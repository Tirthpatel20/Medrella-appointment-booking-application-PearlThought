import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, count, eq, gte, inArray, lte } from "drizzle-orm";
import {
  Activity,
  Calendar,
  Clock,
  ExternalLink,
  Stethoscope,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  appointments,
  availabilitySlots,
  doctorProfiles,
  opdSessions,
  patientProfiles,
} from "@/db/schema";
import { user } from "@/db/auth-schema";

import CompleteAppointmentButton from "@/components/doctor/complete-appointment-button";
import CallPatientButton from "@/components/doctor/call-patient-button";
import SkipPatientButton from "@/components/doctor/skip-patient-button";
import WalkInForm from "@/components/doctor/walk-in-form";
import {
  StartOrOpenSessionButton,
  CloseSessionButton,
} from "@/components/doctor/session-control-button";

function formatDateHeader(date: Date) {
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

async function DoctorDashboardContent() {
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

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Fetch Today's OPD Session
  const [todaySession] = await db
    .select()
    .from(opdSessions)
    .where(
      and(
        eq(opdSessions.doctorId, doctor.id),
        eq(opdSessions.sessionDate, todayStr)
      )
    )
    .limit(1);

  // 2. Fetch OPD queue items if session exists
  const queueItems = todaySession
    ? await db
        .select({
          id: appointments.id,
          patientName: user.name,
          patientEmail: user.email,
          mode: appointments.mode,
          status: appointments.status,
          queuePosition: appointments.queuePosition,
          calledAt: appointments.calledAt,
          reason: appointments.reason,
          createdAt: appointments.createdAt,
        })
        .from(appointments)
        .innerJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
        .innerJoin(user, eq(patientProfiles.userId, user.id))
        .where(eq(appointments.sessionId, todaySession.id))
        .orderBy(asc(appointments.queuePosition))
    : [];

  const waitingCount = queueItems.filter((q) => q.status === "QUEUED").length;
  const calledPatient = queueItems.find((q) => q.status === "CALLED");
  const nextQueuedPatient = queueItems.find((q) => q.status === "QUEUED");
  const opdCompletedCount = queueItems.filter((q) => q.status === "COMPLETED").length;

  // 3. Fetch Fixed-time appointments for today
  const todayFixedAppointments = await db
    .select({
      id: appointments.id,
      patientName: user.name,
      patientEmail: user.email,
      status: appointments.status,
      reason: appointments.reason,
      startTime: availabilitySlots.startTime,
      endTime: availabilitySlots.endTime,
    })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .innerJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
    .innerJoin(user, eq(patientProfiles.userId, user.id))
    .where(
      and(
        eq(appointments.doctorId, doctor.id),
        gte(availabilitySlots.startTime, startOfToday),
        lte(availabilitySlots.startTime, endOfToday)
      )
    )
    .orderBy(asc(availabilitySlots.startTime));

  const fixedTodayActiveCount = todayFixedAppointments.filter((a) =>
    ["BOOKED", "CONFIRMED"].includes(a.status)
  ).length;

  const fixedTodayCompletedCount = todayFixedAppointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;

  const totalCompletedToday = opdCompletedCount + fixedTodayCompletedCount;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              TODAY'S CLINIC WORKSPACE
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dr. {session.user.name}
            </h1>
            <p className="mt-1 text-slate-600">
              {formatDateHeader(now)} · {doctor.specialization}
            </p>
          </div>

          <Link
            href="/doctor/availability"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-teal-700"
          >
            <Calendar className="h-4 w-4 text-teal-600" />
            <span>Manage Future Availability</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </header>

        {/* Operational summary strip */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Live OPD Queue</p>
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {waitingCount}{" "}
              <span className="text-sm font-normal text-slate-500">
                waiting {calledPatient ? "· 1 in room" : ""}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {todaySession?.status === "OPEN"
                ? "Session active · First-come queue"
                : todaySession?.status === "COMPLETED"
                ? "Session completed for today"
                : "No active session"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Fixed Consultations Today</p>
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {fixedTodayActiveCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Scheduled time slots booked for today
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Completed Today</p>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {totalCompletedToday}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {opdCompletedCount} OPD queue + {fixedTodayCompletedCount} fixed appointments
            </p>
          </article>
        </section>

        {/* Live OPD Clinic Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Today's Live OPD Session
                </h2>
                {todaySession?.status === "OPEN" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
                {todaySession?.status === "COMPLETED" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    CLOSED
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {todaySession?.status === "OPEN"
                  ? `Clinic open since ${
                      todaySession.openedAt ? formatTime(todaySession.openedAt) : "today"
                    }. Manage consultation flow and call patients.`
                  : todaySession?.status === "COMPLETED"
                  ? "Today's OPD session has concluded."
                  : "Start today's clinic session to accept walk-ins and live queue patients."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!todaySession && <StartOrOpenSessionButton />}
              {todaySession?.status === "SCHEDULED" && (
                <StartOrOpenSessionButton
                  sessionId={todaySession.id}
                  label="Open Clinic Session"
                />
              )}
              {todaySession?.status === "OPEN" && (
                <CloseSessionButton sessionId={todaySession.id} />
              )}
            </div>
          </div>

          {/* Session Body */}
          {!todaySession || todaySession.status === "SCHEDULED" ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                No Active OPD Clinic Session
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Click <strong>"Start Today's OPD Session"</strong> to open patient check-in,
                allow patients to join the queue, and register walk-ins.
              </p>
              <div className="mt-5 flex justify-center">
                <StartOrOpenSessionButton sessionId={todaySession?.id} />
              </div>
            </div>
          ) : todaySession.status === "COMPLETED" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Today's OPD session is completed. Total {opdCompletedCount} consultations were completed.
                </p>
              </div>

              {queueItems.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Queue #</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Final Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            #{item.queuePosition}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {item.patientName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.patientEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {item.mode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{item.reason || "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                item.status === "COMPLETED"
                                  ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                  : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Session OPEN */
            <div className="mt-6 space-y-6">
              {/* Current Consultation Spotlight */}
              {calledPatient ? (
                <div className="rounded-xl border-2 border-amber-400 bg-amber-50/60 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                          IN CONSULTATION · QUEUE #{calledPatient.queuePosition}
                        </span>
                        <span className="text-xs text-amber-800">
                          Called at{" "}
                          {calledPatient.calledAt
                            ? formatTime(calledPatient.calledAt)
                            : "just now"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {calledPatient.patientName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {calledPatient.patientEmail} · Mode: {calledPatient.mode}
                      </p>
                      {calledPatient.reason && (
                        <p className="mt-1 text-sm text-slate-700">
                          <strong>Chief complaint / Reason:</strong> {calledPatient.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <CompleteAppointmentButton
                        appointmentId={calledPatient.id}
                        label="Complete Consultation"
                        patientName={calledPatient.patientName}
                      />
                      <SkipPatientButton
                        appointmentId={calledPatient.id}
                        patientName={calledPatient.patientName}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/60 p-5">
                  <div>
                    <h3 className="font-semibold text-teal-900">
                      Consultation Room Available
                    </h3>
                    <p className="text-sm text-teal-700">
                      {nextQueuedPatient
                        ? `Next waiting patient is ${nextQueuedPatient.patientName} (Queue #${nextQueuedPatient.queuePosition}).`
                        : "No patients currently waiting in queue."}
                    </p>
                  </div>

                  {nextQueuedPatient && (
                    <CallPatientButton
                      appointmentId={nextQueuedPatient.id}
                      patientName={nextQueuedPatient.patientName}
                      queuePosition={nextQueuedPatient.queuePosition}
                      variant="primary"
                    />
                  )}
                </div>
              )}

              {/* Waiting Queue Table */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">
                    Live Patient Queue ({waitingCount} waiting)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Doctors can call any patient early if needed
                  </span>
                </div>

                {queueItems.length === 0 ? (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                    The queue is currently empty. Patients will appear here when they join or when you register a walk-in below.
                  </div>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Queue #</th>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {queueItems.map((item) => {
                          const isCalled = item.status === "CALLED";
                          const isQueued = item.status === "QUEUED";

                          return (
                            <tr
                              key={item.id}
                              className={
                                isCalled
                                  ? "bg-amber-50/50 font-medium"
                                  : "hover:bg-slate-50/50"
                              }
                            >
                              <td className="px-4 py-3 font-bold text-slate-900">
                                #{item.queuePosition}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">
                                  {item.patientName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.patientEmail}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={
                                    item.mode === "WALKIN"
                                      ? "rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700"
                                      : "rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                                  }
                                >
                                  {item.mode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {item.reason || "General consultation"}
                              </td>
                              <td className="px-4 py-3">
                                {isCalled ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                    CALLED
                                  </span>
                                ) : isQueued ? (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                    QUEUED
                                  </span>
                                ) : item.status === "COMPLETED" ? (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                    DONE
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                                    {item.status}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isQueued && (
                                  <div className="flex items-center justify-end gap-2">
                                    <CallPatientButton
                                      appointmentId={item.id}
                                      patientName={item.patientName}
                                      queuePosition={item.queuePosition}
                                      variant="row"
                                    />
                                    <SkipPatientButton
                                      appointmentId={item.id}
                                      patientName={item.patientName}
                                    />
                                  </div>
                                )}
                                {isCalled && (
                                  <div className="flex items-center justify-end gap-2">
                                    <CompleteAppointmentButton
                                      appointmentId={item.id}
                                      label="Done"
                                      patientName={item.patientName}
                                    />
                                    <SkipPatientButton
                                      appointmentId={item.id}
                                      patientName={item.patientName}
                                    />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Walk-in patient registration form */}
              <WalkInForm sessionId={todaySession.id} />
            </div>
          )}
        </section>

        {/* Today's Fixed-Time Consultations */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Today's Fixed-Time Consultations
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Exclusive time-slot appointments booked for today.
              </p>
            </div>
            <Link
              href="/doctor/availability"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Add more slots →
            </Link>
          </div>

          {todayFixedAppointments.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
              No advance fixed-time consultations booked for today.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {todayFixedAppointments.map((appt) => {
                const isActive = ["BOOKED", "CONFIRMED"].includes(appt.status);

                return (
                  <article
                    key={appt.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {appt.patientName}
                        </h3>
                        <span
                          className={
                            appt.status === "COMPLETED"
                              ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                              : "rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800"
                          }
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                      </p>
                      {appt.reason && (
                        <p className="mt-1 text-sm text-slate-600">
                          <span className="font-medium">Reason:</span> {appt.reason}
                        </p>
                      )}
                    </div>

                    {isActive && (
                      <CompleteAppointmentButton
                        appointmentId={appt.id}
                        patientName={appt.patientName}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Professional Profile */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Professional Profile
            </h2>
            <Link
              href="/doctor/onboarding?edit=true"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit your details
            </Link>
          </div>

          <div className="mt-5 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Specialization:</strong> {doctor.specialization}</p>
            <p><strong>Qualifications:</strong> {doctor.qualifications || "Not provided"}</p>
            <p><strong>Medical license:</strong> {doctor.licenseNumber || "Not provided"}</p>
            <p><strong>Experience:</strong> {doctor.experienceYears ?? 0} years</p>
            <p><strong>Consultation fee:</strong> ₹{doctor.consultationFee}</p>
            <p>
              <strong>Verification:</strong>{" "}
              <span className="font-semibold">{doctor.verificationStatus}</span>
            </p>
            {doctor.bio && (
              <p className="sm:col-span-2"><strong>Bio:</strong> {doctor.bio}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DoctorDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-600">Loading your clinic workspace...</p>
        </main>
      }
    >
      <DoctorDashboardContent />
    </Suspense>
  );
}