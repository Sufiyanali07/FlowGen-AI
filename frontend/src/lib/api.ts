export type TicketPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type TicketResponse = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string | null;
  urgency?: string | null;
  priority_score?: number | null;
  confidence_score?: number | null;
  draft_reply?: string | null;
  reasoning_summary?: string | null;
  status: string;
  guardrail_flags: string[];
  routing_decision?: string | null;
  is_duplicate: boolean;
  original_ticket_id?: number | null;
  created_at: string;
};

export type TicketListItem = {
  id: number;
  name: string;
  email: string;
  subject: string;
  category?: string | null;
  urgency?: string | null;
  priority_score?: number | null;
  confidence_score?: number | null;
  status: string;
  created_at: string;
};

export type TicketLogEntry = {
  id: number;
  timestamp: string;
  raw_input: string;
  ai_output?: string | null;
  guardrail_flags?: string | null;
  routing_decision?: string | null;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      if (typeof data === "string") {
        message = data;
      } else if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function submitTicket(
  payload: TicketPayload
): Promise<TicketResponse> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<TicketResponse>(res);
}

export async function getTickets(params: {
  status?: string;
  urgency?: string;
}): Promise<TicketListItem[]> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.urgency) search.set("urgency", params.urgency);

  const res = await fetch(`${API_BASE}/tickets?${search.toString()}`);
  const data = await handleResponse<{ items: TicketListItem[] }>(res);
  return data.items;
}

export async function getTicketLogs(
  ticketId: number
): Promise<TicketLogEntry[]> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/logs`);
  return handleResponse<TicketLogEntry[]>(res);
}

