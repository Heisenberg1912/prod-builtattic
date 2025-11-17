import React, { useMemo } from "react";
import { HelpCircle, Sparkles, MessageCircle, ShieldCheck } from "lucide-react";
import Footer from "../components/Footer";

const FAQ_ITEMS = [
  {
    question: "What exactly does Builtattic do?",
    answer:
      "Builtattic unifies disconnected AEC workflows into one connected ecosystem where architects, designers, studios, and freelancers can showcase work, collaborate in real time, and connect with qualified leads.",
  },
  {
    question: "Who is Builtattic for?",
    answer:
      "Anyone operating in the architecture, engineering, and construction space—architects, interior designers, visualizers, students, independent specialists, and full-service studios looking for visibility or clients.",
  },
  {
    question: "Is it free to join?",
    answer: "Yes. Registration is free and there are no onboarding or platform access fees.",
  },
  {
    question: "Do I need a registered business or can I join as an individual?",
    answer:
      "Both paths are supported. You can build a verified presence as a freelancer, a registered firm, or a multi-disciplinary studio—Builtattic adapts to whichever profile you choose.",
  },
  {
    question: "Can I link my social media profiles?",
    answer: "Absolutely. Add Instagram, LinkedIn, Behance, and other professional links to deepen trust and let clients explore your broader presence.",
  },
  {
    question: "Is there any skill verification or test?",
    answer:
      "We run documentation-based verification to confirm the required licences, certifications, or credentials so clients know they are working with vetted professionals.",
  },
  {
    question: "How do I get projects on Builtattic?",
    answer:
      "Your portfolio, pricing, and delivery playbooks live in one storefront. Clients browse collections, compare profiles, and reach out directly through secure Builtattic messaging.",
  },
  {
    question: "How do I increase my chances of getting more clients?",
    answer:
      "Keep your portfolio fresh, highlight proof-of-work, respond quickly, publish transparent pricing, and stay active across featured community programs.",
  },
  {
    question: "Is my work protected on the platform?",
    answer:
      "Yes. Builtattic layers modern authenticity safeguards and metadata tracking so provenance is always traceable. Policy-backed enforcement kicks in if misuse is detected.",
  },
  {
    question: "Will Builtattic promote my work?",
    answer:
      "Exceptional profiles and consistently delivered projects are eligible for spotlights across marketplace sections, newsletters, and social channels.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the in-app helpdesk widget or email the support team—response times typically range between 24 and 48 hours depending on queue volume.",
  },
  {
    question: "Is onboarding assistance available?",
    answer:
      "Yes. You get guided walkthroughs, template libraries, and direct help from the Builtattic success crew to get your profile and portfolio launch-ready.",
  },
];

const Faqs = () => {
  const groups = useMemo(
    () => [
      {
        title: "Platform basics",
        highlight: "Understand the core experience and who it's built for.",
        items: FAQ_ITEMS.slice(0, 4),
      },
      {
        title: "Profile & credibility",
        highlight: "Earn trust with social proof and verified credentials.",
        items: FAQ_ITEMS.slice(4, 8),
      },
      {
        title: "Growth & support",
        highlight: "Protect your work and get help whenever you need it.",
        items: FAQ_ITEMS.slice(8),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <main className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-indigo-200 via-white to-transparent blur-3xl" />

        <section className="px-4 pt-20 pb-16 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              <Sparkles size={14} /> Trusted by modern AEC teams
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Everything you need to know about getting started, scaling visibility, and collaborating inside the Builtattic ecosystem.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
              <StatPill icon={<ShieldCheck size={16} />} label="Verified network" detail="Licences & docs reviewed" />
              <StatPill icon={<MessageCircle size={16} />} label="24/48h support" detail="Priority inbox coverage" />
              <StatPill icon={<HelpCircle size={16} />} label="Guided onboarding" detail="Playbooks & workshops" />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-16">
            {groups.map((group) => (
              <article key={group.title} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">
                    {group.title}
                  </p>
                  <h2 className="text-2xl font-semibold">{group.highlight}</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {group.items.map((item, index) => (
                    <FaqCard key={item.question} order={index + 1} {...item} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-indigo-100/70 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Need a human?
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-900">Still have questions?</h3>
            <p className="mt-3 text-base text-slate-600">
              Reach the Builtattic support desk anytime via the in-app help widget or send us an email—most requests are answered within two business days.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/50"
                onClick={() => window?.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <HelpCircle size={16} /> Browse topics
              </button>
              <a
                href="mailto:support@builtattic.com"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <MessageCircle size={16} /> Email support
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const StatPill = ({ icon, label, detail }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
    <span className="text-indigo-500">{icon}</span>
    <span className="text-left">
      <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</span>
      <span className="text-xs text-slate-500">{detail}</span>
    </span>
  </span>
);

const FaqCard = ({ order, question, answer }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200">
    <div className="absolute -left-10 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl transition group-hover:translate-x-4" />
    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">FAQ {order.toString().padStart(2, "0")}</p>
    <h3 className="mt-3 text-xl font-semibold text-slate-900">{question}</h3>
    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{answer}</p>
  </div>
);

export default Faqs;
