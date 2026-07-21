import React, { useState } from "react";
import { Lock, User, Key, Eye, EyeOff, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  backgroundUrl: string;
}

export default function LoginScreen({ onLoginSuccess, backgroundUrl }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    // Simulate luxury verification check
    setTimeout(() => {
      // Retrieve stored custom credentials or fallback to defaults
      const storedUser = localStorage.getItem("ceo_admin_username") || "admin";
      const storedPass = localStorage.getItem("ceo_admin_password") || "ceo";

      const inputUser = username.trim().toLowerCase();
      const inputPass = password;

      // 1. First, check Master Administrator credentials
      const isMasterUser = 
        inputUser === storedUser.toLowerCase() || 
        (storedUser === "admin" && (inputUser === "admin" || inputUser === "ceo"));
        
      const isMasterPass = 
        inputPass === storedPass || 
        (storedPass === "ceo" && (inputPass === "ceo" || inputPass === "lifestyle" || inputPass === "admin"));

      if (isMasterUser && isMasterPass) {
        // Log in as Master Administrator
        localStorage.setItem("ceo_admin_authenticated", "true");
        localStorage.setItem("ceo_user_role", "Master Administrator");
        localStorage.setItem("ceo_user_fullname", "Master Administrator");
        localStorage.setItem("ceo_user_username", storedUser);
        onLoginSuccess();
        return;
      }

      // 2. Next, check application-defined user accounts
      const storedUsersRaw = localStorage.getItem("ceo_application_users");
      let appUsers: any[] = [];
      if (storedUsersRaw) {
        try {
          appUsers = JSON.parse(storedUsersRaw);
        } catch (e) {
          console.error("Failed to parse application users:", e);
        }
      }

      const matchingUser = appUsers.find(
        (u) => u.username.toLowerCase() === inputUser && u.password === inputPass
      );

      if (matchingUser) {
        if (matchingUser.status === "Deactivated") {
          setErrorMsg("Access Denied: This account has been deactivated. Please contact your Master Administrator.");
          setIsLoading(false);
        } else {
          // Log in as authorized standard user with specific role
          localStorage.setItem("ceo_admin_authenticated", "true");
          localStorage.setItem("ceo_user_role", matchingUser.role);
          localStorage.setItem("ceo_user_fullname", matchingUser.fullName);
          localStorage.setItem("ceo_user_username", matchingUser.username);
          onLoginSuccess();
        }
      } else {
        setErrorMsg("Access Denied: Invalid administrator or staff credentials.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat bg-fixed antialiased text-slate-800 transition-all duration-500"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* Dimmer overlay for elegant contrast and high readability */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[4px] z-0" />

      {/* Embedded Apple Style CSS keyframe animations */}
      <style>{`
        @keyframes appleScaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-apple-entrance {
          animation: appleScaleUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Main card panel - Apple macOS Style frosted glass panel */}
      <div className="relative z-10 w-full max-w-[400px] mx-4 bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] animate-apple-entrance flex flex-col justify-between">
        
        {/* Top Header Section */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-900/5">
          <div className="mx-auto w-11 h-11 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md">
            <Lock className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              CEO Lifestyle Management
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Administrative Gateway
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-6 text-xs text-left">
          
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-100/50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 transition-colors"
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-400" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-100/50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 transition-colors pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Authorizing Security Keys...
              </span>
            ) : (
              <>
                Unlock Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Elegant Micro-Credentials help (Apple Style) */}
        <div className="mt-6 pt-5 border-t border-slate-900/5 flex flex-col items-center text-center space-y-1 text-[9.5px] text-slate-400 font-semibold leading-relaxed">
          <div className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-slate-400" />
            <span>Authorized Credentials Only</span>
          </div>
        </div>

      </div>

      {/* Premium Apple-inspired Footer */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400/80 drop-shadow-sm font-sans">
        . © Since 2024 • CEO Lifestyle  The Home Of Endless Creativity
      </div>
    </div>
  );
}
