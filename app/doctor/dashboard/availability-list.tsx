import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { availabilitySlots } from "@/db/schema";
import DeleteAvailabilityButton from "@/components/doctor/delete-availability-button";

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function formatTime(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    }).format(date);
}

export default async function AvailabilityList({
    doctorId,
}: {
    doctorId: string;
}) {
    const slots = await db
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.doctorId, doctorId))
        .orderBy(asc(availabilitySlots.startTime));

    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                    Your Availability Slots
                </h2>
                <span className="text-sm text-slate-500">
                    {slots.length} {slots.length === 1 ? "slot" : "slots"}
                </span>
            </div>

            {slots.length === 0 ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    No slots yet. Add an availability slot above to get started.
                </p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {slots.map((slot) => {
                        const start = new Date(slot.startTime);
                        const end = new Date(slot.endTime);
                        const sameDay =
                            formatDate(start) === formatDate(end);

                        return (
                            <li
                                key={slot.id}
                                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">
                                        {formatDate(start)}
                                        {!sameDay && ` – ${formatDate(end)}`}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {formatTime(start)} – {formatTime(end)}
                                        <span className="ml-2 text-xs text-slate-400">
                                            IST
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${slot.status === "AVAILABLE"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-700"
                                            }`}
                                    >
                                        {slot.status === "AVAILABLE" ? "Available" : "Blocked"}
                                    </span>

                                    <DeleteAvailabilityButton slotId={slot.id} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}