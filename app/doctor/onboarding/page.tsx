import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";
import DoctorOnboardingForm from "./doctor-onboarding-form";

interface DoctorOnboardingPageProps {
    searchParams?: Promise<{ edit?: string }>;
}

async function DoctorOnboardingContent({ searchParams }: DoctorOnboardingPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "doctor") {
        redirect("/");
    }

    const [existingDoctor] = await db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, session.user.id))
        .limit(1);

    const resolvedParams = searchParams ? await searchParams : undefined;
    const isEditMode = resolvedParams?.edit === "true";

    // If doctor profile is already filled and user did not explicitly request edit mode,
    // redirect to dashboard so they don't see an onboarding form again
    if (existingDoctor && !isEditMode) {
        redirect("/doctor/dashboard");
    }

    return (
        <DoctorOnboardingForm
            isEdit={Boolean(existingDoctor && isEditMode)}
            existingDoctor={existingDoctor ?? null}
        />
    );
}

export default async function DoctorOnboardingPage(props: DoctorOnboardingPageProps) {
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
            <DoctorOnboardingContent {...props} />
        </Suspense>
    );
}
