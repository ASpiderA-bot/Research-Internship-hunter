import React, { useState } from "react";
import { Mail, ExternalLink, Award, Copy, Check, Compass, Landmark, GraduationCap, Zap, ShieldCheck, Send, BookOpen, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { MatchResult, StudentProfile, ColdEmailResponse } from "../types";
import EmailComposer from "./EmailComposer";

interface ProfessorCardProps {
  match: MatchResult;
  studentProfile: StudentProfile;
  studentName?: string;
  studentEmail?: string;
  key?: React.Key;
}

export default function ProfessorCard({ match, studentProfile, studentName = "Arnab Acharya", studentEmail = "arnab.acharya1612@gmail.com" }: ProfessorCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<ColdEmailResponse | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const { professor, matchScore, reason, confidence, conversionOpportunity } = match;

  const handleCopyEmail = () => {
    if (!professor.email) return;
    navigator.clipboard.writeText(professor.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const generateEmail = async () => {
    setLoadingEmail(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor,
          studentProfile,
          matchReasons: reason,
          studentName,
          studentEmail,
          tone: "formal",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate email");
      const data = await res.json();
      setEmailDraft(data);
      setShowEmail(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 70) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const categoryBadge = (() => {
    switch (professor.instituteCategory) {
      case "Newer IIT":
        return { label: "Newer IIT", className: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <Zap className="w-3 h-3" /> };
      case "IIIT":
        return { label: "IIIT", className: "bg-blue-50 text-blue-800 border-blue-200", icon: <Compass className="w-3 h-3" /> };
      case "NIT":
        return { label: "NIT", className: "bg-purple-50 text-purple-800 border-purple-200", icon: <Landmark className="w-3 h-3" /> };
      case "Established IIT":
        return { label: "Established IIT", className: "bg-slate-100 text-slate-800 border-slate-200", icon: <GraduationCap className="w-3 h-3" /> };
      default:
        return { label: "Premier Research", className: "bg-indigo-50 text-indigo-800 border-indigo-200", icon: <Landmark className="w-3 h-3" /> };
    }
  })();

  const verified = professor.verificationConfidence === "High" || professor.verificationConfidence === "Medium";

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColor(matchScore)}`}>
                <Award className="w-3.5 h-3.5" />
                {matchScore}% match
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  confidence === "High" ? "bg-emerald-100 text-emerald-800" : confidence === "Medium" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"
                }`}
              >
                {confidence} confidence
              </span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${categoryBadge.className}`}>
              {categoryBadge.icon}
              {categoryBadge.label}
            </span>
          </div>

          <div className="mb-3">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              {professor.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
              {professor.designation && <span>{professor.designation},</span>}
              <span>{professor.department}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">{professor.institute}</span>
            </div>
          </div>

          <div className={`mb-3 rounded-xl p-3 flex items-start gap-2 border ${verified ? "bg-emerald-50/60 border-emerald-200/80" : "bg-amber-50/60 border-amber-200/80"}`}>
            {verified ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-[11px] font-bold text-slate-900">
                {verified ? "Verified via secondary search" : "Verification limited"}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {professor.verificationSources && professor.verificationSources.length > 0
                  ? `Cross-checked against ${professor.verificationSources.length} source(s).`
                  : "No external verification sources available."}
              </p>
            </div>
          </div>

          {conversionOpportunity && (
            <div className="mb-3 bg-amber-50/50 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-amber-900">Outreach opportunity</p>
                <p className="text-xs text-amber-800 mt-0.5 leading-snug">{conversionOpportunity}</p>
              </div>
            </div>
          )}

          <div className="mb-4 bg-indigo-50/30 border border-indigo-100 rounded-xl p-4">
            <h5 className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Why this professor matches
            </h5>
            <ul className="flex flex-col gap-1.5">
              {reason.map((line, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                  <span className="text-indigo-500 mt-1 select-none">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h5 className="text-[10px] font-bold text-slate-400 mb-2">Verified research areas</h5>
            <div className="flex flex-wrap gap-1">
              {professor.researchInterests.map((interest) => (
                <span key={interest} className="text-[10px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-150 transition-colors">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {professor.publications && professor.publications.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Recent publications
              </h5>
              <ul className="flex flex-col gap-1">
                {professor.publications.map((pub, idx) => (
                  <li key={idx} className="text-[11px] text-slate-600 leading-snug">
                    • {pub.title}
                    {pub.year && <span className="text-slate-400"> ({pub.year})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
          {professor.email ? (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 max-w-[220px]">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-xs font-mono text-slate-600 truncate select-all">{professor.email}</span>
              <button onClick={handleCopyEmail} className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No public email found</span>
          )}

          <div className="flex items-center gap-2">
            <a href={professor.facultyPage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Faculty page
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {professor.labPage && (
              <a href={professor.labPage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-2">
                Lab
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={generateEmail}
              disabled={loadingEmail}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {loadingEmail ? "Drafting..." : "Draft email"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEmail && emailDraft && (
          <EmailComposer
            draft={emailDraft}
            professor={professor}
            onClose={() => setShowEmail(false)}
            onRegenerate={generateEmail}
          />
        )}
      </AnimatePresence>
    </>
  );
}
