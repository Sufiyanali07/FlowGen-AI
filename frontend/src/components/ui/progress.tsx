import * as React from "react";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
};

export const Progress = ({ className = "", value, ...props }: ProgressProps) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      role="progressbar"
      className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 to-sky-400 transition-all"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  );
};

