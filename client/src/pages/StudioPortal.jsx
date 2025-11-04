import React from "react";
import { Link } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";

const featureCards = [
  {
    title: "Project catalog",
    description:
      "Maintain your studio overview, signature typologies, and geographic focus to stay relevant for new briefs.",
  },
  {
    title: "Asset management",
    description:
      "Upload hero imagery, drawings, and videos so your listing always reflects your latest work.",
  },
  {
    title: "Team visibility",
    description:
      "Highlight key team members, collaborators, and certifications prospective clients should know about.",
  },
];

const submissionSteps = [
  {
    title: "1. Share your request",
    description:
      "Use the portal sign-in to let us know you are ready for contributor access or to request a walkthrough.",
  },
  {
    title: "2. Prepare your materials",
    description:
      "Collect project imagery at 2000px width, a studio bio under 150 words, and any press or award links.",
  },
  {
    title: "3. Publish with the team",
    description:
      "Our editors will guide you through the first upload and enable direct publishing once the beta opens.",
  },
];

const StudioPortal = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm px-8 py-10 sm:px-12">
          <span className="inline-flex items-center rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-700">
            Studio Portal
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900">
            Showcase every studio project in one place
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Log in to submit new studios, refresh visuals, and coordinate launch timing with the Builtattic curation
            team. You will be ready for self-service publishing as soon as the contributor beta opens.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login?portal=studio"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Sign in to studio workspace
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:text-indigo-800"
            >
              Request publishing access
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Contributor rollout roadmap</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {submissionSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-indigo-200 bg-indigo-900 px-8 py-10 text-indigo-50 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Partner with Builtattic editors</h2>
              <p className="mt-2 max-w-xl text-sm text-indigo-200">
                From storytelling support to asset optimisation, the team is available to make sure your studio looks
                outstanding on launch day.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:studios@builtattic.com"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                Email studios@builtattic.com
              </a>
              <Link
                to="/studio"
                className="inline-flex items-center justify-center rounded-lg border border-indigo-300 px-5 py-3 text-sm font-semibold text-indigo-50 transition hover:bg-indigo-800"
              >
                Explore live studio listings
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudioPortal;
