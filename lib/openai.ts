import OpenAI from 'openai';
import { cache } from 'react';
import { Violation } from '@/types/copyright';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rewrites a prompt to remove copyright violations
 * Uses GPT-4o-mini for cost optimization
 * Cached to avoid duplicate API calls within the same request
 */
export const rewritePrompt = cache(async (
  originalPrompt: string,
  violations: Violation[]
): Promise<string> => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, falling back to rule-based suggestions');

    // Fallback: Use rule-based replacements
    let rewrittenPrompt = originalPrompt;
    for (const violation of violations) {
      if (violation.suggestion) {
        rewrittenPrompt = rewrittenPrompt.replace(
          new RegExp(violation.pattern, 'gi'),
          violation.suggestion
        );
      }
    }
    return rewrittenPrompt;
  }

  try {
    const violationList = violations
      .map(v => `- "${v.pattern}" (${v.severity}): ${v.explanation}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a copyright-safe prompt rewriter. Your job is to rewrite image generation prompts to avoid copyright violations while preserving creative intent. Replace copyrighted terms with generic, original alternatives that capture the same essence without infringing on intellectual property.`,
        },
        {
          role: 'user',
          content: `Original prompt: "${originalPrompt}"\n\nCopyright violations detected:\n${violationList}\n\nPlease rewrite this prompt to be copyright-safe while maintaining the creative vision. Use generic alternatives instead of specific copyrighted characters, brands, or trademarked terms.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || originalPrompt;
  } catch (error) {
    console.error('Error rewriting prompt with OpenAI:', error);

    // Fallback to rule-based
    let rewrittenPrompt = originalPrompt;
    for (const violation of violations) {
      if (violation.suggestion) {
        rewrittenPrompt = rewrittenPrompt.replace(
          new RegExp(violation.pattern, 'gi'),
          violation.suggestion
        );
      }
    }
    return rewrittenPrompt;
  }
});

/**
 * Generates an image using DALL-E 3
 * Uses standard quality for cost optimization
 * Cached to avoid duplicate API calls
 */
export const generateImage = cache(async (prompt: string): Promise<string | null> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Cannot generate images.');
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard', // Use 'standard' for MVP (cheaper than 'hd')
      n: 1,
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating image with DALL-E:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
});
