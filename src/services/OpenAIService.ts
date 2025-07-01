
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
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('OpenAI API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing OpenAI API key:', error);
      return false;
    }
  }

  static async extractFAQs(content: string, sourceUrl: string): Promise<any[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

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

OUTPUT FORMAT:
Return a JSON array of objects with this exact structure:
[
  {
    "question": "Clear, specific question",
    "answer": "Complete, helpful answer",
    "category": "Shipping|Returns|Payment|Support|Technical|General|Account",
    "confidence": "high|medium|low"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text or explanation.`
      },
      {
        role: 'user',
        content: `Extract FAQs from this website content from ${sourceUrl}:\n\n${content.substring(0, 12000)}`
      }
    ];

    try {
      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
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
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      const content_response = data.choices[0]?.message?.content;

      if (!content_response) {
        throw new Error('No response from OpenAI API');
      }

      console.log('OpenAI response:', content_response);
      
      // Parse the JSON response
      const cleanedResponse = content_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const faqs = JSON.parse(cleanedResponse);

      console.log(`OpenAI extracted ${faqs.length} FAQs`);
      return faqs;

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}
