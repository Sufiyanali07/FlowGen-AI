import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsRootProps = {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
};

export const TabsRoot: React.FC<TabsRootProps> = ({
  defaultValue,
  className = "",
  children,
}) => {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export const TabsList: React.FC<TabsListProps> = ({
  className = "",
  ...props
}) => (
  <div
    className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600 ${className}`}
    {...props}
  />
);

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  className = "",
  value,
  children,
  ...props
}) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        isActive
          ? "bg-card text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export const TabsContent: React.FC<TabsContentProps> = ({
  className = "",
  value,
  children,
  ...props
}) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;

  if (ctx.value !== value) return null;

  return (
    <div className={`mt-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

