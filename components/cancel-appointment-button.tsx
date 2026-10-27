"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelAppointment } from "@/app/patient/dashboard/actions";
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

export default function CancelAppointmentButton({
    appointmentId,
}: {
    appointmentId: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState("");

    function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
        // Keep the dialog open while the server action is running.
        event.preventDefault();
        setMessage("");

        startTransition(async () => {
            const result = await cancelAppointment(appointmentId);

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
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                    Cancel appointment
                </AlertDialogTrigger>


                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
                    <AlertDialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-6 w-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                                />
                            </svg>
                        </div>

                        <AlertDialogTitle className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                            Cancel this appointment?
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">
                            Are you sure you want to cancel this appointment? The booking will be
                            marked as cancelled, and the time slot will become available to another
                            patient.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {message && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                            {message}
                        </div>
                    )}

                    <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <AlertDialogCancel
                            disabled={isPending}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:w-auto"
                        >
                            Keep appointment
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 sm:w-auto"
                        >
                            {isPending ? "Cancelling..." : "Yes, cancel appointment"}
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
