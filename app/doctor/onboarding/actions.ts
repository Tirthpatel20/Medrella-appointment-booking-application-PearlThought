"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";

const doctorProfileSchema = z.object({
    specialization: z.string().trim().min(2).max(100),
    qualifications: z.string().trim().max(200).optional(),
    licenseNumber: z.string().trim().min(3).max(100),
    experienceYears: z.coerce.number().int().min(0).max(80),
    consultationFee: z.coerce.number().positive().max(100000),
    bio: z.string().trim().max(1000).optional(),
});

export async function saveDoctorProfile(
    _previousState: { error?: string; success?: boolean },
    formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "doctor") {
        return { error: "Only doctor accounts can create doctor profiles." };
    }

    const parsed = doctorProfileSchema.safeParse({
        specialization: formData.get("specialization"),
        qualifications: formData.get("qualifications") || undefined,
        licenseNumber: formData.get("licenseNumber"),
        experienceYears: formData.get("experienceYears"),
        consultationFee: formData.get("consultationFee"),
        bio: formData.get("bio") || undefined,
    });

    if (!parsed.success) {
        return {
            error: parsed.error.issues[0]?.message ?? "Please check your inputs.",
        };
    }

    const data = parsed.data;

    try {
        await db
            .insert(doctorProfiles)
            .values({
                userId: session.user.id,
                specialization: data.specialization,
                qualifications: data.qualifications ?? null,
                licenseNumber: data.licenseNumber,
                experienceYears: data.experienceYears,
                consultationFee: data.consultationFee.toFixed(2),
                bio: data.bio ?? null,
                verificationStatus: "PENDING",
            })
            .onConflictDoUpdate({
                target: doctorProfiles.userId,
                set: {
                    specialization: data.specialization,
                    qualifications: data.qualifications ?? null,
                    licenseNumber: data.licenseNumber,
                    experienceYears: data.experienceYears,
                    consultationFee: data.consultationFee.toFixed(2),
                    bio: data.bio ?? null,
                    updatedAt: new Date(),
                },
            });
    } catch {
        return {
            error: "Could not save your profile. Check whether this license number is already registered.",
        };
    }

    revalidatePath("/doctor/dashboard");
    revalidatePath("/doctor/onboarding");
    revalidatePath("/");

    return { success: true };
}
