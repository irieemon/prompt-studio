'use client';

import { useActionState, useEffect, useRef } from 'react';
import { checkPrompt } from '@/app/actions/check-prompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ViolationList } from './violation-list';
import { CheckResult } from '@/types/copyright';

const initialState: CheckResult | null = null;

export function PromptForm() {
  const [state, formAction, pending] = useActionState(checkPrompt, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on textarea when the component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-scroll to results when available
  useEffect(() => {
    if (state && state.violations.length > 0) {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [state]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Studio</CardTitle>
          <CardDescription>
            Check your image generation prompts for copyright violations and get safe alternatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Your Image Prompt
              </label>
              <Textarea
                ref={textareaRef}
                id="prompt"
                name="prompt"
                placeholder="E.g., 'A magical wizard casting spells in an ancient castle'"
                className="min-h-32 resize-y"
                required
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                Enter your image generation prompt to check for copyright issues
              </p>
            </div>

            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <>
                  <span className="mr-2">⏳</span>
                  Checking...
                </>
              ) : (
                <>
                  <span className="mr-2">🔍</span>
                  Check Prompt
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {state && (
        <div id="results">
          <ViolationList result={state} />
        </div>
      )}
    </div>
  );
}
