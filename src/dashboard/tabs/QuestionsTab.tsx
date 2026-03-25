import React from "react";
import type { Question } from "../types";
import { THEMES, type ThemeKey } from "../themes";
import { makeInputCls } from "../constants";
import { Icon } from "../components/Icon";

interface QuestionsTabProps {
  theme: typeof THEMES[ThemeKey];
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  selectedQuestionId: number | null;
  setSelectedQuestionId: React.Dispatch<React.SetStateAction<number | null>>;
  replyText: string;
  setReplyText: React.Dispatch<React.SetStateAction<string>>;
  questionsFilter: "all" | "unanswered" | "answered";
  setQuestionsFilter: React.Dispatch<React.SetStateAction<"all" | "unanswered" | "answered">>;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({
  theme,
  questions,
  setQuestions,
  selectedQuestionId,
  setSelectedQuestionId,
  replyText,
  setReplyText,
  questionsFilter,
  setQuestionsFilter,
}) => {
  const inputCls = makeInputCls(theme.inputFocus);
  const filtered = questions.filter(q =>
    questionsFilter === "all" ? true : questionsFilter === "unanswered" ? !q.answered : q.answered
  );
  const selected = questions.find(q => q.id === selectedQuestionId) ?? null;
  const unansweredCount = questions.filter(q => !q.answered).length;

  return (
    <div className="px-8 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Community</div>
          <h1 className="text-4xl font-black mb-2">Questions</h1>
          <p className="text-zinc-400 text-lg">
            {unansweredCount > 0 ? (
              <><span className="text-rose-400 font-black">{unansweredCount}</span> unanswered questions</>
            ) : (
              "All questions answered"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {(["unanswered", "all", "answered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setQuestionsFilter(f)}
              className={`px-4 py-2 rounded-xl font-bold text-sm border-2 capitalize transition-all ${
                questionsFilter === f
                  ? `${theme.accentBg} ${theme.accentBorder} ${theme.accent}`
                  : "border-white/5 text-zinc-500 hover:text-white hover:border-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 items-start">

        {/* Question list */}
        <div className="col-span-2 space-y-2">
          {filtered.length === 0 && (
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl py-16 text-center">
              <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 font-bold">No questions here</p>
            </div>
          )}
          {filtered.map((q) => (
            <button
              key={q.id}
              onClick={() => { setSelectedQuestionId(q.id); setReplyText(""); }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedQuestionId === q.id
                  ? `${theme.accentBg} ${theme.accentBorder}`
                  : "bg-zinc-900/60 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-black text-sm text-white">{q.name}</div>
                <div className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                  q.answered ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                }`}>
                  {q.answered ? "Answered" : "Pending"}
                </div>
              </div>
              <p className="text-zinc-400 text-sm leading-snug line-clamp-2">{q.question}</p>
              <div className="text-zinc-600 text-xs mt-2">
                {new Date(q.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </div>
            </button>
          ))}
        </div>

        {/* Detail + reply panel */}
        <div className="col-span-3">
          {!selected ? (
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl py-24 text-center">
              <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500 font-bold">Select a question to reply</p>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-7 py-5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-lg text-white">{selected.name}</div>
                    <div className="text-zinc-500 text-sm">
                      {selected.email} · {new Date(selected.date).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                    selected.answered
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}>
                    {selected.answered ? "Answered" : "Awaiting reply"}
                  </div>
                </div>
              </div>

              {/* Question bubble */}
              <div className="px-7 py-6 border-b border-white/5">
                <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">Question</div>
                <div className="bg-zinc-800/60 rounded-2xl rounded-tl-none px-5 py-4 text-zinc-200 leading-relaxed">
                  {selected.question}
                </div>
              </div>

              {/* Existing answer */}
              {selected.answered && selected.answer && (
                <div className="px-7 py-6 border-b border-white/5">
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">Your Reply</div>
                  <div className={`${theme.accentBg} border ${theme.accentBorder} rounded-2xl rounded-tr-none px-5 py-4 ${theme.accent} leading-relaxed`}>
                    {selected.answer}
                  </div>
                </div>
              )}

              {/* Reply box */}
              <div className="px-7 py-6">
                <div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">
                  {selected.answered ? "Update Reply" : "Write Reply"}
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your reply..."
                  className={inputCls + " resize-none mb-4"}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!replyText.trim()) return;
                      setQuestions(prev => prev.map(q => q.id === selected.id ? { ...q, answered: true, answer: replyText.trim() } : q));
                      setReplyText("");
                    }}
                    disabled={!replyText.trim()}
                    className={`flex-1 py-3 rounded-xl font-black transition-all ${
                      !replyText.trim() ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : `${theme.btn} hover:scale-[1.01]`
                    }`}
                  >
                    {selected.answered ? "Update Reply" : "Send Reply"}
                  </button>
                  {selected.answered && (
                    <button
                      onClick={() => setQuestions(prev => prev.map(q => q.id === selected.id ? { ...q, answered: false, answer: undefined } : q))}
                      className="px-5 py-3 rounded-xl font-black border-2 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      Mark Unanswered
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuestionsTab;
