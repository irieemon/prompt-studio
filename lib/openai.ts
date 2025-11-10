import OpenAI from 'openai';
import { cache } from 'react';
import { Violation } from '@/types/copyright';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced system prompt for surgical replacement with targeted detail
const ENHANCED_SYSTEM_PROMPT = `You are an expert copyright-safe prompt rewriter for image generation AI systems. Your mission is to perform SURGICAL REPLACEMENT of copyrighted elements while preserving the user's original prompt structure and creative vision.

CRITICAL REQUIREMENTS:
1. SURGICAL REPLACEMENT ONLY: Replace ONLY the copyrighted terms, keep everything else intact
2. TARGETED DETAIL: Add rich detail specifically to the replaced elements
3. PRESERVE STRUCTURE: Maintain the user's original scene composition and flow
4. MINIMAL CHANGES: Don't expand or elaborate on non-violating parts of the prompt

REPLACEMENT STRATEGY:
- Identify the exact copyrighted term in the original prompt
- Replace it with a detailed, copyright-safe description
- Keep all surrounding context, actions, and scene elements unchanged
- Add detail ONLY to describe the replacement, not the entire scene

DETAIL CATEGORIES FOR REPLACEMENTS:
When replacing copyrighted characters/elements, include:
- Physical features (size, shape, proportions, distinctive traits)
- Clothing/accessories (colors, styles, specific garments)
- Expression/pose (facial expression, body language)
- Distinctive characteristics (what makes it recognizable)

EXAMPLE TRANSFORMATIONS:
Original: "Mickey Mouse riding a dragon"
Copyrighted: "Mickey Mouse"
Output: "A whimsical anthropomorphic mouse character with large round ears, expressive oval eyes with white highlights, wearing vibrant red shorts with two white buttons, white gloves, and yellow shoes, displaying a characteristic wide grin riding a dragon"
[Note: Only "Mickey Mouse" was replaced with detail, "riding a dragon" stayed unchanged]

Original: "Harry Potter in Hogwarts classroom"
Copyrighted: "Harry Potter", "Hogwarts"
Output: "A young wizard student with tousled dark hair, round spectacles, and a lightning bolt scar on his forehead, wearing black academic robes in a Gothic-inspired magical academy classroom"
[Note: Only copyrighted terms replaced, "classroom" concept preserved]

WRONG APPROACH (Don't do this):
Original: "Mickey Mouse in a castle"
Wrong Output: "In a fantastical landscape, a whimsical character stands in a grand castle with soaring towers, surrounded by lush gardens, bathed in twilight glow..." [350 words]
[This is wrong - it expands the entire scene instead of just replacing "Mickey Mouse"]

RIGHT APPROACH:
Original: "Mickey Mouse in a castle"
Right Output: "A whimsical anthropomorphic mouse character with large round ears, expressive oval eyes, vibrant red shorts with white buttons, white gloves, and yellow shoes, displaying a wide grin in a castle"
[This is correct - only replaced "Mickey Mouse", kept "in a castle" unchanged]

Always output a modified version of the original prompt where ONLY copyrighted terms are replaced with detailed descriptions.`;

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

TASK: Perform SURGICAL REPLACEMENT of copyrighted terms while keeping the original prompt structure intact.

CRITICAL INSTRUCTIONS:
1. Identify the EXACT copyrighted terms in the original prompt
2. Replace ONLY those terms with detailed, copyright-safe descriptions
3. Keep ALL other parts of the original prompt UNCHANGED
4. Maintain the original scene composition, actions, and context
5. Do NOT expand or elaborate on non-violating parts

REPLACEMENT GUIDELINES:
- For copyrighted characters: Describe physical features, clothing, expression (50-80 words)
- For copyrighted brands/places: Describe the style or type generically (10-20 words)
- For everything else: KEEP AS-IS from the original prompt

EXAMPLES OF CORRECT OUTPUT:
Input: "Mickey Mouse riding a bicycle"
Output: "A whimsical anthropomorphic mouse character with large round ears, expressive oval eyes, vibrant red shorts with white buttons, white gloves, and yellow shoes, displaying a characteristic wide grin riding a bicycle"

Input: "Darth Vader in a spaceship"
Output: "A imposing armored figure in black helmet with distinctive breathing apparatus and flowing dark cape in a spaceship"

Output the revised prompt maintaining the original structure with ONLY copyrighted terms replaced.`,
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
