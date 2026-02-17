import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "success" | "warning" | "destructive";
};

export const Badge = ({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) => {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default:
      "border-transparent bg-slate-900 text-slate-50 shadow-sm",
    outline: "border-slate-200 text-slate-700",
    success:
      "border-transparent bg-emerald-100 text-emerald-800",
    warning:
      "border-transparent bg-amber-100 text-amber-800",
    destructive:
      "border-transparent bg-red-100 text-red-800",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
};

