"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAvailabilitySlot } from "@/app/doctor/dashboard/actions";
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

export default function DeleteAvailabilityButton({
  slotId,
}: {
  slotId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await deleteAvailabilitySlot(slotId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!pending) setOpen(nextOpen);
        }}
      >
        <AlertDialogTrigger
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Delete slot
        </AlertDialogTrigger>

        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this availability slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes the slot if no appointment
              references it. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {message && (
            <p role="alert" className="text-sm text-red-600">
              {message}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Keep slot
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? "Deleting..." : "Delete slot"}
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