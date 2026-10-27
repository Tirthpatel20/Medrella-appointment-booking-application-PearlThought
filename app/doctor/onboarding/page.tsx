
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import DoctorOnboardingForm from "./doctor-onboarding-form";

async function DoctorOnboardingContent() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "doctor") {
        redirect("/");
    }

    return <DoctorOnboardingForm />;
}

export default function DoctorOnboardingPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50">
                    <p className="text-slate-600">
                        Loading your doctor profile...
                    </p>
                </main>
            }
        >
            <DoctorOnboardingContent />
        </Suspense>
    );
}
