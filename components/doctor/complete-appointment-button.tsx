
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeAppointment } from "@/app/doctor/dashboard/actions";

export default function CompleteAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleComplete() {
    if (!window.confirm("Mark this appointment as completed?")) return;

    setError("");

    startTransition(async () => {
      const result = await completeAppointment(appointmentId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleComplete}
        disabled={pending}
        className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
      >
        {pending ? "Updating..." : "Mark completed"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
