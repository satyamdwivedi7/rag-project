export type Citation = {
  excerpt: string;
  relevance: string;
};

export type DocumentBrief = {
  summary: string;
  topics: string[];
  questions: string[];
};

export type UploadedDoc = {
  fileUri: string;
  fileName: string;
  brief: DocumentBrief | null;
};

export type DocComparison = {
  sharedThemes: string[];
  conflicts: string[];
  uniqueInsights: {
    fileName: string;
    insight: string;
  }[];
  synthesis: string;
};

export type Message = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  citations?: Citation[];
  comparison?: DocComparison;
};
