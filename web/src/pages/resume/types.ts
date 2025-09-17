
export interface OptimizationResult {
  totalChanges: number;
  sectionsImproved: string[];
  improvementPercentage: number;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  duration: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  duration: string;
  description: string;
  technologies: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}