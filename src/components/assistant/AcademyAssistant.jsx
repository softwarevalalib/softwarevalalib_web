import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, X, Minus, Send, Sparkles } from "lucide-react";
import AcademyImage from "../academy/AcademyImage";
import { ACADEMY_ASSETS } from "../../data/academyMeta";
import {
  bootstrapAssistant,
  sendAssistantMessage,
  assistantAction,
  trackAssistantEvent,
  isGreetingDismissed,
  dismissGreeting,
} from "../../utils/assistantApi";

function isAcademyLearnerPath(path) {
  return (
    path.startsWith("/academy") &&
    !path.startsWith("/academy/admin") &&
    !path.startsWith("/academy/login")
  );
}

function CourseMiniCard({ course }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c10020]">{course.code}</p>
      <h4 className="mt-0.5 text-sm font-bold text-[#00274c] leading-snug">{course.title}</h4>
      <p className="mt-1 text-xs text-slate-500">
        {course.level} · {course.duration} · US${course.tuition}
      </p>
      {course.why ? <p className="mt-2 text-xs text-slate-600 leading-relaxed">{course.why}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={course.viewUrl}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#00274c]"
        >
          View Course
        </Link>
        <Link
          to={course.enrollUrl}
          className="rounded-full bg-[#c10020] px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          Enroll
        </Link>
      </div>
    </article>
  );
}

