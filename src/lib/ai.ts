import { useAppStore } from '../store';

export type AIProvider = 'openai' | 'anthropic' | 'groq';

interface AIService {
  generateResponse: (prompt: string, context: string) => Promise<string>;
}



class OpenAIService implements AIService {
  async generateResponse(prompt: string, context: string) {
    console.log('Calling OpenAI with context:', context);
    return `[OpenAI Response to: ${prompt}]`;
  }
}

class AnthropicService implements AIService {
  async generateResponse(prompt: string, context: string) {
    console.log('Calling Anthropic with context:', context);
    return `[Anthropic Response to: ${prompt}]`;
  }
}

class GroqService implements AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  }

  async generateResponse(prompt: string, context: string) {
    const store = useAppStore.getState();
    const activeKey = store.settings.groqKey || this.apiKey;

    if (!activeKey || activeKey === 'your-groq-api-key') {
      return "Error: Groq API key is missing. Please update your Settings.";
    }

    try {
      const response = await fetch(
        `https://api.groq.com/openai/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: context
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 2048,
          })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('Groq API Error:', error);
      return `Error calling Groq AI: ${error.message}`;
    }
  }
}

export function getAIService(provider: AIProvider): AIService {
  switch (provider) {
    case 'openai': return new OpenAIService();
    case 'anthropic': return new AnthropicService();
    case 'groq': return new GroqService();
    default: return new GroqService();
  }
}
