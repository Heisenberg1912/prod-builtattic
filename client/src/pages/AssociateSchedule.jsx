import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { scheduleMeeting } from "../services/collaboration.js";
import Footer from "../components/Footer.jsx";

const buildMailtoLink = (email, subject, body) => {
  if (!email) return null;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${email}${query}`;
};

const AssociateSchedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const state = location.state || {};
  const associate = state.associate || state.profile || null;
  const title = state.title || associate?.title || "Associate";
  const meetingHref = state.meetingHref || state.schedulingMeeting || "";
  const contactEmail = state.contactEmail || associate?.contactEmail || associate?.user?.email || "";
  const availability = state.availability || associate?.availability || "Set availability in Skill Studio";
  const timezone = state.timezone || associate?.timezone || "UTC";
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const mailto = buildMailtoLink(
    contactEmail,
    `Schedule intro with ${title}`,
    `Hi ${title},\n\nI'd like to schedule an intro.\nPreferred date/time: ${form.date || "TBD"} ${form.time || ""}\nAgenda: ${form.message || ""}\n\nThanks!`
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        ownerType: "associate",
        ownerId: associate?._id || associate?.id || id || undefined,
        title: form.message ? `${title} intro - ${form.message.slice(0, 40)}` : `${title} intro`,
        scheduledFor: form.date ? new Date(`${form.date}T${form.time || "09:00"}`).toISOString() : null,
        durationMinutes: 45,
        meetingLink: "",
        agenda: form.message || "Intro call request",
        attendees: [
          ...(form.email
            ? [
              {
                name: form.name || "Client",
                email: form.email,
              },
            ]
            : []),
          ...(contactEmail
            ? [
              {
                name: title,
                email: contactEmail,
              },
            ]
            : []),
        ],
        status: "requested",
      };
      await scheduleMeeting(payload);
      toast.success("Meeting request sent");
      if (meetingHref) {
        window.open(meetingHref, "_blank", "noopener,noreferrer");
      }
      navigate("/portal/associate");
    } catch (error) {
      console.error("associate_schedule_failed", error);
      toast.error(error?.message || "Could not request a meeting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Schedule</p>
          <h1 className="text-3xl font-semibold">Meet {title}</h1>
          <p className="text-sm text-slate-600">
            Request a time to align on fit and next steps. We’ll reply with a calendar hold.
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 p-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Availability:</span> {availability}
            <span className="font-semibold text-slate-900">Timezone:</span> {timezone}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Your name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Preferred date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Preferred time</span>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-700">What would you like to discuss?</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                placeholder="Agenda, project context, stakeholders."
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {meetingHref ? "Open scheduling link" : "Send request"}
              </button>
              <button
                type="button"
                disabled={!mailto}
                onClick={() => mailto && (window.location.href = mailto)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Email {title.split(" ")[0] || "associate"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
            {contactEmail ? (
              <p className="text-xs text-slate-500">We will confirm over email at {contactEmail}.</p>
            ) : null}
          </form>
        </div>
        </div>
      <Footer />
    </div>
  );
};

export default AssociateSchedule;
