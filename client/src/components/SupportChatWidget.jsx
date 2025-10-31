import React, { useEffect, useRef, useState } from "react";
import { HiOutlineChatBubbleLeftRight, HiOutlinePaperAirplane } from "react-icons/hi2";

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState(() => [
    {
      sender: "support",
      body: "Hi there! How can Builtattic help you today?",
      at: new Date().toISOString(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const autoReplyTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (autoReplyTimer.current) {
        clearTimeout(autoReplyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("support-chat:open", handleOpen);
    return () => window.removeEventListener("support-chat:open", handleOpen);
  }, []);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userEntry = {
      sender: "user",
      body: trimmed,
      at: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, userEntry]);
    setMessage("");
    setIsSending(true);

    autoReplyTimer.current = setTimeout(() => {
      setHistory((prev) => {
        const supportReplies = prev.filter((entry) => entry.sender === "support").length;
        const body =
          supportReplies <= 1
            ? "This is a demo, and we welcome a review for our work!"
            : "Thank you for your time, we will make sure to keep your suggestions in mind before we make our work public";

        return [
          ...prev,
          {
            sender: "support",
            body,
            at: new Date().toISOString(),
          },
        ];
      });
      setIsSending(false);
    }, 450);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Builtattic</p>
              <p className="text-xs text-slate-300">We&apos;ll reply as soon as we can</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xl leading-none text-slate-300 hover:text-white"
              aria-label="Minimize support chat"
            >
              &minus;
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-3">
            {history.map((entry, index) => (
              <div
                key={`${entry.at}-${index}`}
                className={`max-w-[82%] rounded-xl px-3 py-2 text-xs ${
                  entry.sender === "support"
                    ? "self-start border border-slate-200 bg-white text-slate-700"
                    : "ml-auto bg-slate-900 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{entry.body}</p>
                <span
                  className={`mt-1 block text-[10px] ${
                    entry.sender === "support" ? "text-slate-400" : "text-slate-300"
                  }`}
                >
                  {new Date(entry.at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            {isSending && (
              <div className="self-start text-xs text-slate-400">
                Builtattic is writing&hellip;
              </div>
            )}
          </div>

          <footer className="flex items-start gap-2 border-t border-slate-200 px-3 py-2">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write your message..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <button
              onClick={handleSend}
              disabled={isSending}
              className="rounded-lg bg-slate-900 p-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
            </button>
          </footer>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg transition hover:bg-slate-700"
          aria-label="Open support chat"
        >
          <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default SupportChatWidget;
