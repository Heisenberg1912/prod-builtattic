import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createWorkspaceChat } from "../services/workspaceChats.js";
import Footer from "../components/Footer.jsx";

const buildMailtoLink = (email, subject, body) => {
  if (!email) return null;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${email}${query}`;
};

const AssociateEnquiry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const state = location.state || {};
  const associate = state.associate || state.profile || null;
  const title = state.title || associate?.title || "Associate";
  const price = state.price || associate?.priceLabel || "";
  const currency = state.currency || associate?.currency || "USD";
  const contactEmail = state.contactEmail || associate?.contactEmail || associate?.user?.email || "";
  const enquiryHref = state.enquiryHref || (contactEmail ? `mailto:${contactEmail}` : "");
  const [form, setForm] = useState({
    name: "",
    email: "",
    summary: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const mailto = buildMailtoLink(
    contactEmail,
    `Enquiry for ${title}`,
    `Hi ${title},\n\nI have a question about your availability/scope.\n\nDetails:\n${form.summary || ""}\n\nThanks!`
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
        subject: `${title} enquiry`,
        message: form.summary || "New enquiry",
        contact: {
          name: form.name,
          email: form.email,
        },
        metadata: {
          price,
          currency,
        },
      };
      await createWorkspaceChat(payload);
      toast.success("Enquiry submitted");
      if (enquiryHref) {
        window.open(enquiryHref, "_blank", "noopener,noreferrer");
      }
      navigate("/portal/associate");
    } catch (error) {
      console.error("associate_enquiry_failed", error);
      toast.error(error?.message || "Could not send enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Enquiry</p>
          <h1 className="text-3xl font-semibold">Reach out to {title}</h1>
          <p className="text-sm text-slate-600">
            Ask about scope, capacity, pricing, or fit. We will route this to the associate.
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 p-6 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            {price ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800 font-semibold">{price}</span> : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{currency}</span>
            {id ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">ID: {id}</span> : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-1 text-sm block">
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
            <label className="space-y-1 text-sm block">
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
            <label className="space-y-1 text-sm block">
              <span className="text-slate-700">What do you want to know?</span>
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                rows={4}
                placeholder="Scope, timelines, references, availability..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                required
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {enquiryHref ? "Open email to send" : "Send enquiry"}
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
              <p className="text-xs text-slate-500">We will notify {contactEmail} with your enquiry.</p>
            ) : null}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssociateEnquiry;
