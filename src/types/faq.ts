
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  sourceUrl: string;
  confidence: 'high' | 'medium' | 'low';
  isIncomplete: boolean;
  isDuplicate: boolean;
  extractedAt: string;
}

export interface ExportMetadata {
  extractedFrom: string;
  extractedAt: string;
  totalItems: number;
  crawlDepth: number;
  sourceDomain: string;
}
