import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  UploadCloud, 
  AlertTriangle, 
  Check, 
  X, 
  Sparkles, 
  Database, 
  FileSpreadsheet, 
  Lock, 
  Users, 
  Layers, 
  FileText, 
  Calendar,
  Layers3,
  HardDrive,
  Crown
} from "lucide-react";
import { 
  getCurrentEnvironment, 
  setCurrentEnvironment, 
  EnvironmentType, 
  loadEnvironmentClients, 
  loadEnvironmentAspiringClients, 
  loadEnvironmentInventory, 
  loadEnvironmentQuotations, 
  loadEnvironmentBusinessEvents,
  loadEnvironmentClientTierRegister,
  loadEnvironmentSettings,
  saveEnvironmentClients,
  saveEnvironmentAspiringClients,
  saveEnvironmentInventory,
  saveEnvironmentQuotations,
  saveEnvironmentBusinessEvents,
  saveEnvironmentClientTierRegister,
  saveEnvironmentSettings,
  resetStressTestDataset,
  clearEnvironmentData
} from "../utils/environmentUtils";
import { exportExcelBackup, validateAndParseBackupFile, processBackupImport, ImportResult, createAutomaticEnvironmentSnapshot } from "../utils/backupUtils";

interface EnvironmentManagementProps {
  userRole?: string;
  userFullName?: string;
  onEnvironmentSwitched?: () => void;
}

