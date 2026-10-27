import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";
import { user } from "@/db/auth-schema";

import DoctorSearch from "./doctor-search";

import { Suspense } from "react";

export const metadata = {
    title: "Find Doctors | Medrella",
    description:
        "Discover verified doctors and explore their consultation details on Medrella.",
};

export async function DoctorsList() {
    const doctors = await db
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
        .where(eq(doctorProfiles.verificationStatus, "APPROVED"))
        .orderBy(asc(doctorProfiles.specialization), asc(user.name));

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                        Your health, your choice
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Find the right doctor for you
                    </h1>

                    <p className="mt-3 max-w-2xl text-slate-600">
                        Explore verified doctors, review their expertise, and find
                        someone who fits your healthcare needs.
                    </p>
                </div>

                {doctors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <h2 className="text-xl font-semibold text-slate-900">
                            No doctors available yet
                        </h2>

                        <p className="mt-2 text-slate-600">
                            Please check back later as more doctors join Medrella.
                        </p>

                        <Link
                            href="/"
                            className="mt-6 inline-flex rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800"
                        >
                            Back to home
                        </Link>
                    </div>
                ) : (
                    <DoctorSearch doctors={doctors} />
                )}
            </section>
        </main>
    );
}

export default function DoctorsPage() {
    return (
        <Suspense fallback={<DoctorsLoading />}>
            <DoctorsList />
        </Suspense>
    );
}

function DoctorsLoading() {
    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-slate-200" />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}