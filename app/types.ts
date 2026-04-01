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
  role: string;
  text: string;
  citations?: Citation[];
};
