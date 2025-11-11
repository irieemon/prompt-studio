'use server';

import { generateImage } from '@/lib/openai';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const GenerateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(1000, 'Prompt is too long (max 1000 characters)'),
});

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  message?: string;
}

/**
 * Server Action to generate an image from a prompt using DALL-E 3
 * Returns the generated image URL or an error message
 */
export async function generateImageAction(prompt: string): Promise<GenerateImageResult> {
  // Rate limiting (using a global identifier for MVP)
  const rateLimitResult = await checkRateLimit('global');
  if (!rateLimitResult.success) {
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again in a few moments.',
    };
  }

  // Validate input
  const validatedFields = GenerateImageSchema.safeParse({ prompt });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.issues[0].message,
    };
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return {
      success: false,
      message: 'Image generation is not configured. Please set up your OpenAI API key.',
    };
  }

  try {
    const imageUrl = await generateImage(validatedFields.data.prompt);

    if (!imageUrl) {
      return {
        success: false,
        message: 'Failed to generate image. Please try again.',
      };
    }

    return {
      success: true,
      imageUrl,
    };
  } catch (error) {
    console.error('Error generating image:', error);

    // Extract error message if available
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      success: false,
      message: errorMessage,
    };
  }
}
