
import { logger, sanitizeErrorMessage } from '@/utils/securityConfig';
import { validateApiKey, rateLimiter } from '@/utils/inputValidation';
import { secureFetch, validateApiResponse, sanitizeApiResponse } from '@/utils/secureApiClient';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class OpenAIService {
  private static API_KEY_STORAGE_KEY = 'openai_api_key';
  private static BASE_URL = 'https://api.openai.com/v1';

  static saveApiKey(apiKey: string): void {
    const validation = validateApiKey(apiKey, 'openai');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey.trim());
    logger.info('OpenAI API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    const validation = validateApiKey(apiKey, 'openai');
    if (!validation.isValid) {
      logger.error('Invalid API key format:', validation.error);
      return false;
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest('openai-test')) {
      logger.warn('Rate limit exceeded for API key testing');
      throw new Error('Too many requests. Please wait before trying again.');
    }

    try {
      logger.info('Testing OpenAI API key...');
      const response = await secureFetch(`${this.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const isValid = response.ok;
      logger.info('OpenAI API key test result:', isValid);
      return isValid;
    } catch (error) {
      logger.error('Error testing OpenAI API key:', error);
      return false;
    }
  }

  static async extractFAQs(content: string, sourceUrl: string): Promise<any[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest('openai-extract')) {
      throw new Error('Too many requests. Please wait before trying again.');
    }

    // Validate content length
    if (content.length > 15000) {
      content = content.substring(0, 15000);
      logger.warn('Content truncated due to length limits');
    }

    logger.info(`Extracting FAQs from content (${content.length} chars) for: ${sourceUrl}`);

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an expert FAQ extractor. Extract frequently asked questions and their answers from website content. 

RULES:
1. Only extract genuine Q&A pairs that would be useful as FAQs
2. Questions should be clear and specific
3. Answers should be complete and helpful
4. Skip navigation, footer, or promotional content
5. Handle multiple languages (English, German, French, Spanish, etc.)
6. Look for both explicit Q&A sections and implicit FAQ content
7. Extract 5-15 high-quality FAQs maximum
8. Focus on customer service, product, and support related questions
9. DETECT the language of each FAQ pair accurately

OUTPUT FORMAT:
Return a JSON array of objects with this exact structure:
[
  {
    "question": "Clear, specific question",
    "answer": "Complete, helpful answer",
    "category": "Shipping|Returns|Payment|Support|Technical|General|Account|Products",
    "language": "English|German|French|Spanish|Italian|Portuguese|Dutch|Russian|Chinese|Japanese|Korean|Arabic|Other",
    "confidence": "high|medium|low"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text or explanation.`
      },
      {
        role: 'user',
        content: `Extract FAQs from this website content from ${sourceUrl}:\n\n${content}`
      }
    ];

    try {
      logger.info('Sending request to OpenAI API...');
      
      const response = await secureFetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenAI API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const rawData: OpenAIResponse = await response.json();
      
      // Validate response structure
      if (!validateApiResponse(rawData, ['choices'])) {
        logger.error('Invalid OpenAI API response structure');
        throw new Error('Invalid response from OpenAI API');
      }

      // Sanitize response
      const data = sanitizeApiResponse(rawData);
      const content_response = data.choices[0]?.message?.content;

      if (!content_response) {
        logger.error('No response content from OpenAI API');
        throw new Error('No response from OpenAI API');
      }

      logger.debug('Raw OpenAI response received');
      
      // Parse the JSON response
      const cleanedResponse = content_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const faqs = JSON.parse(cleanedResponse);
        
        if (!Array.isArray(faqs)) {
          logger.error('OpenAI response is not an array');
          throw new Error('Invalid response format from OpenAI');
        }

        // Validate each FAQ item
        const validFAQs = faqs.filter((faq: any) => {
          return faq && 
                 typeof faq.question === 'string' && 
                 typeof faq.answer === 'string' &&
                 faq.question.trim().length > 0 &&
                 faq.answer.trim().length > 0;
        });

        logger.info(`Successfully parsed ${validFAQs.length} valid FAQs from OpenAI response`);
        logger.debug('Token usage:', data.usage);
        
        return validFAQs;
      } catch (parseError) {
        logger.error('Failed to parse OpenAI JSON response:', parseError);
        throw new Error('Failed to parse OpenAI response');
      }

    } catch (error) {
      logger.error('Error calling OpenAI API:', error);
      throw new Error(sanitizeErrorMessage(error));
    }
  }
}
