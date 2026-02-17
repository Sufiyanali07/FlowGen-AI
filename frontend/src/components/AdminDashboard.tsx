import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Select } from "./ui/select";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { TicketListItem, TicketLogEntry } from "../lib/api";
import { getTickets, getTicketLogs } from "../lib/api";
import { useToast } from "./ui/toast";

export const AdminDashboard: React.FC = () => {
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = React.useState<string>("");
  const [tickets, setTickets] = React.useState<TicketListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(
    null
  );
  const [logs, setLogs] = React.useState<TicketLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [showLogsPanel, setShowLogsPanel] = React.useState(true);
  const [logFilter, setLogFilter] = React.useState<"all" | "flags" | "errors">(
    "all"
  );
  const [expandedLogIds, setExpandedLogIds] = React.useState<number[]>([]);
  const { push } = useToast();

  const loadTickets = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTickets({
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
      });
      setTickets(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load tickets.";
      push({
        title: "Unable to load tickets",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, push]);

  React.useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const loadLogs = async (ticketId: number) => {
    try {
      setLogsLoading(true);
      setSelectedTicketId(ticketId);
      const data = await getTicketLogs(ticketId);
      setLogs(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load ticket logs.";
      push({
        title: "Unable to load logs",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const renderTicketsBody = () => {
    if (loading) {
      return (
        <TableBody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (tickets.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center text-xs text-slate-500">
              No tickets match the current filters.
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {tickets.map((t) => (
          <TableRow
            key={t.id}
            className="cursor-pointer"
            onClick={() => void loadLogs(t.id)}
          >
            <TableCell className="text-xs text-slate-500">#{t.id}</TableCell>
            <TableCell className="max-w-[180px] truncate">
              <div className="text-sm font-medium text-slate-900">
                {t.subject}
              </div>
              <div className="text-xs text-slate-500">{t.email}</div>
            </TableCell>
            <TableCell>
              {t.category ? (
                <Badge variant="outline">{t.category}</Badge>
              ) : (
                <span className="text-xs text-slate-400">Unknown</span>
              )}
            </TableCell>
            <TableCell>
              {t.urgency ? (
                <Badge
                  variant={
                    t.urgency === "high"
                      ? "destructive"
                      : t.urgency === "medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {t.urgency.toUpperCase()}
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">N/A</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-xs text-slate-700">
                {t.priority_score ?? "N/A"}
              </span>
            </TableCell>
            <TableCell>
              <Badge
                variant={t.status === "Auto-Resolved" ? "success" : "warning"}
              >
                {t.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  const toggleExpanded = (id: number) => {
    setExpandedLogIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      if (logFilter === "flags") {
        return Boolean(log.guardrail_flags && log.guardrail_flags.trim().length);
      }
      if (logFilter === "errors") {
        return Boolean(log.ai_output && log.ai_output.toLowerCase().includes("error"));
      }
      return true;
    });
  };

  const truncate = (value: string, max = 220) => {
    if (value.length <= max) return value;
    return value.slice(0, max) + "…";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Admin Observability Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Inspect how FlowGen AI is classifying, routing, and applying
            guardrails to live support tickets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Auto-Resolved">Auto-Resolved</option>
            <option value="Needs Human Review">Needs Human Review</option>
          </Select>
          <Select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="">All urgencies</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <button
            type="button"
            onClick={() => void loadTickets()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.3fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject / Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              {renderTicketsBody()}
            </Table>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Ticket Logs</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Inspect raw input, AI responses, and guardrail decisions for each ticket.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  checked={showLogsPanel}
                  onChange={(e) => setShowLogsPanel(e.target.checked)}
                  className="h-3 w-3 rounded border-slate-300 text-blue-600"
                />
                Show logs
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showLogsPanel && (
              <p className="text-xs text-slate-500">
                Logs are hidden. Enable &ldquo;Show logs&rdquo; to inspect detailed traces.
              </p>
            )}

            {showLogsPanel && (
              <>
                {logsLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )}
                {!logsLoading && selectedTicketId === null && (
                  <p className="text-sm text-slate-500">
                    Select a ticket row to inspect its logs, guardrail flags, and any Gemini errors.
                  </p>
                )}
                {!logsLoading &&
                  selectedTicketId !== null &&
                  logs.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No logs found for ticket #{selectedTicketId}.
                    </p>
                  )}

                {!logsLoading && logs.length > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Showing {getFilteredLogs().length} of {logs.length} log
                      entries for ticket #{selectedTicketId}.
                    </p>
                    <Select
                      value={logFilter}
                      onChange={(e) =>
                        setLogFilter(e.target.value as "all" | "flags" | "errors")
                      }
                      className="h-7 w-40 text-xs"
                    >
                      <option value="all">All logs</option>
                      <option value="flags">With guardrail flags</option>
                      <option value="errors">With Gemini errors</option>
                    </Select>
                  </div>
                )}

                {!logsLoading &&
                  getFilteredLogs().map((log) => {
                    const hasFlags =
                      !!log.guardrail_flags &&
                      log.guardrail_flags.split(",").filter(Boolean).length > 0;
                    const hasError =
                      !!log.ai_output &&
                      log.ai_output.toLowerCase().includes("error");
                    const expanded = expandedLogIds.includes(log.id);

                    return (
                      <div
                        key={log.id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <span>
                              {new Date(log.timestamp).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </span>
                            {hasFlags && (
                              <Badge variant="outline" className="text-[10px]">
                                Guardrails
                              </Badge>
                            )}
                            {hasError && (
                              <Badge variant="destructive" className="text-[10px]">
                                Gemini error
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {log.routing_decision && (
                              <span className="font-medium text-slate-700">
                                Route: {log.routing_decision}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleExpanded(log.id)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                            >
                              {expanded ? "Hide details" : "Show details"}
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <>
                            <div className="mt-1.5 space-y-1">
                              <div className="text-[11px] font-semibold text-slate-700">
                                Raw input
                              </div>
                              <pre className="max-h-32 overflow-auto rounded bg-white p-2 text-[11px] text-slate-700">
                                {truncate(log.raw_input)}
                              </pre>
                            </div>
                            {log.ai_output && (
                              <div className="mt-2 space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700">
                                  AI output / errors
                                </div>
                                <pre className="max-h-32 overflow-auto rounded bg-white p-2 text-[11px] text-slate-700">
                                  {truncate(log.ai_output)}
                                </pre>
                              </div>
                            )}
                            {log.guardrail_flags && (
                              <div className="mt-2 space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700">
                                  Guardrail flags
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {log.guardrail_flags
                                    .split(",")
                                    .filter(Boolean)
                                    .map((flag) => (
                                      <Badge key={flag} variant="outline">
                                        {flag}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

