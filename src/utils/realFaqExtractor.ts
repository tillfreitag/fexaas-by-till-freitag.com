import type { FAQItem } from "@/types/faq";

interface CrawledContent {
  url: string;
  content: string;
  metadata?: any;
}

export class RealFAQExtractor {
  static extractFAQsFromContent(crawledData: CrawledContent[]): FAQItem[] {
    const faqs: FAQItem[] = [];
    
    for (const data of crawledData) {
      const extractedFAQs = this.parseContentForFAQs(data.content, data.url);
      faqs.push(...extractedFAQs);
    }

    // Remove duplicates and enhance with metadata
    return this.postProcessFAQs(faqs);
  }

  private static parseContentForFAQs(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    
    console.log('Parsing content length:', content.length);
    console.log('Sample content:', content.substring(0, 500));
    
    // Clean the content first
    const cleanedContent = this.cleanContent(content);
    
    // Method 1: HTML Structure-based extraction (details/summary, accordions)
    faqs.push(...this.extractFromHtmlStructures(cleanedContent, sourceUrl));
    
    // Method 2: Content proximity analysis
    faqs.push(...this.extractByProximityAnalysis(cleanedContent, sourceUrl));
    
    // Method 3: Semantic pattern recognition
    faqs.push(...this.extractBySemanticPatterns(cleanedContent, sourceUrl));

    console.log(`Extracted ${faqs.length} FAQs from content`);
    return faqs;
  }

  private static cleanContent(content: string): string {
    // Remove common website elements and noise
    let cleaned = content
      // Remove navigation elements
      .replace(/\n\s*(Home|About|Contact|Privacy|Terms|Login|Sign up|Menu|Search)\s*\n/gi, '\n')
      // Remove common footer content
      .replace(/\n\s*(Copyright|©|All rights reserved|Follow us|Subscribe).*\n/gi, '\n')
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove markdown artifacts
      .replace(/^\s*[#*-]\s*/gm, '')
      .trim();

    return cleaned;
  }

  private static extractFromHtmlStructures(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];

    // Look for details/summary patterns (common in modern FAQs)
    const detailsPattern = /<details[^>]*>[\s\S]*?<summary[^>]*>(.*?)<\/summary>[\s\S]*?<\/details>/gi;
    let match;
    while ((match = detailsPattern.exec(content)) !== null) {
      const question = this.cleanText(match[1]);
      const fullMatch = match[0];
      const answer = this.extractAnswerFromDetails(fullMatch);
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    // Look for accordion-style patterns
    const accordionPattern = /class=['""][^'"]*accordion[^'"]*['"][^>]*>([\s\S]*?)<\/[^>]+>/gi;
    while ((match = accordionPattern.exec(content)) !== null) {
      const accordionContent = match[1];
      faqs.push(...this.extractFromAccordionContent(accordionContent, sourceUrl));
    }

    return faqs;
  }

  private static extractByProximityAnalysis(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i];
      
      // Look for questions (lines ending with ?)
      if (this.looksLikeQuestion(currentLine)) {
        // Look for the answer in the next few lines
        const answer = this.findAnswerAfterQuestion(lines, i + 1);
        
        if (answer && this.isValidFAQ(currentLine, answer)) {
          faqs.push(this.createFAQItem(currentLine, answer, sourceUrl));
        }
      }
    }

    return faqs;
  }

  private static extractBySemanticPatterns(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    
    // Look for common FAQ section indicators
    const faqSectionPattern = /(?:frequently asked questions|faq|q&a|questions and answers)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d+\.|\n-|\n\*|$)/gi;
    let match;
    
    while ((match = faqSectionPattern.exec(content)) !== null) {
      const sectionContent = match[0];
      faqs.push(...this.extractFromFAQSection(sectionContent, sourceUrl));
    }

    return faqs;
  }

  private static looksLikeQuestion(text: string): boolean {
    const cleanText = this.cleanText(text);
    return (
      cleanText.endsWith('?') &&
      cleanText.length > 10 &&
      cleanText.length < 200 &&
      /\b(what|how|when|where|why|can|do|does|is|are|will|would|could|should)\b/i.test(cleanText)
    );
  }

  private static findAnswerAfterQuestion(lines: string[], startIndex: number): string | null {
    let answer = '';
    let lineCount = 0;
    
    for (let i = startIndex; i < lines.length && lineCount < 5; i++) {
      const line = lines[i];
      
      // Stop if we hit another question
      if (this.looksLikeQuestion(line)) {
        break;
      }
      
      // Skip very short lines (likely navigation or formatting)
      if (line.length < 10) {
        continue;
      }
      
      answer += (answer ? ' ' : '') + line;
      lineCount++;
      
      // If we have a substantial answer, we can stop
      if (answer.length > 50 && (line.endsWith('.') || line.endsWith('!'))) {
        break;
      }
    }
    
    return answer.trim() || null;
  }

  private static extractAnswerFromDetails(detailsHtml: string): string {
    // Remove the summary tag and extract content
    const withoutSummary = detailsHtml.replace(/<summary[^>]*>.*?<\/summary>/gi, '');
    // Remove HTML tags and clean up
    const text = withoutSummary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }

