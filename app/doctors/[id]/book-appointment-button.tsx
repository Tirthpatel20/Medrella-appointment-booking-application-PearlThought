"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "./actions";

type BookingStatus = "available" | "booked" | "yours";

export default function BookAppointmentButton({
  slotId,
  status,
}: {
  slotId: string;
  status: BookingStatus;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleBooking() {
    setMessage("");

    const formData = new FormData();
    formData.set("slotId", slotId);

    startTransition(async () => {
      const result = await bookAppointment(formData);

      if (result.error) {
        setMessage(result.error);
        router.refresh();
        return;
      }

      setMessage(result.success ?? "Appointment booked successfully.");
      router.refresh();
    });
  }

  if (status === "booked") {
    return (
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"
      >
        Already booked
      </button>
    );
  }

  if (status === "yours") {
    return (
      <div className="mt-4">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-lg bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800"
        >
          ✓ You've booked this slot
        </button>
        <p className="mt-2 text-xs text-slate-500">
          View your appointment in your patient dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleBooking}
        disabled={isPending}
        className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Booking..." : "Book appointment"}
      </button>

      {message && (
        <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-700">
          {message}
        </p>
      )}
    </div>
  );
}
