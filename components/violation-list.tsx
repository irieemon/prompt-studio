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
              <div className="space-y-3">
                <AlertTitle className="flex items-center gap-2 flex-wrap">
                  <Badge variant={severityConfig.variant}>
                    {severityConfig.icon} {severityConfig.label}
                  </Badge>
                  <Badge variant="outline">
                    {categoryConfig.icon} {categoryConfig.label}
                  </Badge>
                  <span className="font-semibold">"{violation.pattern}"</span>
                </AlertTitle>

                <AlertDescription className="space-y-3 text-sm">
                  <p className="text-sm">
                    <span className="font-medium">Why this is flagged: </span>
                    {violation.explanation}
                  </p>

                  {violation.suggestion && (
                    <div className="p-3 rounded-md bg-muted">
                      <div className="flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Suggested Alternative: </span>
                            <span className="font-semibold text-foreground whitespace-nowrap">{violation.suggestion}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Replace "{violation.pattern}" with this copyright-safe alternative
                          </p>
                        </div>
                      </div>
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
