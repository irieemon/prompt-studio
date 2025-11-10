import { PromptForm } from '@/components/prompt-form';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            Prompt Studio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate copyright-safe AI images with confidence. Our tool checks your
            prompts for violations and suggests safe alternatives.
          </p>
        </div>

        <PromptForm />

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Powered by Supabase • OpenAI • Next.js
          </p>
        </div>
      </div>
    </div>
  );
}
