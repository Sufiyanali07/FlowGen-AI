import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import type { TicketResponse } from "../lib/api";

type Props = {
  ticket?: TicketResponse | null;
  loading: boolean;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const TicketResult: React.FC<Props> = ({ ticket, loading }) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Analysis in progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Submit a ticket to see FlowGen AI&apos;s automated classification,
            prioritization, guardrails, and draft reply.
          </p>
        </CardContent>
      </Card>
    );
  }

  const priority = ticket.priority_score ?? 0;
  const confidence = ticket.confidence_score ?? 0;

  const urgencyVariant =
    ticket.urgency === "high"
      ? "destructive"
      : ticket.urgency === "medium"
      ? "warning"
      : "success";

  const statusVariant =
    ticket.status === "Auto-Resolved" ? "success" : "warning";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>AI Routing & Guardrails</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Ticket #{ticket.id} • {formatDate(ticket.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={statusVariant}>{ticket.status}</Badge>
            {ticket.is_duplicate && (
              <span className="text-[11px] text-slate-500">
                Marked as potential duplicate of #{ticket.original_ticket_id}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {ticket.category && (
            <Badge className="uppercase tracking-wide">
              Category: {ticket.category}
            </Badge>
          )}
          {ticket.urgency && (
            <Badge variant={urgencyVariant}>
              Urgency: {ticket.urgency.toUpperCase()}
            </Badge>
          )}
          {ticket.routing_decision && (
            <Badge variant="outline">
              Route: {ticket.routing_decision}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Priority score</span>
              <span className="font-medium">{priority || "N/A"}</span>
            </div>
            <Progress value={priority || 0} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Model confidence</span>
              <span className="font-medium">
                {confidence ? `${(confidence * 100).toFixed(0)}%` : "N/A"}
              </span>
            </div>
            <Progress value={confidence ? confidence * 100 : 0} />
          </div>
        </div>

        {ticket.guardrail_flags.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Guardrail flags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ticket.guardrail_flags.map((flag) => (
                <Badge key={flag} variant="outline">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {ticket.reasoning_summary && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Reasoning summary
            </div>
            <p className="text-sm text-slate-700">
              {ticket.reasoning_summary}
            </p>
          </div>
        )}

        {ticket.draft_reply && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Draft reply
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
              <p className="whitespace-pre-wrap">{ticket.draft_reply}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Generated by Gemini with FlowGen AI guardrails. Please skim
                before sending for high-risk topics.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

