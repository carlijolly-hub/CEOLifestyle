import React, { useState, useEffect } from "react";
import { Client, LuxeBookInventoryItem } from "./types";
import { INITIAL_CLIENTS, INITIAL_INVENTORY } from "./data/mockData";
import { syncFamilyBirthdayReminders } from "./utils/dateHelpers";
import Dashboard from "./components/Dashboard";
import ClientList from "./components/ClientList";
import ClientDetail from "./components/ClientDetail";
import ClientForm from "./components/ClientForm";
import ExcelManager from "./components/ExcelManager";
import MilestoneCalendar from "./components/MilestoneCalendar";
import LuxeInventory from "./components/LuxeInventory";
import { 
  Users, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Printer, 
  BookOpen,
  ArrowLeft,
  Sparkles,
  Calendar,
  X,
  CheckSquare
} from "lucide-react";
// @ts-ignore
import spaceBg from "./assets/images/space_background_1783612418079.jpg";

const LOCAL_STORAGE_KEY = "ceo_librarium_crm_customers";

export default function App() {
  // State for client list
  const [clients, setClients] = useState<Client[]>([]);

  // State for Librarium Luxe Inventory
  const [inventory, setInventory] = useState<LuxeBookInventoryItem[]>([]);
  
  // Tab state: "dashboard" | "directory" | "excel" | "calendar" | "inventory"
  const [activeTab, setActiveTab] = useState<"dashboard" | "directory" | "excel" | "calendar" | "inventory">("dashboard");
  
  // Selected client for detail view
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Task viewing & managing state
  const [activeTaskInfo, setActiveTaskInfo] = useState<{ clientId: string; reminderId: string } | null>(null);
  const [taskEditText, setTaskEditText] = useState("");
  const [taskEditDate, setTaskEditDate] = useState("");

  useEffect(() => {
    if (activeTaskInfo) {
      const client = clients.find(c => c.id === activeTaskInfo.clientId);
      const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
      if (reminder) {
        setTaskEditText(reminder.task);
        setTaskEditDate(reminder.date);
      }
    } else {
      setTaskEditText("");
      setTaskEditDate("");
    }
  }, [activeTaskInfo, clients]);

  const handleUpdateTaskDetails = () => {
    if (!activeTaskInfo) return;
    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              return { ...r, task: taskEditText, date: taskEditDate };
            }
            return r;
          })
        };
      }
      return c;
    });
    saveClients(updated);
    setActiveTaskInfo(null);
  };

  const handleToggleTaskCompleted = () => {
    if (!activeTaskInfo) return;
    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              return { ...r, completed: !r.completed };
            }
            return r;
          })
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const handleDeleteTaskFromModal = () => {
    if (!activeTaskInfo) return;
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      const updated = clients.map(c => {
        if (c.id === activeTaskInfo.clientId) {
          return {
            ...c,
            reminders: c.reminders.filter(r => r.id !== activeTaskInfo.reminderId)
          };
        }
        return c;
      });
      saveClients(updated);
      setActiveTaskInfo(null);
    }
  };

  // Initialize clients from localStorage or initial dummy data
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const synced = parsed.map((c: Client) => syncFamilyBirthdayReminders(c));
        setClients(synced);
      } catch (err) {
        console.error("Failed to parse stored clients, using fallback mock dataset:", err);
        const synced = INITIAL_CLIENTS.map(c => syncFamilyBirthdayReminders(c));
        setClients(synced);
      }
    } else {
      const synced = INITIAL_CLIENTS.map(c => syncFamilyBirthdayReminders(c));
      setClients(synced);
    }

    // Initialize Luxe Inventory
    const storedInv = localStorage.getItem("luxe_book_inventory");
    if (storedInv) {
      try {
        const parsed = JSON.parse(storedInv);
        const dummyIds = ["LUX-001", "LUX-002", "LUX-003", "LUX-004", "LUX-005", "LUX-006"];
        const filtered = Array.isArray(parsed) 
          ? parsed.filter((item: LuxeBookInventoryItem) => !dummyIds.includes(item.id))
          : [];
        setInventory(filtered);
        if (filtered.length !== parsed.length) {
          localStorage.setItem("luxe_book_inventory", JSON.stringify(filtered));
        }
      } catch (err) {
        console.error("Failed to parse stored inventory, using fallback:", err);
        setInventory(INITIAL_INVENTORY);
      }
    } else {
      setInventory(INITIAL_INVENTORY);
    }
  }, []);

  // Save Luxe Inventory helper
  const saveInventory = (updatedList: LuxeBookInventoryItem[]) => {
    setInventory(updatedList);
    localStorage.setItem("luxe_book_inventory", JSON.stringify(updatedList));
  };

  // Save clients to localStorage whenever changed
  const saveClients = (updatedList: Client[]) => {
    setClients(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Select client and force directory tab open
  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    setIsAdding(false);
    setIsEditing(false);
    setActiveTab("directory");
  };

  // Add new client form toggle
  const handleAddNewClientTrigger = () => {
    setSelectedClientId(null);
    setIsEditing(false);
    setIsAdding(true);
  };

  // Edit client form trigger
  const handleEditClientTrigger = (client: Client) => {
    setIsAdding(false);
    setIsEditing(true);
  };

  // Save / Update a client
  const handleSaveClient = (savedClient: Client) => {
    const syncedClient = syncFamilyBirthdayReminders(savedClient);
    let updatedList = [...clients];
    const index = clients.findIndex(c => c.id === syncedClient.id);
    
    if (index !== -1) {
      // Overwrite/update existing
      updatedList[index] = syncedClient;
    } else {
      // Append new
      updatedList.push(syncedClient);
    }
    
    saveClients(updatedList);
    setSelectedClientId(syncedClient.id);
    setIsEditing(false);
    setIsAdding(false);
  };

  // Delete a client profile
  const handleDeleteClient = (clientId: string) => {
    const updatedList = clients.filter(c => c.id !== clientId);
    saveClients(updatedList);
    setSelectedClientId(null);
    setIsEditing(false);
    setIsAdding(false);
  };

  // Import clients from XLSX Spreadsheet
  const handleImportClients = (importedList: Client[]) => {
    let updatedList = [...clients];
    
    importedList.forEach(imported => {
      const index = updatedList.findIndex(existing => existing.id === imported.id);
      if (index !== -1) {
        // Merge timeline history if possible, keep old reminders or append
        const existing = updatedList[index];
        updatedList[index] = {
          ...imported,
          timeline: [...imported.timeline, ...existing.timeline].slice(0, 15),
          reminders: [...imported.reminders, ...existing.reminders]
        };
      } else {
        updatedList.push(imported);
      }
    });

    saveClients(updatedList);
  };

  // Retrieve current active client details
  const activeClient = clients.find(c => c.id === selectedClientId) || null;

  return (
    <div 
      className="min-h-screen flex flex-col text-slate-800 antialiased selection:bg-slate-900 selection:text-white relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${spaceBg})` }}
    >
      {/* Dimmer overlay for elegant, high-contrast cosmos aesthetic */}
      <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px] pointer-events-none z-0" />
      
      {/* Dynamic Global CSS for smooth keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Main Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left Brand block */}
          <div className="flex items-center cursor-pointer group" onClick={() => setActiveTab("dashboard")}>
            <div className="text-left">
              <span className="font-extrabold text-[14px] sm:text-[15px] tracking-tight text-slate-900 block transition-colors group-hover:text-slate-700">
                CEO Lifestyle Management
              </span>
            </div>
          </div>

          {/* Middle Navigation Tabs (Apple style) */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "dashboard" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/80"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("directory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "directory" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/80"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Directory
            </button>
             <button
              onClick={() => {
                setActiveTab("excel");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "excel" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/80"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel Exchange
            </button>
            <button
              onClick={() => {
                setActiveTab("calendar");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "calendar" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/80"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Milestone Calendar
            </button>
            <button
              onClick={() => {
                setActiveTab("inventory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "inventory" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/80"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Luxe Inventory
            </button>
          </nav>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 border border-slate-200/60 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {clients.length} Accounts Synchronized
            </div>
          </div>

        </div>

        {/* Mobile quick-tab bar */}
        <div className="sm:hidden flex items-center justify-around border-t border-neutral-100 p-2 bg-white">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "dashboard" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("directory");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "directory" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Users className="w-4 h-4" />
            Directory
          </button>
          <button
            onClick={() => {
              setActiveTab("calendar");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "calendar" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => {
              setActiveTab("excel");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "excel" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => {
              setActiveTab("inventory");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "inventory" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Inventory
          </button>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <Dashboard 
            clients={clients} 
            inventory={inventory}
            onSelectClient={handleSelectClient}
            onNavigateToTab={setActiveTab}
            onOpenTask={(clientId, reminderId) => setActiveTaskInfo({ clientId, reminderId })}
          />
        )}

        {/* Tab 2: Directory split views */}
        {activeTab === "directory" && (
          <div className="space-y-6">
            
            {/* Split layout (List on left, Detail panel on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Directory search column */}
              <div className={`lg:col-span-4 space-y-4 ${
                (activeClient || isAdding || isEditing) ? "hidden lg:block" : "block"
              }`}>
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-white">Brand Directory</h1>
                  <p className="text-xs text-slate-300 mt-1">Select accounts to track custom interaction notes.</p>
                </div>

                <ClientList 
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onSelectClient={setSelectedClientId}
                  onAddNewClient={handleAddNewClientTrigger}
                  onDeleteClient={handleDeleteClient}
                />
              </div>

              {/* Detail panel columns */}
              <div className={`lg:col-span-8 ${
                (!activeClient && !isAdding && !isEditing) ? "block" : ""
              }`}>
                
                {/* Mobile Back-to-list action bar */}
                {(activeClient || isAdding || isEditing) && (
                  <button
                    onClick={() => {
                      setSelectedClientId(null);
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="lg:hidden flex items-center gap-1 text-neutral-600 hover:text-neutral-900 text-xs font-semibold mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Return to Client Directory
                  </button>
                )}

                {/* Switch between Detail view, edit form, creation form, or default placeholder */}
                {isAdding ? (
                  <ClientForm 
                    onSave={handleSaveClient}
                    onCancel={() => setIsAdding(false)}
                  />
                ) : isEditing ? (
                  <ClientForm 
                    customer={activeClient}
                    onSave={handleSaveClient}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : activeClient ? (
                  <ClientDetail 
                    customer={activeClient}
                    onEdit={handleEditClientTrigger}
                    onDelete={handleDeleteClient}
                    onUpdateCustomer={handleSaveClient}
                  />
                ) : (
                  // Default placeholder
                  <div className="bg-white border border-neutral-100 rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-200 mb-4 shadow-sm">
                      <Users className="w-5 h-5 text-neutral-400" />
                    </div>
                    <h3 className="text-sm font-bold text-neutral-800">No Client Account Selected</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                      Select an account from the directory tree to inspect historic purchase orders, family connections, lifestyle notes, and pending tasks, or establish a brand new profile.
                    </p>
                    <button
                      onClick={handleAddNewClientTrigger}
                      className="mt-5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Establish First Client
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Excel Exchange */}
        {activeTab === "excel" && (
          <ExcelManager 
            customers={clients}
            onImportCustomers={handleImportClients}
          />
        )}

        {/* Tab 4: Milestone Calendar */}
        {activeTab === "calendar" && (
          <MilestoneCalendar 
            clients={clients}
            onSelectClient={handleSelectClient}
            onOpenTask={(clientId, reminderId) => setActiveTaskInfo({ clientId, reminderId })}
          />
        )}

        {/* Tab 5: Luxe Inventory */}
        {activeTab === "inventory" && (
          <LuxeInventory 
            inventory={inventory}
            onUpdateInventory={saveInventory}
          />
        )}

      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-neutral-800/10 bg-white/90 backdrop-blur-md py-6 text-center text-xs text-neutral-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 CEO Printing Services & Librarium Luxe. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="font-semibold text-neutral-500">Executive Relationship Hub</span>
            <span>•</span>
            <span>Made with Precision</span>
          </div>
        </div>
      </footer>

      {/* TASK DETAILS MODAL */}
      {activeTaskInfo && (() => {
        const client = clients.find(c => c.id === activeTaskInfo.clientId);
        const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
        if (!client || !reminder) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 text-left relative">
              <button 
                onClick={() => setActiveTaskInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Task Details</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{client.firstName} {client.lastName} ({client.tier} Account)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Task/Follow-up Details</label>
                  <textarea
                    value={taskEditText}
                    onChange={(e) => setTaskEditText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800 resize-none h-24 transition-colors"
                    placeholder="Enter details here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Follow-up Date</label>
                    <input
                      type="date"
                      value={taskEditDate}
                      onChange={(e) => setTaskEditDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status</label>
                    <button
                      type="button"
                      onClick={handleToggleTaskCompleted}
                      className={`w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        reminder.completed 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                          : "bg-amber-50 border-amber-100 text-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${reminder.completed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      {reminder.completed ? "Completed" : "Pending Action"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUpdateTaskDetails}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2.5 rounded-xl transition-all shadow-sm text-center"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskInfo(null);
                    handleSelectClient(client.id);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl transition-all text-center"
                >
                  Open Client Profile
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTaskFromModal}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold p-2.5 rounded-xl transition-all text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
