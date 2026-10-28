import {
    date,
    index,
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { sql } from "drizzle-orm";

export const doctorVerificationStatus = pgEnum(
    "doctor_verification_status",
    ["PENDING", "APPROVED", "REJECTED"],
);

export const slotStatus = pgEnum("slot_status", [
    "AVAILABLE",
    "BLOCKED",
]);

export const appointmentStatus = pgEnum("appointment_status", [
    "BOOKED",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
    "QUEUED",
    "CALLED",
]);

export const appointmentMode = pgEnum("appointment_mode", [
    "FIXED",
    "OPD",
    "WALKIN",
]);

export const opdSessionStatus = pgEnum("opd_session_status", [
    "SCHEDULED",
    "OPEN",
    "COMPLETED",
]);

export const patientProfiles = pgTable("patient_profiles", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: "cascade" }),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const doctorProfiles = pgTable(
    "doctor_profiles",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id")
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: "cascade" }),
        specialization: text("specialization").notNull(),
        qualifications: text("qualifications"),
        licenseNumber: text("license_number").unique(),
        experienceYears: integer("experience_years"),
        consultationFee: numeric("consultation_fee", {
            precision: 10,
            scale: 2,
        }).notNull(),
        bio: text("bio"),
        verificationStatus: doctorVerificationStatus("verification_status")
            .default("PENDING")
            .notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("doctor_profiles_specialization_idx").on(table.specialization),
    ],
);

export const availabilitySlots = pgTable(
    "availability_slots",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        doctorId: uuid("doctor_id")
            .notNull()
            .references(() => doctorProfiles.id, { onDelete: "restrict" }),
        startTime: timestamp("start_time", { withTimezone: true }).notNull(),
        endTime: timestamp("end_time", { withTimezone: true }).notNull(),
        status: slotStatus().default("AVAILABLE").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("availability_slots_doctor_start_idx").on(
            table.doctorId,
            table.startTime,
        ),
    ],
);

export const opdSessions = pgTable(
    "opd_sessions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        doctorId: uuid("doctor_id")
            .notNull()
            .references(() => doctorProfiles.id, { onDelete: "restrict" }),
        sessionDate: date("session_date").notNull(),
        status: opdSessionStatus("status").default("SCHEDULED").notNull(),
        notes: text("notes"),
        openedAt: timestamp("opened_at", { withTimezone: true }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        unique("opd_sessions_doctor_date_unique").on(
            table.doctorId,
            table.sessionDate,
        ),
        index("opd_sessions_doctor_date_idx").on(
            table.doctorId,
            table.sessionDate,
        ),
    ],
);

export const appointments = pgTable(
    "appointments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        patientId: uuid("patient_id")
            .notNull()
            .references(() => patientProfiles.id, { onDelete: "restrict" }),
        doctorId: uuid("doctor_id")
            .notNull()
            .references(() => doctorProfiles.id, { onDelete: "restrict" }),
        slotId: uuid("slot_id")
            .references(() => availabilitySlots.id, { onDelete: "restrict" }),
        mode: appointmentMode("mode").default("FIXED").notNull(),
        sessionId: uuid("session_id")
            .references(() => opdSessions.id, { onDelete: "restrict" }),
        queuePosition: integer("queue_position"),
        calledAt: timestamp("called_at", { withTimezone: true }),
        status: appointmentStatus().default("BOOKED").notNull(),
        reason: text("reason"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("appointments_patient_idx").on(table.patientId),
        index("appointments_doctor_idx").on(table.doctorId),
        index("appointments_slot_idx").on(table.slotId),
        index("appointments_session_idx").on(table.sessionId),
        uniqueIndex("one_active_booking_per_slot")
            .on(table.slotId)
            .where(
                sql`${table.status} IN ('BOOKED', 'CONFIRMED')`,
            ),
        uniqueIndex("one_active_queue_entry_per_session")
            .on(table.sessionId, table.patientId)
            .where(
                sql`${table.status} IN ('QUEUED', 'CALLED')`,
            ),
    ],
);
