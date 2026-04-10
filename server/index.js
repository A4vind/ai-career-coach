import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse-fork')
import { geminiChat, geminiTranscribe } from './gemini.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// PDF Text Extraction
app.post('/api/ai/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No PDF file uploaded')
    const data = await pdfParse(req.file.buffer)
    res.json({ text: data.text })
  } catch (err) {
    console.error('PDF Parse error:', err)
    res.status(500).json({ error: err.message })
  }
})

// AI Resume Analysis
app.post('/api/ai/analyze-resume', async (req, res) => {
  try {
    const { resumeText } = req.body
    const result = await geminiChat(
      'You are a professional resume analyzer. Analyze the resume and return JSON with: atsScore (0-100), overallRating (string), strengths (array of strings), weaknesses (array of strings), skillGaps (array of {skill, priority} where priority is high/medium/low), suggestions (array of strings), sections (object with keys contact/experience/education/skills/projects each having score (number) and feedback (string)).',
      `Analyze this resume:\n\n${resumeText}`
    )
    res.json(JSON.parse(result))
  } catch (err) {
    console.error('Resume analysis error:', err)
    res.status(500).json({ error: err.message })
  }
})

// AI Bullet Points
app.post('/api/ai/generate-bullets', async (req, res) => {
  try {
    const { role, company } = req.body
    const result = await geminiChat(
      'Generate 4 professional resume bullet points for the given role. Each bullet should start with a strong action verb and include quantifiable metrics where possible. Return JSON: { "bullets": ["string1", "string2", "string3", "string4"] }',
      `Role: ${role} at ${company}`
    )
    res.json(JSON.parse(result))
  } catch (err) {
    console.error('Bullet generation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Generate Interview Questions
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const { role } = req.body
    const result = await geminiChat(
      'Generate 5 interview questions for the given role. Mix technical and behavioral questions. Return JSON: { "questions": ["question1", "question2", "question3", "question4", "question5"] }',
      `Role: ${role}`
    )
    res.json(JSON.parse(result))
  } catch (err) {
    console.error('Question generation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Evaluate Interview Answer
app.post('/api/ai/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, role } = req.body
    const result = await geminiChat(
      `You are a strict, senior technical interviewer for a ${role} position. Evaluate the candidate's answer to the question.
      
CRITICAL INSTRUCTIONS:
1. FACTUAL ACCURACY IS PARAMOUNT. If the answer is hallucinated, factually incorrect, or fundamentally misunderstands the concept, the overall score MUST be below 40.
2. Penalize heavily for generic "fluff" or evasive answers.
3. A perfect answer (95+) must be completely accurate, deeply detailed, and show practical understanding.
      
Return JSON with: 
- overall (0-100)
- clarity (0-100)
- confidence (0-100)
- relevance (0-100)
- depth (0-100)
- feedback (string with 2-3 blunt, honest sentences)
- strengths (array of 2 strings)
- improvements (array of 2 strings).`,
      `Question: ${question}\nCandidate Answer: ${answer}`
    )
    res.json(JSON.parse(result))
  } catch (err) {
    console.error('Answer evaluation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Career Guidance
app.post('/api/ai/career-guidance', async (req, res) => {
  try {
    const { interests } = req.body
    const result = await geminiChat(
      'Create a career roadmap. Return JSON: { "currentLevel": "string", "targetRole": "string", "timeline": "string", "skills": [{"name": "string", "priority": "high/medium/low", "status": "not-started/beginner/learning", "resources": ["string"]}], "projects": [{"name": "string", "description": "string", "difficulty": "Beginner/Intermediate/Advanced", "skills": ["string"]}] }. Include 5-6 skills and 3 projects.',
      `Interests and goals: ${interests}`
    )
    res.json(JSON.parse(result))
  } catch (err) {
    console.error('Career guidance error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Voice Transcription (Gemini multimodal)
app.post('/api/ai/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const text = await geminiTranscribe(req.file.buffer, req.file.originalname || 'audio.webm')
    res.json({ text })
  } catch (err) {
    console.error('Transcription error:', err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 AI Career Pro server running on port ${PORT}`))
// Reload triggered
