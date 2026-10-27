# Medrella — Doctor Appointment Booking Platform

Medrella is a full-stack doctor appointment booking application built with Next.js, PostgreSQL, and Drizzle ORM. It allows patients to discover doctors, view available time slots, book appointments, and manage their bookings, while doctors can manage their professional profiles, availability, and appointments.

The project focuses on building a reliable appointment workflow with role-based access control, database integrity, and a modern, responsive user interface.

## Features

### For Patients
- **Authentication:** Sign up and sign in with role-based accounts.
- **Doctor Discovery:** Browse verified and approved doctors by name and specialization.
- **Doctor Profiles:** View professional information, qualifications, experience, consultation fees, and available slots.
- **Appointment Booking:** Book available appointment slots.
- **Appointment Management:** View upcoming appointments and recent appointment history.
- **Cancellation:** Cancel eligible appointments without deleting historical records.

### For Doctors
- **Doctor Onboarding:** Submit professional details for verification.
- **Verification Workflow:** Support for pending, approved, and rejected verification statuses.
- **Availability Management:** Create and manage appointment slots.
- **Appointment Dashboard:** View upcoming appointments and key dashboard statistics.
- **Appointment Status Management:** Track appointment statuses such as booked, confirmed, cancelled, and completed.

### Reliability and Data Integrity
- Role-based authorization for patient and doctor operations.
- Server-side validation of sensitive actions.
- Database transactions for appointment booking.
- Row-level locking when booking slots to help prevent concurrent bookings.
- A partial unique database index to prevent multiple active appointments for the same slot.
- Relational database constraints and indexes for core entities.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Full-stack application framework |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| PostgreSQL | Relational database |
| Neon | Hosted PostgreSQL |
| Drizzle ORM | Database queries and schema management |
| Better Auth | Authentication and session management |
| Vercel | Application deployment |

## Application Architecture

Medrella uses Next.js for both the frontend and server-side application logic.

- **UI layer:** React components and Next.js pages render doctor listings, profiles, dashboards, and booking interfaces.
- **Authentication layer:** Better Auth manages authentication and sessions. Server-side operations verify the user's session and role before making changes.
- **Business logic layer:** Server actions handle operations such as creating availability, booking appointments, and cancelling bookings.
- **Data layer:** Drizzle ORM communicates with PostgreSQL, where relationships, constraints, and indexes help maintain data integrity.

## Database Design

The main application entities are:

- **Users:** Authentication identity and user role.
- **Patient Profiles:** Patient-specific information linked to users.
- **Doctor Profiles:** Professional details and verification status.
- **Availability Slots:** Doctor-specific appointment times and availability status.
- **Appointments:** Bookings linking patients, doctors, and slots.

The database uses foreign keys to maintain relationships between these entities.

### Appointment Booking Flow

1. A patient browses approved doctors.
2. The patient opens a doctor's profile and selects an available slot.
3. The server verifies authentication, patient role, doctor approval, and slot availability.
4. A database transaction locks the slot while the booking is processed.
5. The appointment is created if the slot is still eligible for booking.
6. Database constraints provide an additional safeguard against duplicate active bookings.

This approach helps handle concurrent booking attempts more safely than relying on frontend checks alone.

## Getting Started

### Prerequisites

- Node.js
- npm
- A PostgreSQL database (Neon or a local instance)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Tirthpatel20/Medrella-appointment-booking-application-PearlThought.git

cd Medrella-appointment-booking-application-PearlThought
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=your_postgresql_connection_string
```

Configure any additional environment variables required by your Better Auth setup before running the application.

### 4. Apply database migrations

Run the project's configured Drizzle migration command. For example, if your `package.json` defines `db:migrate`:

```bash
npm run db:migrate
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Seed Test Data

Medrella includes a seed script for creating dummy patients, doctors, availability slots, and appointments for development testing.

If your project has the `db:seed` script configured, run:

```bash
npm run db:seed
```

The seed data includes approved and pending doctors, future availability, booked and confirmed appointments, and historical appointment statuses.

**Warning:** The current seed script clears existing appointments, availability slots, and patient and doctor profiles before recreating the test data. Run it only against a dedicated development database, never production.

The script prints the test account emails and shared test password after successful completion. These credentials are for local development only.

## Project Structure

```text
medrella-appointment/
├── app/
│   ├── auth/                 # Authentication pages
│   ├── doctor/               # Doctor onboarding and dashboard
│   ├── doctors/              # Doctor directory and profiles
│   ├── patient/              # Patient appointment actions
│   ├── layout.tsx            # Root application layout
│   └── page.tsx              # Homepage and patient dashboard
├── components/               # Shared UI and dashboard components
├── db/
│   ├── auth-schema.ts        # Better Auth database schema
│   ├── schema.ts             # Application database schema
│   ├── index.ts              # Database connection
│   └── seed.ts               # Development test data
├── lib/
│   ├── auth.ts               # Better Auth server configuration
│   └── auth-client.ts        # Client authentication utilities
├── public/                   # Static assets
└── package.json
```

*This structure is representative; exact filenames may vary as the project evolves.*

## Deployment

The application can be deployed on Vercel with PostgreSQL hosted on Neon.

At a high level:

1. Push the application to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in Vercel.
4. Apply database migrations to the intended hosted database.
5. Deploy and test authentication, doctor discovery, booking, and cancellation flows.


## Current Focus

The project is being developed incrementally, with emphasis on:

- Reliable appointment booking and cancellation.
- Doctor availability and appointment lifecycle management.
- Database integrity under concurrent booking requests.
- Role-based authorization.
- End-to-end testing with realistic test data.
