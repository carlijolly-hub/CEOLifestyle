import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  X, 
  FileText, 
  CheckCircle2
} from "lucide-react";
import { ExecutiveChecklistItem } from "../types";

const STORAGE_KEY = "ceo_crm_executive_checklist";

const DEFAULT_ITEMS: ExecutiveChecklistItem[] = [
  {
    id: "exec-1",
    task: "Design magazine cover",
    dueDate: "2026-08-20",
    priority: "High",
    notes: "Final cover for upcoming magazine release.",
    completed: false,
    createdAt: "2026-08-15T10:00:00.000Z"
  },
  {
    id: "exec-2",
    task: "Confirm Valentine's inventory",
    dueDate: "2026-08-22",
    priority: "Normal",
    notes: "Review Luxe stock levels and packaging allocations.",
    completed: false,
    createdAt: "2026-08-15T11:00:00.000Z"
  },
  {
    id: "exec-3",
    task: "Approve supplier order",
    priority: "High",
    completed: false,
    createdAt: "2026-08-15T12:00:00.000Z"
  },
  {
    id: "exec-4",
    task: "Send final artwork",
    completed: true,
    completedAt: "2026-08-16T14:30:00.000Z",
    createdAt: "2026-08-14T09:00:00.000Z"
  }
];

export const ExecutiveChecklist: React.FC = () => {
  const [items, setItems] = useState<ExecutiveChecklistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading executive checklist from storage", e);
    }
    return DEFAULT_ITEMS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ExecutiveChecklistItem | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formTask, setFormTask] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPriority, setFormPriority] = useState<"High" | "Normal">("Normal");
  const [formNotes, setFormNotes] = useState("");

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Error saving executive checklist", e);
    }
  }, [items]);

  const handleToggleComplete = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    if (expandedNotesId === id) {
      setExpandedNotesId(null);
    }
  };

  const handleOpenAdd = () => {
    setFormTask("");
    setFormDueDate("");
    setFormPriority("Normal");
    setFormNotes("");
    setIsAdding(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item: ExecutiveChecklistItem) => {
    setFormTask(item.task);
    setFormDueDate(item.dueDate || "");
    setFormPriority(item.priority || "Normal");
    setFormNotes(item.notes || "");
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTask = formTask.trim();
    if (!trimmedTask) return;

    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            task: trimmedTask,
            dueDate: formDueDate || undefined,
            priority: formPriority,
            notes: formNotes.trim() || undefined
          };
        }
        return item;
      }));
      setEditingItem(null);
    } else {
      // Add new item
      const newItem: ExecutiveChecklistItem = {
        id: `exec-${Date.now()}`,
        task: trimmedTask,
        dueDate: formDueDate || undefined,
        priority: formPriority,
        notes: formNotes.trim() || undefined,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setItems(prev => [newItem, ...prev]);
      setIsAdding(false);
    }

    setFormTask("");
    setFormDueDate("");
    setFormPriority("Normal");
    setFormNotes("");
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  // Format Due Date with Overdue check
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return { text: dateStr, isOverdue: false, isToday: false };

      const target = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedMonthDay = `${monthNames[month - 1]} ${day}`;

      if (diffDays < 0) {
        return { text: "Overdue", isOverdue: true, isToday: false, dateLabel: formattedMonthDay };
      } else if (diffDays === 0) {
        return { text: "Due Today", isOverdue: false, isToday: true, dateLabel: formattedMonthDay };
      } else if (diffDays === 1) {
        return { text: "Due Tomorrow", isOverdue: false, isToday: false, dateLabel: formattedMonthDay };
      } else {
        return { text: `Due ${formattedMonthDay}`, isOverdue: false, isToday: false, dateLabel: formattedMonthDay };
      }
    } catch {
      return { text: dateStr, isOverdue: false, isToday: false };
    }
  };

  const pendingItems = useMemo(() => items.filter(i => !i.completed), [items]);

  return (
    <div 
      className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4 text-left relative overflow-hidden"
      id="dashboard-executive-checklist-widget"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-slate-900 text-amber-300 rounded-xl shadow-2xs">
            <CheckSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Priority Action Queue
            </h3>
          </div>
        </div>

        <div className="flex items-center">
          {!isAdding && !editingItem && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
              title="Add Action"
              aria-label="Add Action"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Form (Add or Edit) */}
      {(isAdding || editingItem) && (
        <form 
          onSubmit={handleSaveForm}
          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
              {editingItem ? "Edit Checklist Item" : "New Executive Item"}
            </span>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Task / Action <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formTask}
              onChange={(e) => setFormTask(e.target.value)}
              placeholder="e.g., Design magazine cover"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormPriority("Normal")}
                  className={`py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    formPriority === "Normal"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setFormPriority("High")}
                  className={`py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    formPriority === "High"
                      ? "bg-amber-500 text-slate-950 shadow-2xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  High
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Brief context or reference..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {editingItem ? "Update Item" : "Add to Checklist"}
            </button>
          </div>
        </form>
      )}

      {/* Checklist Items List */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 divide-y divide-slate-100/60">
        {pendingItems.length === 0 ? (
          <div className="text-center py-6 text-slate-400 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Priority action queue is clear</p>
            <p className="text-[11px] text-slate-400">What still needs to be done will appear here.</p>
          </div>
        ) : (
          pendingItems.map((item) => {
            const dueInfo = formatDueDate(item.dueDate);
            const isNotesExpanded = expandedNotesId === item.id;

            return (
              <div
                key={item.id}
                className="pt-2 first:pt-0 pb-2 group flex flex-col gap-1 transition-all"
              >
                <div className="flex items-start justify-between gap-2.5">
                  {/* Checkbox and Task */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Mark as completed"
                    >
                      <Square className="w-4 h-4 rounded text-slate-400 hover:text-slate-600 stroke-[2.2]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 leading-snug break-words">
                          {item.task}
                        </span>
                      </div>

                      {/* Metadata badges (Due date, Priority) */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-medium flex-wrap">
                        {dueInfo && (
                          <span 
                            className={`flex items-center gap-1 font-semibold ${
                              dueInfo.isOverdue 
                                ? "text-rose-600 font-extrabold" 
                                : dueInfo.isToday 
                                  ? "text-amber-700 font-extrabold" 
                                  : "text-slate-500"
                            }`}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{dueInfo.text}</span>
                          </span>
                        )}

                        {item.priority === "High" && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded shadow-2xs">
                            High
                          </span>
                        )}

                        {item.notes && (
                          <button
                            type="button"
                            onClick={() => setExpandedNotesId(isNotesExpanded ? null : item.id)}
                            className="text-slate-400 hover:text-slate-700 flex items-center gap-0.5 text-[10px] cursor-pointer"
                            title="Toggle notes"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isNotesExpanded ? "Hide notes" : "Note"}</span>
                          </button>
                        )}
                      </div>

                      {/* Collapsible Notes Preview */}
                      {isNotesExpanded && item.notes && (
                        <div className="mt-1.5 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100 font-normal leading-relaxed animate-fade-in">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
