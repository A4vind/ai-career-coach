import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { saveInterviewSession } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Mic, MicOff, Send, ChevronRight, Sparkles, Loader2,
  CheckCircle2, Clock, RotateCw, Volume2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

const roles = [
  { id: 'frontend',  label: 'Frontend Developer',  color: 'from-blue-500 to-cyan-400'    },
  { id: 'backend',   label: 'Backend Developer',    color: 'from-emerald-500 to-teal-400' },
  { id: 'fullstack', label: 'Full Stack Developer', color: 'from-purple-500 to-pink-400'  },
  { id: 'ai-ml',     label: 'AI/ML Engineer',       color: 'from-orange-500 to-red-400'   },
  { id: 'devops',    label: 'DevOps Engineer',      color: 'from-amber-500 to-yellow-400' },
  { id: 'hr',        label: 'HR / Behavioral',      color: 'from-rose-500 to-pink-400'    },
]

export default function InterviewPage() {
  const { user, demoMode } = useAuth()
  const [stage, setStage]               = useState('select')
  const [role, setRole]                 = useState(null)
  const [questions, setQuestions]       = useState([])
  const [currentQ, setCurrentQ]         = useState(0)
  const [answers, setAnswers]           = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [evaluations, setEvaluations]   = useState([])
  const [loading, setLoading]           = useState(false)
  const [loadingQ, setLoadingQ]         = useState(false)  // for question generation
  const [recording, setRecording]       = useState(false)
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [apiError, setApiError]         = useState('')
  const recognitionRef = useRef(null)

  // TTS — read question aloud when it changes
  useEffect(() => {
    if (stage !== 'interview' || !questions[currentQ]) return
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const ut = new SpeechSynthesisUtterance(questions[currentQ])
    ut.rate = 1.05
    ut.onstart = () => setIsSpeaking(true)
    ut.onend   = () => setIsSpeaking(false)
    ut.onerror = () => setIsSpeaking(false)
    setTimeout(() => window.speechSynthesis.speak(ut), 300)
  }, [stage, currentQ, questions])

  const startInterview = async (selectedRole) => {
    setRole(selectedRole)
    setLoadingQ(true)
    setApiError('')
    try {
      const res = await axios.post('/api/ai/generate-questions', { role: selectedRole.id })
      setQuestions(res.data.questions)
      setAnswers([])
      setEvaluations([])
      setCurrentQ(0)
      setCurrentAnswer('')
      setStage('interview')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate questions'
      setApiError(`Could not generate questions: ${msg}. Make sure the backend is running on port 3001.`)
      toast.error('Failed to generate interview questions')
    }
    setLoadingQ(false)
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return
    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers)
    setLoading(true)

    let evaluation = null
    try {
      const res = await axios.post('/api/ai/evaluate-answer', {
        question: questions[currentQ],
        answer: currentAnswer,
        role: role.id,
      })
      evaluation = res.data
    } catch (err) {
      // Show the real error — do NOT silently fallback to fake scores
      const msg = err.response?.data?.error || err.message || 'Evaluation failed'
      toast.error(`Evaluation failed: ${msg}`)
      setLoading(false)
      return  // stop here — don't advance to next question with no evaluation
    }

    const newEvaluations = [...evaluations, evaluation]
    setEvaluations(newEvaluations)
    setLoading(false)

    const isLast = currentQ >= questions.length - 1

    if (!isLast) {
      setCurrentQ(currentQ + 1)
      setCurrentAnswer('')
    } else {
      // All questions answered — save session to Supabase
      const avg = newEvaluations.length
        ? Math.round(newEvaluations.reduce((a, e) => a + (e.overall || 0), 0) / newEvaluations.length)
        : 0

      if (!demoMode && user) {
        const { error } = await saveInterviewSession(
          user.id, role.id, questions, newAnswers, newEvaluations, avg
        )
        if (error) {
          console.warn('Failed to save interview session:', error)
          toast.warning('Interview complete, but session could not be saved.')
        } else {
          toast.success('Interview session saved!')
        }
      }
      setStage('results')
    }
  }

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        toast.error('Your browser does not support voice recording. Please type your answer.')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' '
        }
        if (finalTranscript) setCurrentAnswer(prev => prev + finalTranscript)
      }
      recognition.onerror = (e) => { console.error('Speech error:', e.error); setRecording(false) }
      recognition.onend   = () => setRecording(false)
      recognition.start()
      recognitionRef.current = recognition
      setRecording(true)
    } catch (err) {
      toast.error('Voice recording failed to start. Please type your answer.')
    }
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((a, e) => a + (e.overall || 0), 0) / evaluations.length)
    : 0

  // ── Stage: Select Role ──────────────────────────────────
  if (stage === 'select') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Mock <span className="gradient-text">Interview</span></h1>
          <p className="text-muted-foreground mt-1">Select a role to start your AI-powered practice session</p>
        </motion.div>

        {apiError && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Could not start interview</p>
              <p className="text-xs mt-1 opacity-80">{apiError}</p>
            </div>
          </div>
        )}

        {loadingQ && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 text-primary">
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            <span className="text-sm">Generating AI questions for {role?.label}…</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card
                className={`cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group ${loadingQ ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !loadingQ && startInterview(r)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{r.label}</h3>
                  <p className="text-sm text-muted-foreground">5 AI questions • ~15 min</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // ── Stage: Results ──────────────────────────────────────
  if (stage === 'results') {
    const scoreColor = avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444'
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Interview <span className="gradient-text">Results</span></h1>
          <p className="text-muted-foreground mt-1">{role.label} — {evaluations.length} question{evaluations.length !== 1 ? 's' : ''} evaluated</p>
        </motion.div>

        {/* Overall score ring */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                <circle cx="64" cy="64" r="56" fill="none" stroke={scoreColor}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - avgScore / 100)}`}
                  className="score-ring" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{avgScore}</span>
                <span className="text-xs text-muted-foreground">Overall</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Session saved to your profile ✓</p>
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        {evaluations.map((ev, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Q{i + 1}: {questions[i]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm bg-muted/50 p-3 rounded-lg italic">"{answers[i]}"</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['clarity', 'confidence', 'relevance', 'depth'].map(k => (
                  <div key={k} className="text-center p-2 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold">{ev[k] ?? '—'}%</div>
                    <div className="text-xs text-muted-foreground capitalize">{k}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm">{ev.feedback}</p>
              {ev.strengths?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ev.strengths.map((s, j) => (
                    <Badge key={j} variant="success" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
              {ev.improvements?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ev.improvements.map((imp, j) => (
                    <Badge key={j} variant="warning" className="text-xs">{imp}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button onClick={() => { setStage('select'); setRole(null); setApiError('') }} variant="outline" className="gap-2">
            <RotateCw className="w-4 h-4" /> New Interview
          </Button>
        </div>
      </div>
    )
  }

  // ── Stage: Interview In Progress ────────────────────────
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{role.label} <span className="gradient-text">Interview</span></h1>
            <p className="text-muted-foreground mt-1">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <Badge variant="outline" className="text-sm"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 mt-4" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              {/* Question */}
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-300 ${
                  isSpeaking ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-primary/20 text-primary'
                }`}>
                  {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : `Q${currentQ + 1}`}
                </div>
                <p className="text-lg font-medium leading-relaxed flex-1">{questions[currentQ]}</p>
                <Button
                  variant="ghost" size="icon"
                  className="shrink-0 text-muted-foreground hover:text-primary rounded-full"
                  onClick={() => {
                    const ut = new SpeechSynthesisUtterance(questions[currentQ])
                    window.speechSynthesis.cancel()
                    window.speechSynthesis.speak(ut)
                  }}
                  title="Replay question"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>

              <Textarea
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here… or use voice recording below"
                rows={6}
                className="mb-4"
              />

              <div className="flex items-center gap-3">
                <Button
                  onClick={recording ? stopRecording : startRecording}
                  variant={recording ? 'destructive' : 'outline'}
                  className="gap-2"
                >
                  {recording
                    ? <><MicOff className="w-4 h-4" /> Stop Recording</>
                    : <><Mic className="w-4 h-4" /> Record Voice</>}
                </Button>
                <div className="flex-1" />
                <Button onClick={submitAnswer} disabled={!currentAnswer.trim() || loading} className="gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
                    : <><Send className="w-4 h-4" /> {currentQ < questions.length - 1 ? 'Submit & Next' : 'Finish Interview'}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
