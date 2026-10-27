"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { saveDoctorProfile } from "./actions";

interface ExistingDoctorData {
    specialization?: string;
    qualifications?: string | null;
    licenseNumber?: string | null;
    experienceYears?: number | null;
    consultationFee?: string;
    bio?: string | null;
}

interface DoctorOnboardingFormProps {
    isEdit?: boolean;
    existingDoctor?: ExistingDoctorData | null;
}

const initialState: { error?: string; success?: boolean } = {};

export default function DoctorOnboardingForm({
    isEdit = false,
    existingDoctor,
}: DoctorOnboardingFormProps) {
    const [state, formAction, pending] = useActionState(
        saveDoctorProfile,
        initialState,
    );

    useEffect(() => {
        if (state.success) {
            // Full navigation ensures client-side router cache is bypassed
            window.location.href = "/doctor/dashboard";
        }
    }, [state.success]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-blue-600">
                        {isEdit
                            ? "MEDRELLA · EDIT DOCTOR PROFILE"
                            : "MEDRELLA · DOCTOR REGISTRATION"}
                    </p>

                    {isEdit && (
                        <Link
                            href="/doctor/dashboard"
                            className="text-sm font-medium text-slate-500 hover:text-slate-800"
                        >
                            ← Back to Dashboard
                        </Link>
                    )}
                </div>

                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                    {isEdit
                        ? "Edit your professional details"
                        : "Set up your professional profile"}
                </h1>

                <p className="mt-2 text-slate-600">
                    {isEdit
                        ? "Enter your updated details below to revise your doctor profile."
                        : "Provide your professional details to submit your profile for verification."}
                </p>

                <form action={formAction} className="mt-8 space-y-5">
                    <label className="block text-sm font-medium text-slate-700">
                        Specialization *
                        <input
                            name="specialization"
                            required
                            minLength={2}
                            maxLength={100}
                            placeholder={
                                existingDoctor?.specialization
                                    ? `Current: ${existingDoctor.specialization}`
                                    : "e.g. Cardiology"
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Qualifications
                        <input
                            name="qualifications"
                            maxLength={200}
                            placeholder={
                                existingDoctor?.qualifications
                                    ? `Current: ${existingDoctor.qualifications}`
                                    : "e.g. MBBS, MD"
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Medical license number *
                        <input
                            name="licenseNumber"
                            required
                            minLength={3}
                            maxLength={100}
                            placeholder={
                                existingDoctor?.licenseNumber
                                    ? `Current: ${existingDoctor.licenseNumber}`
                                    : "e.g. MED-12345"
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </label>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Years of experience *
                            <input
                                name="experienceYears"
                                type="number"
                                required
                                min={0}
                                max={80}
                                step={1}
                                placeholder={
                                    existingDoctor?.experienceYears !== undefined &&
                                    existingDoctor?.experienceYears !== null
                                        ? `Current: ${existingDoctor.experienceYears}`
                                        : "0"
                                }
                                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </label>

                        <label className="block text-sm font-medium text-slate-700">
                            Consultation fee (₹) *
                            <input
                                name="consultationFee"
                                type="number"
                                required
                                min="0.01"
                                max="100000"
                                step="0.01"
                                placeholder={
                                    existingDoctor?.consultationFee
                                        ? `Current: ₹${existingDoctor.consultationFee}`
                                        : "500"
                                }
                                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </label>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Professional bio
                        <textarea
                            name="bio"
                            rows={4}
                            maxLength={1000}
                            placeholder={
                                existingDoctor?.bio
                                    ? `Current: ${existingDoctor.bio}`
                                    : "Describe your experience and areas of expertise."
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </label>

                    {state.error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {state.error}
                        </p>
                    )}

                    {state.success && (
                        <p
                            role="status"
                            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
                        >
                            Profile saved successfully! Redirecting to your dashboard...
                        </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={pending || state.success}
                            className="flex-1 rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {pending
                                ? "Saving details..."
                                : state.success
                                ? "Redirecting..."
                                : isEdit
                                ? "Update details"
                                : "Submit for verification"}
                        </button>

                        {isEdit && (
                            <Link
                                href="/doctor/dashboard"
                                className="rounded-lg border border-slate-300 px-5 py-3 text-center font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </Link>
                        )}
                    </div>
                </form>
            </div>
        </main>
    );
}