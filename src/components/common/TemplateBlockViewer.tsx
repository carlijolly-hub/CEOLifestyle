import React from "react";

interface TemplateBlockViewerProps {
  text: string;
  theme?: "light" | "dark";
  className?: string;
}

/**
 * Standardized Customer & Production Template Viewer
 * 
 * Enforces proper label/value presentation layout so that wrapped continuation text
 * (such as full unit names like "(Centimeters)", long product names, or multi-word suppliers)
 * naturally aligns under the beginning of the value/content column, NOT under the label.
 */
export const TemplateBlockViewer: React.FC<TemplateBlockViewerProps> = ({
  text,
  theme = "light",
  className = ""
}) => {
  const lines = (text || "").split("\n");

  const isDark = theme === "dark";
  const baseContainerClass = isDark
    ? "p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed select-text"
    : "p-3.5 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed select-text";

  return (
    <div className={`${baseContainerClass} ${className}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();

        // 1. Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2.5" />;
        }

        // 2. Horizontal divider lines (e.g. "----" or "====")
        if (/^[-=_*~]{4,}$/.test(line.trim())) {
          return (
            <div
              key={idx}
              className={`border-t my-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}
            />
          );
        }

        // 3. Label-Value row pattern: e.g.
        // "Client: Carli Jolly"
        // "Job: The Conscience Laws Of Human Nature Edition"
        // "Measurement: 27.94 cm × 30.48 cm (Centimeters)"
        // "Product: The Conscience Laws Of Human Nature Edition"
        // "Supplier: ABC International Printing & Manufacturing Ltd."
        // "* Sheet Size: 11 in × 16 in (Inches)"
        // "* Production Cost: JMD $12,000"
        // "Delivery Method: Knutsford Express"
        const labelValueMatch = line.match(/^(\s*(?:[*•-]\s*)?[A-Za-z0-9_#&/() -]+:)\s+(.*)$/);
        if (labelValueMatch) {
          const label = labelValueMatch[1];
          const val = labelValueMatch[2];
          return (
            <div key={idx} className="label-value-row items-baseline leading-relaxed">
              <span
                className={`label-value-label font-bold shrink-0 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {label}
              </span>
              <span
                className={`label-value-val break-words min-w-0 font-medium ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                {val}
              </span>
            </div>
          );
        }

        // 4. Bullet item pattern without colon: e.g. "* 10 × 11 in × 16 in (Inches) (Logo)"
        const bulletMatch = line.match(/^(\s*[*•-]\s+)(.*)$/);
        if (bulletMatch) {
          const bullet = bulletMatch[1];
          const content = bulletMatch[2];
          return (
            <div key={idx} className="hanging-indent items-baseline leading-relaxed">
              <span
                className={`shrink-0 font-bold ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              >
                {bullet}
              </span>
              <span
                className={`flex-1 min-w-0 break-words font-medium ${
                  isDark ? "text-slate-200" : "text-slate-800"
                }`}
              >
                {content}
              </span>
            </div>
          );
        }

        // 5. Section titles (e.g. "*IN-HOUSE DTF PRINTING QUOTE*", "*Production Specifications:*")
        const isHeader =
          (line.startsWith("*") && line.endsWith("*") && line.length > 2) ||
          line.endsWith(":") ||
          line === line.toUpperCase();

        if (isHeader) {
          return (
            <div
              key={idx}
              className={`font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {line}
            </div>
          );
        }

        // 6. Regular prose lines or footers
        return (
          <div
            key={idx}
            className={`break-words ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

export default TemplateBlockViewer;
