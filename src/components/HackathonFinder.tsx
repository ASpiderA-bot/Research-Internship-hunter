import React, { useState } from "react";
import { Sparkles, Search, Loader2, Monitor, Zap, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Hackathon, StudentProfile } from "../types";
import HackathonCard from "./HackathonCard";

interface HackathonFinderProps {
  studentProfile: StudentProfile;
}

export default function HackathonFinder({ studentProfile }: HackathonFinderProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requireOnline, setRequireOnline] = useState(true);
  const [requireVibeCoding, setRequireVibeCoding] = useState(true);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHackathons([]);
    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfile,
          requireOnline,
          requireVibeCoding,
          maxResults: 12,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to find hackathons");
      }
      const data = await res.json();
      setHackathons(data.hackathons || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 mb-3 border border-amber-100">
            <Sparkles className="w-3.5 h-3.5" />
            Vibe-coding friendly
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hackathon match finder</h2>
          <p className="mt-2 text-slate-500 text-sm max-w-lg mx-auto">
            Discover online hackathons that welcome AI-assisted, no-code, or rapid-prototyping approaches and match your skills.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${requireOnline ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <Monitor className="w-4 h-4" />
            <span className="text-xs font-semibold">Online / hybrid</span>
            <input type="checkbox" className="hidden" checked={requireOnline} onChange={(e) => setRequireOnline(e.target.checked)} />
            {requireOnline && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 rounded">ON</span>}
          </label>

          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${requireVibeCoding ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold">Vibe-coding allowed</span>
            <input type="checkbox" className="hidden" checked={requireVibeCoding} onChange={(e) => setRequireVibeCoding(e.target.checked)} />
            {requireVibeCoding && <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded">ON</span>}
          </label>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Searching hackathons..." : "Find hackathons"}
        </button>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}
      </div>

      <AnimatePresence>
        {hackathons.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                Found {hackathons.length} hackathons
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hackathons.map((hack) => (
                <HackathonCard key={hack.id} hackathon={hack} studentProfile={studentProfile} />
              ))}
            </div>
          </motion.div>
        )}

        {!loading && hackathons.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500">Click "Find hackathons" to discover events matching your profile.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
