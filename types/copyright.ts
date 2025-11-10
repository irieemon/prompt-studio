// Database enum types matching Supabase schema
export type PatternType = 'exact' | 'fuzzy' | 'regex';
export type SeverityLevel = 'severe' | 'moderate' | 'minor';
export type CategoryType = 'character' | 'brand' | 'trademark' | 'artwork' | 'style';

// Copyright pattern from database
export interface CopyrightPattern {
  id: string;
  pattern: string;
  pattern_type: PatternType;
  severity: SeverityLevel;
  category: CategoryType;
  replacement_suggestion: string | null;
  explanation: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Violation detected during prompt checking
export interface Violation {
  pattern: string;
  severity: SeverityLevel;
  category: CategoryType;
  explanation: string;
  suggestion: string | null;
  position?: {
    start: number;
    end: number;
  };
}

// Result from checking a prompt
export interface CheckResult {
  success: boolean;
  violations: Violation[];
  hasBlockingViolations: boolean;
  hasSevereViolations: boolean;
  hasModerateViolations: boolean;
  hasMinorViolations: boolean;
  message?: string;
  checkedAt: string;
  // Automatic prompt revision fields
  revisedPrompt?: string;
  revisionMethod?: 'llm' | 'rule-based' | 'none';
  revisionError?: string;
}

// Request to check a prompt
export interface CheckPromptRequest {
  prompt: string;
  includeMinor?: boolean; // Whether to include minor violations
  includePositions?: boolean; // Whether to calculate text positions
}

// Rewritten prompt result
export interface RewriteResult {
  success: boolean;
  originalPrompt: string;
  rewrittenPrompt: string;
  violationsFixed: number;
  method: 'rule-based' | 'llm' | 'hybrid';
  message?: string;
}

// Analytics data for prompt checks
export interface PromptCheckAnalytics {
  id: string;
  user_ip: string | null;
  original_prompt: string;
  violations_found: number;
  max_severity: SeverityLevel | null;
  rewritten: boolean;
  created_at: string;
}

// Form state for the prompt checking form
export interface PromptFormState {
  prompt: string;
  isChecking: boolean;
  checkResult: CheckResult | null;
  error: string | null;
}

// Severity badge configuration
export interface SeverityConfig {
  label: string;
  variant: 'destructive' | 'default';
  color: string;
  icon: string;
  description: string;
}

export const SEVERITY_CONFIG: Record<SeverityLevel, SeverityConfig> = {
  severe: {
    label: 'Severe',
    variant: 'destructive',
    color: 'text-red-600',
    icon: '🚫',
    description: 'This will block your prompt from being generated',
  },
  moderate: {
    label: 'Moderate',
    variant: 'default',
    color: 'text-yellow-600',
    icon: '⚠️',
    description: 'This should be addressed before generating',
  },
  minor: {
    label: 'Minor',
    variant: 'default',
    color: 'text-blue-600',
    icon: 'ℹ️',
    description: 'Consider revising for best results',
  },
};

// Category icons and labels
export const CATEGORY_CONFIG: Record<CategoryType, { icon: string; label: string }> = {
  character: { icon: '👤', label: 'Character' },
  brand: { icon: '🏢', label: 'Brand' },
  trademark: { icon: '™️', label: 'Trademark' },
  artwork: { icon: '🎨', label: 'Artwork' },
  style: { icon: '🖌️', label: 'Style' },
};
