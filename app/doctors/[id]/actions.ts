"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, gt, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  appointments,
  availabilitySlots,
  doctorProfiles,
  patientProfiles,
} from "@/db/schema";

export async function bookAppointment(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in before booking an appointment." };
  }

  if (session.user.role !== "patient") {
    return { error: "Only patient accounts can book appointments." };
  }

  const slotId = formData.get("slotId");

  if (typeof slotId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slotId)) {
    return { error: "Invalid appointment slot." };
  }

  try {
    await db.transaction(async (tx) => {
      // Lock the slot so concurrent booking requests must wait.
      const [slot] = await tx
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.id, slotId))
        .for("update")
        .limit(1);

      if (!slot || slot.status !== "AVAILABLE") {
        throw new Error("SLOT_UNAVAILABLE");
      }

      if (slot.startTime <= new Date()) {
        throw new Error("SLOT_IN_PAST");
      }

      const [doctor] = await tx
        .select({
          id: doctorProfiles.id,
        })
        .from(doctorProfiles)
        .where(
          and(
            eq(doctorProfiles.id, slot.doctorId),
            eq(doctorProfiles.verificationStatus, "APPROVED"),
          ),
        )
        .limit(1);

      if (!doctor) {
        throw new Error("DOCTOR_UNAVAILABLE");
      }

      // Find the patient's profile, creating it for older accounts if needed.
      await tx
        .insert(patientProfiles)
        .values({ userId: session.user.id })
        .onConflictDoNothing({
          target: patientProfiles.userId,
        });

      const [patient] = await tx
        .select({ id: patientProfiles.id })
        .from(patientProfiles)
        .where(eq(patientProfiles.userId, session.user.id))
        .limit(1);

      if (!patient) {
        throw new Error("PATIENT_PROFILE_FAILED");
      }

      // A cancelled booking does not prevent the slot being booked again.
      const [existingAppointment] = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.slotId, slotId),
            sql`${appointments.status} IN ('BOOKED', 'CONFIRMED')`,
          ),
        )
        .limit(1);

      if (existingAppointment) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      await tx.insert(appointments).values({
        patientId: patient.id,
        doctorId: doctor.id,
        slotId: slot.id,
        status: "BOOKED",
      });
    });

    revalidatePath("/doctors");
    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");

    return { success: "Appointment booked successfully." };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SLOT_UNAVAILABLE") {
        return { error: "This slot is no longer available. Please choose another." };
      }

      if (error.message === "SLOT_IN_PAST") {
        return { error: "This appointment time has already passed." };
      }

      if (error.message === "DOCTOR_UNAVAILABLE") {
        return { error: "This doctor is no longer available for booking." };
      }

      if (error.message === "PATIENT_PROFILE_FAILED") {
        return { error: "Could not prepare your patient profile. Please try again." };
      }
    }

    console.error("Appointment booking failed:", error);

    return { error: "Could not book the appointment. Please try again." };
  }
}
