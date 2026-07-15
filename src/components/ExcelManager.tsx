import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Client, ClientTier } from "../types";
import { 
  flatRowToCustomer, 
  exportClientsExcel, 
  exportReport, 
  downloadUploadTemplate 
} from "../utils/excelUtils";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  FileCheck2, 
  FileText, 
  AlertCircle, 
  RefreshCw,
  Search,
  Check,
  MapPin,
  Sparkles
} from "lucide-react";

interface ExcelManagerProps {
  customers: Client[];
  onImportCustomers: (importedList: Client[]) => void;
}

export default function ExcelManager({ customers, onImportCustomers }: ExcelManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappedClients, setMappedClients] = useState<Client[]>([]);
  const [importStats, setImportStats] = useState<{
    newCount: number;
    duplicateCount: number;
    total: number;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Parish / Country dropdown filters for custom exports
  const [exportParish, setExportParish] = useState("All");
  const [exportCategory, setExportCategory] = useState("All");

  // Get unique local lists for export parameters
  const parishes = Array.from(new Set(customers.map(c => c.contact.parish).filter(p => p && p !== "N/A")));
  const categories = Array.from(new Set(customers.flatMap(c => c.history.preferredCategories)));

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parsing file
  const processFile = (file: File) => {
    setSuccessMsg("");
    setErrorMsg("");
    
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg("Invalid file type. Please upload a standard Excel file (.xlsx or .xls).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Grab first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON row list
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawJson.length === 0) {
          setErrorMsg("Excel spreadsheet is empty. Please add rows to upload.");
          return;
        }

        // Parse rows to Customer objects
        const importedClients = rawJson.map(row => flatRowToCustomer(row));

        // Evaluate duplicates
        let newCount = 0;
        let duplicateCount = 0;

        importedClients.forEach(imported => {
          const exists = customers.some(existing => existing.id === imported.id);
          if (exists) {
            duplicateCount++;
          } else {
            newCount++;
          }
        });

        setParsedRows(rawJson);
        setMappedClients(importedClients);
        setImportStats({
          newCount,
          duplicateCount,
          total: importedClients.length
        });
      } catch (err: any) {
        setErrorMsg(`Failed to parse Excel file correctly: ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Complete Bulk Database synchronization
  const handleFinalizeImport = () => {
    if (mappedClients.length === 0) return;
    onImportCustomers(mappedClients);
    
    setSuccessMsg(
      `Flawless Integration! Successfully integrated ${importStats?.total} records (${importStats?.newCount} new client accounts, ${importStats?.duplicateCount} updated duplicates).`
    );
    setParsedRows([]);
    setMappedClients([]);
    setImportStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Exporters
  const handleExportAll = () => {
    exportClientsExcel(customers, "All");
  };

  const handleExportBrand = (brand: "CEO Printing Services" | "Librarium Luxe") => {
    const filtered = customers.filter(c => c.homeBrand === brand || c.homeBrand === "CEO Lifestyle");
    exportClientsExcel(filtered, brand.replace(/\s+/g, "_"));
  };

  const handleExportTier = (tier: ClientTier) => {
    const filtered = customers.filter(c => c.tier === tier);
    exportClientsExcel(filtered, tier);
  };

  const handleExportOverseas = () => {
    const filtered = customers.filter(c => c.contact.country !== "Jamaica");
    exportClientsExcel(filtered, "Overseas");
  };

  const handleExportByParish = () => {
    if (exportParish === "All") {
      alert("Please select a specific Parish to download.");
      return;
    }
    const filtered = customers.filter(c => c.contact.parish === exportParish);
    exportClientsExcel(filtered, `Parish_${exportParish.replace(/\s+/g, "_")}`);
  };

  const handleExportByCategory = () => {
    if (exportCategory === "All") {
      alert("Please select a specific Category to download.");
      return;
    }
    const filtered = customers.filter(c => 
      c.history.preferredCategories.some(cat => cat.toLowerCase() === exportCategory.toLowerCase())
    );
    exportClientsExcel(filtered, `Category_${exportCategory.replace(/\s+/g, "_")}`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      
      {/* Title Cover */}
      <div className="text-left bg-gradient-to-tr from-slate-50 via-slate-100/30 to-slate-100/70 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Excel Exchange Control Center</span>
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Database Import & Export</h1>
        <p className="text-slate-500 leading-relaxed text-xs max-w-2xl font-medium">
          Execute bulk database synchronizations. Import spreadsheets directly into your local database with automatic duplicate resolution, export refined client logs, or generate bespoke strategic business reports instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - IMPORT & TEMPLATE (7 spaces) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* UPLOAD CONTAINER */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-950">1. Upload Client Database Spreadsheet</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Upload a `.xlsx` spreadsheet matching our layout headers.</p>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                dragActive 
                  ? "border-slate-900 bg-slate-50" 
                  : "border-slate-200 hover:border-slate-400 bg-slate-50/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              
              <div className="p-4 bg-white rounded-full shadow-xs border border-slate-100">
                <UploadCloud className="w-8 h-8 text-slate-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  Drag and drop your spreadsheet here, or <span className="text-slate-950 underline font-extrabold hover:text-slate-850">browse computer</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">Supports Microsoft Excel (.xlsx, .xls) files only.</p>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-left text-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="font-semibold text-xs">{errorMsg}</p>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-left text-emerald-800">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="font-bold text-xs">{successMsg}</p>
              </div>
            )}

            {/* Preview Sheet Data before finalized Sync */}
            {importStats && (
              <div className="border border-slate-200/60 rounded-2xl overflow-hidden p-5 space-y-5 bg-slate-50/40 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <div>
                    <h3 className="font-bold text-slate-950">Spreadsheet Scan Complete</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-bold">Headers analyzed successfully.</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-1 border border-slate-200 rounded text-slate-800 shadow-xs">
                    {importStats.total} Rows found
                  </span>
                </div>

                {/* Duplicates stats alerts */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3.5 border border-slate-200/40 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] text-slate-400 block font-bold">NEW CLIENT RECORDS</span>
                    <span className="text-lg font-bold text-emerald-600 block mt-1">+{importStats.newCount}</span>
                  </div>
                  <div className="bg-white p-3.5 border border-slate-200/40 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] text-slate-400 block font-bold">DUPLICATES (TO OVERWRITE)</span>
                    <span className="text-lg font-bold text-amber-600 block mt-1">{importStats.duplicateCount} records</span>
                  </div>
                </div>

                <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100 flex items-start gap-2 text-[11px] text-amber-900 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Matching Client IDs detected! Proceeding with integration will **automatically merge** matches, updating existing profile attributes with Excel's latest fields.
                  </p>
                </div>

                {/* Confirm Import Action */}
                <button
                  onClick={handleFinalizeImport}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Synchronize and Overwrite Database ({importStats.total} Records)
                </button>
              </div>
            )}
          </div>

          {/* DOWNLOAD BLANK SPREADSHEET TEMPLATE */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                Download Ready-to-Use Upload Template
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md font-medium">
                Get a clean skeleton file with pre-defined column headings, data guidelines, date formats, and selection dropdown options (Gender, Client Tier, Brands, Country, Parish) for clean imports.
              </p>
            </div>
            <button
              onClick={downloadUploadTemplate}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-slate-800 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Excel Template
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN - SPREADSHEET EXPORTS & EXECUTIVE REPORTS (5 spaces) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* CATEGORY & BRAND EXPORTS PANEL */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h2 className="text-sm font-bold text-slate-950">2. Segmented Database Downloads</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Download custom segments based on brand, location or tier.</p>
            </div>

            <div className="space-y-3">
              {/* Export All */}
              <button
                onClick={handleExportAll}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Master Client Database</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export CEO Printing */}
              <button
                onClick={() => handleExportBrand("CEO Printing Services")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download CEO Printing Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export Librarium */}
              <button
                onClick={() => handleExportBrand("Librarium Luxe")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Librarium Luxe Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Tiers */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExportTier("Silver")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Silver</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportTier("Gold")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Gold</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportTier("Platinum")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Platinum</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Export Overseas */}
              <button
                onClick={handleExportOverseas}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Overseas Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export by Parish */}
              <div className="border border-slate-200/60 p-4 rounded-2xl space-y-2 bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Download Clients by Parish</span>
                <div className="flex gap-2">
                  <select
                    value={exportParish}
                    onChange={(e) => setExportParish(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="All">Select Parish...</option>
                    {parishes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportByParish}
                    disabled={exportParish === "All"}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Export by Category */}
              <div className="border border-slate-200/60 p-4 rounded-2xl space-y-2 bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Download Clients by Category</span>
                <div className="flex gap-2">
                  <select
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="All">Select Category...</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportByCategory}
                    disabled={exportCategory === "All"}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EXECUTIVE SPREADSHEET REPORTS */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h2 className="text-sm font-bold text-slate-950">3. Business Intel Reports</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Generate multi-sheet strategic corporate dashboards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* LTV */}
              <button
                onClick={() => exportReport("lifetime_value", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Client LTV Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">LTV analysis by order values</span>
              </button>

              {/* Repeat Clients */}
              <button
                onClick={() => exportReport("repeat_customers", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-indigo-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Repeat Client Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Retention rates & frequency</span>
              </button>

              {/* Product Preference */}
              <button
                onClick={() => exportReport("product_preferences", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-purple-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Category Preference</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Preferred products & colors</span>
              </button>

              {/* Birthday Reminders */}
              <button
                onClick={() => exportReport("dates_reminders", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-amber-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Anniversaries & Reminders</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Milestone dates calendar log</span>
              </button>

              {/* Overseas Report */}
              <button
                onClick={() => exportReport("overseas_purchasers", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-blue-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Overseas Purchases Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">International billing segments</span>
              </button>

              {/* Sales History */}
              <button
                onClick={() => exportReport("sales_history", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 w-fit mb-3">
                  <FileText className="w-4 h-4 text-slate-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Corporate Sales Metrics</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Revenue liftiver value ledger</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
