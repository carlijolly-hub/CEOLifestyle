import React, { useState, useEffect } from "react";

export default function SystemReferenceClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="px-4 py-3 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-left self-start md:self-end space-y-2 shrink-0 shadow-xs">
      <div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
          SYSTEM REFERENCE DATE
        </span>
        <span className="text-xs font-semibold text-white font-mono block mt-0.5">
          {formattedDate}
        </span>
      </div>
      <div className="pt-2 border-t border-slate-700/40">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
          SYSTEM TIME
        </span>
        <span className="text-xs font-semibold text-amber-300 font-mono block mt-0.5">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
