import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Clipboard, ArrowRight, Sparkles, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SAMPLE_RESUMES } from "../utils/sampleResumes";
import type { StudentProfile } from "../types";

interface ResumeUploaderProps {
  onProfileParsed: (profile: StudentProfile) => void;
  onLoadingStateChange: (loading: boolean, stage: string) => void;
}

export default function ResumeUploader({ onProfileParsed, onLoadingStateChange }: ResumeUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setExtractionSuccess(null);
    if (e.dataTransfer.files.length > 0) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setExtractionSuccess(null);
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const loadPdfJS = (): Promise<any> => {
    if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF extraction library."));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const validateAndSetFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF resumes are supported. Use the text tab for other formats.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Please upload a PDF under 10MB.");
      return;
    }
    setSelectedFile(file);
    setIsExtracting(true);
    setError(null);
    setExtractionSuccess(null);
    try {
      const extracted = await extractTextFromPdf(file);
      if (!extracted.trim()) throw new Error("No readable text found. The PDF may be scanned.");
      setPastedText(extracted);
      setExtractionSuccess(`Extracted text from "${file.name}".`);
      setActiveTab("paste");
    } catch (err: any) {
      setError(err.message || "Failed to parse PDF.");
      setSelectedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    onLoadingStateChange(true, "Analyzing resume & extracting skills...");
    try {
      let textToSubmit = pastedText;
      if (activeTab === "file") {
        if (!textToSubmit.trim() && selectedFile) {
          textToSubmit = await extractTextFromPdf(selectedFile);
          setPastedText(textToSubmit);
        } else if (!textToSubmit.trim()) {
          setError("Please select a PDF file first.");
          onLoadingStateChange(false, "");
          return;
        }
      } else if (!textToSubmit.trim()) {
        setError("Please paste your resume text first.");
        onLoadingStateChange(false, "");
        return;
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: textToSubmit }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to analyze resume.");
      }
      const profile = await res.json();
      onProfileParsed(profile);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      onLoadingStateChange(false, "");
    }
  };

  const loadSample = (key: "ml" | "web") => {
    setPastedText(SAMPLE_RESUMES[key].text);
    setActiveTab("paste");
    setError(null);
    setExtractionSuccess(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-4 border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5" />
          ResearchMatch v2
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Find professors whose work actually matches yours
        </h2>
        <p className="mt-3 text-slate-500 text-base max-w-lg mx-auto">
          Upload your resume or paste its contents. We verify every professor with a secondary search and cite real publications in your cold emails.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex border-b border-slate-100 mb-6">
          <button
            onClick={() => setActiveTab("file")}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === "file" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4" />
              Upload PDF Resume
            </span>
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === "paste" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Clipboard className="w-4 h-4" />
              Copy-Paste Text
            </span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "file" ? (
            <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isExtracting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isExtracting
                    ? "border-indigo-300 bg-indigo-50/30"
                    : isDragOver
                    ? "border-indigo-500 bg-indigo-50/50"
                    : selectedFile
                    ? "border-indigo-200 bg-indigo-50/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" disabled={isExtracting} />
                {isExtracting ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-semibold text-slate-800">Extracting resume text locally...</p>
                    <p className="text-xs text-slate-400 mt-1">Parsed in your browser with PDF.js.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-4 ${selectedFile ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"}`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setExtractionSuccess(null);
                          }}
                          className="mt-3 text-xs font-semibold text-rose-500 hover:text-rose-600"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Drag & drop your PDF resume, or <span className="text-indigo-600">browse</span></p>
                        <p className="text-xs text-slate-400 mt-1.5">PDFs up to 10MB</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="paste" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {extractionSuccess && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                  <div className="p-1 bg-indigo-600 text-white rounded-full flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-indigo-700">{extractionSuccess}</p>
                </div>
              )}
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your full resume here..."
                className="w-full h-64 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={activeTab === "file" ? !selectedFile : !pastedText.trim()}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-600/10"
        >
          Analyze Resume
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 mb-3">Or try a sample resume:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => loadSample("ml")}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/30 hover:bg-indigo-50/10 text-left transition-all"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{SAMPLE_RESUMES.ml.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PyTorch, NLP, Speech, Medical imaging</p>
              </div>
            </button>
            <button
              onClick={() => loadSample("web")}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/30 hover:bg-indigo-50/10 text-left transition-all"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{SAMPLE_RESUMES.web.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">React, WebSockets, HCI, Accessibility</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
