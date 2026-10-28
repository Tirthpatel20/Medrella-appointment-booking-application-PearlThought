"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, StopCircle } from "lucide-react";
import {
  createOrGetTodaySession,
  openSession,
  closeSession,
} from "@/app/doctor/clinic/actions";
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

export function StartOrOpenSessionButton({
  sessionId,
  label = "Start Today's OPD Session",
}: {
  sessionId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAction() {
    setError("");

    startTransition(async () => {
      let targetSessionId = sessionId;

      if (!targetSessionId) {
        const initRes = await createOrGetTodaySession();
        if ("error" in initRes && initRes.error) {
          setError(initRes.error);
          return;
        }
        if ("session" in initRes && initRes.session) {
          targetSessionId = initRes.session.id;
        }
      }

      if (!targetSessionId) {
        setError("Could not initialize today's session.");
        return;
      }

      const openRes = await openSession(targetSessionId);
      if (openRes.error) {
        setError(openRes.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAction}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
      >
        <PlayCircle className="h-4 w-4" />
        {isPending ? "Starting session..." : label}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function CloseSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await closeSession(sessionId);

      if (res.error) {
        setError(res.error);
        return;
      }

      setOpen(false);
      setError("");
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
        >
          <StopCircle className="h-4 w-4 text-red-600" />
          Close Session
        </AlertDialogTrigger>

        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <StopCircle className="h-6 w-6" />
            </div>

            <AlertDialogTitle className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Close Today's OPD Session?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
              Closing this session will end the live queue for today. Any remaining
              waiting patients will be marked as cancelled. Completed consultations will
              remain saved.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
            >
              Keep Session Open
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 sm:w-auto"
            >
              {isPending ? "Closing..." : "Yes, Close Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && !open && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
