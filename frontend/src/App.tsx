import * as React from "react";
import { TicketForm } from "./components/TicketForm";
import { TicketResult } from "./components/TicketResult";
import { AdminDashboard } from "./components/AdminDashboard";
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "./components/ui/tabs";
import { ToastProvider } from "./components/ui/toast";
import type { TicketResponse } from "./lib/api";

const App: React.FC = () => {
  const [latestTicket, setLatestTicket] = React.useState<TicketResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                  FlowGen AI
                </span>
                <h1 className="text-base font-semibold text-slate-900">
                  Intelligent Support Workflow Automation
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Automate ticket triage with Gemini while keeping humans in the
                loop for risky cases.
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <TabsRoot defaultValue="submit">
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="submit">Submit Ticket</TabsTrigger>
                <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
              </TabsList>
              <div className="hidden text-xs text-slate-500 sm:block">
                Backed by FastAPI, SQLite, and Gemini Free Tier with explicit
                guardrails and observability.
              </div>
            </div>

            <TabsContent value="submit">
              <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
                <TicketForm
                  onResult={(ticket) => setLatestTicket(ticket)}
                  onLoadingChange={setLoading}
                />
                <TicketResult ticket={latestTicket} loading={loading} />
              </div>
            </TabsContent>

            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          </TabsRoot>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;

