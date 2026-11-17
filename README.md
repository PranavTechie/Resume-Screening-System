# Resume Screening System: Frontend

AI-powered resume analysis and candidate screening: ATS score, skill-gap detection, job-description matching and candidate ranking, on a credit-based model. Built for single candidates and for recruiters screening dozens of resumes at once.

**Backend repo:** [Resume-Screening-System--Backend-](https://github.com/PranavTechie/Resume-Screening-System--Backend-)

## Features

- **Upload one resume or a batch**: multi-select, drag & drop or one ZIP (up to 50 resumes). Every file is checked in the browser first (type, size, PDF page count, duplicate names) before any credit is spent.
- **Cost confirmation**: "48 resumes will be analyzed = 48 credits. You have 120." Starting is blocked when credits are short, with a link to Pricing. Bulk uploads need a consent tick ("I have permission to process these candidates' data").
- **Live batch progress**: per-file status (Queued / Processing / Done / Failed / Not a resume / Duplicate), progress bar, Retry failed, Cancel. Safe to leave the page; results appear in the library as they finish.
- **Clear rejections, no wasted credits**: non-resumes, over-long documents and duplicates are explained ("This doesn't look like a resume (detected: research paper)") and refunded automatically.
- **Recruiter ranking table**: sort by match / ATS / name, filter by minimum score, skill and status, pagination for 100+ candidates, candidate status (new, shortlisted, on hold, rejected) with bulk actions, blind screening (hides names and contact details, remembered per user), CSV export, "why this score" breakdown.
- **Your data**: Settings → Your data to export everything as JSON or delete all resumes and candidates.
- Light and dark themes, mobile layouts.

## Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · React Router 7 · Motion · Supabase Auth · pdf.js (page count only)

## Run locally

1. Start the backend first (it uses port 3000). See the backend repo README.
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

New users get **10 free credits**. Resume upload + analysis = 1 credit, ranking = 1 credit per resume, AI job description = 1 credit. Rejected files, duplicates, failures and cancelled items are refunded automatically.

AI scores are suggestions. Final hiring decisions should be made by a person.
