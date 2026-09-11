import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Clipboard, ArrowRight, Sparkles, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ResumeUploaderProps {
  onProfileParsed: (profile: any) => void;
  onLoadingStateChange: (loading: boolean, stage: string) => void;
}

const SAMPLE_RESUMES = {
  ml: {
    title: "AI & Machine Learning Student (Arnab Acharya)",
    text: `ARNAB ACHARYA
Email: arnab.acharya1612@gmail.com
Github: github.com/arnab-ai

TECHNICAL SKILLS:
- Languages: Python, C++, SQL, Bash
- Frameworks: PyTorch, TensorFlow, Scikit-Learn, Hugging Face Transformers, OpenCV, Pandas
- Tools: Docker, Git, Linux, Jupyter, Pipeline Engineering

RESEARCH & INTERNSHIP EXPERIENCE:
- Summer Research Intern | annam.ai @ IIT Ropar
  Contributed to the "Krishi Darshan" agricultural video transcription pipeline, working on the processing of an initial batch of 74 Hindi agricultural videos to generate structured, machine-readable transcripts and CSV outputs that could support AI applications such as content analysis, search, and accessible educational narration.
  Contributed to an FLN Assessment & Personalized Worksheet Platform, focusing on curriculum-aligned question banks and AI-assisted worksheet generation and evaluation for Classes 2–4, to enable adaptive learning in the average Indian classroom.
- Poster Presentation | Innovación 2026 (IEM Kolkata)
  Presented research poster on "Multispectral Wound Diagnostics" at Innovación 2026, the annual flagship techno-management festival hosted by the Institute of Engineering and Management (IEM) in Kolkata. Demonstrated spectral signature classification for non-invasive tissue analysis.

ACADEMIC PROJECTS:
1. Low-Resource Machine Translation & Speech Processing for Indian Languages
   - Fine-tuned transformer models on multilingual Indian corpora.
   - Researched tokenization strategies and data pipelines to improve translation and semantic indexing.
   
2. Medical Image Segmentation for Brain Tumor Detection
   - Designed a deep 3D U-Net architecture in PyTorch to segment tumors from MRI scans with attention gates.

RESEARCH INTERESTS:
- Natural Language Processing, Speech Recognition, Multimodal Deep Learning, Educational AI, Computer Vision.`
  },
  web: {
    title: "Web Systems & HCI Developer",
    text: `PRIYA SHARMA
Email: priya@example.com
Portfolio: priya-dev.in

TECHNICAL SKILLS:
- Languages: JavaScript, TypeScript, Python, HTML/CSS
- Frameworks: React, Node.js, Express, Tailwind CSS, Next.js, WebSockets
- Databases: PostgreSQL, MongoDB, Redis

ACADEMIC PROJECTS:
1. Collaborative Education Canvas (EdTech)
   - Built a real-time multiplayer virtual whiteboard using WebSockets, React, and Canvas API.
   - Implemented state-synchronization with operational transformation to allow up to 50 active students.

2. AccessFlow - Accessibility Auditor for Websites
   - Developed a Chromium extension to audit web pages for WCAG 2.1 compliance.
   - Created an automated alt-text generator for blind users using lightweight Vision-Language Models.

RESEARCH INTERESTS:
- Human-Computer Interaction (HCI), Educational Technology, Collaborative Platforms, Web Accessibility.`
}
};

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

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setExtractionSuccess(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setExtractionSuccess(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const loadPdfJS = (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return Promise.resolve((window as any).pdfjsLib);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = () => {
        reject(new Error("Failed to load PDF extraction library from CDN. Please make sure you are online, or copy-paste your resume text manually."));
      };
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const validateAndSetFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF resumes are supported. For other formats, please use the text copy-paste tab.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File is too large. Please upload a PDF under 10MB.");
      return;
    }
    
    setSelectedFile(file);
    setIsExtracting(true);
    setError(null);
    setExtractionSuccess(null);

    try {
      const extractedText = await extractTextFromPdf(file);
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("We couldn't extract any readable text from this PDF. It might be scanned/an image. Please paste the resume contents manually in the text tab.");
      }
      setPastedText(extractedText);
      setExtractionSuccess(`Successfully extracted text from "${file.name}"! You can review or edit it below.`);
      setActiveTab("paste");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse PDF file. Please paste your resume text manually in the text tab.");
      setSelectedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Strip out the data:application/pdf;base64, header
        const base64 = resultStr.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    setError(null);
    onLoadingStateChange(true, "Analyzing resume & extracting skills...");

    try {
      let payload: any = {};
      let textToSubmit = pastedText;

      if (activeTab === "file") {
        if (!textToSubmit.trim() && selectedFile) {
          try {
            textToSubmit = await extractTextFromPdf(selectedFile);
            setPastedText(textToSubmit);
          } catch (err: any) {
            setError("We had trouble reading this PDF file locally. Please copy and paste its text in the 'Copy-Paste Text' tab instead.");
            onLoadingStateChange(false, "");
            return;
          }
        } else if (!textToSubmit.trim()) {
          setError("Please select a PDF file first.");
          onLoadingStateChange(false, "");
          return;
        }
      } else {
        if (!textToSubmit.trim()) {
          setError("Please paste your resume text first.");
          onLoadingStateChange(false, "");
          return;
        }
      }

      payload = { textContent: textToSubmit };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze resume.");
      }

      const profile = await res.json();
      onProfileParsed(profile);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while parsing.");
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
    <div id="resume-uploader-container" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Zero API-Key Setup for Discovery
        </span>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">
          Discover Aligning Research Professors
        </h2>
        <p className="mt-2 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
          Upload your resume or paste its contents. Gemini will extract your profile and crawl DuckDuckGo to match you with faculty.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6">
        <button
          id="tab-file-upload"
          onClick={() => setActiveTab("file")}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
            activeTab === "file"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload PDF Resume
          </span>
        </button>
        <button
          id="tab-text-paste"
          onClick={() => setActiveTab("paste")}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
            activeTab === "paste"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Clipboard className="w-4 h-4" />
            Copy-Paste Text
          </span>
        </button>
      </div>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {activeTab === "file" ? (
          <motion.div
            key="file-uploader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div
              id="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isExtracting
                  ? "border-emerald-300 bg-emerald-50/5 cursor-wait"
                  : isDragOver
                  ? "border-emerald-500 bg-emerald-50/50 cursor-pointer"
                  : selectedFile
                  ? "border-emerald-200 bg-emerald-50/10 cursor-pointer"
                  : "border-gray-200 hover:border-gray-300 cursor-pointer"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
                disabled={isExtracting}
              />
              <div className="flex flex-col items-center">
                {isExtracting ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <p className="text-sm font-bold text-gray-800">Extracting resume text locally...</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      This PDF is parsed 100% in your browser using PDF.js. No credentials or server calls needed for this step.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`p-4 rounded-full mb-4 ${selectedFile ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Resume</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setExtractionSuccess(null);
                          }}
                          className="mt-3 text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Drag & drop your PDF resume here, or <span className="text-emerald-600 hover:underline">browse</span></p>
                        <p className="text-xs text-gray-400 mt-1.5">Supports academic / professional PDFs up to 10MB</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text-paster"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {extractionSuccess && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <div className="p-1 bg-emerald-600 text-white rounded-full flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Local PDF Extraction Success!</h4>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">{extractionSuccess}</p>
                </div>
              </div>
            )}
            <textarea
              id="resume-text-input"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your full resume here (skills, education, projects, etc.)..."
              className="w-full h-64 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div id="error-message" className="mt-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6">
        <button
          id="btn-parse-resume"
          onClick={handleSubmit}
          disabled={activeTab === "file" ? !selectedFile : !pastedText.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm shadow-emerald-600/10"
        >
          Analyze Resume with Gemini
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sample Resumes */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Or try a sample student resume instantly:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="btn-sample-ml"
            onClick={() => loadSample("ml")}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/30 hover:bg-emerald-50/5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{SAMPLE_RESUMES.ml.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PyTorch, MRI segmentation, NLP multilingual</p>
            </div>
          </button>
          <button
            id="btn-sample-web"
            onClick={() => loadSample("web")}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/30 hover:bg-emerald-50/5 text-left transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{SAMPLE_RESUMES.web.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">React, WebSockets, HCI, Accessibility auditor</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
