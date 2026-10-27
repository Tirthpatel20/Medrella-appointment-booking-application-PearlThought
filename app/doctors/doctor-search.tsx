
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Doctor = {
    id: string;
    name: string;
    specialization: string;
    qualifications: string | null;
    experienceYears: number | null;
    consultationFee: string | number;
    bio: string | null;
};

export default function DoctorSearch({ doctors }: { doctors: Doctor[] }) {
    const [search, setSearch] = useState("");

    const filteredDoctors = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return doctors;

        return doctors.filter((doctor) =>
            doctor.name.toLowerCase().includes(query)
        );
    }, [doctors, search]);

    return (
        <>
            <div className="mb-6">
                <label
                    htmlFor="doctor-search"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Search by doctor name
                </label>

                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m16 16 4 4" />
                        </svg>
                    </span>

                    <input
                        id="doctor-search"
                        type="search"
                        placeholder="Enter a doctor's name..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                </div>

                <p className="mt-2 text-sm text-slate-500" aria-live="polite">
                    {filteredDoctors.length}{" "}
                    {filteredDoctors.length === 1 ? "doctor" : "doctors"} found
                </p>
            </div>

            {filteredDoctors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        No doctors found
                    </h2>
                    <p className="mt-2 text-slate-600">
                        Try another name or clear your search.
                    </p>

                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="mt-4 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDoctors.map((doctor) => (
                        <article
                            key={doctor.id}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-800">
                                    {doctor.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Dr. {doctor.name}
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-teal-700">
                                        {doctor.specialization}
                                    </p>
                                </div>
                            </div>

                            {doctor.qualifications && (
                                <p className="mt-5 text-sm text-slate-600">
                                    {doctor.qualifications}
                                </p>
                            )}

                            {doctor.bio && (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                    {doctor.bio}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap gap-2">
                                {doctor.experienceYears !== null && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                        {doctor.experienceYears}{" "}
                                        {doctor.experienceYears === 1 ? "year" : "years"}{" "}
                                        experience
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
                                <div>
                                    <p className="text-xs text-slate-500">Consultation fee</p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">
                                        ₹
                                        {Number(doctor.consultationFee).toLocaleString("en-IN")}
                                    </p>
                                </div>

                                <Link
                                    href={`/doctors/${doctor.id}`}
                                    className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                                >
                                    View profile
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
