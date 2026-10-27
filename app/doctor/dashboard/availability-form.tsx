
"use client";

import { useState, useTransition } from "react";
import { createAvailabilitySlot } from "./actions";

export default function AvailabilityForm() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await createAvailabilitySlot(formData);

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result?.success ?? "Slot created.");
      (
        document.getElementById("availability-form") as HTMLFormElement
      )?.reset();
    });
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Manage Availability
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Add a future time slot that patients can book.
      </p>

      <form
        id="availability-form"
        action={handleSubmit}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-slate-700">
          Start time
          <input
            name="startTime"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          End time
          <input
            name="endTime"
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Add availability"}
          </button>
        </div>
      </form>

      {message && (
        <p aria-live="polite" className="mt-4 text-sm text-slate-700">
          {message}
        </p>
      )}
    </section>
  );
}
