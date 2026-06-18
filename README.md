# Ironman Lab V1.4

Upload only these files/folders to GitHub:
- src
- index.html
- package.json
- package-lock.json
- README.md
- supabase.sql / supabase_v1_1.sql if needed

Do NOT upload node_modules or dist.

V1.4 adds:
- quick planned workout templates
- standalone sweat-rate calculator
- race simulation tracker
- improved Garmin screenshot workflow with copyable AI analysis prompt
- calendar/workout flow from V1.3


## V1.5 AI Screenshot Backend

This version adds a Netlify Function at `netlify/functions/analyze-garmin.js`.

Add this Netlify environment variable before deploying:

- `OPENAI_API_KEY` = your OpenAI API key

Optional:

- `OPENAI_MODEL` = `gpt-4o-mini` by default

Then redeploy the site. The AI Screenshots tab will send Garmin screenshots to the Netlify function and return extracted workout fields plus a coach report.
