# Setup Guide - Prompt Studio

## Quick Start (5 minutes)

### Step 1: Create Supabase Project

1. **Go to** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Click** "New Project"
3. **Fill in**:
   - Organization: Choose or create one
   - Name: `prompt-studio`
   - Database Password: Generate a secure one (save it!)
   - Region: Choose closest to you
4. **Click** "Create new project" and wait ~2 minutes

### Step 2: Get Your Credentials

1. In your new Supabase project, go to **Project Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 3: Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 4: Set Up Database

Run the migration to create the copyright_patterns table with seed data:

```bash
cd "/Users/sean.mcinerney/Documents/claude projects/prompt-studio"

# Link your Supabase project (use the ref from your project URL)
supabase link --project-ref YOUR_PROJECT_REF

# Push the database schema and seed data
supabase db push
```

When prompted:
- Database password: Use the password you created in Step 1

### Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test it out!

Try entering: "Create an image of Mickey Mouse wearing a Disney shirt"

---

## Optional Enhancements

### Add OpenAI (for Phase 2 features)

1. Get API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to `.env.local`:

```env
OPENAI_API_KEY=sk-your-actual-key
```

### Add Rate Limiting

1. Create free account at [https://upstash.com](https://upstash.com)
2. Create a Redis database
3. Get credentials and add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## Troubleshooting

### "Missing Supabase environment variables"

Make sure `.env.local` has the correct values from your Supabase project.

### "Failed to check copyright patterns"

1. Verify your Supabase credentials are correct
2. Check that the migration was applied: Run `supabase db push` again
3. Go to your Supabase dashboard → Table Editor → Check if `copyright_patterns` table exists

### "Cannot connect to Supabase"

1. Check your internet connection
2. Verify the project URL is correct (should end in `.supabase.co`)
3. Try regenerating the anon key in Supabase dashboard

### Database Migration Issues

If `supabase db push` fails:

1. Make sure you're linked: `supabase link --project-ref YOUR_REF`
2. Check database password is correct
3. Try manual setup:
   - Go to Supabase Dashboard → SQL Editor
   - Paste the contents of `supabase/migrations/20251110154855_copyright_patterns_schema.sql`
   - Click "Run"

---

## Next Steps

Once everything is running:

1. **Test the detection**: Try various prompts with copyrighted terms
2. **Add more patterns**: Go to Supabase dashboard → Table Editor → `copyright_patterns` → Insert new rows
3. **Deploy to Vercel**: Run `vercel --prod` to get a live URL
4. **Enable OpenAI**: Add image generation capabilities (Phase 2)

---

## Architecture Overview

```
User submits prompt
    ↓
Next.js Server Action (check-prompt.ts)
    ↓
Query Supabase (copyright_patterns table)
    ↓
Pattern matching (exact + fuzzy)
    ↓
Return violations with suggestions
    ↓
Display results to user
```

## Database Structure

The `copyright_patterns` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pattern | TEXT | Copyrighted term (e.g., "Mickey Mouse") |
| pattern_type | ENUM | exact, fuzzy, or regex |
| severity | ENUM | severe, moderate, or minor |
| category | ENUM | character, brand, trademark, artwork, style |
| replacement_suggestion | TEXT | Safe alternative |
| explanation | TEXT | Why it's copyrighted |
| active | BOOLEAN | Enable/disable pattern |

---

## Cost Breakdown

### Free Tier (Perfect for MVP)

- **Supabase**: 500MB database, 2GB bandwidth (free)
- **Vercel**: Unlimited deployments (free)
- **Upstash**: 10K commands/day (free)

### Paid Features (Optional)

- **OpenAI**: ~$0.04 per image generated with DALL-E 3
- **Supabase Pro**: $25/month (only if you exceed free tier)

**Estimated monthly cost for 1000 users: $0-20**

---

## Support

If you run into issues:

1. Check this guide's troubleshooting section
2. Review the README.md for additional details
3. Check Supabase logs: Dashboard → Logs
4. Verify environment variables are loaded: Add `console.log(process.env)` in a Server Component

---

**Happy building! 🚀**
