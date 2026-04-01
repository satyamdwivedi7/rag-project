export type Citation = {
  excerpt: string;
  relevance: string;
};

export type DocumentBrief = {
  summary: string;
  topics: string[];
  questions: string[];
};

export type Message = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  citations?: Citation[];
};
