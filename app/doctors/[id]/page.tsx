import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { doctorProfiles, availabilitySlots, appointments } from "@/db/schema";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { patientProfiles } from "@/db/schema";
import { sql } from "drizzle-orm";

import BookAppointmentButton from "./book-appointment-button";

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
                eq(doctorProfiles.verificationStatus, "APPROVED"),
            ),
        )
        .limit(1);

    if (!doctor) {
        notFound();
    }


    const session = await auth.api.getSession({
        headers: await headers(),
    });

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
                sql`${appointments.status} IN ('BOOKED', 'CONFIRMED')`,
            ),
        )
        .leftJoin(
            patientProfiles,
            eq(appointments.patientId, patientProfiles.id),
        )
        .where(
            and(
                eq(availabilitySlots.doctorId, doctor.id),
                eq(availabilitySlots.status, "AVAILABLE"),
                gt(availabilitySlots.startTime, new Date()),
            ),
        )
        .orderBy(asc(availabilitySlots.startTime))
        .limit(30);


    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    href="/doctors"
                    className="text-sm font-medium text-teal-700 hover:text-teal-900"
                >
                    ← Back to doctors
                </Link>

                <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
                                <p className="mt-2 text-slate-600">
                                    {doctor.qualifications}
                                </p>
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

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Available appointments
                    </h2>

                    <p className="mt-2 text-slate-600">
                        Choose a suitable time to continue with your booking.
                    </p>

                    {slots.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="font-medium text-slate-900">
                                No upcoming slots available
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                Please check back later for new appointment times.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            <section className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-6 h-56 rounded-2xl bg-white" />
                <div className="mt-8 h-8 w-64 rounded bg-slate-200" />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
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