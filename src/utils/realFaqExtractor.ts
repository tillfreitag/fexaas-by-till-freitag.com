
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
    
    // Method 1: Look for markdown headers followed by content (most common)
    const headerPattern = /#+\s*([^#\n]+\?[^#\n]*)\s*\n+((?:(?!#+)[^\n]+(?:\n|$))+)/gm;
    let match;
    while ((match = headerPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      
      console.log('Header pattern match:', { question, answer: answer.substring(0, 100) });
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    // Method 2: Look for Q: and A: patterns
    const qaPattern = /(?:^|\n)(?:Q:|Question:|Frage:)\s*([^\n]+(?:\n(?!(?:A:|Answer:|Antwort:))[^\n]+)*)\s*\n+(?:A:|Answer:|Antwort:)\s*((?:(?!(?:Q:|Question:|Frage:))[^\n]+(?:\n|$))+)/gim;
    while ((match = qaPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      
      console.log('Q&A pattern match:', { question, answer: answer.substring(0, 100) });
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    // Method 3: Look for structured FAQ sections with strong/bold questions
    const boldQuestionPattern = /\*\*([^*]+\?[^*]*)\*\*\s*\n+((?:(?!\*\*)[^\n]+(?:\n|$))+)/gm;
    while ((match = boldQuestionPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      
      console.log('Bold question match:', { question, answer: answer.substring(0, 100) });
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    // Method 4: Look for numbered or bulleted lists with questions
    const listPattern = /(?:^|\n)(?:\d+\.|\-|\*)\s*([^?\n]*\?[^\n]*)\s*\n+((?:(?!\n(?:\d+\.|\-|\*))[^\n]+(?:\n|$))+)/gm;
    while ((match = listPattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      
      console.log('List pattern match:', { question, answer: answer.substring(0, 100) });
      
      if (this.isValidFAQ(question, answer)) {
        faqs.push(this.createFAQItem(question, answer, sourceUrl));
      }
    }

    console.log(`Extracted ${faqs.length} FAQs from content`);
    return faqs;
  }

  private static isValidFAQ(question: string, answer: string): boolean {
    // Clean up the question and answer
    const cleanQuestion = question.replace(/[#*\-\d\.]/g, '').trim();
    const cleanAnswer = answer.replace(/[#*\-]/g, '').trim();
    
    // Basic validation rules
    const isValid = (
      cleanQuestion.length > 5 &&
      cleanAnswer.length > 10 &&
      cleanQuestion.includes('?') &&
      cleanQuestion !== cleanAnswer && // Make sure question and answer are different
      !cleanQuestion.toLowerCase().includes('lorem ipsum') &&
      !cleanAnswer.toLowerCase().includes('lorem ipsum') &&
      cleanAnswer.length > cleanQuestion.length * 0.3 // Answer should be reasonably longer than question
    );
    
    console.log('Validation result:', { 
      question: cleanQuestion.substring(0, 50), 
      answer: cleanAnswer.substring(0, 50), 
      isValid 
    });
    
    return isValid;
  }

  private static createFAQItem(question: string, answer: string, sourceUrl: string): FAQItem {
    // Clean up the question and answer
    const cleanQuestion = question.replace(/^[#*\-\d\.\s]+/, '').trim();
    const cleanAnswer = answer.replace(/^[#*\-\s]+/, '').trim();
    
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
