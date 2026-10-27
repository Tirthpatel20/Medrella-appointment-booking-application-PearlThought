import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    numeric,
    index,
    uniqueIndex,
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
            .notNull()
            .references(() => availabilitySlots.id, { onDelete: "restrict" }),
        status: appointmentStatus().default("BOOKED").notNull(),
        reason: text("reason"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("appointments_patient_idx").on(table.patientId),
        index("appointments_doctor_idx").on(table.doctorId),
        index("appointments_slot_idx").on(table.slotId),
        uniqueIndex("one_active_booking_per_slot")
            .on(table.slotId)
            .where(
                // This index is only for active bookings.
                // Cancelled and completed appointments remain as history.
                // SQL literal is intentionally static.
                // Drizzle's SQL helper is imported below.
                sql`${table.status} IN ('BOOKED', 'CONFIRMED')`,
            ),
    ],
);
