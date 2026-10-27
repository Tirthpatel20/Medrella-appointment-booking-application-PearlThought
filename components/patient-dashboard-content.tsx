
import Link from "next/link";
import { and, desc, eq, gt, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
    appointments,
    availabilitySlots,
    doctorProfiles,
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

    const now = new Date();

    const appointmentFields = {
        id: appointments.id,
        status: appointments.status,
        doctorName: user.name,
        specialization: doctorProfiles.specialization,
        consultationFee: doctorProfiles.consultationFee,
        startTime: availabilitySlots.startTime,
        endTime: availabilitySlots.endTime,
    };

    const upcoming = patient
        ? await db
            .select(appointmentFields)
            .from(appointments)
            .innerJoin(
                availabilitySlots,
                eq(appointments.slotId, availabilitySlots.id),
            )
            .innerJoin(
                doctorProfiles,
                eq(appointments.doctorId, doctorProfiles.id),
            )
            .innerJoin(user, eq(doctorProfiles.userId, user.id))
            .where(
                and(
                    eq(appointments.patientId, patient.id),
                    sql`${appointments.status} IN ('BOOKED', 'CONFIRMED')`,
                    gt(availabilitySlots.startTime, now),
                ),
            )
            .orderBy(availabilitySlots.startTime)
            .limit(1)
        : [];

    const history = patient
        ? await db
            .select(appointmentFields)
            .from(appointments)
            .innerJoin(
                availabilitySlots,
                eq(appointments.slotId, availabilitySlots.id),
            )
            .innerJoin(
                doctorProfiles,
                eq(appointments.doctorId, doctorProfiles.id),
            )
            .innerJoin(user, eq(doctorProfiles.userId, user.id))
            .where(
                and(
                    eq(appointments.patientId, patient.id),
                    or(
                        lte(availabilitySlots.startTime, now),
                        eq(appointments.status, "CANCELLED"),
                        eq(appointments.status, "COMPLETED"),
                    ),
                ),
            )
            .orderBy(desc(availabilitySlots.startTime))
            .limit(3)
        : [];

    const nextAppointment = upcoming[0];

    return (
        <main className="min-h-screen bg-[#f8fbfa] text-slate-900">

            <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">

                <section>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                                YOUR MEDRELLA HOME
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Good to see you, {name}!
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                                Your healthcare, all in one place. Here's what's happening with
                                your appointments.
                            </p>
                        </div>

                        <Link
                            href="/doctors"
                            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800"
                        >
                            Find a doctor
                            <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Your next appointment</h2>
                        {nextAppointment && (
                            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                                {nextAppointment.status}
                            </span>
                        )}
                    </div>

                    {nextAppointment ? (
                        <article className="mt-4 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-800">
                                        ✚
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-teal-700">
                                            {nextAppointment.specialization}
                                        </p>
                                        <h3 className="mt-1 text-xl font-semibold">
                                            Dr. {nextAppointment.doctorName}
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {formatDate(nextAppointment.startTime)}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {formatTime(nextAppointment.startTime)} –{" "}
                                            {formatTime(nextAppointment.endTime)}
                                        </p>
                                    </div>
                                </div>



                                <div className="sm:text-right">
                                    <p className="text-sm text-slate-500">Consultation fee</p>
                                    <p className="mt-1 text-xl font-bold">
                                        ₹
                                        {Number(nextAppointment.consultationFee).toLocaleString(
                                            "en-IN",
                                        )}
                                    </p>
                                    <div className="mt-4">
                                        <CancelAppointmentButton appointmentId={nextAppointment.id} />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
                                <span className="text-2xl">▦</span>
                            </div>

                            <h3 className="mt-4 text-lg font-semibold">
                                No upcoming appointments
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                                When you book an appointment, its details will appear here.
                                You can explore available doctors whenever you're ready.
                            </p>

                            <Link
                                href="/doctors"
                                className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                            >
                                Explore doctors →
                            </Link>
                        </div>
                    )}
                </section>

                <section className="mt-12">
                    <h2 className="text-xl font-semibold">Recent appointment history</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Your latest past and cancelled appointments.
                    </p>

                    {history.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="font-medium">Nothing in your history yet</p>
                            <p className="mt-2 text-sm text-slate-600">
                                Past appointments will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {history.map((appointment) => (
                                <article
                                    key={appointment.id}
                                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold">
                                            Dr. {appointment.doctorName}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {appointment.specialization}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatDate(appointment.startTime)} ·{" "}
                                            {formatTime(appointment.startTime)}
                                        </p>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${appointment.status === "CANCELLED"
                                            ? "bg-rose-50 text-rose-700"
                                            : appointment.status === "COMPLETED"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-700"
                                            }`}
                                    >
                                        {appointment.status}
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