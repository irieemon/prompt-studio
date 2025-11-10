'use client';

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import { checkPrompt } from '@/app/actions/check-prompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ViolationList } from './violation-list';
import { RevisedPromptCard } from './revised-prompt-card';
import { CheckResult } from '@/types/copyright';

const initialState: CheckResult | null = null;

export function PromptForm() {
  const [state, formAction, pending] = useActionState(checkPrompt, initialState);
  const [prompt, setPrompt] = useState('');
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

  // Handler to use revised prompt
  const handleUseRevised = useCallback(() => {
    if (state?.revisedPrompt) {
      setPrompt(state.revisedPrompt);
      // Auto-submit to recheck the revised prompt
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
    }
  }, [state?.revisedPrompt]);

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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
        <div id="results" className="space-y-4">
          <ViolationList result={state} />

          {/* Revised Prompt Card */}
          {state.revisedPrompt && state.revisionMethod && state.revisionMethod !== 'none' && (
            <RevisedPromptCard
              originalPrompt={prompt}
              revisedPrompt={state.revisedPrompt}
              revisionMethod={state.revisionMethod}
              onUseRevised={handleUseRevised}
            />
          )}

          {/* Show error if revision failed */}
          {state.revisionError && (
            <div className="text-sm text-yellow-600 dark:text-yellow-400 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
              ⚠️ {state.revisionError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
