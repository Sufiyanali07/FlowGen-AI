import * as React from "react";

export const Table = ({
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table
    className={`w-full caption-bottom text-sm ${className}`}
    {...props}
  />
);

export const TableHeader = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props} />
);

export const TableBody = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={`[&_tr:last-child]:border-0 ${className}`}
    {...props}
  />
);

export const TableRow = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`border-b transition-colors hover:bg-slate-50/60 ${className}`}
    {...props}
  />
);

export const TableHead = ({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`h-10 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    {...props}
  />
);

export const TableCell = ({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={`p-3 align-middle text-sm text-slate-700 ${className}`}
    {...props}
  />
);

