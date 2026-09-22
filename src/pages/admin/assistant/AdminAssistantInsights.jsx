import { useState } from "react";
import { getAdminToken } from "../../../utils/adminApi";

async function adminAsk(question) {
  const res = await fetch("/api/academy/assistant-admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ action: "ask", question }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Query failed");
  return data;
}

export default function AdminAssistantInsights() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (q) => {
    setBusy(true);
    setError("");
    try {
      const data = await adminAsk(q);
      setAnswer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">
          Ask Academy Assistant about Academy activity
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Answers are calculated from database records — never invented.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "How many chatbot-assisted enrollments were submitted today?",
          "How many conversations happened this week?",
          "How many admission letters were generated?",
          "What questions could the assistant not answer?",
          "Which courses were most recommended?",
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setQuestion(q);
              ask(q);
            }}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#00274c] hover:bg-[#00274c] hover:text-white"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Ask a data question…"
        />
        <button type="submit" className="btn-primary" disabled={busy || !question.trim()}>
          {busy ? "Querying…" : "Ask"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {answer ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Answer</p>
          <p className="mt-2 text-lg font-semibold text-[#00274c] whitespace-pre-wrap">{answer.answer}</p>
          {answer.count !== undefined ? (
            <p className="mt-3 text-3xl font-display font-bold text-[#c10020]">{answer.count}</p>
          ) : null}
          {answer.range ? <p className="mt-1 text-xs text-slate-500">Range: {answer.range}</p> : null}
          {Array.isArray(answer.rows) && answer.rows.length ? (
            <ul className="mt-4 space-y-1 text-sm text-slate-600">
              {answer.rows.slice(0, 15).map((row, i) => (
                <li key={i}>{typeof row === "string" ? row : JSON.stringify(row)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
