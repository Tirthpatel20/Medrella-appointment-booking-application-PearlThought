import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, count, eq, gt, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appointments, availabilitySlots, doctorProfiles, patientProfiles } from "@/db/schema";
import { user } from "@/db/auth-schema";

import AvailabilityForm from "./availability-form";
import AvailabilityList from "./availability-list";
import CompleteAppointmentButton from "@/components/doctor/complete-appointment-button";

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

    const [upcomingCount] = await db
        .select({ total: count() })
        .from(appointments)
        .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
        .where(
            and(
                eq(appointments.doctorId, doctor.id),
                inArray(appointments.status, ["BOOKED", "CONFIRMED"]),
                gt(availabilitySlots.startTime, now)
            )
        );

    const [availableCount] = await db
        .select({ total: count() })
        .from(availabilitySlots)
        .where(
            and(
                eq(availabilitySlots.doctorId, doctor.id),
                eq(availabilitySlots.status, "AVAILABLE"),
                gt(availabilitySlots.startTime, now)
            )
        );

    const [completedCount] = await db
        .select({ total: count() })
        .from(appointments)
        .where(
            and(
                eq(appointments.doctorId, doctor.id),
                eq(appointments.status, "COMPLETED")
            )
        );

    const upcoming = await db
        .select({
            id: appointments.id,
            status: appointments.status,
            reason: appointments.reason,
            patientName: user.name,
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
                inArray(appointments.status, ["BOOKED", "CONFIRMED"]),
                gt(availabilitySlots.startTime, now)
            )
        )
        .orderBy(availabilitySlots.startTime)
        .limit(10);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                        DOCTOR WORKSPACE
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Welcome, Dr. {session.user.name}
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Manage your appointments, professional profile, and availability.
                    </p>
                </header>

                <section className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label="Upcoming appointments"
                        value={upcomingCount.total}
                        description="Future booked consultations"
                    />
                    <SummaryCard
                        label="Available slots"
                        value={availableCount.total}
                        description="Future slots patients can book"
                    />
                    <SummaryCard
                        label="Completed appointments"
                        value={completedCount.total}
                        description="Consultations marked completed"
                    />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Upcoming appointments
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Your next scheduled patient consultations.
                    </p>

                    {upcoming.length === 0 ? (
                        <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
                            <h3 className="font-semibold text-slate-900">
                                No upcoming appointments
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                New bookings will appear here when patients book your available slots.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {upcoming.map((appointment) => (
                                <article
                                    key={appointment.id}
                                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-900">
                                            {appointment.patientName}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {formatDate(appointment.startTime)} ·{" "}
                                            {formatTime(appointment.startTime)} –{" "}
                                            {formatTime(appointment.endTime)}
                                        </p>
                                        {appointment.reason && (
                                            <p className="mt-2 text-sm text-slate-600">
                                                <span className="font-medium">Reason:</span>{" "}
                                                {appointment.reason}
                                            </p>
                                        )}
                                        <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                                            {appointment.status}
                                        </span>
                                    </div>

                                    <CompleteAppointmentButton appointmentId={appointment.id} />
                                </article>
                            ))}
                        </div>
                    )}
                </section>

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

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Manage availability
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Add future time slots for patients to book.
                    </p>
                    <div className="mt-5">
                        <AvailabilityForm />
                        <AvailabilityList doctorId={doctor.id} />
                    </div>
                </section>
            </div>
        </main>
    );
}

function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: number;
    description: string;
}) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
        </article>
    );
}

export default function DoctorDashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50">
                    <p className="text-slate-600">Loading your dashboard...</p>
                </main>
            }
        >
            <DoctorDashboardContent />
        </Suspense>
    );
}