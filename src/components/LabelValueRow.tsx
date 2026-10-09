import React from "react";

export interface LabelValueRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  id?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

/**
 * Standard Global Responsive Label-Value Row
 * Ensures that when values or measurements wrap onto a second or subsequent line,
 * the continuation line remains visually aligned with the beginning of the value column,
 * rather than jumping back under the label.
 */
export const LabelValueRow: React.FC<LabelValueRowProps> = ({
  label,
  value,
  id,
  className = "",
  labelClassName = "",
  valueClassName = "",
}) => {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div id={id} className={`flex items-start gap-1.5 min-w-0 max-w-full text-left ${className}`}>
      <span className={`shrink-0 font-medium select-none ${labelClassName}`}>{label}</span>
      <span className={`flex-1 min-w-0 break-words ${valueClassName}`}>{value}</span>
    </div>
  );
};

export default LabelValueRow;
