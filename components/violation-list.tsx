'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckResult, SEVERITY_CONFIG, CATEGORY_CONFIG } from '@/types/copyright';

interface ViolationListProps {
  result: CheckResult;
}

export function ViolationList({ result }: ViolationListProps) {
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{result.message || 'Failed to check prompt'}</AlertDescription>
      </Alert>
    );
  }

  if (result.violations.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <AlertTitle className="text-green-800 dark:text-green-200">
          ✅ All Clear!
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          {result.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.hasBlockingViolations && '🚫'}
          {!result.hasBlockingViolations && result.hasModerateViolations && '⚠️'}
          {!result.hasBlockingViolations && !result.hasModerateViolations && 'ℹ️'}
          Copyright Issues Detected
        </CardTitle>
        <CardDescription>{result.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.violations.map((violation, idx) => {
          const severityConfig = SEVERITY_CONFIG[violation.severity];
          const categoryConfig = CATEGORY_CONFIG[violation.category];

          return (
            <Alert
              key={idx}
              variant={severityConfig.variant}
              className="relative"
            >
              <div className="space-y-2">
                <AlertTitle className="flex items-center gap-2 flex-wrap">
                  <Badge variant={severityConfig.variant}>
                    {severityConfig.icon} {severityConfig.label}
                  </Badge>
                  <Badge variant="outline">
                    {categoryConfig.icon} {categoryConfig.label}
                  </Badge>
                  <span className="font-semibold">"{violation.pattern}"</span>
                </AlertTitle>

                <AlertDescription className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Why this is flagged:</p>
                    <p className="text-sm break-words">{violation.explanation}</p>
                  </div>

                  {violation.suggestion && (
                    <div className="p-3 rounded-md bg-muted space-y-2">
                      <p className="text-sm font-medium">💡 Suggested Alternative:</p>
                      <p className="text-sm font-semibold text-foreground break-words">
                        {violation.suggestion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Replace "{violation.pattern}" with this copyright-safe alternative
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground italic">
                    {severityConfig.description}
                  </p>
                </AlertDescription>
              </div>
            </Alert>
          );
        })}

        {result.hasBlockingViolations && (
          <Alert variant="destructive">
            <AlertTitle>⚠️ Action Required</AlertTitle>
            <AlertDescription>
              Your prompt contains severe copyright violations that must be fixed before
              generating an image. Please replace the flagged terms with the suggested
              alternatives.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
