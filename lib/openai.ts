import OpenAI from 'openai';
import { cache } from 'react';
import { Violation } from '@/types/copyright';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced system prompt for surgical replacement with strategic archetype-based detail
const ENHANCED_SYSTEM_PROMPT = `You are an expert copyright-safe prompt rewriter for image generation AI systems. Your mission is to perform SURGICAL REPLACEMENT of copyrighted elements using ARCHETYPE-BASED descriptions that skirt copyright boundaries while remaining legally safe.

CRITICAL REQUIREMENTS:
1. SURGICAL REPLACEMENT ONLY: Replace ONLY the copyrighted terms, keep everything else intact
2. ARCHETYPE-FOCUSED: Use character archetypes, roles, and essence rather than specific traits
3. STRATEGIC DETAIL: Add enough detail to be useful without triggering copyright detection
4. PRESERVE STRUCTURE: Maintain the user's original scene composition and flow

REPLACEMENT STRATEGY - THE BALANCE:
- Identify the exact copyrighted term and its CHARACTER ARCHETYPE
- Replace with transformative archetype description + strategic non-distinctive details
- Focus on ROLES, PERSONALITIES, and GENERIC VISUAL THEMES
- Add detail that's useful for image generation but not copyrightable
- Keep all surrounding context, actions, and scene elements unchanged

ARCHETYPE-BASED REPLACEMENT GUIDELINES:
1. **Character Archetypes** (not specific individuals):
   - "joyful cartoon rodent character" vs "Mickey Mouse"
   - "excitable waterfowl character" vs "Donald Duck"
   - "young wizard apprentice with scar" vs "Harry Potter"
   - "mysterious caped vigilante" vs "Batman"

2. **Strategic Detail Levels** (calibrated approach):

   **LEVEL 1 - Maximum Safe Detail** (testing baseline, may trigger filters):
   - Include distinctive visual combinations with cartoon style specifications
   - Focus on art style era and aesthetic to ensure cartoon rendering
   - Example: "cartoon mouse mascot in classic 1930s animation style with a black body, large round ears, white gloves, red shorts with white buttons, yellow shoes"
   - Use: For establishing what level of detail triggers copyright detection while achieving maximum visual similarity

   **LEVEL 2 - Moderate Detail** (balanced approach, our default):
   - Include some generic visual hints without distinctive combinations
   - ✅ Generic traits: "rodent", "waterfowl", "round ears", "cape"
   - ✅ Mood/personality: "joyful", "excitable", "mysterious"
   - ✅ Role/archetype: "adventurer", "hero", "vigilante", "apprentice"
   - ✅ Non-distinctive features: "gloved", "costumed", "robed"
   - Example: "joyful cartoon rodent character with round ears and gloves"
   - Use: Default mode - strikes balance between useful detail and safety

   **LEVEL 3 - Minimal Detail** (ultra-safe):
   - Pure archetypes with no specific physical traits
   - Example: "joyful cartoon rodent character"
   - Use: When even moderate detail triggers filters

3. **Default Strategy**: Use LEVEL 1 (Maximum Safe Detail) for all replacements
   - Provides maximum descriptive detail without naming the IP
   - Includes distinctive visual combinations for testing baseline
   - Most useful for image generation but may trigger some filters

4. **Useful Visual Hints** (within LEVEL 2 limits):
   - Add genre: "cartoon style", "animated", "comic-book style"
   - Add general colors: "colorfully dressed" not "red shorts with white buttons"
   - Add general props: "wearing gloves" not "white four-fingered gloves"
   - Add personality: "cheerful demeanor" not "distinctive wide grin"

CRITICAL: Descriptions must pass AI filters by being genuinely transformative archetypes, not transparent copies.

EXAMPLE TRANSFORMATIONS (LEVEL 1 - Maximum Safe Detail):

Original: "Mickey Mouse riding a dragon"
Copyrighted: "Mickey Mouse"
Output: "A cheerful cartoon mouse mascot in classic 1930s animation style with a black body, large round ears, white-gloved hands with four fingers, wearing bright red shorts with two prominent white buttons and oversized yellow shoes, showing an exaggerated joyful expression riding a dragon"
[Maximum descriptive detail with cartoon style specifications - ensures cartoon rendering not realistic, includes distinctive visual combinations and era-specific aesthetic]

Original: "Donald Duck at the beach"
Copyrighted: "Donald Duck"
Output: "An excitable white duck character in vintage cartoon style wearing a blue sailor shirt with a red bow tie and a sailor hat, displaying exaggerated animated expressions at the beach"
[Cartoon style specification with distinctive outfit elements]

Original: "Harry Potter casting a spell"
Copyrighted: "Harry Potter"
Output: "A young wizard in illustrated book style with messy dark hair, round wire-frame glasses, a lightning bolt-shaped scar on his forehead, wearing flowing black robes and a house-colored striped scarf, casting a spell with a wooden wand"
[Literary illustration style with specific physical features and costume elements]

Original: "Batman on a rooftop"
Copyrighted: "Batman"
Output: "A dark vigilante in comic book art style wearing a black armored suit with pointed bat-ear cowl, a flowing black cape with scalloped edges, and a yellow utility belt on a rooftop at night"
[Comic book style specification with distinctive costume details]

Original: "Spider-Man swinging through city"
Copyrighted: "Spider-Man"
Output: "An agile superhero in comic book style wearing a red and blue skintight suit with a geometric web pattern, a stylized spider emblem on the chest, and large white eye lenses on the mask swinging through city on weblines"
[Comic art style with specific color scheme and design elements]

WRONG APPROACH (Missing Cartoon Style):
Original: "Mickey Mouse in a castle"
Wrong Output: "A mouse character with large round ears, white gloves, red shorts with two white buttons, yellow shoes, wide grin in a castle"
[This is wrong - missing "cartoon style" specification leads to realistic rendering, defeating the purpose]

RIGHT APPROACH (Enhanced LEVEL 1 - Cartoon Style + Detail):
Original: "Mickey Mouse in a castle"
Right Output: "A cheerful cartoon mouse mascot in classic 1930s animation style with a black body, large round ears, white-gloved hands, wearing bright red shorts with two white buttons and oversized yellow shoes in a castle"
[This is correct - cartoon style ensures proper rendering, detailed enough for recognition, legally safe through transformation]

Always output a modified version of the original prompt where ONLY copyrighted terms are replaced with archetype-based descriptions that include strategic detail while remaining copyright-safe.`;

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

