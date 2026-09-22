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

export interface VerifiedPublication {
  title: string;
  year?: string;
  venue?: string;
  url?: string;
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
  verificationConfidence?: 'High' | 'Medium' | 'Low';
  verificationSources?: string[];
  publications?: VerifiedPublication[];
}

export interface MatchResult {
  professor: ProfessorProfile;
  matchScore: number;
  reason: string[];
  confidence: 'High' | 'Medium' | 'Low';
  queryUsed?: string;
  conversionOpportunity?: string;
}

export interface SearchResponse {
  searchQueries: SearchQuery[];
  scrapedCount: number;
  results: MatchResult[];
  targetInstitutes: string[];
  rejectedCount: number;
  verificationNotes?: string;
}

export interface ColdEmailRequest {
  professor: ProfessorProfile;
  studentProfile: StudentProfile;
  matchReasons: string[];
  studentName?: string;
  studentEmail?: string;
  studentInstitute?: string;
  tone?: 'formal' | 'warm' | 'concise';
}

export interface ColdEmailResponse {
  subject: string;
  body: string;
  citedPublications: VerifiedPublication[];
  alignmentSummary: string;
}

export interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  startDate?: string;
  endDate?: string;
  mode: 'online' | 'hybrid' | 'in-person';
  registrationUrl?: string;
  prize?: string;
  theme?: string;
  techStack?: string[];
  vibeCodingFriendly: boolean;
  description: string;
  sourceUrl: string;
  relevanceScore: number;
}

export interface HackathonSearchRequest {
  studentProfile: StudentProfile;
  requireOnline: boolean;
  requireVibeCoding: boolean;
  maxResults?: number;
}
