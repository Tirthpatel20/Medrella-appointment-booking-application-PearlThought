"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, lt, gt, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles, availabilitySlots, appointments } from "@/db/schema";

const slotSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine(
  (slot) => slot.endTime > slot.startTime,
  { message: "End time must be after start time." },
).refine(
  (slot) => slot.startTime > new Date(),
  { message: "Choose a future start time." },
);

export async function createAvailabilitySlot(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (session.user.role !== "doctor") {
    return { error: "Only doctors can create availability slots." };
  }

  const parsed = slotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid time slot." };
  }

  const { startTime, endTime } = parsed.data;

  try {
    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, session.user.id))
      .limit(1);

    if (!doctor) {
      return { error: "Complete your doctor profile first." };
    }

    if (doctor.verificationStatus !== "APPROVED") {
      return { error: "Your doctor profile must be approved first." };
    }

    const [overlap] = await db
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.doctorId, doctor.id),
          eq(availabilitySlots.status, "AVAILABLE"),
          lt(availabilitySlots.startTime, endTime),
          gt(availabilitySlots.endTime, startTime),
        ),
      )
      .limit(1);

    if (overlap) {
      return { error: "This time overlaps an existing available slot." };
    }

    await db.insert(availabilitySlots).values({
      doctorId: doctor.id,
      startTime,
      endTime,
      status: "AVAILABLE",
    });

    revalidatePath("/doctor/dashboard");

    return { success: "Availability slot created successfully." };
  } catch {
    return { error: "Could not create the slot. Please try again." };
  }
}



export async function completeAppointment(appointmentId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (session.user.role !== "doctor") {
    return { error: "Only doctors can update appointments." };
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      appointmentId
    )
  ) {
    return { error: "Invalid appointment." };
  }

  try {
    const [doctor] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, session.user.id))
      .limit(1);

    if (!doctor) {
      return { error: "Doctor profile not found." };
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctor.id),
          inArray(appointments.status, ["BOOKED", "CONFIRMED"])
        )
      )
      .returning({ id: appointments.id });

    if (!updated) {
      return {
        error: "This appointment cannot be marked as completed.",
      };
    }

    revalidatePath("/doctor/dashboard");
    revalidatePath("/");

    return { success: "Appointment marked as completed." };
  } catch (error) {
    console.error("Completing appointment failed:", error);
    return { error: "Could not update the appointment. Please try again." };
  }
}


export async function deleteAvailabilitySlot(slotId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (session.user.role !== "doctor") {
    return { error: "Only doctors can delete availability slots." };
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      slotId
    )
  ) {
    return { error: "Invalid availability slot." };
  }

  try {
    const [doctor] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, session.user.id))
      .limit(1);

    if (!doctor) {
      return { error: "Doctor profile not found." };
    }

    const [slot] = await db
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.doctorId, doctor.id)
        )
      )
      .limit(1);

    if (!slot) {
      return { error: "Slot not found or you do not own this slot." };
    }

    const [existingAppointment] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.slotId, slotId))
      .limit(1);

    if (existingAppointment) {
      return {
        error:
          "This slot has an appointment record and cannot be deleted. Keep it for appointment history.",
      };
    }

    await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.doctorId, doctor.id)
        )
      );

    revalidatePath("/doctor/dashboard");

    return { success: "Availability slot deleted." };
  } catch (error) {
    console.error("Deleting availability slot failed:", error);
    return { error: "Could not delete this slot. Please try again." };
  }
}
