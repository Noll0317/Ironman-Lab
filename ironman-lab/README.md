# Ironman Lab

Maryland Mission Control: training log, fueling log, heat/cramp/gut tracking, weekly dashboard, and experiment tracker.

## Deploy
1. Upload this folder to GitHub.
2. Connect the repo to Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`

## Supabase
Run `supabase.sql` in Supabase SQL editor.
Then add Netlify environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without Supabase, the app still runs using browser localStorage for testing.
