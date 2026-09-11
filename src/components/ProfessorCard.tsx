import React, { useState } from "react";
import { 
  Mail, 
  ExternalLink, 
  Award, 
  Copy, 
  Check, 
  Compass, 
  Landmark, 
  GraduationCap, 
  Zap, 
  Sparkles, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  RotateCcw 
} from "lucide-react";
import { MatchResult, StudentProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { generateTailoredColdEmail } from "../utils/coldEmailGenerator";

interface ProfessorCardProps {
  match: MatchResult;
  studentProfile?: StudentProfile | null;
  key?: string;
}

export default function ProfessorCard({ match, studentProfile }: ProfessorCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const { professor, matchScore, reason, confidence, conversionOpportunity } = match;

  // Generate tailored cold email draft for this professor with the IIT Ropar experience
  const defaultDraftObj = generateTailoredColdEmail(professor, reason, {
    studentName: "Arnab Acharya",
    studentInstitute: "Undergraduate Researcher",
    studentEmail: "arnab.acharya1612@gmail.com",
  });

  const [customDraft, setCustomDraft] = useState<string>(defaultDraftObj.body);
  const [subjectLine, setSubjectLine] = useState<string>(defaultDraftObj.subject);

  const handleResetDraft = () => {
    setCustomDraft(defaultDraftObj.body);
    setSubjectLine(defaultDraftObj.subject);
    setIsEditingDraft(false);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!professor.email) return;
    navigator.clipboard.writeText(professor.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subjectLine);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(`Subject: ${subjectLine}\n\n${customDraft}`);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const mailtoLink = professor.email
    ? `mailto:${encodeURIComponent(professor.email)}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(customDraft)}`
    : null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (score >= 70) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "Newer IIT":
        return {
          label: "Newer IIT (High Conversion)",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <Zap className="w-3 h-3 text-emerald-600" />
        };
      case "IIIT":
        return {
          label: "IIIT (Research Focus)",
          className: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Sparkles className="w-3 h-3 text-blue-600" />
        };
      case "NIT":
        return {
          label: "NIT System",
          className: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <Landmark className="w-3 h-3 text-purple-600" />
        };
      case "Established IIT":
        return {
          label: "Established IIT",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <GraduationCap className="w-3 h-3 text-gray-600" />
        };
      default:
        return {
          label: "Premier Research Inst",
          className: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <Landmark className="w-3 h-3 text-indigo-600" />
        };
    }
  };

  const categoryInfo = getCategoryBadge(professor.instituteCategory);

  return (
    <div
      id={`professor-card-${professor.name.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Header: Score and Category */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColor(matchScore)}`}>
              <Award className="w-3.5 h-3.5" />
              {matchScore}% Match
            </span>
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              confidence === 'High' ? 'bg-emerald-100 text-emerald-800' :
              confidence === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {confidence} Confidence
            </span>
          </div>
          
          {/* Institute Category Tag */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${categoryInfo.className}`}>
            {categoryInfo.icon}
            {categoryInfo.label}
          </span>
        </div>

        {/* Professor Meta */}
        <div className="mb-3">
          <h4 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
            <GraduationCap className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {professor.name}
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-gray-500 font-medium">
            {professor.designation && <span>{professor.designation},</span>}
            <span>{professor.department}</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-gray-700">{professor.institute}</span>
          </div>
        </div>

        {/* Conversion Opportunity Insight */}
        {conversionOpportunity && (
          <div className="mb-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Outreach & Conversion Opportunity</p>
              <p className="text-xs text-amber-800 mt-0.5 leading-snug">{conversionOpportunity}</p>
            </div>
          </div>
        )}

        {/* Match Explanation ('Why this matches') */}
        <div className="mb-4 bg-emerald-50/15 border border-emerald-100/80 rounded-xl p-4">
          <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            Why this professor matches
          </h5>
          <ul className="flex flex-col gap-1.5">
            {reason.map((resLine, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 mt-1 select-none">•</span>
                <span>{resLine}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Research Interests Tags */}
        <div className="mb-4">
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Research Areas</h5>
          <div className="flex flex-wrap gap-1">
            {professor.researchInterests.map((interest) => (
              <span
                key={interest}
                className="text-[10px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded border border-gray-150 transition-colors"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Email Draft Accordion */}
        <div className="mb-4">
          <button
            onClick={() => setShowEmailDraft(!showEmailDraft)}
            className="w-full flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/60 border border-emerald-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              {showEmailDraft ? "Hide Personalized Cold Email Draft" : "View Personalized Cold Email Draft"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                IIT Ropar Experience Tailored
              </span>
              {showEmailDraft ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          <AnimatePresence>
            {showEmailDraft && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2.5">
                  {/* Tailored Experience Callout */}
                  <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-2.5 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-emerald-900 leading-snug">
                      <span className="font-bold">Personalized Structure: </span>
                      Includes a professor-specific opening for <span className="font-semibold">{professor.name}</span> ({professor.institute}), followed by your <span className="font-semibold">IIT Ropar & annam.ai</span> experience ("Krishi Darshan" + FLN platform), <span className="font-semibold">Innovación 2026</span> poster, and a tailored research connector.
                    </div>
                  </div>

                  {/* Header & Controls */}
                  <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-1.5 max-w-[280px] sm:max-w-xs">
                      <span className="font-bold text-gray-500 font-mono text-[11px]">Subject:</span>
                      <span className="font-medium text-gray-700 font-mono text-[11px] truncate" title={subjectLine}>
                        {subjectLine}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopySubject}
                        className="px-2 py-1 bg-white border border-gray-200 hover:border-emerald-500 text-gray-600 hover:text-emerald-700 text-[10px] font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                        title="Copy Subject Line"
                      >
                        {copiedSubject ? "Copied Subject!" : "Copy Subject"}
                      </button>

                      <button
                        onClick={() => setIsEditingDraft(!isEditingDraft)}
                        className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] font-semibold rounded-md shadow-2xs transition-all cursor-pointer ${
                          isEditingDraft 
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                            : "bg-white border-gray-200 text-gray-600 hover:text-emerald-700"
                        }`}
                        title="Edit draft text inline"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        {isEditingDraft ? "Done Editing" : "Edit"}
                      </button>

                      {isEditingDraft && (
                        <button
                          onClick={handleResetDraft}
                          className="inline-flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-200 hover:border-rose-300 text-gray-500 hover:text-rose-600 text-[10px] font-medium rounded-md cursor-pointer"
                          title="Reset to default generated text"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      )}

                      <button
                        onClick={handleCopyDraft}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition-all cursor-pointer"
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="w-3 h-3 text-white" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-white" /> Copy Full Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Editor / Viewer */}
                  {isEditingDraft ? (
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Subject</label>
                        <input
                          type="text"
                          value={subjectLine}
                          onChange={(e) => setSubjectLine(e.target.value)}
                          className="w-full text-xs font-mono border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Body</label>
                        <textarea
                          rows={10}
                          value={customDraft}
                          onChange={(e) => setCustomDraft(e.target.value)}
                          className="w-full text-xs font-sans border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed max-h-56 overflow-y-auto bg-white p-3 rounded-lg border border-gray-150">
                      {customDraft}
                    </pre>
                  )}

                  {/* Quick Mailto Link */}
                  {mailtoLink && (
                    <div className="pt-1 flex justify-end">
                      <a
                        href={mailtoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <Mail className="w-3 h-3 text-emerald-600" />
                        Open prefilled in default email app &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action / Contact Footer */}
      <div className="pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
        {/* Email */}
        {professor.email ? (
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 max-w-[190px] sm:max-w-[220px]">
            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-600 truncate select-all">{professor.email}</span>
            <button
              onClick={handleCopyEmail}
              className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-white transition-all cursor-pointer"
              title="Copy Email"
            >
              {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No public email found</span>
        )}

        {/* Web Links */}
        <div className="flex gap-2">
          <a
            href={professor.facultyPage}
            target="_blank"
            referrerPolicy="no-referrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
          >
            Faculty Page
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {professor.labPage && (
            <a
              href={professor.labPage}
              target="_blank"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-emerald-600 transition-colors border-l border-gray-200 pl-2"
            >
              Lab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
