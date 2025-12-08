import React from "react";
import { Link } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";

const featureCards = [
  {
    title: "Profile builder",
    description:
      "Edit your bio, service categories, rates, and availability without waiting on the marketplace team.",
  },
  {
    title: "Portfolio spotlight",
    description:
      "Upload hero imagery, attach recent case studies, and keep your external links current.",
  },
  {
    title: "Lead preferences",
    description:
      "Control the regions, project sizes, and collaboration types you want to be discovered for.",
  },
];

const onboardingChecklist = [
  "Latest headshot or brand image",
  "Updated rate card or pricing bands",
  "Three recent projects with short blurbs",
  "Contact email or call scheduling link",
];

const AssociatePortal = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm px-8 py-10 sm:px-12">
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Associate Portal
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900">
            Own your Builtattic associate presence
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Use the portal to keep your services, certifications, and availability up to date. Once contributor
            workflows are fully enabled, your edits will flow straight to the marketplace listing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login?portal=associate"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign in to associate workspace
            </Link>
            <a
              href="mailto:support@builtattic.com"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Contact support
            </a>
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
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">What you will need</h2>
              <p className="mt-3 text-sm text-slate-600">
                Gather the essentials below so the team can approve your workspace quickly once contributor uploads
                go live.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              {onboardingChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-10 text-slate-100 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Have questions?</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                The partner success team can help migrate your existing profile or share the rollout timeline for
                full self-service editing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:partnerships@builtattic.com"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Email partnerships@builtattic.com
              </a>
              <Link
                to="/associates"
                className="inline-flex items-center justify-center rounded-lg border border-slate-400 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                View live associate marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AssociatePortal;
