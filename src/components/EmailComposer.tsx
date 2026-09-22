import React, { useState } from "react";
import { X, Copy, Check, Mail, RefreshCw, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import type { ColdEmailResponse, ProfessorProfile } from "../types";

interface EmailComposerProps {
  draft: ColdEmailResponse;
  professor: ProfessorProfile;
  onClose: () => void;
  onRegenerate: () => void;
}

export default function EmailComposer({ draft, professor, onClose, onRegenerate }: EmailComposerProps) {
  const [copied, setCopied] = useState(false);
  const [body, setBody] = useState(draft.body);
  const [subject, setSubject] = useState(draft.subject);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailto = professor.email
    ? `mailto:${encodeURIComponent(professor.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personalized cold email</h3>
            <p className="text-xs text-slate-500">Drafted for {professor.name} at {professor.institute}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {draft.citedPublications.length > 0 && (
            <div className="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
              <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                Cited publications
              </p>
              <ul className="flex flex-col gap-1">
                {draft.citedPublications.map((pub, idx) => (
                  <li key={idx} className="text-[11px] text-slate-700 leading-snug">
                    • {pub.title}
                    {pub.year && <span className="text-slate-400"> ({pub.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed resize-none"
            />
          </div>

          {draft.alignmentSummary && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700">Alignment summary</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{draft.alignmentSummary}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex flex-wrap justify-end gap-2">
          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy email"}
          </button>
          {mailto && (
            <a
              href={mailto}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              Open in mail app
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
