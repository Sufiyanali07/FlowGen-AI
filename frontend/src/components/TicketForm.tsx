import * as React from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Alert } from "./ui/alert";
import type { TicketPayload, TicketResponse } from "../lib/api";
import { submitTicket } from "../lib/api";
import { useToast } from "./ui/toast";

type Props = {
  onResult: (ticket: TicketResponse) => void;
  onLoadingChange: (loading: boolean) => void;
};

export const TicketForm: React.FC<Props> = ({ onResult, onLoadingChange }) => {
  const [form, setForm] = React.useState<TicketPayload>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const { push } = useToast();

  const validate = (): boolean => {
    const errs: string[] = [];

    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.email.trim()) {
      errs.push("Email is required.");
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      errs.push("Email format looks invalid.");
    }
    if (!form.subject.trim()) errs.push("Subject is required.");
    const msg = form.message;
    if (!msg.trim()) {
      errs.push("Message cannot be empty.");
    } else {
      if (msg.length < 10) errs.push("Message must be at least 10 characters.");
      if (msg.length > 5000)
        errs.push("Message cannot exceed 5000 characters.");
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      onLoadingChange(true);
      const result = await submitTicket(form);
      onResult(result);
      push({
        title: "Ticket submitted",
        description: "FlowGen AI analyzed the ticket successfully.",
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit ticket.";
      push({
        title: "Submission failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      onLoadingChange(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Submit a Support Ticket
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          FlowGen AI will classify, prioritize, and draft a safe response with
          built-in guardrails.
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <div>
            <div className="font-semibold">Please fix the following issues:</div>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="subject"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Billing question, account access, technical issue..."
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="message"
          >
            Message
          </label>
          <span className="text-xs text-slate-400">
            {form.message.length}/5000
          </span>
        </div>
        <Textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={6}
          placeholder="Describe your issue in as much detail as possible..."
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Your ticket will be analyzed with Gemini and routed with safety
          guardrails. Sensitive decisions are always escalated.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Analyzing..." : "Submit Ticket"}
        </Button>
      </div>
    </form>
  );
};

