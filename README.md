# Prompt Studio

A copyright-safe AI image prompt checker and generator. This tool helps you detect copyright violations in your image generation prompts and suggests safe alternatives.

## Features

- 🔍 **Copyright Detection**: Automatically scans prompts for copyrighted characters, brands, trademarks, and artworks
- 🎨 **Multi-Tier Severity System**: Classifies violations as severe (blocking), moderate (warning), or minor (suggestion)
- 💡 **Smart Suggestions**: Provides copyright-safe alternatives for flagged terms
- 🚀 **Rule-Based + LLM Hybrid**: Fast pattern matching with optional AI-powered rewriting
- ⚡ **Built with Modern Stack**: Next.js 15, TypeScript, Tailwind CSS, Supabase, OpenAI
- 📊 **30+ Copyright Patterns**: Pre-loaded database of common copyrighted terms

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Optional: OpenAI API key (for Phase 2 - image generation)
- Optional: Upstash Redis (for rate limiting)

### Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Set Up Supabase**

Apply the database migration to create the copyright_patterns table:

```bash
# If using local Supabase
supabase start
supabase db push

# If using hosted Supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

3. **Configure Environment Variables**

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials (see `.env.local.example` for details).

4. **Run the Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **User enters a prompt** for image generation
2. **Two-stage detection**: Exact pattern matching + fuzzy full-text search
3. **Violations displayed** with severity badges and explanations
4. **Suggestions provided** for copyright-safe alternatives
5. **(Phase 2)** Generate image with approved prompt

## Deployment

Deploy to Vercel with one command:

```bash
vercel --prod
```

Don't forget to add your environment variables in the Vercel dashboard!

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (PostgreSQL), OpenAI, Upstash Redis
- shadcn/ui components

## License

MIT