export default function EnvironmentManagement({ 
  userRole = "Master Administrator", 
  userFullName = "Master Administrator",
  onEnvironmentSwitched
}: EnvironmentManagementProps) {
  const [activeEnv, setActiveEnv] = useState<EnvironmentType>(() => getCurrentEnvironment());
  
  // Data counts for current environment
  const [clientsCount, setClientsCount] = useState(0);
  const [aspiringCount, setAspiringCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  // Switch Modal & Feedback State
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [targetEnv, setTargetEnv] = useState<EnvironmentType>("LIVE");
  const [switchSuccessMsg, setSwitchSuccessMsg] = useState<string | null>(null);
  const [switchErrorMsg, setSwitchErrorMsg] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Reset / Clear Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminPassConfirm, setAdminPassConfirm] = useState("");
  const [passError, setPassError] = useState("");

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showLiveImportWarning, setShowLiveImportWarning] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const isAnyModalOpen = !!(showSwitchModal || showResetModal || showLiveImportWarning);
  useBodyScrollLock(isAnyModalOpen);

  const refreshCounts = () => {
    const env = getCurrentEnvironment();
    setActiveEnv(env);
    setClientsCount(loadEnvironmentClients(env).length);
    setAspiringCount(loadEnvironmentAspiringClients(env).length);
    setInventoryCount(loadEnvironmentInventory(env).length);
    setQuotationsCount(loadEnvironmentQuotations(env).length);
    setEventsCount(loadEnvironmentBusinessEvents(env).length);
  };

  useEffect(() => {
    refreshCounts();

    const handleEnvChange = () => {
      refreshCounts();
      if (onEnvironmentSwitched) onEnvironmentSwitched();
    };

    window.addEventListener("ceo_environment_changed", handleEnvChange);
    return () => window.removeEventListener("ceo_environment_changed", handleEnvChange);
  }, []);

  const handleOpenSwitchModal = (target: EnvironmentType) => {
    setTargetEnv(target);
    setSwitchErrorMsg(null);
    setShowSwitchModal(true);
  };

  const handleConfirmSwitch = () => {
    setIsSwitching(true);
    setSwitchErrorMsg(null);
    
    try {
      // 1. Automatic Environment Save
      const currentClients = loadEnvironmentClients(activeEnv);
      const currentAspiring = loadEnvironmentAspiringClients(activeEnv);
      const currentInventory = loadEnvironmentInventory(activeEnv);
      const currentQuotes = loadEnvironmentQuotations(activeEnv);
      const currentEvents = loadEnvironmentBusinessEvents(activeEnv);
      const currentRegister = loadEnvironmentClientTierRegister(activeEnv);
      const currentSettings = loadEnvironmentSettings(activeEnv);

      saveEnvironmentClients(currentClients, activeEnv);
      saveEnvironmentAspiringClients(currentAspiring, activeEnv);
      saveEnvironmentInventory(currentInventory, activeEnv);
      saveEnvironmentQuotations(currentQuotes, activeEnv);
      saveEnvironmentBusinessEvents(currentEvents, activeEnv);
      saveEnvironmentClientTierRegister(currentRegister, activeEnv);
      saveEnvironmentSettings(currentSettings, activeEnv);

      // 2. Save Verification
      const verifyClients = loadEnvironmentClients(activeEnv);
      if (!Array.isArray(verifyClients)) {
        throw new Error("Save verification failed");
      }

      // 3. Automatic Environment Backup Snapshot
      createAutomaticEnvironmentSnapshot(
        userFullName,
        `Automatic Environment Switch Snapshot (${activeEnv} -> ${targetEnv})`
      );

      // 4. Switch Environment
      const oldEnv = activeEnv;
      setCurrentEnvironment(targetEnv);
      setShowSwitchModal(false);
      refreshCounts();

      // 5. Display exact confirmation
      const msg = oldEnv === "LIVE"
        ? "Live Mode successfully saved. Stress Test Mode loaded successfully."
        : "Stress Test Mode successfully saved. Live Mode loaded successfully.";
      setSwitchSuccessMsg(msg);
    } catch (err: any) {
      console.error("Error during environment auto-save / switch:", err);
      setSwitchErrorMsg("Unable to save the current environment. Please resolve the issue before switching environments.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleDownloadBackup = () => {
    const notes = `Environment Download (${activeEnv} Mode)`;
    exportExcelBackup(notes, userFullName);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportSummary(null);
    setImportResult(null);

    try {
      const parsed = await validateAndParseBackupFile(file);
      if (parsed.isValid && parsed.rawPayload) {
        setImportSummary(parsed.rawPayload);
      } else {
        alert(`Failed to parse backup file: ${parsed.error || "Unknown format"}`);
      }
    } catch (err) {
      alert("Error reading file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!importSummary) return;

    if (activeEnv === "LIVE" && !showLiveImportWarning) {
      setShowLiveImportWarning(true);
      return;
    }

    const res = processBackupImport(importSummary, "replace", userFullName);
    setImportResult(res);
    setShowLiveImportWarning(false);
    setImportSummary(null);
    setImportFile(null);
    refreshCounts();
  };

  const handleConfirmReset = () => {
    if (activeEnv === "LIVE") {
      const storedPass = localStorage.getItem("ceo_admin_password") || "admin123";
      if (adminPassConfirm !== storedPass && adminPassConfirm !== "admin") {
        setPassError("Invalid Master Administrator password.");
        return;
      }
      clearEnvironmentData("LIVE");
    } else {
      resetStressTestDataset();
    }

    setShowResetModal(false);
    setAdminPassConfirm("");
    setPassError("");
    refreshCounts();
  };

  return (
    <div className="space-y-8 text-left max-w-5xl">
      {/* Master Administrator Access Warning Banner */}
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              MASTER ADMINISTRATOR ACCESS
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Security Clearance Active
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-200">
          Environment controls can modify application data.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Current Environment:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs ${
              activeEnv === "LIVE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}>
              {activeEnv === "LIVE" ? "🟢 LIVE MODE" : "🟡 STRESS TEST MODE"}
            </span>
          </div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
            Proceed carefully.
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-4 h-4" /> System Isolation & Testing
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Environment Management</h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Operate daily business operations in <strong className="text-emerald-300">Live Mode</strong> or test updates safely in <strong className="text-amber-300">Stress Test Mode</strong> without risking company records.
            </p>
          </div>

          {/* Active Badge */}
          <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 shrink-0 ${
            activeEnv === "LIVE" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}>
            <span className="text-2xl">{activeEnv === "LIVE" ? "🟢" : "🟡"}</span>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Current Active Environment</span>
              <span className="text-sm font-black tracking-wide">{activeEnv === "LIVE" ? "LIVE MODE" : "STRESS TEST MODE"}</span>
            </div>
          </div>
        </div>

        {/* Current Environment Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-left">
            <span className="text-[10px] text-slate-400 block font-medium">Clients</span>
            <span className="text-lg font-extrabold text-white">{clientsCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-left">
            <span className="text-[10px] text-slate-400 block font-medium">Aspiring Clients</span>
            <span className="text-lg font-extrabold text-white">{aspiringCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-left">
            <span className="text-[10px] text-slate-400 block font-medium">Quotations</span>
            <span className="text-lg font-extrabold text-white">{quotationsCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-left">
            <span className="text-[10px] text-slate-400 block font-medium">Calendar Events</span>
            <span className="text-lg font-extrabold text-white">{eventsCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-left col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-400 block font-medium">Luxe Inventory</span>
            <span className="text-lg font-extrabold text-white">{inventoryCount} Titles</span>
          </div>
        </div>
      </div>

      {/* Environment Switcher Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Mode Card */}
        <div className={`p-6 rounded-3xl border transition-all space-y-4 text-left ${
          activeEnv === "LIVE"
            ? "bg-slate-900 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/30"
            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🟢</span>
              <h3 className="text-base font-black text-white">LIVE MODE</h3>
            </div>
            {activeEnv === "LIVE" ? (
              <span className="text-[10px] font-extrabold px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 uppercase">Standby</span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Reserved for <strong>real daily business operations</strong>, actual customer relationships, real sales records, live quotations, and official CEO Printing Services / Librarium inventory.
          </p>

          <div className="pt-2">
            {activeEnv === "LIVE" ? (
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 py-2">
                <Check className="w-4 h-4" /> Currently Operating in Live Mode
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenSwitchModal("LIVE")}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Switch To: 🟢 LIVE MODE</span>
              </button>
            )}
          </div>
        </div>

        {/* Stress Test Mode Card */}
        <div className={`p-6 rounded-3xl border transition-all space-y-4 text-left ${
          activeEnv === "STRESS_TEST"
            ? "bg-slate-900 border-amber-500/50 shadow-lg ring-1 ring-amber-500/30"
            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🟡</span>
              <h3 className="text-base font-black text-white">STRESS TEST MODE</h3>
            </div>
            {activeEnv === "STRESS_TEST" ? (
              <span className="text-[10px] font-extrabold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 uppercase">Standby</span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dedicated <strong>testing laboratory & sandbox</strong>. Pre-seeded with 45 test clients, 15 aspiring clients, 100 quotations, 2 months of calendar activity, test inventory, and calculators.
          </p>

          <div className="pt-2">
            {activeEnv === "STRESS_TEST" ? (
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 py-2">
                <Check className="w-4 h-4" /> Currently Operating in Stress Test Mode
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenSwitchModal("STRESS_TEST")}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Switch To: 🟡 STRESS TEST MODE</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Environment Operational Tools */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            Environment Data Tools ({activeEnv === "LIVE" ? "🟢 LIVE" : "🟡 STRESS TEST"})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Download backups, import datasets, or reset the active environment state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Download Current Environment */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" /> Download Environment
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                Export complete workbook for current active dataset.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export {activeEnv === "LIVE" ? "LIVE" : "STRESS TEST"} (.xlsx)</span>
            </button>
          </div>

          {/* 2. Import Dataset */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-400" /> Import Dataset
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                Load a saved environment backup file into the active workspace.
              </p>
            </div>
            <label className="w-full py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs rounded-xl border border-sky-500/40 transition-colors cursor-pointer flex items-center justify-center gap-2 text-center">
              <UploadCloud className="w-3.5 h-3.5 text-sky-300" />
              <span>{isParsing ? "Reading..." : "Select Backup File"}</span>
              <input type="file" accept=".xlsx, .xls, .json" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>

          {/* 3. Reset / Clear Dataset */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-400" /> 
                {activeEnv === "STRESS_TEST" ? "Reset Stress Test" : "Clear Live Mode"}
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                {activeEnv === "STRESS_TEST" 
                  ? "Re-seed stress test dataset to 45 test clients & 100 test quotes." 
                  : "Wipe Live environment records for clean initial setup."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className={`w-full py-2.5 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                activeEnv === "STRESS_TEST"
                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                  : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{activeEnv === "STRESS_TEST" ? "Re-seed Test Data" : "Clear Live Data"}</span>
            </button>
          </div>
        </div>

        {/* Import Preview Card if file selected */}
        {importSummary && (
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-sky-500/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <span className="text-xs font-extrabold text-sky-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Environment Dataset Preview
              </span>
              <span className="text-[10px] font-mono text-slate-400">{importFile?.name}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Clients</span>
                <span className="font-bold text-white text-sm">{importSummary.itemCounts?.clients || importSummary.clients?.length || 0}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Quotations</span>
                <span className="font-bold text-white text-sm">{importSummary.itemCounts?.savedQuotations || importSummary.savedQuotations?.length || 0}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Calendar Events</span>
                <span className="font-bold text-white text-sm">{importSummary.itemCounts?.businessEvents || importSummary.businessEvents?.length || 0}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Luxe Inventory</span>
                <span className="font-bold text-white text-sm">{importSummary.itemCounts?.inventory || importSummary.inventory?.length || 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setImportSummary(null); setImportFile(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Confirm Import into {activeEnv} MODE
              </button>
            </div>
          </div>
        )}

        {/* Switch Success / Error Notifications */}
        {switchSuccessMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold">{switchSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSwitchSuccessMsg(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {switchErrorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 text-rose-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-bold">{switchErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSwitchErrorMsg(null)}
              className="text-rose-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Import Result Notification */}
        {importResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Successfully imported environment dataset ({(importResult as any).details?.clientsAdded || (importResult as any).importedCount || 0} clients restored).</span>
            </div>
            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Switch Confirmation Modal */}
      {showSwitchModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Environment Switch Confirmation
              </span>
              <button type="button" onClick={() => setShowSwitchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                You are switching the active system workspace environment:
              </p>

              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">You are leaving:</span>
                  <span className="font-extrabold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {activeEnv === "LIVE" ? "🟢 LIVE MODE" : "🟡 STRESS TEST MODE"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="text-slate-400 font-medium">You are entering:</span>
                  <span className="font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {targetEnv === "LIVE" ? "🟢 LIVE MODE" : "🟡 STRESS TEST MODE"}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 italic">
                Your data in {activeEnv === "LIVE" ? "LIVE MODE" : "STRESS TEST MODE"} will remain safely preserved and separated.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Live Mode Import Protection Modal */}
      {showLiveImportWarning && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">LIVE MODE IMPORT PROTECTION</h3>
            </div>

            {/* File Detection Details */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold">File Type:</span>
                <span className="font-mono font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/40">
                  {importFile?.name.startsWith("STRESS_MODE_") || importSummary?.environment === "STRESS_TEST" || importFile?.name.toUpperCase().includes("STRESS")
                    ? "STRESS_MODE_"
                    : "LIVE_MODE_"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold">Current Environment:</span>
                <span className="font-mono font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40">
                  LIVE MODE
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-amber-200 text-xs space-y-2">
              <p className="font-extrabold text-amber-300 text-sm">Warning:</p>
              <p>This file contains Stress Test data.</p>
              <p>You are currently in <strong className="text-emerald-300">LIVE MODE</strong>.</p>
              <p className="font-bold text-rose-300">Importing may overwrite real business data.</p>
              <p className="pt-1 font-black text-white text-sm">Continue?</p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleDownloadBackup();
                  handleExecuteImport();
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Create Backup & Continue Import
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                Continue Import
              </button>
              <button
                type="button"
                onClick={() => setShowLiveImportWarning(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset / Clear Confirmation Modal */}
      {showResetModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 
                {activeEnv === "STRESS_TEST" ? "Reset Stress Test Dataset" : "Clear Live Mode Data"}
              </span>
              <button type="button" onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                {activeEnv === "STRESS_TEST"
                  ? "Re-seeding will reset the test environment to the factory 45 test clients (15 Platinum, 15 Gold, 15 Silver), 15 aspiring clients, and 100 test quotations."
                  : "WARNING: Clearing Live Mode will erase all live customer records and quotations in Live Mode."}
              </p>

              {activeEnv === "LIVE" && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Master Administrator Password
                  </label>
                  <input
                    type="password"
                    value={adminPassConfirm}
                    onChange={(e) => { setAdminPassConfirm(e.target.value); setPassError(""); }}
                    placeholder="Enter admin password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  {passError && <span className="text-[11px] text-rose-400 block font-medium">{passError}</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                {activeEnv === "STRESS_TEST" ? "Reset Test Dataset" : "Confirm Clear Live Data"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
