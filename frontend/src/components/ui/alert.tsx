import * as React from "react";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

export const Alert = ({
  className = "",
  variant = "default",
  ...props
}: AlertProps) => {
  const base =
    "relative w-full rounded-lg border px-4 py-3 text-sm flex gap-2";
  const variants: Record<NonNullable<AlertProps["variant"]>, string> = {
    default: "border-amber-200 bg-amber-50 text-amber-900",
    destructive: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
};

