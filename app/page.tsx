
import Link from "next/link";
import Navbar from "@/components/navbar";

const features = [
  {
    number: "01",
    title: "Find the right care",
    description:
      "Explore a straightforward path toward connecting with the healthcare professional you need.",
  },
  {
    number: "02",
    title: "Choose a convenient time",
    description:
      "The platform is being built around doctor-managed availability and a simpler appointment experience.",
  },
  {
    number: "03",
    title: "Stay organized",
    description:
      "Our goal is to make managing appointments clearer for both patients and healthcare professionals.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fbfa] text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-28 h-[420px] w-[420px] rounded-full bg-teal-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-64 h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-teal-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              A simpler approach to healthcare
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[68px]">
              Better care starts with{" "}
              <span className="text-teal-700">a simpler way.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Medrella is building a more convenient way for patients and
              doctors to connect, manage availability, and move toward a
              smoother appointment experience.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-800"
              >
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
              >
                Join as a doctor
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <span className="text-teal-700">✓</span> Patient and doctor accounts
              </span>
              <span className="flex items-center gap-2">
                <span className="text-teal-700">✓</span> Doctor profile management
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-100 via-cyan-50 to-white" />

            <div className="relative rounded-[1.75rem] border border-white bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-teal-700">
                    YOUR HEALTH, MORE ORGANIZED
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Care that fits your life.
                  </h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
                  ✚
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    ♙
                  </div>
                  <div>
                    <p className="font-semibold">For patients</p>
                    <p className="mt-1 text-sm text-slate-500">
                      A clearer path to getting started
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    ♧
                  </div>
                  <div>
                    <p className="font-semibold">For doctors</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Profiles and availability management
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f0f8f6] p-5">
                  <p className="text-sm font-semibold text-teal-900">
                    Designed around simplicity
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Clear steps, focused screens, and a consistent experience
                    across devices.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-lg sm:-left-8">
              <p className="text-xs text-slate-500">Built for</p>
              <p className="mt-1 font-semibold">Patients & professionals</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              How Medrella works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Healthcare, with fewer complications.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              We're building the essentials first, with separate experiences
              for patients and doctors.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl border border-slate-200 bg-[#fbfdfc] p-7 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/5"
              >
                <span className="text-sm font-semibold text-teal-700">
                  {feature.number}
                </span>
                <h3 className="mt-6 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="for-doctors" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-slate-900 p-8 text-white sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">
                For healthcare professionals
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Your practice deserves a simpler workflow.
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Create your professional profile and manage your availability
                through your own doctor dashboard.
              </p>
            </div>
            <Link
              href="/auth"
              className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-50"
            >
              Join as a doctor →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-semibold text-slate-800">Medrella.</span>{" "}
            A simpler approach to healthcare.
          </p>
          <p>© 2026 Medrella. Project in development.</p>
        </div>
      </footer>
    </main>
  );
}