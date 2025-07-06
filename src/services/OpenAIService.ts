
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
    const key = localStorage.getItem(this.API_KEY_STORAGE_KEY);
    console.log('OpenAI API key check:', key ? 'Key exists' : 'No key found');
    return key;
  }

  static hasApiKey(): boolean {
    const hasKey = !!this.getApiKey();
    console.log('OpenAI hasApiKey:', hasKey);
    return hasKey;
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
      console.log('Testing OpenAI API key...');
      const response = await secureFetch(`${this.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const isValid = response.ok;
      console.log('OpenAI API key test result:', isValid);
      if (!isValid) {
        const errorText = await response.text();
        console.error('OpenAI API key test failed:', response.status, errorText);
      }
      return isValid;
    } catch (error) {
      console.error('Error testing OpenAI API key:', error);
      return false;
    }
  }

  static async extractFAQs(content: string, sourceUrl: string): Promise<any[]> {
    console.log('=== OpenAI extractFAQs called ===');
    console.log('Content length:', content.length);
    console.log('Source URL:', sourceUrl);
    
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('OpenAI API key not found in extractFAQs');
      throw new Error('OpenAI API key not found');
    }

    console.log('API key exists, proceeding with extraction...');

    // Rate limiting check
    if (!rateLimiter.canMakeRequest('openai-extract')) {
      throw new Error('Too many requests. Please wait before trying again.');
    }

    // Validate and clean content
    if (!content || content.trim().length === 0) {
      logger.warn('Empty or invalid content provided');
      return [];
    }

    // Validate content length and truncate if needed
    if (content.length > 15000) {
      content = content.substring(0, 15000);
      logger.warn('Content truncated due to length limits');
    }

    console.log(`Sending ${content.length} characters to OpenAI for extraction`);

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
      console.log('Making request to OpenAI API...');
      
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

      console.log('OpenAI API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. The model or parameters might be incorrect.');
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const rawData: OpenAIResponse = await response.json();
      console.log('Raw OpenAI response received');
      
      // Validate response structure
      if (!validateApiResponse(rawData, ['choices'])) {
        console.error('Invalid OpenAI API response structure:', rawData);
        throw new Error('Invalid response from OpenAI API');
      }

      // Sanitize response
      const data = sanitizeApiResponse(rawData);
      const content_response = data.choices[0]?.message?.content;

      if (!content_response) {
        console.error('No response content from OpenAI API');
        throw new Error('No response from OpenAI API');
      }

      console.log('OpenAI response content received, length:', content_response.length);
      console.log('Response preview:', content_response.substring(0, 500) + '...');
      
      // Parse the JSON response
      const cleanedResponse = content_response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[\{]*/, '') // Remove any text before the JSON starts
        .replace(/[^}\]]*$/, '') // Remove any text after the JSON ends
        .trim();
      
      console.log('Cleaned response for parsing:', cleanedResponse.substring(0, 200) + '...');
      
      try {
        const faqs = JSON.parse(cleanedResponse);
        
        if (!Array.isArray(faqs)) {
          console.error('OpenAI response is not an array:', typeof faqs);
          throw new Error('Invalid response format from OpenAI');
        }

        // Validate each FAQ item
        const validFAQs = faqs.filter((faq: any) => {
          const isValid = faq && 
                 typeof faq.question === 'string' && 
                 typeof faq.answer === 'string' &&
                 faq.question.trim().length > 0 &&
                 faq.answer.trim().length > 0;
          
          if (!isValid) {
            console.log('Invalid FAQ filtered out:', faq);
          }
          
          return isValid;
        });

        console.log(`Successfully parsed ${validFAQs.length} valid FAQs from OpenAI response`);
        if (data.usage) {
          console.log('Token usage:', data.usage);
        }
        
        return validFAQs;
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError);
        console.error('Raw response that failed to parse:', cleanedResponse);
        throw new Error('Failed to parse OpenAI response. The AI might have returned invalid JSON.');
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error(sanitizeErrorMessage(error));
    }
  }
}
