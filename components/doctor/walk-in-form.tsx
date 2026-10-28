"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { registerWalkIn } from "@/app/doctor/clinic/actions";

export default function WalkInForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim()) {
      setFeedback({ type: "error", message: "Please enter patient's account email." });
      return;
    }

    startTransition(async () => {
      const res = await registerWalkIn(sessionId, email, reason);

      if (res.error) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: res.success || "Walk-in patient registered in queue.",
      });
      setEmail("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-teal-700" />
        <h3 className="font-semibold text-slate-900">Register Walk-in Patient</h3>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Add an in-person patient to today's live OPD queue using their registered account email.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="walkin-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Patient Email <span className="text-red-500">*</span>
            </label>
            <input
              id="walkin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              required
              disabled={isPending}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="walkin-reason"
              className="block text-xs font-semibold text-slate-700"
            >
              Consultation Reason (Optional)
            </label>
            <input
              id="walkin-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Acute fever, skin rash"
              disabled={isPending}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
            />
          </div>
        </div>

        {feedback && (
          <div
            role="alert"
            className={
              feedback.type === "success"
                ? "flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-2.5 text-xs font-medium text-teal-800"
                : "flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700"
            }
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {isPending ? "Registering..." : "Add to Queue"}
          </button>
        </div>
      </form>
    </div>
  );
}
