"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { completeAppointment } from "@/app/doctor/dashboard/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CompleteAppointmentButton({
  appointmentId,
  label = "Mark completed",
  patientName,
}: {
  appointmentId: string;
  label?: string;
  patientName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await completeAppointment(appointmentId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setOpen(false);
      setMessage("");
      router.refresh();
    });
  }

  return (
    <div>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isPending) setOpen(nextOpen);
        }}
      >
        <AlertDialogTrigger
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {label}
        </AlertDialogTrigger>

        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-8 ring-teal-50/50">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <AlertDialogTitle className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Complete Consultation?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
              {patientName ? (
                <>
                  Are you sure you want to mark the consultation with{" "}
                  <strong className="text-slate-800">{patientName}</strong> as completed?
                </>
              ) : (
                "Are you sure you want to mark this consultation as completed?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {message && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              {message}
            </div>
          )}

          <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 sm:w-auto"
            >
              {isPending ? "Completing..." : "Yes, complete consultation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {message && !open && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
