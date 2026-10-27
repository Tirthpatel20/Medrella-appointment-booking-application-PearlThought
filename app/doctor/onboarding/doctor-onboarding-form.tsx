
"use client";

import { useActionState } from "react";
import { saveDoctorProfile } from "./actions";

const initialState: { error?: string } = {};

export default function DoctorOnboardingPage() {
    const [state, formAction, pending] = useActionState(
        saveDoctorProfile,
        initialState,
    );

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
                <p className="text-sm font-semibold text-blue-600">
                    MEDRELLA · DOCTOR REGISTRATION
                </p>

                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                    Set up your professional profile
                </h1>

                <p className="mt-2 text-slate-600">
                    Provide your professional details to submit your profile
                    for verification.
                </p>

                <form action={formAction} className="mt-8 space-y-5">
                    <label className="block text-sm font-medium">
                        Specialization *
                        <input
                            name="specialization"
                            required
                            minLength={2}
                            maxLength={100}
                            placeholder="e.g. Cardiology"
                            className="mt-1 w-full rounded-lg border p-3"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Qualifications
                        <input
                            name="qualifications"
                            maxLength={200}
                            placeholder="e.g. MBBS, MD"
                            className="mt-1 w-full rounded-lg border p-3"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Medical license number *
                        <input
                            name="licenseNumber"
                            required
                            minLength={3}
                            maxLength={100}
                            className="mt-1 w-full rounded-lg border p-3"
                        />
                    </label>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block text-sm font-medium">
                            Years of experience *
                            <input
                                name="experienceYears"
                                type="number"
                                required
                                min={0}
                                max={80}
                                step={1}
                                defaultValue={0}
                                className="mt-1 w-full rounded-lg border p-3"
                            />
                        </label>

                        <label className="block text-sm font-medium">
                            Consultation fee (₹) *
                            <input
                                name="consultationFee"
                                type="number"
                                required
                                min="0.01"
                                max="100000"
                                step="0.01"
                                placeholder="500"
                                className="mt-1 w-full rounded-lg border p-3"
                            />
                        </label>
                    </div>

                    <label className="block text-sm font-medium">
                        Professional bio
                        <textarea
                            name="bio"
                            rows={4}
                            maxLength={1000}
                            placeholder="Describe your experience and areas of expertise."
                            className="mt-1 w-full rounded-lg border p-3"
                        />
                    </label>

                    {state.error && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {state.error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {pending ? "Saving profile..." : "Submit for verification"}
                    </button>
                </form>
            </div>
        </main>
    );
}