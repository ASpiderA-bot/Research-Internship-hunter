import React from "react";
import { Calendar, Trophy, Globe, Zap, ExternalLink, Code } from "lucide-react";
import type { Hackathon, StudentProfile } from "../types";

interface HackathonCardProps {
  hackathon: Hackathon;
  studentProfile: StudentProfile;
  key?: React.Key;
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <h4 className="text-base font-bold text-slate-900">{hackathon.name}</h4>
        <div className="flex items-center gap-1.5">
          {hackathon.vibeCodingFriendly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <Zap className="w-3 h-3" />
              Vibe coding
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            hackathon.mode === "online" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"
          }`}>
            <Globe className="w-3 h-3" />
            {hackathon.mode}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-3">{hackathon.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs text-slate-600">
        {hackathon.organizer && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-400">Organizer:</span>
            {hackathon.organizer}
          </div>
        )}
        {hackathon.startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {hackathon.startDate}
            {hackathon.endDate && ` → ${hackathon.endDate}`}
          </div>
        )}
        {hackathon.prize && (
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            {hackathon.prize}
          </div>
        )}
        {hackathon.theme && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-400">Theme:</span>
            {hackathon.theme}
          </div>
        )}
      </div>

      {hackathon.techStack && hackathon.techStack.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {hackathon.techStack.map((tech) => (
              <span key={tech} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Code className="w-3.5 h-3.5" />
          Relevance score: <span className="font-bold text-indigo-600">{hackathon.relevanceScore}</span>
        </div>
        {hackathon.registrationUrl ? (
          <a
            href={hackathon.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Register
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <a
            href={hackathon.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Source
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
