ALTER TYPE "public"."appointment_status" ADD VALUE 'QUEUED';--> statement-breakpoint
ALTER TYPE "public"."appointment_status" ADD VALUE 'CALLED';--> statement-breakpoint
CREATE TYPE "public"."appointment_mode" AS ENUM('FIXED', 'OPD', 'WALKIN');--> statement-breakpoint
CREATE TYPE "public"."opd_session_status" AS ENUM('SCHEDULED', 'OPEN', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "opd_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"status" "opd_session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"notes" text,
	"opened_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opd_sessions_doctor_date_unique" UNIQUE("doctor_id","session_date")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "mode" "appointment_mode" DEFAULT 'FIXED' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "queue_position" integer;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "called_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "slot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "opd_sessions" ADD CONSTRAINT "opd_sessions_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_session_id_opd_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."opd_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opd_sessions_doctor_date_idx" ON "opd_sessions" USING btree ("doctor_id","session_date");--> statement-breakpoint
CREATE INDEX "appointments_session_idx" ON "appointments" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_queue_entry_per_session" ON "appointments" USING btree ("session_id","patient_id") WHERE "appointments"."status" IN ('QUEUED', 'CALLED');