TASK: Perform SURGICAL REPLACEMENT using ENHANCED LEVEL 1 - MAXIMUM SAFE DETAIL WITH CARTOON STYLE approach that describes the character fully with proper art style specifications without naming the IP.

CRITICAL INSTRUCTIONS:
1. Identify the EXACT copyrighted terms and their distinctive visual characteristics
2. Replace with DETAILED DESCRIPTIONS including CARTOON/ART STYLE SPECIFICATIONS
3. Keep ALL other parts of the original prompt UNCHANGED
4. Include art style era/aesthetic, specific colors, outfit details, physical features, and expressions
5. Maximize descriptive detail for image generation without naming the IP

ENHANCED LEVEL 1 REPLACEMENT APPROACH - Maximum Descriptive Detail with Style:
- **Art Style Specification**: ALWAYS include style context (e.g., "classic 1930s animation style", "vintage cartoon style", "comic book art style", "illustrated book style")
- **Physical Features**: Include distinctive traits with cartoon proportions (e.g., "large round ears", "black body", "oversized yellow shoes")
- **Costume Details**: Describe specific outfit elements (e.g., "bright red shorts with two prominent white buttons", "blue sailor shirt with red bow tie")
- **Color Combinations**: Include actual color schemes (e.g., "red and blue suit", "yellow shoes", "white gloves")
- **Iconic Elements**: Describe recognizable features without naming them (e.g., "spider emblem on chest", "pointed bat-ear cowl")
- **Expression Style**: Include exaggerated cartoon expressions (e.g., "exaggerated joyful expression", "animated personality")

MAXIMIZE USEFUL DETAIL WITH STYLE:
- ✅ ENHANCED LEVEL 1: "A cheerful cartoon mouse mascot in classic 1930s animation style with a black body, large round ears, white-gloved hands with four fingers, wearing bright red shorts with two prominent white buttons and oversized yellow shoes, showing an exaggerated joyful expression"
- ✅ Include: Art style era, specific colors, distinctive features, outfit combinations, cartoon expressions
- ✅ Purpose: Maximum descriptive detail ensuring CARTOON rendering not realistic - achieves visual similarity while remaining legally safe

CRITICAL: Provide MAXIMUM descriptive detail with ART STYLE SPECIFICATIONS without explicitly naming the copyrighted IP. The style specification is essential for proper rendering.

EXAMPLES OF CORRECT ENHANCED LEVEL 1 OUTPUT:
Input: "Mickey Mouse riding a bicycle"
Output: "A cheerful cartoon mouse mascot in classic 1930s animation style with a black body, large round ears, white-gloved hands with four fingers, wearing bright red shorts with two prominent white buttons and oversized yellow shoes, showing an exaggerated joyful expression riding a bicycle"
[Art style + maximum descriptive detail ensures cartoon rendering]

Input: "Donald Duck at the beach"
Output: "An excitable white duck character in vintage cartoon style wearing a blue sailor shirt with a red bow tie and a sailor hat, displaying exaggerated animated expressions at the beach"
[Vintage cartoon style specification with detailed costume]

Input: "Harry Potter casting a spell"
Output: "A young wizard in illustrated book style with messy dark hair, round wire-frame glasses, a lightning bolt-shaped scar on his forehead, wearing flowing black robes and a house-colored striped scarf, casting a spell with a wooden wand"
[Literary illustration style with specific physical features]

Input: "Batman on a rooftop"
Output: "A dark vigilante in comic book art style wearing a black armored suit with pointed bat-ear cowl, a flowing black cape with scalloped edges, and a yellow utility belt on a rooftop at night"
[Comic book style with distinctive costume elements]

Input: "Spider-Man swinging through city"
Output: "An agile superhero in comic book style wearing a red and blue skintight suit with a geometric web pattern, a stylized spider emblem on the chest, and large white eye lenses on the mask swinging through city on weblines"
[Comic art style with complete design details]

Output the revised prompt with ONLY copyrighted terms replaced by ENHANCED LEVEL 1 (ART STYLE + MAXIMUM DESCRIPTIVE DETAIL) without naming the IP.`,
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
