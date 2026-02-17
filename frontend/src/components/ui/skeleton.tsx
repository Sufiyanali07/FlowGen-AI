import * as React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  ...props
}) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    {...props}
  />
);

