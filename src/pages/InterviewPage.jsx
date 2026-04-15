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
import { Mic, MicOff, Send, ChevronRight, Sparkles, Loader2, CheckCircle2, Clock, SkipForward, RotateCw, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

const roles = [
  { id: 'frontend', label: 'Frontend Developer', color: 'from-blue-500 to-cyan-400' },
  { id: 'backend', label: 'Backend Developer', color: 'from-emerald-500 to-teal-400' },
  { id: 'fullstack', label: 'Full Stack Developer', color: 'from-purple-500 to-pink-400' },
  { id: 'ai-ml', label: 'AI/ML Engineer', color: 'from-orange-500 to-red-400' },
  { id: 'devops', label: 'DevOps Engineer', color: 'from-amber-500 to-yellow-400' },
  { id: 'hr', label: 'HR / Behavioral', color: 'from-rose-500 to-pink-400' },
]



export default function InterviewPage() {
  const { user, demoMode } = useAuth()
  const [stage, setStage] = useState('select') // select | interview | results
  const [role, setRole] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])

  // TTS Web Speech API
  useEffect(() => {
    if (stage === 'interview' && questions[currentQ]) {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel() // clear queue
      const ut = new SpeechSynthesisUtterance(questions[currentQ])
      ut.rate = 1.05
      
      ut.onstart = () => setIsSpeaking(true)
      ut.onend = () => setIsSpeaking(false)
      ut.onerror = () => setIsSpeaking(false)
      
      // small delay to let UI render before speaking
      setTimeout(() => window.speechSynthesis.speak(ut), 300)
    }
  }, [stage, currentQ, questions])

  const startInterview = async (selectedRole) => {
    setRole(selectedRole)
    setLoading(true)
    try {
      const res = await axios.post('/api/ai/generate-questions', { role: selectedRole.id })
      setQuestions(res.data.questions)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate questions')
      setLoading(false)
      return
    }
    setAnswers([])
    setEvaluations([])
    setCurrentQ(0)
    setCurrentAnswer('')
    setStage('interview')
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return
    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers)
    setLoading(true)
    try {
      const res = await axios.post('/api/ai/evaluate-answer', { question: questions[currentQ], answer: currentAnswer, role: role.id })
      setEvaluations([...evaluations, res.data])
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI Evaluation Failed')
      setEvaluations([...evaluations, { overall: 0, clarity: 0, confidence: 0, relevance: 0, depth: 0, feedback: 'Evaluation failed. Please try again.', strengths: ['N/A'], improvements: ['N/A'] }])
    }
    setLoading(false)
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setCurrentAnswer('')
    } else {
      // Save session to Supabase
      const allEvals = [...evaluations, evaluations[evaluations.length - 1]].filter(Boolean)
      const avg = allEvals.length ? Math.round(allEvals.reduce((a, e) => a + e.overall, 0) / allEvals.length) : 0
      if (!demoMode && user) {
        saveInterviewSession(user.id, role.id, questions, newAnswers, allEvals, avg)
      }
      setStage('results')
    }
  }

  const recognitionRef = useRef(null)

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setCurrentAnswer('Your browser does not support voice transcription. Please type your answer.')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript) {
          setCurrentAnswer(prev => prev + finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setRecording(false)
      }

      recognition.onend = () => {
        setRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setRecording(true)
    } catch (err) {
      console.error('Speech recognition setup failed:', err)
      setCurrentAnswer('(Voice transcription failed to start)')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setRecording(false)
    }
  }

  const avgScore = evaluations.length ? Math.round(evaluations.reduce((a, e) => a + e.overall, 0) / evaluations.length) : 0

  if (stage === 'select') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Mock <span className="gradient-text">Interview</span></h1>
          <p className="text-muted-foreground mt-1">Select a role to start your AI-powered practice session</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group" onClick={() => startInterview(r)}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{r.label}</h3>
                  <p className="text-sm text-muted-foreground">5 questions • ~15 min</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Interview <span className="gradient-text">Results</span></h1>
          <p className="text-muted-foreground mt-1">{role.label} interview completed</p>
        </motion.div>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                <circle cx="64" cy="64" r="56" fill="none" stroke={avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2*Math.PI*56}`} strokeDashoffset={`${2*Math.PI*56*(1-avgScore/100)}`} className="score-ring" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{avgScore}</span>
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {evaluations.map((ev, i) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-sm">Q{i+1}: {questions[i]}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{answers[i]}</p>
              <div className="grid grid-cols-4 gap-2">
                {['clarity','confidence','relevance','depth'].map(k => (
                  <div key={k} className="text-center p-2 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold">{ev[k]}%</div>
                    <div className="text-xs text-muted-foreground capitalize">{k}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm">{ev.feedback}</p>
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-3">
          <Button onClick={() => { setStage('select'); setRole(null) }} variant="outline" className="gap-2"><RotateCw className="w-4 h-4" /> New Interview</Button>
        </div>
      </div>
    )
  }

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
              <div className="flex items-start gap-3 mb-6 relative">
                <div className={`w-8 h-8 rounded-lg ${isSpeaking ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-primary/20 text-primary'} flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-300`}>
                  {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : `Q${currentQ + 1}`}
                </div>
                <p className="text-lg font-medium leading-relaxed flex-1">{questions[currentQ]}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 text-muted-foreground hover:text-primary rounded-full"
                  onClick={() => {
                    const ut = new SpeechSynthesisUtterance(questions[currentQ])
                    window.speechSynthesis.speak(ut)
                  }}
                  title="Replay Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              <Textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder="Type your answer here... or use voice recording" rows={6} className="mb-4" />
              <div className="flex items-center gap-3">
                <Button onClick={recording ? stopRecording : startRecording} variant={recording ? 'destructive' : 'outline'} className="gap-2">
                  {recording ? <><MicOff className="w-4 h-4" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Record Voice</>}
                </Button>
                <div className="flex-1" />
                <Button onClick={submitAnswer} disabled={!currentAnswer.trim() || loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {currentQ < questions.length - 1 ? 'Submit & Next' : 'Finish Interview'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
