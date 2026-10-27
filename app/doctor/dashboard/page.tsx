import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";

import AvailabilityForm from "./availability-form";
import AvailabilityList from "./availability-list";

async function DoctorDashboardContent() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "doctor") {
        redirect("/");
    }

    const [doctor] = await db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, session.user.id))
        .limit(1);

    if (!doctor) {
        redirect("/doctor/onboarding");
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold text-slate-900">
                    Doctor Dashboard
                </h1>

                <p className="mt-2 text-slate-600">
                    Welcome, {session.user.name}
                </p>

                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Professional Profile
                        </h2>
                        <Link
                            href="/doctor/onboarding?edit=true"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <span>✏️</span> Edit your details
                        </Link>
                    </div>

                    <div className="mt-5 space-y-3 text-slate-700">
                        <p>
                            <strong>Specialization:</strong>{" "}
                            {doctor.specialization}
                        </p>
                        <p>
                            <strong>Qualifications:</strong>{" "}
                            {doctor.qualifications || "Not provided"}
                        </p>
                        <p>
                            <strong>Medical License:</strong>{" "}
                            {doctor.licenseNumber || "Not provided"}
                        </p>
                        <p>
                            <strong>Experience:</strong>{" "}
                            {doctor.experienceYears ?? 0} years
                        </p>
                        <p>
                            <strong>Consultation Fee:</strong>{" "}
                            ₹{doctor.consultationFee}
                        </p>
                        {doctor.bio && (
                            <p>
                                <strong>Bio:</strong> {doctor.bio}
                            </p>
                        )}
                        <p className="flex items-center gap-2">
                            <strong>Verification Status:</strong>{" "}
                            <span
                                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                                    doctor.verificationStatus === "APPROVED"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                        : doctor.verificationStatus === "REJECTED"
                                        ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                                        : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                                }`}
                            >
                                {doctor.verificationStatus}
                            </span>
                        </p>
                    </div>
                </section>

                <AvailabilityForm />
                <AvailabilityList doctorId={doctor.id} />
            </div>
        </main>
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
