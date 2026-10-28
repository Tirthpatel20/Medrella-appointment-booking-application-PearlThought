"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { callPatient } from "@/app/doctor/clinic/actions";

export default function CallPatientButton({
  appointmentId,
  patientName,
  queuePosition,
  variant = "row",
}: {
  appointmentId: string;
  patientName?: string;
  queuePosition?: number | null;
  variant?: "primary" | "row";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCall() {
    setError("");

    startTransition(async () => {
      const result = await callPatient(appointmentId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  const isPrimary = variant === "primary";

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleCall}
        disabled={isPending}
        className={
          isPrimary
            ? "inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
        }
      >
        <BellRing className={isPrimary ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {isPending
          ? "Calling..."
          : isPrimary
          ? `Call Next Patient${queuePosition ? ` (#${queuePosition})` : ""}`
          : "Call Patient"}
      </button>

      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
