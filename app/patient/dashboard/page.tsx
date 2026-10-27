
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import PatientDashboardContent from "@/components/patient-dashboard-content";

async function PatientDashboard() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "patient") {
        redirect("/");
    }

    return (
        <PatientDashboardContent
            userId={session.user.id}
            name={session.user.name}
        />
    );
}

export default function PatientDashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-[#f8fbfa] px-5 py-12">
                    <div className="mx-auto max-w-6xl animate-pulse">
                        <div className="h-9 w-72 rounded bg-slate-200" />
                        <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />
                        <div className="mt-10 h-56 rounded-2xl bg-white" />
                    </div>
                </main>
            }
        >
            <PatientDashboard />
        </Suspense>
    );
}
