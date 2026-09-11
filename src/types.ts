export interface Project {
  title: string;
  description: string;
  technologies?: string[];
}

export interface Experience {
  role: string;
  organization: string;
  description: string;
}

export interface StudentProfile {
  skills: string[];
  domains: string[];
  interests: string[];
  projects: Project[];
  experience?: Experience[];
}

export interface SearchQuery {
  query: string;
  focusArea: string;
}

export interface ProfessorProfile {
  name: string;
  institute: string;
  department: string;
  researchInterests: string[];
  email: string;
  facultyPage: string;
  labPage?: string;
  instituteCategory?: 'Newer IIT' | 'Established IIT' | 'IIIT' | 'NIT' | 'Premier Research Inst';
  conversionPotential?: 'Very High' | 'High' | 'Moderate';
  designation?: string;
}

export interface MatchResult {
  professor: ProfessorProfile;
  matchScore: number; // 0 to 100
  reason: string[]; // List of specific bullet points matching the criteria
  confidence: 'High' | 'Medium' | 'Low';
  queryUsed?: string;
  conversionOpportunity?: string;
}
