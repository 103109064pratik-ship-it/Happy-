
export interface CoachingInstitute {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviews: number;
  website?: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  ownerName?: string;
  studentCount?: string;
  tuitionCharges?: string;
  coursesOffered?: string[];
  establishedYear?: string;
  batchSize?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  keyword: string;
  city: string;
  pincode?: string;
  leadScore?: number;
}

export interface SearchFilters {
  filtersEnabled: boolean;
  minRating: number;
  minReviews: number;
  maxReviews?: number;
  hasWebsite: boolean;
  maxFee?: number;
  excludeChains: boolean;
}

// Score = (rating * 20) + log10(reviews) * 15 + (hasWebsite * 10)
export function computeLeadScore(inst: CoachingInstitute): number {
  const ratingScore = (inst.rating || 0) * 20;
  const reviewScore = inst.reviews > 0 ? Math.log10(inst.reviews) * 15 : 0;
  const websiteScore = inst.website ? 10 : 0;
  return Math.round(ratingScore + reviewScore + websiteScore);
}

export const EXCLUDE_NAMES = [
  "allen", "aakash", "fiitjee", "resonance", "bansal classes",
  "vidyamandir classes", "vibrant academy", "career point",
  "motion", "narayana", "sri chaitanya", "byju"
];


export interface SearchParams {
  coachingType: string;
  location: string;
  pincode?: string;
  examType?: string;
  filters: SearchFilters;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

export interface LeadData {
  institutes: CoachingInstitute[];
  searchMeta: {
    query: string;
    location: string;
    timestamp: string;
    totalResults: number;
  };
}

export const COACHING_TYPES = [
  "Medical (NEET/AIIMS)",
  "JEE / Engineering",
  "CA / Commerce",
  "UPSC / Civil Services",
  "IELTS / Study Abroad",
  "GATE / PSU",
  "State Board Tuitions",
  "Custom"
] as const;

export const EXAM_TYPE_MAP: Record<string, string[]> = {
  "Medical (NEET/AIIMS)": ["NEET UG", "NEET PG", "AIIMS", "JIPMER", "All Medical"],
  "JEE / Engineering": ["JEE Main", "JEE Advanced", "BITSAT", "MHT-CET", "All Engineering"],
  "CA / Commerce": ["CA Foundation", "CA Intermediate", "CA Final", "CMA", "CS"],
  "UPSC / Civil Services": ["UPSC Prelims", "UPSC Mains", "State PSC", "IAS", "IPS"],
  "IELTS / Study Abroad": ["IELTS", "TOEFL", "GRE", "GMAT", "SAT"],
  "GATE / PSU": ["GATE", "ESE", "PSU Exams"],
  "State Board Tuitions": ["Class 10", "Class 12", "SSC", "HSC"],
  "Custom": []
};
