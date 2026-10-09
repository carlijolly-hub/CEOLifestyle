import React, { useState, useEffect, useRef } from "react";
import { SYSTEM_TIMEZONE } from "../utils/vendorOperatingHours";

interface SystemReferenceClockProps {
  clientsCount?: number;
  showDirectoryStatusWidgets?: boolean;
}

export default function SystemReferenceClock({
  clientsCount,
  showDirectoryStatusWidgets = false,
}: SystemReferenceClockProps) {
  const [now, setNow] = useState(() => new Date());
  const [timeFontSize, setTimeFontSize] = useState<string>("clamp(1.6rem, 3.8vw, 2.25rem)");
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedDate = now.toLocaleDateString("en-US", {
    timeZone: SYSTEM_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-US", {
    timeZone: SYSTEM_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Mathematically balance the time font size to match the horizontal visual width of the date
  const calibrateWidth = () => {
    if (!dateRef.current || !timeRef.current) return;
    const dateWidth = dateRef.current.getBoundingClientRect().width;
    const timeWidth = timeRef.current.getBoundingClientRect().width;

    if (dateWidth <= 0 || timeWidth <= 0) return;

    const computedStyle = window.getComputedStyle(timeRef.current);
    const currentSize = parseFloat(computedStyle.fontSize) || 32;

    // Calculate the proportional font size so time matches the date's visual width
    const targetSize = currentSize * (dateWidth / timeWidth);

    // Bounded between safe minimum and maximum to prevent overflow across all devices
    const boundedSize = Math.max(18, Math.min(46, targetSize));
    setTimeFontSize(`${boundedSize.toFixed(2)}px`);
  };

  useEffect(() => {
    calibrateWidth();
  }, [formattedDate, formattedTime]);

  useEffect(() => {
    calibrateWidth();
    if (document.fonts?.ready) {
      document.fonts.ready.then(calibrateWidth);
    }

    window.addEventListener("resize", calibrateWidth);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && dateRef.current) {
      ro = new ResizeObserver(() => {
        calibrateWidth();
      });
      ro.observe(dateRef.current);
    }

    return () => {
      window.removeEventListener("resize", calibrateWidth);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="flex items-center self-start md:self-end shrink-0">
      {/* Shared Centered Container for System Date & Time Display */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl text-center flex flex-col items-center justify-center shrink-0 shadow-xs select-none">
        {/* Date: Smaller, refined typography with subtle letter-spacing */}
        <div
          ref={dateRef}
          className="text-[11px] sm:text-xs md:text-[13px] font-semibold text-slate-300 tracking-[0.03em] whitespace-nowrap text-center leading-none"
        >
          {formattedDate}
        </div>

        {/* Time: Visibly larger typography, clean numerals with AM/PM, matched to date's visual width */}
        <div
          ref={timeRef}
          style={{
            fontSize: timeFontSize,
            lineHeight: 1.15,
          }}
          className="font-extrabold text-amber-300 tabular-nums whitespace-nowrap text-center tracking-[0.03em] mt-1 transition-[font-size] duration-150"
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

