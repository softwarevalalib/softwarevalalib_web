import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, X, Minus, Maximize2, Minimize2, Send, Sparkles } from "lucide-react";
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
    !path.startsWith("/academy/login") &&
    !path.startsWith("/academy/portal")
  );
}

function CourseMiniCard({ course, onSelect }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c10020]">{course.code}</p>
      <h4 className="mt-0.5 text-sm font-bold text-[#00274c] leading-snug">{course.title}</h4>
      <p className="mt-1 text-xs text-slate-500">
        {course.level} · {course.duration} · US${course.tuition}
        {course.registrationFee ? ` + $${course.registrationFee} reg.` : ""}
      </p>
      {course.why ? <p className="mt-2 text-xs text-slate-600 leading-relaxed">{course.why}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={course.viewUrl}
          className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-[#00274c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c10020]"
        >
          View details
        </Link>
        <button
          type="button"
          onClick={() => onSelect?.(course)}
          className="rounded-full bg-[#c10020] px-2.5 py-1.5 text-[11px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00274c]"
        >
          Select to enroll
        </button>
      </div>
    </article>
  );
}

function MessageBubble({ message, onAction, onSelectCourse }) {
  const ui = message.ui_payload || message.ui || {};
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#00274c] text-white rounded-br-md"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {ui.type === "enrollment_summary" ? (
          <div className="mt-3 rounded-xl bg-slate-50 text-[#00274c] p-3 text-xs space-y-1 border border-slate-200">
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
            <p className="text-[11px] font-semibold text-[#00274c]">
              Click <span className="text-[#c10020]">Select to enroll</span> on a course below.
            </p>
            {ui.courses.map((c) => (
              <CourseMiniCard key={c.code} course={c} onSelect={onSelectCourse} />
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
                  className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#00274c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c10020]"
                >
                  {btn.label}
                </a>
              ) : (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => onAction(btn)}
                  className="rounded-full bg-[#c10020] px-3 py-1.5 text-[11px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00274c]"
                >
                  {btn.label}
                </button>
              )
            )}
          </div>
        ) : null}

        {ui.enrollment?.progress ? (
          <p className="mt-2 text-[11px] font-semibold text-[#00274c]/80">
            Enrollment progress: {ui.enrollment.progress.completed} of{" "}
            {ui.enrollment.progress.total} required items
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
  const [maximized, setMaximized] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingField, setAwaitingField] = useState(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    greetingDelayMs: 5000,
    assistantName: "SVL Academy Assistant",
  });

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
  }, [messages, open, minimized]);

  useEffect(() => {
    if (!open || minimized) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (maximized) setMaximized(false);
        else {
          setMinimized(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, minimized, maximized]);

  const appendMessages = (list = []) => {
    setMessages((prev) => [...prev, ...list]);
  };

  const ensureBootstrapped = async (force = false) => {
    if (messages.length && !force) return;
    setBusy(true);
    try {
      const data = await bootstrapAssistant();
      if (data.settings) setSettings((s) => ({ ...s, ...data.settings }));
      setMessages(data.messages || []);
      setAwaitingField(null);
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
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeChat = () => {
    setOpen(false);
    setMinimized(false);
    setMaximized(false);
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
        courseCode: btn.courseCode,
      });
      appendMessages(data.messages || []);
      if (Object.prototype.hasOwnProperty.call(data, "awaitingField")) {
        setAwaitingField(data.awaitingField || null);
      }
      if (btn.action === "confirm_submit") setAwaitingField(null);
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelectCourse = async (course) => {
    setBusy(true);
    setError("");
    appendMessages([
      {
        id: `local-select-${Date.now()}`,
        role: "user",
        content: `I want to enroll in ${course.code} — ${course.title}`,
        ui_payload: {},
      },
    ]);
    try {
      const data = await assistantAction("select_course", {
        courseCode: course.code,
        courseCodes: [course.code],
      });
      appendMessages(data.messages || []);
      setAwaitingField(data.awaitingField || null);
    } catch (err) {
      setError(err.message || "Unable to select course.");
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
      if (Object.prototype.hasOwnProperty.call(data, "awaitingField")) {
        setAwaitingField(data.awaitingField || null);
      }
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setBusy(false);
    }
  };

  if (!active) return null;

  const panelOpen = open && !minimized;
  const panelClass = maximized
    ? "fixed z-[60] inset-3 sm:inset-6 rounded-2xl"
    : "fixed z-[60] left-3 right-3 sm:left-6 sm:right-auto bottom-[9.5rem] sm:bottom-[5.5rem] w-auto sm:w-[min(400px,calc(100vw-3rem))] h-[min(62vh,520px)] sm:h-[min(560px,calc(100vh-8rem))] rounded-2xl";

  return (
    <>
      {greeting && !open ? (
        <div
          className="fixed z-[45] left-3 sm:left-6 bottom-[11rem] sm:bottom-[6.5rem] w-[min(340px,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-[#00274c]">Hi — need help choosing a course?</p>
            <button
              type="button"
              onClick={dismissInvite}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c10020]"
              aria-label="Dismiss greeting"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Tell me what you&apos;d like to learn and I&apos;ll suggest suitable SVL Academy courses.
            You can click a course to enroll with me.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "Find a Course", value: "Help me find a course for my goals" },
              { label: "View Fees", value: "Explain the tuition fees and payment options in detail" },
              { label: "Enrollment", value: "How does enrollment work? Please explain the steps." },
              { label: "Ask", action: "open" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-[#00274c] hover:bg-[#00274c] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c10020]"
                onClick={async () => {
                  await openChat();
                  if (item.value) handleSend(item.value);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {panelOpen ? (
        <section
          ref={panelRef}
          aria-labelledby={titleId}
          className={`${panelClass} bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden`}
        >
          <header className="bg-[#00274c] text-white px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white p-1 overflow-hidden shrink-0">
              <AcademyImage
                src={ACADEMY_ASSETS.logo}
                alt=""
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display font-bold text-sm truncate leading-tight">
                {settings.assistantName || "SVL Academy Assistant"}
              </h2>
              <p className="text-[11px] text-white/75 flex items-center gap-1.5 truncate">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden />
                AI Admissions & Course Advisor
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0" role="toolbar" aria-label="Chat window controls">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Start new conversation"
                onClick={async () => {
                  setMessages([]);
                  await ensureBootstrapped(true);
                }}
              >
                <Sparkles size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label={maximized ? "Restore chat size" : "Maximize chat"}
                onClick={() => setMaximized((v) => !v)}
              >
                {maximized ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
              </button>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Minimize chat"
                onClick={() => {
                  setMinimized(true);
                  setMaximized(false);
                }}
              >
                <Minus size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Close chat"
                onClick={closeChat}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          </header>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id || `${m.role}-${m.created_at}-${m.content?.slice(0, 12)}`}
                message={m}
                onAction={handleAction}
                onSelectCourse={handleSelectCourse}
              />
            ))}
            {busy ? (
              <p className="text-xs text-slate-400 px-1" role="status">
                Assistant is typing…
              </p>
            ) : null}
            {error ? (
              <p className="text-xs text-red-600 px-1" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-slate-200 p-3 bg-white flex gap-2 shrink-0"
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
              placeholder={
                awaitingField
                  ? `Enter your ${awaitingField}…`
                  : "Ask about courses, enrollment, fees…"
              }
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#c10020] focus-visible:ring-2 focus-visible:ring-[#c10020]/30"
              disabled={busy}
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c10020] text-white px-3.5 grid place-items-center disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00274c]"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} aria-hidden />
            </button>
          </form>
        </section>
      ) : null}

      {/* Launcher — hidden while chat panel is open to avoid overlap */}
      {!panelOpen ? (
        <button
          type="button"
          onClick={() => {
            if (open && minimized) {
              setMinimized(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            } else openChat();
          }}
          className="fixed z-[45] left-3 sm:left-6 bottom-[7.25rem] sm:bottom-6 inline-flex items-center gap-2 min-h-11 sm:min-h-12 pl-2 pr-3 sm:pl-2.5 sm:pr-3.5 rounded-full bg-[#00274c] text-white text-sm font-bold shadow-lg shadow-[#00274c]/30 hover:bg-[#001a33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c10020]"
          aria-label={open && minimized ? "Restore SVL Academy Assistant" : "Open SVL Academy Assistant"}
          aria-expanded={open && minimized}
          aria-controls={titleId}
        >
          <span className="grid place-items-center h-8 w-8 rounded-full bg-[#c10020]" aria-hidden>
            {open && minimized ? <MessageCircle size={16} /> : <MessageCircle size={16} />}
          </span>
          <span className="pr-0.5">Assistant</span>
        </button>
      ) : null}
    </>
  );
}
