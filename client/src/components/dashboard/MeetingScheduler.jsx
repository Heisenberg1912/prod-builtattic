import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { scheduleMeeting, updateMeeting, deleteMeeting } from "../../services/collaboration.js";

const defaultMeetingForm = {
  id: null,
  title: "",
  scheduledFor: "",
  durationMinutes: 45,
  meetingLink: "",
  agenda: "",
  attendees: "",
  status: "scheduled",
};

const STATUS_LABELS = {
  scheduled: { label: "Scheduled", tone: "text-slate-700 bg-slate-100" },
  completed: { label: "Completed", tone: "text-emerald-700 bg-emerald-50" },
  cancelled: { label: "Cancelled", tone: "text-rose-700 bg-rose-50" },
};

const formatDateTime = (value) => {
  if (!value) return "TBD";
  try {
    return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

const parseAttendees = (value) => {
  const list = Array.isArray(value) ? value : String(value || "").split(/\n+/);
  return list
    .map((line) => {
      const entry = String(line || "").trim();
      if (!entry) return null;
      const match = entry.match(/^(.*)<([^>]+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      if (entry.includes("@")) {
        return { name: "", email: entry };
      }
      return { name: entry, email: "" };
    })
    .filter(Boolean);
};

export default function MeetingScheduler({
  ownerType = "associate",
  initialMeetings = [],
  heading = "Meeting schedule",
  eyebrow = "Scheduling",
  description = "Plan onboarding calls, walkthroughs, and review sessions linked to your packs.",
  emptyMessage = "No meetings scheduled yet. Log touchpoints so ops knows your availability.",
}) {
  const [meetings, setMeetings] = useState(() => (Array.isArray(initialMeetings) ? initialMeetings : []));
  const [form, setForm] = useState(defaultMeetingForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    setMeetings(Array.isArray(initialMeetings) ? [...initialMeetings] : []);
  }, [initialMeetings]);

  const upcomingMeetings = useMemo(
    () =>
      [...meetings].sort(
        (a, b) => new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime()
      ),
    [meetings]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(defaultMeetingForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give the meeting a title");
      return;
    }
    if (!form.scheduledFor) {
      toast.error("Select a meeting date");
      return;
    }
    setSaving(true);
    try {
      const when = new Date(form.scheduledFor);
      if (Number.isNaN(when.getTime())) {
        throw new Error("Select a valid meeting date");
      }
      const payload = {
        ownerType,
        title: form.title.trim(),
        scheduledFor: when.toISOString(),
        durationMinutes: Number(form.durationMinutes) || 30,
        meetingLink: form.meetingLink.trim(),
        agenda: form.agenda.trim(),
        attendees: parseAttendees(form.attendees),
        status: form.status || "scheduled",
      };
      let response;
      if (form.id) {
        response = await updateMeeting(form.id, payload);
      } else {
        response = await scheduleMeeting(payload);
      }
      const saved = response?.meeting;
      if (!saved) throw new Error("Meeting response missing");
      setMeetings((prev) => {
        const filtered = prev.filter((meeting) => meeting.id !== saved.id);
        return [saved, ...filtered];
      });
      toast.success(form.id ? "Meeting updated" : "Meeting scheduled");
      resetForm();
    } catch (error) {
      toast.error(error?.message || "Unable to save meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meeting) => {
    setForm({
      id: meeting.id,
      title: meeting.title || "",
      scheduledFor: toInputDateTime(meeting.scheduledFor),
      durationMinutes: meeting.durationMinutes || 45,
      meetingLink: meeting.meetingLink || "",
      agenda: meeting.agenda || "",
      attendees: Array.isArray(meeting.attendees)
        ? meeting.attendees
            .map((attendee) =>
              attendee.name && attendee.email ? `${attendee.name} <${attendee.email}>` : attendee.email || attendee.name || ""
            )
            .join("\n")
        : "",
      status: meeting.status || "scheduled",
    });
  };

  const handleStatusChange = async (meeting, status) => {
    setBusyId(meeting.id);
    try {
      const { meeting: updated } = await updateMeeting(meeting.id, { ownerType, status });
      setMeetings((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success(`Marked as ${status}`);
    } catch (error) {
      toast.error(error?.message || "Unable to update meeting");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (meeting) => {
    if (!window.confirm(`Delete ${meeting.title}?`)) return;
    setBusyId(meeting.id);
    try {
      await deleteMeeting(meeting.id, { ownerType });
      setMeetings((prev) => prev.filter((entry) => entry.id !== meeting.id));
      toast.success("Meeting removed");
      if (form.id === meeting.id) {
        resetForm();
      }
    } catch (error) {
      toast.error(error?.message || "Unable to delete meeting");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
          <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        {form.id ? (
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-700 underline"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-4">
          {!upcomingMeetings.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              {emptyMessage}
            </div>
          ) : (
            upcomingMeetings.map((meeting) => {
              const tone = STATUS_LABELS[meeting.status] || STATUS_LABELS.scheduled;
              return (
                <article
                  key={meeting.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
                        {tone.label}
                      </span>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{meeting.title}</h3>
                      <p className="text-sm text-slate-600">{formatDateTime(meeting.scheduledFor)}</p>
                      {meeting.meetingLink ? (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-slate-900 underline"
                        >
                          Join link
                        </a>
                      ) : null}
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>{meeting.durationMinutes ? `${meeting.durationMinutes} min` : ""}</p>
                    </div>
                  </div>
                  {meeting.agenda ? (
                    <p className="mt-3 text-sm text-slate-600">{meeting.agenda}</p>
                  ) : null}
                  {meeting.attendees?.length ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Attendees:{" "}
                      {meeting.attendees
                        .map((attendee) => attendee.name || attendee.email)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(meeting)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(meeting, meeting.status === "completed" ? "scheduled" : "completed")}
                      disabled={busyId === meeting.id}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60"
                    >
                      {meeting.status === "completed" ? "Reopen" : "Mark complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(meeting, "cancelled")}
                      disabled={busyId === meeting.id}
                      className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:border-amber-300 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(meeting)}
                      disabled={busyId === meeting.id}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:border-rose-300 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
          <label className="text-sm font-semibold text-slate-700">
            Meeting title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Client onboarding"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Scheduled for
            <input
              type="datetime-local"
              name="scheduledFor"
              value={form.scheduledFor}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Duration (minutes)
              <input
                type="number"
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                min={15}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Meeting link
              <input
                name="meetingLink"
                value={form.meetingLink}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://meet.builtattic.com/..."
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Agenda / notes
            <textarea
              name="agenda"
              rows={3}
              value={form.agenda}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Walk through service pack scope and expectations."
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Attendees
            <textarea
              name="attendees"
              rows={3}
              value={form.attendees}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={"Ops Lead <ops@builtattic.com>\nYou <associate@demo.com>"}
            />
            <p className="mt-1 text-xs text-slate-500">Add one attendee per line. Use Name &lt;email&gt; where possible.</p>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {form.id ? "Update meeting" : "Schedule meeting"}
          </button>
        </form>
      </div>
    </section>
  );
}
