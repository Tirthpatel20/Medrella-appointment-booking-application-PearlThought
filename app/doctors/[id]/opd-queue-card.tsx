"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, AlertCircle, CheckCircle2, BellRing, LogOut } from "lucide-react";
import { joinOpdQueue, leaveOpdQueue } from "./actions";

export default function OpdQueueCard({
  sessionId,
  currentQueueLength,
  patientAppointment,
  isPatient,
  isLoggedIn,
}: {
  sessionId: string;
  currentQueueLength: number;
  patientAppointment?: {
    id: string;
    queuePosition: number | null;
    status: string;
  } | null;
  isPatient: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.set("sessionId", sessionId);
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }

    startTransition(async () => {
      const res = await joinOpdQueue(formData);

      if (res.error) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: res.success || "Successfully joined the queue!",
      });
      router.refresh();
    });
  }

  function handleLeave() {
    if (!patientAppointment) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await leaveOpdQueue(patientAppointment.id);

      if (res.error) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: "You have left the queue.",
      });
      router.refresh();
    });
  }

  if (patientAppointment) {
    const isCalled = patientAppointment.status === "CALLED";

    return (
      <div
        className={
          isCalled
            ? "rounded-2xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm"
            : "rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm"
        }
      >
        <div className="flex items-center gap-2">
          {isCalled ? (
            <BellRing className="h-6 w-6 text-amber-700 animate-bounce" />
          ) : (
            <Users className="h-6 w-6 text-teal-700" />
          )}
          <h3
            className={
              isCalled
                ? "text-xl font-bold text-amber-950"
                : "text-xl font-bold text-teal-950"
            }
          >
            {isCalled ? "You've Been Called!" : "You Are In Today's OPD Queue"}
          </h3>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Your Queue Number</p>
            <p className="text-3xl font-extrabold text-teal-800">
              #{patientAppointment.queuePosition ?? "—"}
            </p>
          </div>

          <div className="flex-1">
            {isCalled ? (
              <p className="text-sm font-semibold text-amber-900">
                Please proceed directly to the doctor's consultation room now.
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                Please wait in the clinic or check back here. When the doctor calls you, your
                status will update live.
              </p>
            )}
          </div>
        </div>

        {!isCalled && (
          <div className="mt-5 border-t border-teal-100 pt-4 flex items-center justify-between">
            <Link
              href="/patient/dashboard"
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              View in Patient Dashboard →
            </Link>

            <button
              type="button"
              onClick={handleLeave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isPending ? "Leaving..." : "Leave Queue"}
            </button>
          </div>
        )}

        {feedback && (
          <p
            role="alert"
            className={
              feedback.type === "error"
                ? "mt-3 text-xs font-medium text-red-600"
                : "mt-3 text-xs font-medium text-teal-700"
            }
          >
            {feedback.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h3 className="text-lg font-bold text-slate-900">Live OPD Queue Open Today</h3>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          {currentQueueLength} {currentQueueLength === 1 ? "patient" : "patients"} currently in queue
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        No prior appointment slot needed. Join the walk-in / OPD queue and consult the doctor
        in order of arrival.
      </p>

      {!isLoggedIn ? (
        <div className="mt-4">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Sign in to Join OPD Queue
          </Link>
        </div>
      ) : !isPatient ? (
        <p className="mt-4 text-xs font-medium text-slate-500">
          Only patient accounts can join the OPD consultation queue.
        </p>
      ) : (
        <form onSubmit={handleJoin} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="queue-reason"
              className="block text-xs font-semibold text-slate-700"
            >
              Consultation Reason / Chief Complaint (Optional)
            </label>
            <input
              id="queue-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cough, follow-up, general checkup"
              disabled={isPending}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
            />
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

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            {isPending ? "Joining queue..." : "Join Live OPD Queue"}
          </button>
        </form>
      )}
    </div>
  );
}
