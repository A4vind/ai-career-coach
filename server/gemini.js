import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Models to try in order — primary is 2.5-flash-lite, fallback is 2.0-flash
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash']

/**
 * Sleep for ms milliseconds
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Call Gemini with automatic retry + model fallback.
 * - Retries up to 3 times on 5xx / network errors (exponential backoff)
 * - Falls back to gemini-2.0-flash if primary model keeps failing
 */
export async function geminiChat(systemPrompt, userMessage) {
  const prompt = `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.\n\nUser request:\n${userMessage}`

  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()

        // Strip any accidental markdown fences
        const cleaned = text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()

        return cleaned
      } catch (err) {
        const status = err?.status || err?.response?.status || 0
        const isRetryable = status === 502 || status === 503 || status === 429 || status === 500 || !status

        console.warn(`[Gemini] ${modelName} attempt ${attempt} failed — status ${status}: ${err.message}`)

        if (attempt < 3 && isRetryable) {
          const delay = attempt * 1500  // 1.5s, 3s
          console.log(`[Gemini] Retrying in ${delay}ms…`)
          await sleep(delay)
          continue
        }

        // Move to fallback model
        console.warn(`[Gemini] Giving up on ${modelName}, trying next model…`)
        break
      }
    }
  }

  throw new Error('All Gemini models failed after retries. Please try again in a moment.')
}

export async function geminiTranscribe(buffer, filename) {
  const audioData = buffer.toString('base64')

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent([
        { text: 'Transcribe the following audio recording. Return ONLY the transcribed text, nothing else.' },
        { inlineData: { mimeType: 'audio/webm', data: audioData } },
      ])
      return result.response.text().trim()
    } catch (err) {
      console.warn(`[Gemini Transcribe] ${modelName} failed: ${err.message}`)
    }
  }

  throw new Error('Transcription failed on all models.')
}
