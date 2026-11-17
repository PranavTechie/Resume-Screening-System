# Resume Screening System – Frontend

AI-powered resume analysis and candidate screening platform: ATS score, skill-gap detection, job-description matching and candidate ranking, on a credit-based model.

**Backend repo:** [Resume-Screening-System--Backend-](https://github.com/PranavTechie/Resume-Screening-System--Backend-)

## Tech stack
React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · React Router 7 · Motion · Supabase Auth

## Run locally
1. Start the backend first (it uses port 3000).
2. Install and configure:
   ```bash
   npm install
   cp .env.example .env   # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
   ```
3. Run:
   ```bash
   npm run dev            # Vite moves to port 3001 when 3000 is taken
   ```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Type-check (`tsc --noEmit`) |

## Credits model
New users get **10 free credits**. Resume upload + analysis = 1 credit, ranking = 1 credit per resume, AI job description = 1 credit.
