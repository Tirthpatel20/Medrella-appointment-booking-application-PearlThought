"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelAppointment } from "@/app/patient/dashboard/actions";

export default function CancelAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    setMessage("");

    startTransition(async () => {
      const result = await cancelAppointment(appointmentId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result.success ?? "Appointment cancelled.");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Cancelling..." : "Cancel appointment"}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${
            message.includes("successfully") || message === "Appointment cancelled."
              ? "text-teal-700"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
