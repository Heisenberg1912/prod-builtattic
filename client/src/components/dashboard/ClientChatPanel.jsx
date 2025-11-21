import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createWorkspaceChat,
  postWorkspaceChatMessage,
  updateWorkspaceChat,
} from "../../services/workspaceChats.js";

const defaultThreadForm = {
  subject: "",
  clientName: "",
  clientEmail: "",
  message: "",
};

const defaultMessageForm = {
  body: "",
};

const formatTimestamp = (value) => {
  if (!value) return "Just now";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function ClientChatPanel({
  ownerType = "associate",
  initialChats = [],
  heading = "Client chat",
  eyebrow = "Workspace",
  description = "Log touchpoints, share updates, and keep the client thread in sync with what ops can see.",
  emptyMessage = "No chat threads yet. Start a conversation when the buyer requests WD-W3 files or scheduling changes.",
  onChange = () => {},
}) {
  const [chats, setChats] = useState(() => (Array.isArray(initialChats) ? initialChats : []));
  const [selectedChatId, setSelectedChatId] = useState(() => chats[0]?.id || null);
  const [threadForm, setThreadForm] = useState(defaultThreadForm);
  const [messageForms, setMessageForms] = useState({});
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setChats(Array.isArray(initialChats) ? [...initialChats] : []);
    if (initialChats?.length && !selectedChatId) {
      setSelectedChatId(initialChats[0].id);
    }
  }, [initialChats]);

  const selectedChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId) || null, [chats, selectedChatId]);

  const handleThreadFormChange = (event) => {
    const { name, value } = event.target;
    setThreadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMessageChange = (chatId, value) => {
    setMessageForms((prev) => ({ ...prev, [chatId]: { body: value } }));
  };

  const resetThreadForm = () => setThreadForm(defaultThreadForm);

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!threadForm.subject.trim()) {
      toast.error("Add a subject");
      return;
    }
    if (threadForm.message.trim().length < 5) {
      toast.error("Add a short message to kick things off");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        ownerType,
        subject: threadForm.subject.trim(),
        clientName: threadForm.clientName.trim(),
        clientEmail: threadForm.clientEmail.trim(),
        message: {
          body: threadForm.message.trim(),
        },
      };
    const response = await createWorkspaceChat(payload);
    const chat = response?.chat;
    if (!chat) throw new Error("Chat response missing");
    setChats((prev) => [chat, ...prev]);
    setSelectedChatId(chat.id);
    setMessageForms((prev) => ({ ...prev, [chat.id]: defaultMessageForm }));
    resetThreadForm();
    toast.success("Chat created");
    onChange();
  } catch (error) {
    toast.error(error?.message || "Unable to create chat");
  } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (chatId) => {
    const message = messageForms[chatId]?.body?.trim();
    if (!message) {
      toast.error("Add a message");
      return;
    }
    setSending(true);
    try {
    const response = await postWorkspaceChatMessage(chatId, { ownerType, body: message });
    const chat = response?.chat;
    if (!chat) throw new Error("Chat response missing");
    setChats((prev) => prev.map((item) => (item.id === chat.id ? chat : item)));
    setMessageForms((prev) => ({ ...prev, [chatId]: defaultMessageForm }));
    toast.success("Message sent");
    onChange();
  } catch (error) {
    toast.error(error?.message || "Unable to send message");
  } finally {
      setSending(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!selectedChat) return;
    setUpdatingStatus(true);
    const nextStatus = selectedChat.status === "resolved" ? "open" : "resolved";
    try {
      const response = await updateWorkspaceChat(selectedChat.id, { ownerType, status: nextStatus });
      const chat = response?.chat;
      if (!chat) throw new Error("Chat response missing");
      setChats((prev) => prev.map((item) => (item.id === chat.id ? chat : item)));
      toast.success(nextStatus === "resolved" ? "Chat resolved" : "Chat reopened");
      onChange();
    } catch (error) {
      toast.error(error?.message || "Unable to update chat");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm" id="client-chat">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <form onSubmit={handleCreateThread} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-900">New thread</p>
            <input
              name="subject"
              value={threadForm.subject}
              onChange={handleThreadFormChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Client sync or WD-W3 release"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="clientName"
                value={threadForm.clientName}
                onChange={handleThreadFormChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Client name"
              />
              <input
                name="clientEmail"
                value={threadForm.clientEmail}
                onChange={handleThreadFormChange}
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="client@email.com"
              />
            </div>
            <textarea
              name="message"
              value={threadForm.message}
              onChange={handleThreadFormChange}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Kick off the conversation with a short update"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {creating ? "Creating..." : "Start chat"}
            </button>
          </form>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <p className="text-sm text-slate-500">{emptyMessage}</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    chat.id === selectedChatId ? "border-slate-900 bg-slate-900/5" : "border-slate-100 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{chat.subject}</p>
                  <p className="text-xs text-slate-500">
                    {chat.status === "resolved" ? "Resolved" : "Open"} �?�{" "}
                    {chat.messages?.[chat.messages.length - 1]?.senderName || "No replies yet"}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatTimestamp(chat.lastMessageAt || chat.updatedAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
          {!selectedChat ? (
            <p className="text-sm text-slate-500">Select a thread to view the conversation.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedChat.subject}</p>
                  <p className="text-xs text-slate-500">
                    {selectedChat.clientName || "Unknown client"} {selectedChat.clientEmail ? `• ${selectedChat.clientEmail}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  disabled={updatingStatus}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                >
                  {updatingStatus
                    ? "Updating..."
                    : selectedChat.status === "resolved"
                      ? "Reopen"
                      : "Mark resolved"}
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-[320px] overflow-auto pr-1">
                {(selectedChat.messages || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl border px-3 py-2 text-sm ${
                        message.senderType === "client"
                          ? "border-slate-100 bg-slate-50 text-slate-800"
                          : "border-indigo-100 bg-indigo-50 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{message.senderName || (message.senderType === "client" ? "Client" : "Workspace")}</span>
                        <span>{formatTimestamp(message.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-800">{message.body}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 space-y-2">
                <textarea
                  rows={3}
                  value={messageForms[selectedChat.id]?.body || ""}
                  onChange={(event) => handleMessageChange(selectedChat.id, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Share updates, links, or next steps"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage(selectedChat.id)}
                  disabled={sending}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send message"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
