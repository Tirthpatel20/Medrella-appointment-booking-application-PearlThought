"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  doctorProfiles,
  patientProfiles,
  opdSessions,
  appointments,
} from "@/db/schema";

type AuthDoctorResult =
  | { error: string }
  | {
      doctor: typeof doctorProfiles.$inferSelect;
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
    };

async function getAuthenticatedDoctor(): Promise<AuthDoctorResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (session.user.role !== "doctor") {
    return { error: "Only doctors can perform clinic operations." };
  }

  const [doctor] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, session.user.id))
    .limit(1);

  if (!doctor) {
    return { error: "Complete your doctor profile first." };
  }

  return { doctor, session };
}

export async function createOrGetTodaySession() {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const [existing] = await db
      .select()
      .from(opdSessions)
      .where(
        and(
          eq(opdSessions.doctorId, doctor.id),
          eq(opdSessions.sessionDate, todayStr)
        )
      )
      .limit(1);

    if (existing) {
      return { success: true, session: existing };
    }

    const [created] = await db
      .insert(opdSessions)
      .values({
        doctorId: doctor.id,
        sessionDate: todayStr,
        status: "SCHEDULED",
      })
      .returning();

    revalidatePath("/doctor/dashboard");
    return { success: true, session: created };
  } catch (err) {
    console.error("Error creating or getting today's session:", err);
    return { error: "Failed to initialize today's clinic session." };
  }
}

export async function openSession(sessionId: string) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  try {
    const [session] = await db
      .select()
      .from(opdSessions)
      .where(
        and(
          eq(opdSessions.id, sessionId),
          eq(opdSessions.doctorId, doctor.id)
        )
      )
      .limit(1);

    if (!session) {
      return { error: "Session not found." };
    }

    if (session.status === "COMPLETED") {
      return { error: "Completed sessions cannot be reopened." };
    }

    await db
      .update(opdSessions)
      .set({
        status: "OPEN",
        openedAt: session.openedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(opdSessions.id, sessionId));

    revalidatePath("/doctor/dashboard");
    revalidatePath(`/doctors/${doctor.id}`);
    return { success: "Clinic session is now open for patients." };
  } catch (err) {
    console.error("Error opening session:", err);
    return { error: "Failed to open session." };
  }
}

export async function closeSession(sessionId: string) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  try {
    const [session] = await db
      .select()
      .from(opdSessions)
      .where(
        and(
          eq(opdSessions.id, sessionId),
          eq(opdSessions.doctorId, doctor.id)
        )
      )
      .limit(1);

    if (!session) {
      return { error: "Session not found." };
    }

    // Cancel remaining QUEUED or CALLED patients
    await db
      .update(appointments)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.sessionId, sessionId),
          inArray(appointments.status, ["QUEUED", "CALLED"])
        )
      );

    await db
      .update(opdSessions)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(opdSessions.id, sessionId));

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");
    revalidatePath(`/doctors/${doctor.id}`);
    return { success: "Clinic session closed successfully." };
  } catch (err) {
    console.error("Error closing session:", err);
    return { error: "Failed to close clinic session." };
  }
}

export async function callPatient(appointmentId: string) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  try {
    const [appt] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctor.id)
        )
      )
      .limit(1);

    if (!appt) {
      return { error: "Appointment not found." };
    }

    if (appt.status !== "QUEUED") {
      return { error: "Only queued patients can be called." };
    }

    if (appt.sessionId) {
      // Check if another patient is already CALLED in this session
      const [currentlyCalled] = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.sessionId, appt.sessionId),
            eq(appointments.status, "CALLED")
          )
        )
        .limit(1);

      if (currentlyCalled) {
        return {
          error:
            "Another patient is currently called. Please complete or skip them before calling the next patient.",
        };
      }
    }

    await db
      .update(appointments)
      .set({
        status: "CALLED",
        calledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");
    return { success: "Patient called to consultation room." };
  } catch (err) {
    console.error("Error calling patient:", err);
    return { error: "Failed to call patient." };
  }
}

export async function completeQueuedAppointment(appointmentId: string) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  try {
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
          inArray(appointments.status, ["CALLED", "QUEUED", "BOOKED", "CONFIRMED"])
        )
      )
      .returning({ id: appointments.id });

    if (!updated) {
      return { error: "Appointment cannot be completed." };
    }

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");
    return { success: "Consultation marked as completed." };
  } catch (err) {
    console.error("Error completing consultation:", err);
    return { error: "Failed to complete consultation." };
  }
}

export async function skipPatient(appointmentId: string) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  try {
    const [updated] = await db
      .update(appointments)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.doctorId, doctor.id),
          inArray(appointments.status, ["QUEUED", "CALLED"])
        )
      )
      .returning({ id: appointments.id });

    if (!updated) {
      return { error: "Patient could not be skipped." };
    }

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");
    return { success: "Patient marked as skipped (cancelled)." };
  } catch (err) {
    console.error("Error skipping patient:", err);
    return { error: "Failed to skip patient." };
  }
}

export async function registerWalkIn(
  sessionId: string,
  patientEmail: string,
  reason?: string
) {
  const authRes = await getAuthenticatedDoctor();
  if ("error" in authRes) {
    return { error: authRes.error };
  }
  const { doctor } = authRes;

  const emailClean = patientEmail?.trim().toLowerCase();
  if (!emailClean) {
    return { error: "Patient email is required for registration." };
  }

  try {
    const [session] = await db
      .select()
      .from(opdSessions)
      .where(
        and(
          eq(opdSessions.id, sessionId),
          eq(opdSessions.doctorId, doctor.id)
        )
      )
      .limit(1);

    if (!session) {
      return { error: "Clinic session not found." };
    }

    if (session.status !== "OPEN") {
      return { error: "Clinic session is not currently open for registration." };
    }

    const [patientUser] = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.email, emailClean))
      .limit(1);

    if (!patientUser) {
      return {
        error: `No registered account found with email "${emailClean}". Walk-in patients must have an account.`,
      };
    }

    let [profile] = await db
      .select({ id: patientProfiles.id })
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, patientUser.id))
      .limit(1);

    if (!profile) {
      [profile] = await db
        .insert(patientProfiles)
        .values({
          userId: patientUser.id,
        })
        .returning({ id: patientProfiles.id });
    }

    // Check if patient is already active in queue
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.sessionId, sessionId),
          eq(appointments.patientId, profile.id),
          inArray(appointments.status, ["QUEUED", "CALLED"])
        )
      )
      .limit(1);

    if (existing) {
      return { error: "This patient is already in the queue for today's session." };
    }

    const maxPosRes = await db
      .select({
        maxPos: sql<number>`COALESCE(MAX(${appointments.queuePosition}), 0)`,
      })
      .from(appointments)
      .where(eq(appointments.sessionId, sessionId));

    const nextPos = (Number(maxPosRes[0]?.maxPos) || 0) + 1;

    await db.insert(appointments).values({
      patientId: profile.id,
      doctorId: doctor.id,
      sessionId: sessionId,
      mode: "WALKIN",
      status: "QUEUED",
      queuePosition: nextPos,
      reason: reason?.trim() || "Walk-in consultation",
    });

    revalidatePath("/doctor/dashboard");
    revalidatePath("/patient/dashboard");

    return {
      success: `Walk-in registered: ${patientUser.name} at Queue #${nextPos}`,
    };
  } catch (err) {
    console.error("Error registering walk-in:", err);
    return { error: "Could not register walk-in patient. Please try again." };
  }
}
