# AI Career Pro - Full Project Explanation

## 1. Project Overview
AI Career Pro is a full-stack, AI-powered career coaching application designed to help job seekers build professional resumes, analyze their current resumes against Applicant Tracking Systems (ATS), practice mock interviews with real-time feedback, and receive personalized career guidance roadmaps. The project leverages generative AI (Google Gemini) throughout to provide intelligent, tailored insights.

## 2. Tech Stack
- **Frontend Core**: React 19, Vite, React Router DOM for browser routing.
- **Styling & UI**: Tailwind CSS v4, Shadcn/UI (Radix UI primitives like tabs, dialogs, dropdowns), Framer Motion for smooth entrance animations, and Sonner for toast notifications.
- **Data Visualization**: Recharts for visualizing interview scoring and statistical history.
- **PDF Generation**: `html2pdf.js` to enable clients to download constructed resumes directly from the browser DOM.
- **Backend Core**: Node.js and Express server.
- **Database & Authentication**: Supabase (PostgreSQL) for user management, authentication, and secure data storage using strict Row-Level Security (RLS) policies.
- **AI Integrations**: `@google/generative-ai` (Gemini 2.5 Flash Lite) handles all large language model capabilities including structured JSON prompt responses and voice transcription via multimodal uploads.

## 3. Database Schema (Supabase)
The PostgreSQL database consists of several interconnected tables, protected by RLS (so users only access their own data):
- **profiles:** Extends basic auth to store `full_name`, `avatar_url`, `phone`, `location`, `linkedin`.
- **resumes:** Stores JSON structured data defining user's resumes and template selections.
- **resume_analyses:** Saves past resume ATS reviews, skill gaps, and generated text strengths.
- **interview_sessions:** Logs questions asked, answers given, AI evaluations, and the average score of mock interview sessions.
- **career_roadmaps:** Saves recommended skills, timeline goals, and projects tailored to a user's interests.

## 4. Key AI Features (Gemini Integration)
The application relies heavily on Google's Gemini API via dedicated backend endpoints (`/server/index.js`):
- **Resume Bullet Generation:** Automatically suggests strong action-oriented, quantified bullets for a given role and company.
- **Resume Analysis:** Takes raw text (extracted via `pdf-parse-fork` backend utility or text area) and provides a simulated 0-100 ATS score, section-by-section breakdown, recognized strengths, and actionable skill gaps.
- **Mock Interviews:** Dynamically generates behavioral and technical questions based on the selected role (e.g., Frontend, Fullstack). Evaluates candidate textual or vocal answers for clarity, confidence, relevance, and depth.
- **Voice Transcription:** Uses Gemini's multimodal audio capabilities or the browser's native Web Speech API to allow users to verbalize their mock interview answers naturally.
- **Career Roadmap:** Proposes 5-6 skills grouped by priority with learning resources, alongside 3 structured side projects (beginner to advanced difficulty).

## 5. Main Application Pages
- **Landing Page (`/`)**: Feature highlights, animated statistics, and call-to-actions to start free or log in.
- **Dashboard (`/dashboard`)**: Unified graphical view plotting past interview scores on an AreaChart and summarizing total resumes constructed and ATS scores.
- **Resume Builder (`/resume-builder`)**: Multi-step cohesive form for entering personal, education, skill, and experience details. Integrates AI bullet generation. Offers a real-time Markdown/HTML preview utilizing three styles (Modern, Professional, Creative). Enables direct PDF downloading.
- **Resume Analyzer (`/resume-analyzer`)**: File uploader for existing PDFs. Breaks the ATS score out visually, maps section scores via Progress components, highlights missing skills, and categorizes actionable feedback.
- **Interview Mock (`/interview`)**: Lets the user select an interview domain, provides contextual AI questions, records their response (type or voice), scores them, and eventually provides an aggregated results summary. Read-aloud TTS capabilities (Text-to-Speech) are natively integrated for a lifelike conversational experience.
- **Career Guidance (`/career-guidance`)**: Captures future ambitions to construct a step-by-step roadmap mapping current skills to target aspirations using AI logic.

## 6. How it runs locally
1. **Backend**: Initialize the backend node server by navigating to the `/server` directory, running `npm install`, and executing `node index.js`. It runs on port `3001` and connects to the Gemini API.
2. **Frontend**: Initialize the frontend vite dev server in the project root directory by running `npm install` and `npm run dev`. This launches the React app on port `5173`.
3. **Environment Setup**:
   - Supabase project URL and anon key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are utilized in the frontend `/src/lib/supabase.js`.
   - Google Gemini API key (`GEMINI_API_KEY`) is stored within `/server/.env` for all AI logic.
   - If Supabase environment variables are missing, the app gracefully falls back to a locally simulated **Demo Mode** for uninterrupted UI navigation.