  private static extractFromAccordionContent(content: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    // Simple accordion parsing - look for header/content pairs
    const sections = content.split(/(?=<[^>]*class[^>]*header)/gi);
    
    for (const section of sections) {
      const headerMatch = section.match(/<[^>]*header[^>]*>(.*?)<\//i);
      if (headerMatch) {
        const question = this.cleanText(headerMatch[1]);
        const contentMatch = section.match(/<[^>]*content[^>]*>(.*?)<\//i);
        if (contentMatch) {
          const answer = this.cleanText(contentMatch[1]);
          if (this.isValidFAQ(question, answer)) {
            faqs.push(this.createFAQItem(question, answer, sourceUrl));
          }
        }
      }
    }
    
    return faqs;
  }

  private static extractFromFAQSection(sectionContent: string, sourceUrl: string): FAQItem[] {
    const faqs: FAQItem[] = [];
    const lines = sectionContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (line.match(/^\d+\.\s/) || line.startsWith('Q:') || line.startsWith('Question:')) {
        const question = this.cleanText(line.replace(/^\d+\.\s|^Q:\s*|^Question:\s*/i, ''));
        const nextLine = lines[i + 1];
        
        if (nextLine && (nextLine.startsWith('A:') || nextLine.startsWith('Answer:'))) {
          const answer = this.cleanText(nextLine.replace(/^A:\s*|^Answer:\s*/i, ''));
          if (this.isValidFAQ(question, answer)) {
            faqs.push(this.createFAQItem(question, answer, sourceUrl));
          }
        }
      }
    }
    
    return faqs;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private static isValidFAQ(question: string, answer: string): boolean {
    const cleanQuestion = this.cleanText(question);
    const cleanAnswer = this.cleanText(answer);
    
    const isValid = (
      cleanQuestion.length >= 10 &&
      cleanQuestion.length <= 300 &&
      cleanAnswer.length >= 15 &&
      cleanAnswer.length <= 1000 &&
      cleanQuestion !== cleanAnswer &&
      !cleanQuestion.toLowerCase().includes('lorem ipsum') &&
      !cleanAnswer.toLowerCase().includes('lorem ipsum') &&
      cleanAnswer.length > cleanQuestion.length * 0.5 &&
      // Ensure it's actually a question
      (cleanQuestion.includes('?') || /\b(what|how|when|where|why|can|do|does|is|are)\b/i.test(cleanQuestion))
    );
    
    console.log('Validation result:', { 
      question: cleanQuestion.substring(0, 50), 
      answer: cleanAnswer.substring(0, 50), 
      isValid,
      questionLength: cleanQuestion.length,
      answerLength: cleanAnswer.length
    });
    
    return isValid;
  }

  private static createFAQItem(question: string, answer: string, sourceUrl: string): FAQItem {
    const cleanQuestion = this.cleanText(question);
    const cleanAnswer = this.cleanText(answer);
    
    return {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: cleanQuestion,
      answer: cleanAnswer,
      category: this.categorizeQuestion(cleanQuestion),
      sourceUrl,
      confidence: this.calculateConfidence(cleanQuestion, cleanAnswer),
      isIncomplete: cleanAnswer.length < 30,
      isDuplicate: false,
      extractedAt: new Date().toISOString(),
    };
  }

  private static categorizeQuestion(question: string): string {
    const categories = {
      'Shipping': ['ship', 'deliver', 'shipping', 'delivery', 'tracking', 'package', 'versand', 'lieferung'],
      'Returns & Refunds': ['return', 'refund', 'exchange', 'money back', 'cancel', 'rückgabe', 'erstattung'],
      'Payment': ['pay', 'payment', 'credit card', 'billing', 'charge', 'cost', 'price', 'bezahlung', 'preis'],
      'Account': ['account', 'login', 'password', 'profile', 'register', 'sign up', 'konto', 'anmeldung'],
      'Support': ['help', 'support', 'contact', 'customer service', 'assistance', 'hilfe', 'kontakt'],
      'Technical': ['technical', 'bug', 'error', 'not working', 'browser', 'mobile', 'technisch', 'fehler'],
      'General': ['what', 'how', 'when', 'where', 'why', 'was', 'wie', 'wann', 'wo', 'warum']
    };

    const lowerQuestion = question.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private static calculateConfidence(question: string, answer: string): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Question quality indicators
    if (question.includes('?')) score += 2;
    if (question.length > 20) score += 1;
    if (question.toLowerCase().match(/\b(what|how|when|where|why|can|do|does|is|are|was|wie|wann|wo|warum)\b/)) score += 1;
    
    // Answer quality indicators
    if (answer.length > 50) score += 2;
    if (answer.includes('.')) score += 1;
    if (answer.toLowerCase().match(/\b(yes|no|you can|we offer|our|the|ja|nein|sie können|wir bieten)\b/)) score += 1;
    
    // Relationship indicators
    if (answer.length > question.length * 2) score += 1;
    
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  private static postProcessFAQs(faqs: FAQItem[]): FAQItem[] {
    // Remove duplicates based on question similarity
    const uniqueFAQs: FAQItem[] = [];
    const seenQuestions = new Set<string>();

    for (const faq of faqs) {
      const normalizedQuestion = faq.question.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      if (!seenQuestions.has(normalizedQuestion)) {
        seenQuestions.add(normalizedQuestion);
        uniqueFAQs.push(faq);
      } else {
        // Mark as duplicate
        const existingFAQ = uniqueFAQs.find(f => 
          f.question.toLowerCase().replace(/[^a-z0-9\s]/g, '') === normalizedQuestion
        );
        if (existingFAQ) {
          existingFAQ.isDuplicate = true;
        }
      }
    }

    console.log(`Final unique FAQs: ${uniqueFAQs.length}`);
    return uniqueFAQs;
  }
}
