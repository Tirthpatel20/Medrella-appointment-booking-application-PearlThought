"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, lt, gt } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctorProfiles, availabilitySlots } from "@/db/schema";

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
