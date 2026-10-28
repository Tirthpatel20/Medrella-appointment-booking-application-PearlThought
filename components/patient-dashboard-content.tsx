import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { BellRing, Calendar, Clock, Stethoscope, Users } from "lucide-react";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  appointments,
  availabilitySlots,
  doctorProfiles,
  opdSessions,
  patientProfiles,
} from "@/db/schema";

import CancelAppointmentButton from "@/components/cancel-appointment-button";

type Props = {
  userId: string;
  name: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default async function PatientDashboardContent({
  userId,
  name,
}: Props) {
  const [patient] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);

  const allAppointments = patient
    ? await db
        .select({
          id: appointments.id,
          mode: appointments.mode,
          status: appointments.status,
          queuePosition: appointments.queuePosition,
          calledAt: appointments.calledAt,
          reason: appointments.reason,
          createdAt: appointments.createdAt,
          doctorId: appointments.doctorId,
          doctorName: user.name,
          specialization: doctorProfiles.specialization,
          consultationFee: doctorProfiles.consultationFee,
          startTime: availabilitySlots.startTime,
          endTime: availabilitySlots.endTime,
          sessionDate: opdSessions.sessionDate,
          sessionStatus: opdSessions.status,
        })
        .from(appointments)
        .leftJoin(
          availabilitySlots,
          eq(appointments.slotId, availabilitySlots.id)
        )
        .leftJoin(opdSessions, eq(appointments.sessionId, opdSessions.id))
        .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
        .innerJoin(user, eq(doctorProfiles.userId, user.id))
        .where(eq(appointments.patientId, patient.id))
        .orderBy(desc(appointments.createdAt))
    : [];

  const now = new Date();

  // Active / Upcoming appointments:
  // 1. Any CALLED or QUEUED OPD/WALKIN appointments
  // 2. Any BOOKED or CONFIRMED fixed appointments
  const activeAppointments = allAppointments.filter((a) => {
    if (["CALLED", "QUEUED"].includes(a.status)) return true;
    if (["BOOKED", "CONFIRMED"].includes(a.status)) {
      if (a.startTime) return new Date(a.startTime) > now;
      return true;
    }
    return false;
  });

  // Pick the most pressing next appointment (CALLED first, then QUEUED, then closest future slot)
  const calledAppointment = activeAppointments.find((a) => a.status === "CALLED");
  const queuedAppointment = activeAppointments.find((a) => a.status === "QUEUED");
  const fixedUpcoming = activeAppointments
    .filter((a) => ["BOOKED", "CONFIRMED"].includes(a.status) && a.startTime)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())[0];

  const primaryNext = calledAppointment || queuedAppointment || fixedUpcoming || activeAppointments[0];

  // History: any completed, cancelled, or past appointments
  const history = allAppointments.filter((a) => {
    if (a.id === primaryNext?.id) return false;
    if (["COMPLETED", "CANCELLED"].includes(a.status)) return true;
    if (a.startTime && new Date(a.startTime) <= now) return true;
    return false;
  }).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f8fbfa] text-slate-900">
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 space-y-10">
        {/* Welcome Header */}
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                YOUR MEDRELLA HOME
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-slate-900">
                Good to see you, {name}!
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                Manage your consultations, track live OPD clinic queues, and view appointment history.
              </p>
            </div>

            <Link
              href="/doctors"
              className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Find a doctor
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* Primary Next Appointment Spotlight */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Your next appointment</h2>
            {primaryNext && (
              <span
                className={
                  primaryNext.status === "CALLED"
                    ? "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"
                    : primaryNext.status === "QUEUED"
                    ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                    : "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"
                }
              >
                {primaryNext.status === "CALLED" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    YOU'VE BEEN CALLED!
                  </>
                ) : primaryNext.status === "QUEUED" ? (
                  `IN OPD QUEUE (#${primaryNext.queuePosition})`
                ) : (
                  primaryNext.status
                )}
              </span>
            )}
          </div>

          {primaryNext ? (
            <article
              className={
                primaryNext.status === "CALLED"
                  ? "mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-6 shadow-md sm:p-8"
                  : "mt-4 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm sm:p-8"
              }
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={
                      primaryNext.status === "CALLED"
                        ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-amber-900"
                        : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-800"
                    }
                  >
                    {primaryNext.status === "CALLED" ? (
                      <BellRing className="h-7 w-7 animate-bounce" />
                    ) : primaryNext.mode === "OPD" || primaryNext.mode === "WALKIN" ? (
                      <Users className="h-7 w-7 text-teal-700" />
                    ) : (
                      <Stethoscope className="h-7 w-7 text-teal-700" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        {primaryNext.specialization}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {primaryNext.mode}
                      </span>
                    </div>

                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      Dr. {primaryNext.doctorName}
                    </h3>

                    {/* Mode specific details */}
                    {primaryNext.mode === "OPD" || primaryNext.mode === "WALKIN" ? (
                      <div className="mt-3 space-y-1">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 border border-teal-200">
                          <Users className="h-4 w-4 text-teal-700" />
                          <span className="text-sm font-bold text-teal-900">
                            Queue Position #{primaryNext.queuePosition ?? "—"}
                          </span>
                        </div>
                        {primaryNext.status === "CALLED" ? (
                          <p className="mt-2 text-sm font-bold text-amber-900">
                            🔔 The doctor has called you! Please head directly to the consultation room now.
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600">
                            Live queue for today · First-come, first-served consultation.
                          </p>
                        )}
                      </div>
                    ) : (
                      primaryNext.startTime && (
                        <div className="mt-2 text-sm text-slate-600 space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {formatDate(new Date(primaryNext.startTime))}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatTime(new Date(primaryNext.startTime))} –{" "}
                            {primaryNext.endTime
                              ? formatTime(new Date(primaryNext.endTime))
                              : ""}
                          </p>
                        </div>
                      )
                    )}

                    {primaryNext.reason && (
                      <p className="mt-3 text-xs text-slate-600">
                        <strong className="text-slate-800">Reason:</strong> {primaryNext.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-slate-500">Consultation fee</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ₹{Number(primaryNext.consultationFee).toLocaleString("en-IN")}
                  </p>

                  {/* Allow cancelling when BOOKED, CONFIRMED, or QUEUED (not when CALLED) */}
                  {["BOOKED", "CONFIRMED", "QUEUED"].includes(primaryNext.status) && (
                    <div className="mt-4">
                      <CancelAppointmentButton appointmentId={primaryNext.id} />
                    </div>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
                <Calendar className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No active or upcoming appointments
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Join a live OPD queue or book an advance consultation with any of our verified doctors.
              </p>

              <Link
                href="/doctors"
                className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 shadow-sm"
              >
                Explore doctors →
              </Link>
            </div>
          )}
        </section>

        {/* History Section */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">Recent consultation history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Past completed and cancelled consultations.
          </p>

          {history.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-medium text-slate-800">Nothing in your history yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Past appointments will appear here after completion.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {history.map((appt) => (
                <article
                  key={appt.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        Dr. {appt.doctorName}
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {appt.mode}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-600">
                      {appt.specialization}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {appt.startTime
                        ? `${formatDate(new Date(appt.startTime))} · ${formatTime(
                            new Date(appt.startTime)
                          )}`
                        : appt.createdAt
                        ? formatDate(new Date(appt.createdAt))
                        : "Previous visit"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      appt.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : appt.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-700"
                        : appt.status === "CALLED"
                        ? "bg-amber-100 text-amber-900"
                        : appt.status === "QUEUED"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {appt.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}