import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function geminiChat(systemPrompt, userMessage) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.\n\nUser request:\n${userMessage}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip any markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return cleaned
}

export async function geminiTranscribe(buffer, filename) {
  // Gemini doesn't have a direct Whisper-like API, so we'll use Gemini's
  // multimodal capability for audio understanding
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const audioData = buffer.toString('base64')

  const result = await model.generateContent([
    { text: 'Transcribe the following audio recording. Return ONLY the transcribed text, nothing else.' },
    {
      inlineData: {
        mimeType: 'audio/webm',
        data: audioData,
      },
    },
  ])

  return result.response.text().trim()
}
