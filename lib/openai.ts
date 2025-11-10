import OpenAI from 'openai';
import { cache } from 'react';
import { Violation } from '@/types/copyright';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced system prompt for detailed, unambiguous prompt generation
const ENHANCED_SYSTEM_PROMPT = `You are an expert copyright-safe prompt rewriter for image generation AI systems. Your mission is to transform prompts into highly detailed, unambiguous descriptions that are completely free of copyright violations.

CRITICAL REQUIREMENTS:
1. BE EXTREMELY DETAILED: Expand every element with rich, specific descriptions
2. MINIMIZE AMBIGUITY: Use precise, concrete language instead of vague terms
3. PRESERVE ALL CREATIVE INTENT: Maintain every visual element, mood, and stylistic choice
4. STRUCTURE YOUR OUTPUT: Cover all visual aspects systematically

DETAIL CATEGORIES TO ADDRESS:
- Subject Description: Physical features, clothing/accessories, pose/action, expression
- Setting/Environment: Location type, background elements, spatial arrangement
- Lighting: Direction, quality (soft/hard), color temperature, shadows/highlights
- Composition: Framing, perspective, focal point, depth of field
- Color Palette: Dominant colors, accents, saturation levels, color harmony
- Mood/Atmosphere: Emotional tone, energy level, overall feeling
- Artistic Style: Art style, rendering technique, level of detail/realism
- Textures/Materials: Surface qualities, material properties

APPROACH:
- Replace copyrighted characters with detailed original descriptions
- Replace brand names with detailed generic equivalents
- Replace trademarked styles with comprehensive artistic descriptions
- Expand brief mentions into rich, specific details
- Transform vague terms into precise descriptions

EXAMPLE TRANSFORMATIONS:
Generic: "a cheerful cartoon mouse"
Detailed: "a friendly anthropomorphic mouse character with oversized round ears, expressive oval eyes with white highlights, a small button nose, wearing white gloves and yellow shoes, displaying a wide welcoming smile"

Generic: "in a magical setting"
Detailed: "in an enchanted forest clearing at twilight, with bioluminescent mushrooms casting soft blue-green light, ancient gnarled trees with glowing runes carved in their bark, delicate motes of golden light floating through the air like fireflies"

Always output a single, cohesive paragraph that flows naturally while incorporating all detail categories.`;

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
          content: ENHANCED_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Original prompt: "${originalPrompt}"

Copyright violations detected:
${violationList}

TASK: Rewrite this prompt to be completely copyright-safe while making it SIGNIFICANTLY MORE DETAILED and UNAMBIGUOUS.

REQUIREMENTS:
1. Replace each copyrighted element with a detailed, original description that captures its visual essence
2. Expand ALL aspects of the scene with rich, specific details
3. Include concrete descriptions for: subject appearance, setting, lighting, composition, colors, mood, and style
4. Use precise language: instead of "magical", specify "glowing with ethereal blue-white light"; instead of "cheerful", specify "wide grin with crinkled eyes showing genuine joy"
5. Transform the output into a prompt that leaves minimal room for interpretation variance

Output the revised prompt as a single detailed paragraph (200-400 words recommended).`,
        },
      ],
      temperature: 0.8,
      max_tokens: 600,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
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
