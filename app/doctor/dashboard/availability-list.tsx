
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { availabilitySlots } from "@/db/schema";

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
      <h2 className="text-xl font-semibold text-slate-900">
        Your Availability Slots
      </h2>

      {slots.length === 0 ? (
        <p className="mt-3 text-slate-600">
          No slots yet. Add one above to get started.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {new Date(slot.startTime).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">
                  Until {new Date(slot.endTime).toLocaleString()}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {slot.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
