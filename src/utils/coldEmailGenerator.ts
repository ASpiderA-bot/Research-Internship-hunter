import { ProfessorProfile } from "../types";

export interface ColdEmailConfig {
  studentName?: string;
  studentInstitute?: string;
  studentEmail?: string;
  includeSalutation?: boolean;
}

/**
 * Generates an individualized cold email draft for a specific professor
 * based on the user's exact model mail body:
 * 
 * 1. Base Paragraph (verbatim):
 *    - Summer internship at IIT Ropar with annam.ai ("Krishi Darshan" agricultural video transcription pipeline)
 *    - FLN Assessment & Personalized Worksheet Platform for Classes 2-4
 *    - Poster on Multispectral Wound Diagnostics at Innovación 2026 (IEM Kolkata)
 * 
 * 2. Tailored Alignment Paragraph:
 *    - Varied faculty-to-faculty based on their respective research interests:
 *      "In light of your lab's contributions to [interests], this gave me direct, hands-on experience..."
 * 
 * 3. Closing Call to Action (verbatim):
 *    - Resume attachment, invitation for discussion, and professional sign-off.
 */
export function generateTailoredColdEmail(
  professor: ProfessorProfile,
  matchReasons: string[] = [],
  config: ColdEmailConfig = {}
): {
  subject: string;
  body: string;
  professorIntro: string;
  tailoredVariation: string;
  modelMailBodyOnly: string;
} {
  const studentName = config.studentName || "Arnab Acharya";
  
  // Format salutation cleanly (handling Dr. / Prof. / Professor prefixes)
  let salutationName = professor.name.trim();
  if (salutationName.toLowerCase().startsWith("prof. dr.") || salutationName.toLowerCase().startsWith("dr. prof.")) {
    salutationName = salutationName.replace(/^(prof\.\s*dr\.|dr\.\s*prof\.)\s*/i, "Prof. ");
  } else if (!salutationName.toLowerCase().startsWith("prof.") && !salutationName.toLowerCase().startsWith("dr.")) {
    salutationName = `Prof. ${salutationName}`;
  }
  const salutation = `Dear ${salutationName},`;

  // Primary research interests formatted for natural reading
  const primaryInterests = professor.researchInterests.length > 0 
    ? professor.researchInterests.slice(0, 2).join(" and ")
    : "Artificial Intelligence and Machine Learning";

  const subject = `Research Internship Inquiry: ${professor.researchInterests[0] || "AI & Computing"} – ${studentName}`;

  // Analyze professor's domains to craft the tailored intro and connection
  const allInterestsText = [
    ...professor.researchInterests,
    professor.department,
    professor.institute
  ].join(" ").toLowerCase();

  const isRopar = professor.institute.toLowerCase().includes("ropar");
  const isMedicalOrBio = /medical|wound|health|biomedical|clinical|biology|pathology|healthcare|mri|diagnostics/.test(allInterestsText);
  const isNLPOrSpeech = /nlp|natural language|speech|audio|indic|language|translation|text|llm|linguistics/.test(allInterestsText);
  const isVision = /vision|video|image|multimodal|graphics|camera|visual|perception/.test(allInterestsText);
  const isEdTechOrHCI = /education|edtech|hci|human|interactive|social|learning|accessibility|assistive/.test(allInterestsText);
  const isInformationRetrieval = /retrieval|search|data mining|graph|knowledge|database|information/.test(allInterestsText);
  const isRoboticsOrSystems = /robotics|systems|embedded|iot|autonomous|network|distributed|hardware|parallel|cloud/.test(allInterestsText);
  const isSecurity = /security|crypto|privacy|forensics|side channel/.test(allInterestsText);

  // Department name normalization
  const deptText = professor.department
    ? (professor.department.toLowerCase().startsWith("department of")
        ? professor.department
        : `Department of ${professor.department}`)
    : "Department of Computer Science and Engineering";

  // 1. Professor-Specific Intro
  let professorIntro = "";
  if (isRopar) {
    professorIntro = `I hope this email finds you well. Having worked on-campus at IIT Ropar this past summer with annam.ai, I am writing to express my strong interest in joining your research group in the ${deptText} at IIT Ropar for a research internship. I have been closely following your lab's impactful work in ${primaryInterests}, and I would love the opportunity to contribute to your ongoing initiatives.`;
  } else if (isNLPOrSpeech) {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful contributions to ${primaryInterests}, particularly in language technologies and intelligent systems, and I am very keen to contribute to your group's research.`;
  } else if (isMedicalOrBio) {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful contributions to ${primaryInterests}, particularly in biomedical imaging and computational diagnostics, and I am very keen to contribute to your research group.`;
  } else if (isVision) {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful work in ${primaryInterests}, particularly in visual analytics and multimodal perception, and I am very keen to contribute to your ongoing projects.`;
  } else if (isEdTechOrHCI) {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful work in ${primaryInterests}, particularly in human-centered computing and accessible educational technologies, and I am very keen to contribute to your research initiatives.`;
  } else if (isRoboticsOrSystems) {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful contributions to ${primaryInterests}, particularly in scalable architectures and distributed computing, and I am very keen to contribute to your group.`;
  } else {
    professorIntro = `I hope this email finds you well. I am writing to express my strong interest in exploring research internship opportunities under your guidance in the ${deptText} at ${professor.institute}. I have been closely following your lab's impactful contributions to ${primaryInterests}, and I am very keen to contribute to your group's ongoing research initiatives.`;
  }

  // 2. Synthesize tailored variation connecting the core experience to this specific professor
  let tailoredVariation = "";

  if (isRopar) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests} at IIT Ropar, having completed this summer internship on-campus with annam.ai, I am already deeply familiar with IIT Ropar's research ecosystem and computing facilities; momentum that I am eager to bring directly to your ongoing lab projects.`;
  } else if (isNLPOrSpeech) {
    // Exact model phrasing for NLP / Speech / ML
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, this gave me direct, hands-on experience handling real-world Indic audio datasets, speech-to-text pipeline automation, and structuring outputs for AI models; skills that I am eager to contribute to your ongoing language and speech projects.`;
  } else if (isMedicalOrBio) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, my poster presentation on Multispectral Wound Diagnostics and hands-on experience structuring multi-modal diagnostic data provided me with direct technical grounding in biomedical vision and diagnostics; skills that I am eager to contribute to your ongoing medical imaging and healthcare AI projects.`;
  } else if (isVision) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, my experience processing large volumes of educational video content, working on multispectral diagnostics, and structuring multi-modal pipelines provided me with practical visual data engineering skills; capabilities that I am eager to contribute to your ongoing computer vision and video analysis projects.`;
  } else if (isEdTechOrHCI) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, developing assistive educational narration and AI-assisted curriculum evaluation specifically tailored for the constraints of average Indian classrooms gave me direct experience building human-centered AI tools; skills that I am eager to contribute to your ongoing educational technology and interactive systems projects.`;
  } else if (isInformationRetrieval) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, converting unstructured educational broadcasts into structured, searchable CSV databases and retrieval-ready representations gave me practical exposure to large-scale data ingestion and semantic indexing; skills that I am eager to contribute to your ongoing data mining and information retrieval projects.`;
  } else if (isRoboticsOrSystems) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, architecting end-to-end data processing pipelines and automating evaluation workflows in resource-constrained environments gave me strong systems engineering discipline and pipeline automation experience; skills that I am eager to contribute to your ongoing systems and edge AI projects.`;
  } else if (isSecurity) {
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, managing data integrity across end-to-end processing pipelines and handling sensitive educational evaluation data gave me a strong awareness of secure pipeline engineering and empirical software methods; skills that I am eager to contribute to your ongoing research projects.`;
  } else {
    // Default ML / AI
    tailoredVariation = `In light of your lab's contributions to ${primaryInterests}, this gave me direct, hands-on experience handling real-world datasets, pipeline automation, and structuring outputs for AI models; skills that I am eager to contribute to your ongoing research projects.`;
  }

  // Base paragraphs matching the user's model mail body verbatim
  const paragraph1 = `During my summer internship at IIT Ropar with annam.ai, I contributed to the "Krishi Darshan" agricultural video transcription pipeline, working on the processing of an initial batch of 74 Hindi agricultural videos to generate structured, machine-readable transcripts and CSV outputs that could support AI applications such as content analysis, search, and accessible educational narration. 
I also contributed to an FLN Assessment & Personalized Worksheet Platform, focusing on curriculum-aligned question banks and AI-assisted worksheet generation and evaluation for Classes 2–4, to enable adaptive learning in the average Indian classroom. 
I also presented a poster on Multispectral Wound Diagnostics at Innovación 2026 (It is the annual flagship techno-management festival hosted by the Institute of Engineering and Management (IEM) in Kolkata).`;

  const paragraph2 = tailoredVariation;

  const paragraph3 = `I would welcome the opportunity to contribute to your ongoing research initiatives. I have attached my resume for your convenience to discuss potential research alignment.

Thank you very much for your time and consideration.

Sincerely,
${studentName}`;

  const modelMailBodyOnly = `${professorIntro}

${paragraph1}

${paragraph2}

${paragraph3}`;

  // Complete email including standard salutation, professor intro, model body, tailored connector, and sign-off
  const emailBody = `${salutation}

${professorIntro}

${paragraph1}

${paragraph2}

${paragraph3}`;

  return {
    subject,
    body: emailBody,
    professorIntro,
    tailoredVariation,
    modelMailBodyOnly,
  };
}
