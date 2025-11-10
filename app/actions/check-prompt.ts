'use server';

import { createClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { rewritePrompt } from '@/lib/openai';
import { CheckResult, Violation, SeverityLevel, CategoryType } from '@/types/copyright';
import { z } from 'zod';

const PromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(1000, 'Prompt is too long (max 1000 characters)'),
});

/**
 * Server Action to check a prompt for copyright violations
 * Returns a CheckResult with all detected violations
 */
export async function checkPrompt(
  prevState: CheckResult | null,
  formData: FormData
): Promise<CheckResult> {
  // Rate limiting (using a global identifier for MVP)
  const rateLimitResult = await checkRateLimit('global');
  if (!rateLimitResult.success) {
    return {
      success: false,
      violations: [],
      hasBlockingViolations: false,
      hasSevereViolations: false,
      hasModerateViolations: false,
      hasMinorViolations: false,
      message: 'Rate limit exceeded. Please try again in a few moments.',
      checkedAt: new Date().toISOString(),
    };
  }

  // Validate input
  const validatedFields = PromptSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      violations: [],
      hasBlockingViolations: false,
      hasSevereViolations: false,
      hasModerateViolations: false,
      hasMinorViolations: false,
      message: validatedFields.error.issues[0].message,
      checkedAt: new Date().toISOString(),
    };
  }

  const { prompt } = validatedFields.data;
  const supabase = createClient();
  const violations: Violation[] = [];

  type PatternRow = {
    pattern: string;
    severity: string;
    category: string;
    explanation: string;
    replacement_suggestion: string | null;
  };

  try {
    // Step 1: Exact matching (fastest and most accurate)
    const { data: exactPatterns, error: exactError } = await supabase
      .from('copyright_patterns')
      .select('pattern, severity, category, explanation, replacement_suggestion')
      .eq('pattern_type', 'exact')
      .eq('active', true)
      .returns<PatternRow[]>();

    if (exactError) {
      console.error('Error fetching exact patterns:', exactError);
      throw new Error('Failed to check copyright patterns');
    }

    // Check for exact matches (case-insensitive)
    const promptLower = prompt.toLowerCase();
    if (exactPatterns) {
      for (const pattern of exactPatterns) {
        if (promptLower.includes(pattern.pattern.toLowerCase())) {
          violations.push({
            pattern: pattern.pattern,
            severity: pattern.severity as SeverityLevel,
            category: pattern.category as CategoryType,
            explanation: pattern.explanation,
            suggestion: pattern.replacement_suggestion,
          });
        }
      }
    }

    // Step 2: Fuzzy matching using full-text search
    // Sanitize prompt for tsquery: remove special characters and join with spaces
    const sanitizedPrompt = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .split(/\s+/) // Split into words
      .filter(word => word.length > 2) // Filter out short words
      .join(' | '); // Join with OR operator for tsquery

    let fuzzyPatterns: PatternRow[] | null = null;
    if (sanitizedPrompt) {
      const { data, error: fuzzyError } = await supabase
        .from('copyright_patterns')
        .select('pattern, severity, category, explanation, replacement_suggestion')
        .textSearch('fts', sanitizedPrompt)
        .eq('pattern_type', 'fuzzy')
        .eq('active', true)
        .returns<PatternRow[]>();

      if (fuzzyError) {
        console.error('Error fetching fuzzy patterns:', fuzzyError);
        // Continue even if fuzzy search fails
      } else {
        fuzzyPatterns = data;
      }
    }

    if (fuzzyPatterns) {
      // Add fuzzy matches
      for (const pattern of fuzzyPatterns) {
        // Avoid duplicates
        if (!violations.some(v => v.pattern === pattern.pattern)) {
          violations.push({
            pattern: pattern.pattern,
            severity: pattern.severity as SeverityLevel,
            category: pattern.category as CategoryType,
            explanation: pattern.explanation,
            suggestion: pattern.replacement_suggestion,
          });
        }
      }
    }

    // Sort violations by severity (severe first)
    const severityOrder: Record<SeverityLevel, number> = {
      severe: 0,
      moderate: 1,
      minor: 2,
    };
    violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate severity flags
    const hasSevereViolations = violations.some(v => v.severity === 'severe');
    const hasModerateViolations = violations.some(v => v.severity === 'moderate');
    const hasMinorViolations = violations.some(v => v.severity === 'minor');
    const hasBlockingViolations = hasSevereViolations;

    // Create result message
    let message: string;
    if (violations.length === 0) {
      message = '✅ No copyright issues detected! Your prompt is safe to use.';
    } else if (hasBlockingViolations) {
      message = `🚫 Found ${violations.length} copyright issue(s) including severe violations that must be fixed.`;
    } else if (hasModerateViolations) {
      message = `⚠️ Found ${violations.length} copyright issue(s) that should be addressed.`;
    } else {
      message = `ℹ️ Found ${violations.length} minor issue(s). Consider revising for best results.`;
    }

    // Automatically generate revised prompt if violations found
    let revisedPrompt: string | undefined;
    let revisionMethod: 'llm' | 'rule-based' | 'none' = 'none';
    let revisionError: string | undefined;

    if (violations.length > 0) {
      try {
        revisedPrompt = await rewritePrompt(prompt, violations);
        revisionMethod = process.env.OPENAI_API_KEY ? 'llm' : 'rule-based';
      } catch (error) {
        console.error('Error generating revised prompt:', error);
        revisionError = 'Could not generate revised prompt automatically';
      }
    }

    return {
      success: true,
      violations,
      hasBlockingViolations,
      hasSevereViolations,
      hasModerateViolations,
      hasMinorViolations,
      message,
      checkedAt: new Date().toISOString(),
      revisedPrompt,
      revisionMethod,
      revisionError,
    };
  } catch (error) {
    console.error('Error checking prompt:', error);
    return {
      success: false,
      violations: [],
      hasBlockingViolations: false,
      hasSevereViolations: false,
      hasModerateViolations: false,
      hasMinorViolations: false,
      message: 'An error occurred while checking your prompt. Please try again.',
      checkedAt: new Date().toISOString(),
    };
  }
}
