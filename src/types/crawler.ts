
export interface CrawlResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface ProcessedPage {
  url: string;
  content: string;
  metadata: any;
}
