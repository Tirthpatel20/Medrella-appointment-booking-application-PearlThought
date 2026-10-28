"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appointments, patientProfiles } from "@/db/schema";

export async function cancelAppointment(appointmentId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return { error: "Please sign in to cancel an appointment." };
    }

    if (session.user.role !== "patient") {
        return { error: "Only patients can cancel appointments." };
    }

    if (
        typeof appointmentId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            appointmentId
        )
    ) {
        return { error: "Invalid appointment." };
    }

    try {
        const [patient] = await db
            .select({ id: patientProfiles.id })
            .from(patientProfiles)
            .where(eq(patientProfiles.userId, session.user.id))
            .limit(1);

        if (!patient) {
            return { error: "Patient profile not found." };
        }

        const [cancelledAppointment] = await db
            .update(appointments)
            .set({
                status: "CANCELLED",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(appointments.id, appointmentId),
                    eq(appointments.patientId, patient.id),
                    inArray(appointments.status, ["BOOKED", "CONFIRMED", "QUEUED"])
                )
            )
            .returning({ id: appointments.id });

        if (!cancelledAppointment) {
            return {
                error:
                    "This appointment cannot be cancelled. It may already be cancelled or completed.",
            };
        }

        revalidatePath("/");
        revalidatePath("/patient/dashboard");
        revalidatePath("/doctors");
        revalidatePath("/doctor/dashboard");

        return { success: "Appointment cancelled successfully." };
    } catch (error) {
        console.error("Appointment cancellation failed:", error);
        return { error: "Could not cancel the appointment. Please try again." };
    }
}
