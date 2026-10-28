import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Calendar } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";
import AvailabilityForm from "../dashboard/availability-form";
import AvailabilityList from "../dashboard/availability-list";

async function AvailabilityContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth");
  if (session.user.role !== "doctor") redirect("/");

  const [doctor] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, session.user.id))
    .limit(1);

  if (!doctor) redirect("/doctor/onboarding");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Today's Clinic Dashboard
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                DOCTOR WORKSPACE
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Manage Future Availability
              </h1>
              <p className="mt-1 text-slate-600">
                Create and manage advance fixed-time consultation slots for patients to book.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span>Advance Booking System</span>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Create New Availability Slot
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add future time slots for dedicated one-on-one appointments.
          </p>
          <div className="mt-6">
            <AvailabilityForm />
          </div>
        </section>

        <AvailabilityList doctorId={doctor.id} />
      </div>
    </main>
  );
}

export default function DoctorAvailabilityPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-600">Loading availability manager...</p>
        </main>
      }
    >
      <AvailabilityContent />
    </Suspense>
  );
}
