import { and, eq, sql } from "drizzle-orm";
import { client, db } from "./index";
import { user } from "./auth-schema";
import {
    appointments,
    availabilitySlots,
    doctorProfiles,
    patientProfiles,
} from "./schema";
import { auth } from "../lib/auth";

const TEST_PASSWORD = "MedrellaTest123!";

const patientData = [
    { name: "Aarav Mehta", email: "aarav.patient@medrella.test" },
    { name: "Ananya Sharma", email: "ananya.patient@medrella.test" },
    { name: "Rohan Verma", email: "rohan.patient@medrella.test" },
    { name: "Priya Patel", email: "priya.patient@medrella.test" },
];

const doctorData = [
    {
        name: "Dr. Kavita Rao",
        email: "kavita.doctor@medrella.test",
        specialization: "Cardiology",
        qualifications: "MBBS, MD Cardiology",
        licenseNumber: "MED-SEED-1001",
        experienceYears: 12,
        consultationFee: "800",
        bio: "Experienced cardiologist specializing in preventive heart care.",
        verificationStatus: "APPROVED" as const,
    },
    {
        name: "Dr. Arjun Singh",
        email: "arjun.doctor@medrella.test",
        specialization: "Dermatology",
        qualifications: "MBBS, MD Dermatology",
        licenseNumber: "MED-SEED-1002",
        experienceYears: 8,
        consultationFee: "600",
        bio: "Specialist in skin health and dermatological conditions.",
        verificationStatus: "APPROVED" as const,
    },
    {
        name: "Dr. Neha Kapoor",
        email: "neha.doctor@medrella.test",
        specialization: "General Medicine",
        qualifications: "MBBS, DNB",
        licenseNumber: "MED-SEED-1003",
        experienceYears: 5,
        consultationFee: "500",
        bio: "Focused on primary care and general health consultations.",
        verificationStatus: "PENDING" as const,
    },
];

type SeedUser = {
    id: string;
    name: string;
    email: string;
};

type SeedDoctor = SeedUser & (typeof doctorData)[number];

async function clearDummyData() {
    console.log("🧹 Clearing existing test data...");

    // 1. Delete appointments first (they reference patients, doctors, and slots)
    await db.delete(appointments);

    // 2. Delete availability slots (they reference doctor profiles)
    await db.delete(availabilitySlots);

    // 3. Delete patient and doctor profiles
    await db.delete(patientProfiles);
    await db.delete(doctorProfiles);

    // 4. Delete test users from Better Auth's user table
    await db.delete(user).where(
        // Add your test email condition here if you want to delete
        // only seed users instead of every user.
        sql`email LIKE '%@medrella.test'`
    );

    console.log("✅ Existing test data cleared.");
}

async function ensureUser(
    data: SeedUser,
    role: "patient" | "doctor",
): Promise<SeedUser> {
    const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.email, data.email))
        .limit(1);

    if (existing) {
        // These are dedicated test accounts, so keep their roles deterministic.
        if (existing.role !== role) {
            await db
                .update(user)
                .set({ role })
                .where(eq(user.id, existing.id));
        }

        return {
            id: existing.id,
            name: existing.name,
            email: existing.email,
        };
    }

    try {
        const result = await auth.api.signUpEmail({
            body: {
                name: data.name,
                email: data.email,
                password: TEST_PASSWORD,
                role,
            },
        });

        if (!result.user?.id) {
            throw new Error(`Better Auth did not create ${data.email}`);
        }

        return {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
        };
    } catch (error) {
        // Handle a concurrent or previously completed signup safely.
        const [created] = await db
            .select()
            .from(user)
            .where(eq(user.email, data.email))
            .limit(1);

        if (created) {
            if (created.role !== role) {
                await db
                    .update(user)
                    .set({ role })
                    .where(eq(user.id, created.id));
            }

            return {
                id: created.id,
                name: created.name,
                email: created.email,
            };
        }

        throw error;
    }
}

// Interpret every supplied date/time as India Standard Time (UTC+05:30).
function istDate(daysFromToday: number, hour: number, minute = 0) {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() + daysFromToday);

    // Find today's calendar date in IST.
    const indiaDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000));

    return new Date(`${indiaDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`);
}

async function ensureSlot(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    status: "AVAILABLE" | "BLOCKED" = "AVAILABLE",
) {
    const [existing] = await db
        .select()
        .from(availabilitySlots)
        .where(
            and(
                eq(availabilitySlots.doctorId, doctorId),
                eq(availabilitySlots.startTime, startTime),
                eq(availabilitySlots.endTime, endTime),
            ),
        )
        .limit(1);

    if (existing) {
        return existing;
    }

    const [slot] = await db
        .insert(availabilitySlots)
        .values({ doctorId, startTime, endTime, status })
        .returning();

    return slot;
}

async function ensureAppointment(
    patientId: string,
    doctorId: string,
    slotId: string,
    status: "BOOKED" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    reason: string,
) {
    const [existing] = await db
        .select()
        .from(appointments)
        .where(
            and(
                eq(appointments.patientId, patientId),
                eq(appointments.slotId, slotId),
            ),
        )
        .limit(1);

    if (existing) {
        return existing;
    }

    const [appointment] = await db
        .insert(appointments)
        .values({
            patientId,
            doctorId,
            slotId,
            status,
            reason,
        })
        .returning();

    return appointment;
}

