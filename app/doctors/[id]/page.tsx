import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  doctorProfiles,
  availabilitySlots,
  appointments,
  patientProfiles,
  opdSessions,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import BookAppointmentButton from "./book-appointment-button";
import OpdQueueCard from "./opd-queue-card";

type DoctorPageProps = {
  params: Promise<{ id: string }>;
};

async function DoctorDetails({ id }: { id: string }) {
  const [doctor] = await db
    .select({
      id: doctorProfiles.id,
      name: user.name,
      specialization: doctorProfiles.specialization,
      qualifications: doctorProfiles.qualifications,
      experienceYears: doctorProfiles.experienceYears,
      consultationFee: doctorProfiles.consultationFee,
      bio: doctorProfiles.bio,
    })
    .from(doctorProfiles)
    .innerJoin(user, eq(doctorProfiles.userId, user.id))
    .where(
      and(
        eq(doctorProfiles.id, id),
        eq(doctorProfiles.verificationStatus, "APPROVED")
      )
    )
    .limit(1);

  if (!doctor) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch today's OPEN OPD session if any
  const [todayOpdSession] = await db
    .select()
    .from(opdSessions)
    .where(
      and(
        eq(opdSessions.doctorId, doctor.id),
        eq(opdSessions.sessionDate, todayStr),
        eq(opdSessions.status, "OPEN")
      )
    )
    .limit(1);

  let patientOpdAppointment: {
    id: string;
    queuePosition: number | null;
    status: string;
  } | null = null;

  let currentQueueLength = 0;

  if (todayOpdSession) {
    const activeEntries = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        queuePosition: appointments.queuePosition,
        status: appointments.status,
        userId: patientProfiles.userId,
      })
      .from(appointments)
      .innerJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
      .where(
        and(
          eq(appointments.sessionId, todayOpdSession.id),
          sql`${appointments.status} IN ('QUEUED', 'CALLED')`
        )
      );

    currentQueueLength = activeEntries.length;

    if (session?.user?.id) {
      const match = activeEntries.find((e) => e.userId === session.user.id);
      if (match) {
        patientOpdAppointment = {
          id: match.id,
          queuePosition: match.queuePosition,
          status: match.status,
        };
      }
    }
  }

  // Fetch advance slots
  const slots = await db
    .select({
      id: availabilitySlots.id,
      startTime: availabilitySlots.startTime,
      endTime: availabilitySlots.endTime,
      bookedSlotId: appointments.slotId,
      bookedByUserId: patientProfiles.userId,
    })
    .from(availabilitySlots)
    .leftJoin(
      appointments,
      and(
        eq(appointments.slotId, availabilitySlots.id),
        sql`${appointments.status} IN ('BOOKED', 'CONFIRMED')`
      )
    )
    .leftJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
    .where(
      and(
        eq(availabilitySlots.doctorId, doctor.id),
        eq(availabilitySlots.status, "AVAILABLE"),
        gt(availabilitySlots.startTime, new Date())
      )
    )
    .orderBy(asc(availabilitySlots.startTime))
    .limit(30);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/doctors"
          className="inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← Back to doctors
        </Link>

        {/* Doctor Profile Card */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-teal-100 text-3xl font-bold text-teal-800">
              {doctor.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                {doctor.specialization}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Dr. {doctor.name}
              </h1>

              {doctor.qualifications && (
                <p className="mt-2 text-slate-600">{doctor.qualifications}</p>
              )}

              {doctor.experienceYears !== null && (
                <p className="mt-2 text-sm text-slate-600">
                  {doctor.experienceYears}{" "}
                  {doctor.experienceYears === 1 ? "year" : "years"} of experience
                </p>
              )}
            </div>

            <div className="rounded-xl bg-teal-50 p-4 sm:min-w-36">
              <p className="text-sm text-slate-600">Consultation fee</p>
              <p className="mt-1 text-2xl font-bold text-teal-800">
                ₹{Number(doctor.consultationFee).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {doctor.bio && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-semibold text-slate-900">
                About the doctor
              </h2>
              <p className="mt-3 leading-7 text-slate-600">{doctor.bio}</p>
            </div>
          )}
        </article>

        {/* Live OPD Consultation Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Track 1: Today's Live OPD Queue
            </h2>
          </div>

          {todayOpdSession ? (
            <OpdQueueCard
              sessionId={todayOpdSession.id}
              currentQueueLength={currentQueueLength}
              patientAppointment={patientOpdAppointment}
              isPatient={session?.user.role === "patient"}
              isLoggedIn={!!session}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              <p className="font-semibold text-slate-900">No Live OPD Session Today</p>
              <p className="mt-1 text-sm text-slate-500">
                The doctor hasn't opened a walk-in/live clinic session for today. You can still
                reserve an advance fixed-time appointment slot below.
              </p>
            </div>
          )}
        </section>

        {/* Advance Fixed-Time Slots Section */}
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Track 2: Advance Fixed-Time Appointments
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Reserve a guaranteed, exclusive consultation slot for a future date and time.
            </p>
          </div>

          {slots.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-medium text-slate-900">
                No upcoming advance slots available
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Please check back later for new appointment times.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-semibold text-slate-900">
                    {new Date(slot.startTime).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {new Date(slot.startTime).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}
                    {" – "}
                    {new Date(slot.endTime).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>

                  <BookAppointmentButton
                    slotId={slot.id}
                    status={
                      !slot.bookedSlotId
                        ? "available"
                        : session?.user.role === "patient" &&
                          slot.bookedByUserId === session.user.id
                        ? "yours"
                        : "booked"
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function DoctorLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-56 rounded-2xl bg-white" />
        <div className="h-32 rounded-2xl bg-white" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-28 rounded-xl bg-white" />
          <div className="h-28 rounded-xl bg-white" />
        </div>
      </section>
    </main>
  );
}

async function DoctorPageContent({ params }: DoctorPageProps) {
  const { id } = await params;

  return <DoctorDetails id={id} />;
}

export default function DoctorPage({ params }: DoctorPageProps) {
  return (
    <Suspense fallback={<DoctorLoading />}>
      <DoctorPageContent params={params} />
    </Suspense>
  );
}