function MessageBubble({ message, onAction }) {
  const ui = message.ui_payload || message.ui || {};
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#00274c] text-white rounded-br-md"
            : "bg-slate-100 text-slate-800 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {ui.type === "enrollment_summary" ? (
          <div className="mt-3 rounded-xl bg-white/90 text-[#00274c] p-3 text-xs space-y-1 border border-slate-200">
            <p><strong>Applicant:</strong> {ui.applicant}</p>
            <p><strong>Email:</strong> {ui.email}</p>
            <p><strong>Phone:</strong> {ui.phone}</p>
            <p><strong>Courses:</strong> {(ui.courses || []).join(", ")}</p>
            {ui.education ? <p><strong>Education:</strong> {ui.education}</p> : null}
            {ui.preferredSession ? <p><strong>Session:</strong> {ui.preferredSession}</p> : null}
          </div>
        ) : null}

        {Array.isArray(ui.courses) && ui.courses.length ? (
          <div className="mt-3 space-y-2">
            {ui.courses.map((c) => (
              <CourseMiniCard key={c.code} course={c} />
            ))}
          </div>
        ) : null}

        {Array.isArray(ui.buttons) && ui.buttons.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {ui.buttons.map((btn) =>
              btn.href ? (
                <a
                  key={btn.label}
                  href={btn.href}
                  target={btn.href.startsWith("/api/") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#00274c]"
                >
                  {btn.label}
                </a>
              ) : (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => onAction(btn)}
                  className="rounded-full bg-[#c10020] px-3 py-1.5 text-[11px] font-bold text-white"
                >
                  {btn.label}
                </button>
              )
            )}
          </div>
        ) : null}

        {ui.enrollment?.progress ? (
          <p className="mt-2 text-[11px] font-semibold text-[#00274c]/80">
            Enrollment Progress {ui.enrollment.progress.completed} of{" "}
            {ui.enrollment.progress.total} required items completed
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AcademyAssistant() {
  const location = useLocation();
  const active = isAcademyLearnerPath(location.pathname);
  const titleId = useId();
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingField, setAwaitingField] = useState(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({ greetingDelayMs: 5000, assistantName: "SVL Academy Assistant" });

  useEffect(() => {
    if (!active) {
      setOpen(false);
      setGreeting(false);
      return undefined;
    }
    if (isGreetingDismissed() || open) return undefined;
    const delay = settings.greetingDelayMs || 5000;
    const t = setTimeout(() => setGreeting(true), delay);
    return () => clearTimeout(t);
  }, [active, open, settings.greetingDelayMs]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const appendMessages = (list = []) => {
    setMessages((prev) => [...prev, ...list]);
  };

  const ensureBootstrapped = async () => {
    if (messages.length) return;
    setBusy(true);
    try {
      const data = await bootstrapAssistant();
      if (data.settings) setSettings((s) => ({ ...s, ...data.settings }));
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Unable to start assistant.");
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    setGreeting(false);
    dismissGreeting();
    setMinimized(false);
    setOpen(true);
    await ensureBootstrapped();
    trackAssistantEvent("CHAT_OPENED");
  };

  const closeChat = () => {
    setOpen(false);
    setMinimized(false);
  };

  const dismissInvite = () => {
    setGreeting(false);
    dismissGreeting();
  };

  const handleAction = async (btn) => {
    if (btn.action === "focus_input") {
      inputRef.current?.focus();
      return;
    }
    if (btn.action === "quick" && btn.value) {
      setInput(btn.value);
      await handleSend(btn.value);
      return;
    }
    if (btn.action === "self_enroll") {
      window.location.href = btn.href || "/academy/enroll";
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await assistantAction(btn.action, {
        value: btn.value,
        courseCodes: btn.courseCodes,
      });
      appendMessages(data.messages || []);
      if (data.awaitingField) setAwaitingField(data.awaitingField);
      else if (btn.action === "confirm_submit") setAwaitingField(null);
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    appendMessages([{ id: `local-${Date.now()}`, role: "user", content: text, ui_payload: {} }]);
    setBusy(true);
    try {
      const data = await sendAssistantMessage(text, { awaitingField });
      appendMessages(data.messages || []);
      setAwaitingField(data.awaitingField || null);
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setBusy(false);
    }
  };

  if (!active) return null;

  return (
    <>
      {/* 5-second greeting popup — does not steal focus */}
      {greeting && !open ? (
        <div
          className="fixed z-40 left-4 bottom-28 sm:bottom-24 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-[#00274c]">Hi 👋 Need help choosing a course?</p>
            <button
              type="button"
              onClick={dismissInvite}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label="Dismiss greeting"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Tell me what you&apos;d like to learn, your current education/experience, or the career
            skills you want to develop, and I&apos;ll help you explore suitable SVL Academy courses.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "Find a Course", value: "Help me find a course for my goals" },
              { label: "View Fees", value: "What are the tuition fees?" },
              { label: "How Enrollment Works", value: "How does enrollment work?" },
              { label: "Enroll Now", action: "start_assistant_enroll" },
              { label: "Ask a Question", action: "open" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#00274c] hover:bg-[#00274c] hover:text-white"
                onClick={async () => {
                  await openChat();
                  if (item.action === "start_assistant_enroll") {
                    handleAction({ action: "start_assistant_enroll", label: "Enroll Now" });
                  } else if (item.value) {
                    handleSend(item.value);
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Chat panel */}
      {open && !minimized ? (
        <section
          ref={panelRef}
          aria-labelledby={titleId}
          className="fixed z-50 left-0 sm:left-4 bottom-0 sm:bottom-24 w-full sm:w-[400px] h-[min(92vh,640px)] sm:h-[600px] sm:rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        >
          <header className="bg-[#00274c] text-white px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white p-1 overflow-hidden shrink-0">
              <AcademyImage
                src={ACADEMY_ASSETS.logo}
                alt=""
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display font-bold text-sm truncate">
                {settings.assistantName || "SVL Academy Assistant"}
              </h2>
              <p className="text-[11px] text-white/75 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                AI Admissions & Course Advisor · Online
              </p>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="New conversation"
              onClick={async () => {
                setMessages([]);
                await ensureBootstrapped();
              }}
            >
              <Sparkles size={16} />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Minimize chat"
              onClick={() => setMinimized(true)}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Close chat"
              onClick={closeChat}
            >
              <X size={16} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50" aria-live="polite">
            {messages.map((m) => (
              <MessageBubble key={m.id || `${m.role}-${m.created_at}-${m.content?.slice(0, 12)}`} message={m} onAction={handleAction} />
            ))}
            {busy ? <p className="text-xs text-slate-400 px-1">Assistant is typing…</p> : null}
            {error ? <p className="text-xs text-red-600 px-1" role="alert">{error}</p> : null}
          </div>

          <form
            className="border-t border-slate-200 p-3 bg-white flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label className="sr-only" htmlFor="academy-assistant-input">
              Ask about courses, enrollment, fees
            </label>
            <input
              id="academy-assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, enrollment, fees..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#c10020]"
              disabled={busy}
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c10020] text-white px-3.5 grid place-items-center disabled:opacity-50"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      ) : null}

      {/* Launcher — bottom LEFT */}
      <button
        type="button"
        onClick={() => (open && minimized ? setMinimized(false) : open ? closeChat() : openChat())}
        className="fixed z-40 left-4 bottom-[5.5rem] sm:bottom-8 inline-flex items-center gap-2 min-h-12 pl-3 pr-4 rounded-full bg-[#00274c] text-white text-sm font-bold shadow-lg shadow-[#00274c]/30 hover:bg-[#001a33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c10020]"
        aria-label={open ? "Close SVL Academy Assistant" : "Open SVL Academy Assistant"}
        aria-expanded={open && !minimized}
      >
        <span className="grid place-items-center h-8 w-8 rounded-full bg-[#c10020]">
          {open && !minimized ? <X size={16} /> : <MessageCircle size={16} />}
        </span>
        <span className="hidden xs:inline sm:inline">Assistant</span>
      </button>
    </>
  );
}