async function main() {
    await clearDummyData();

    console.log("Seeding Medrella test data...");

    const patients = [];

    for (const data of patientData) {
        const account = await ensureUser(
            { ...data, id: "" },
            "patient",
        );

        await db
            .insert(patientProfiles)
            .values({ userId: account.id })
            .onConflictDoNothing({ target: patientProfiles.userId });

        const [profile] = await db
            .select()
            .from(patientProfiles)
            .where(eq(patientProfiles.userId, account.id))
            .limit(1);

        if (!profile) {
            throw new Error(`Could not create patient profile: ${data.email}`);
        }

        patients.push({ ...account, patientId: profile.id });
    }

    const doctors: Array<{
        account: SeedUser;
        profile: typeof doctorProfiles.$inferSelect;
    }> = [];

    for (const data of doctorData) {
        const account = await ensureUser(
            { id: "", name: data.name, email: data.email },
            "doctor",
        );

        await db
            .insert(doctorProfiles)
            .values({
                userId: account.id,
                specialization: data.specialization,
                qualifications: data.qualifications,
                licenseNumber: data.licenseNumber,
                experienceYears: data.experienceYears,
                consultationFee: data.consultationFee,
                bio: data.bio,
                verificationStatus: data.verificationStatus,
            })
            .onConflictDoNothing({ target: doctorProfiles.userId });

        const [profile] = await db
            .select()
            .from(doctorProfiles)
            .where(eq(doctorProfiles.userId, account.id))
            .limit(1);

        if (!profile) {
            throw new Error(`Could not create doctor profile: ${data.email}`);
        }

        // Ensure the test doctor's approval state stays predictable on reruns.
        await db
            .update(doctorProfiles)
            .set({
                verificationStatus: data.verificationStatus,
                specialization: data.specialization,
                qualifications: data.qualifications,
                experienceYears: data.experienceYears,
                consultationFee: data.consultationFee,
                bio: data.bio,
            })
            .where(eq(doctorProfiles.id, profile.id));

        doctors.push({ account, profile });
    }

    const [cardiologist, dermatologist, pendingDoctor] = doctors;
    const [aarav, ananya, rohan, priya] = patients;

    // Future slots for approved doctors.
    const cardiologySlot1 = await ensureSlot(
        cardiologist.profile.id,
        istDate(1, 10),
        istDate(1, 10, 30),
    );
    const cardiologySlot2 = await ensureSlot(
        cardiologist.profile.id,
        istDate(2, 11),
        istDate(2, 11, 30),
    );
    const cardiologySlot3 = await ensureSlot(
        cardiologist.profile.id,
        istDate(3, 14),
        istDate(3, 14, 30),
    );

    const dermatologySlot1 = await ensureSlot(
        dermatologist.profile.id,
        istDate(1, 12),
        istDate(1, 12, 30),
    );
    const dermatologySlot2 = await ensureSlot(
        dermatologist.profile.id,
        istDate(2, 15),
        istDate(2, 15, 30),
    );

    // A blocked slot for availability UI testing.
    await ensureSlot(
        cardiologist.profile.id,
        istDate(4, 16),
        istDate(4, 16, 30),
        "BLOCKED",
    );

    // Past slots for completed and cancelled appointment history.
    const completedSlot = await ensureSlot(
        cardiologist.profile.id,
        istDate(-3, 10),
        istDate(-3, 10, 30),
    );
    const cancelledSlot = await ensureSlot(
        dermatologist.profile.id,
        istDate(-2, 12),
        istDate(-2, 12, 30),
    );

    // Future bookings for doctor and patient dashboard testing.
    await ensureAppointment(
        aarav.patientId,
        cardiologist.profile.id,
        cardiologySlot1.id,
        "BOOKED",
        "Routine heart health consultation",
    );

    await ensureAppointment(
        ananya.patientId,
        cardiologist.profile.id,
        cardiologySlot2.id,
        "CONFIRMED",
        "Follow-up consultation",
    );

    await ensureAppointment(
        rohan.patientId,
        dermatologist.profile.id,
        dermatologySlot1.id,
        "BOOKED",
        "Skin irritation and rash",
    );

    await ensureAppointment(
        priya.patientId,
        cardiologist.profile.id,
        completedSlot.id,
        "COMPLETED",
        "Previous consultation",
    );

    await ensureAppointment(
        aarav.patientId,
        dermatologist.profile.id,
        cancelledSlot.id,
        "CANCELLED",
        "Patient cancelled this consultation",
    );

    // Leave these slots unbooked for testing the booking flow.
    void cardiologySlot3;
    void dermatologySlot2;
    void pendingDoctor;

    console.log("\nSeed completed successfully.");
    console.log(`Test password for all seeded accounts: ${TEST_PASSWORD}`);

    console.log("\nPatient accounts:");
    for (const patient of patients) {
        console.log(`  ${patient.email}`);
    }

    console.log("\nDoctor accounts:");
    for (const doctor of doctors) {
        console.log(
            `  ${doctor.account.email} (${doctor.profile.verificationStatus})`,
        );
    }

    console.log("\nUse these accounts only in your development/test environment.");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await client.end();
    });
