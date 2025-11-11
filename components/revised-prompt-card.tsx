'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Check, Copy, Sparkles, ImageIcon, Loader2, Download } from 'lucide-react';
import { generateImageAction } from '@/app/actions/generate-image';
import Image from 'next/image';

interface RevisedPromptCardProps {
  originalPrompt: string;
  revisedPrompt: string;
  revisionMethod: 'llm' | 'rule-based';
  onUseRevised: () => void;
}

export function RevisedPromptCard({
  originalPrompt,
  revisedPrompt,
  revisionMethod,
  onUseRevised
}: RevisedPromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(revisedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setImageError(null);

    try {
      const result = await generateImageAction(revisedPrompt);

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      } else {
        setImageError(result.message || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setImageError('An unexpected error occurred while generating the image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (generatedImageUrl) {
      // Open image in new tab for download
      window.open(generatedImageUrl, '_blank');
    }
  };

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Sparkles className="h-5 w-5" />
            Revised Prompt
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
          >
            {revisionMethod === 'llm' ? '✨ AI-Powered' : '🔧 Rule-Based'}
          </Badge>
        </div>
        <CardDescription className="text-green-700 dark:text-green-300">
          We've automatically created a copyright-safe version of your prompt that maintains your creative intent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-white dark:bg-gray-950 border border-green-200 dark:border-green-800">
          <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {revisedPrompt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onUseRevised}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Use This Prompt
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowComparison(!showComparison)}
            variant="ghost"
            className="text-green-700 hover:text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-200 dark:hover:bg-green-900"
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </Button>
        </div>

        {/* Image Error Display */}
        {imageError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-600 dark:text-red-400">
              ⚠️ {imageError}
            </p>
          </div>
        )}

        {/* Generated Image Display */}
        {generatedImageUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Generated Image
              </p>
              <Button
                onClick={handleDownloadImage}
                variant="outline"
                size="sm"
                className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900"
              >
                <Download className="h-4 w-4 mr-2" />
                Open Full Size
              </Button>
            </div>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800">
              <Image
                src={generatedImageUrl}
                alt="Generated image from revised prompt"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}

        {showComparison && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-2">
                Original Prompt
              </p>
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {originalPrompt}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-2">
                Revised Prompt
              </p>
              <div className="p-3 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {revisedPrompt}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-green-700/70 dark:text-green-300/70 italic">
          💡 Tip: Review the revised prompt to ensure it matches your creative vision, then click "Use This Prompt" to replace your original.
        </div>
      </CardContent>
    </Card>
  );
}
