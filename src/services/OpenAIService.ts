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
      console.log('Testing OpenAI API key...');
      const response = await fetch(`${this.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('OpenAI API key test result:', response.ok);
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

    console.log(`Extracting FAQs from content (${content.length} chars) for: ${sourceUrl}`);

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
        content: `Extract FAQs from this website content from ${sourceUrl}:\n\n${content.substring(0, 12000)}`
      }
    ];

    try {
      console.log('Sending request to OpenAI API...');
      
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
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      const content_response = data.choices[0]?.message?.content;

      if (!content_response) {
        console.error('No response content from OpenAI API');
        throw new Error('No response from OpenAI API');
      }

      console.log('Raw OpenAI response:', content_response);
      
      // Parse the JSON response
      const cleanedResponse = content_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const faqs = JSON.parse(cleanedResponse);
        
        if (!Array.isArray(faqs)) {
          console.error('OpenAI response is not an array:', faqs);
          throw new Error('Invalid response format from OpenAI');
        }

        console.log(`Successfully parsed ${faqs.length} FAQs from OpenAI response`);
        console.log('Token usage:', data.usage);
        
        return faqs;
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError);
        console.error('Response content:', cleanedResponse);
        throw new Error('Failed to parse OpenAI response');
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}
