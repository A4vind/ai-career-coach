import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Search, Sparkles, Target, AlertTriangle, TrendingUp, CheckCircle2, XCircle, Loader2, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'

const mockAnalysis = {
  atsScore: 72, overallRating: 'Good',
  strengths: ['Strong technical skills section', 'Quantifiable achievements', 'Clear formatting', 'Relevant projects'],
  weaknesses: ['Missing professional summary', 'Education lacks coursework', 'No soft skills mentioned', 'Some bullets lack action verbs'],
  skillGaps: [
    { skill: 'Cloud Computing (AWS/GCP)', priority: 'high' },
    { skill: 'CI/CD Pipelines', priority: 'high' },
    { skill: 'System Design', priority: 'medium' },
    { skill: 'Leadership', priority: 'medium' },
  ],
  suggestions: ['Add a professional summary', 'Use strong action verbs', 'Include metrics and percentages', 'Add certifications', 'Tailor keywords to job descriptions', 'Include portfolio links'],
  sections: {
    contact: { score: 90, feedback: 'Well-formatted' },
    experience: { score: 75, feedback: 'Needs more metrics' },
    education: { score: 60, feedback: 'Missing coursework' },
    skills: { score: 85, feedback: 'Comprehensive' },
    projects: { score: 70, feedback: 'Add outcomes' },
  },
}

const scoreColor = (s) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
const scoreGrad = (s) => s >= 80 ? 'from-emerald-500 to-teal-400' : s >= 60 ? 'from-amber-500 to-orange-400' : 'from-red-500 to-pink-400'

export default function ResumeAnalyzerPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF file')
      return
    }
    setUploadingPdf(true)
    const formData = new FormData()
    formData.append('pdf', file)
    try {
      toast.loading('Extracting text from PDF...', { id: 'pdf' })
      const res = await axios.post('/api/ai/parse-pdf', formData)
      setText(res.data.text)
      toast.success('PDF text extracted! You can now analyze it.', { id: 'pdf' })
    } catch (err) {
      toast.error('Failed to parse PDF', { id: 'pdf' })
    }
    setUploadingPdf(false)
    e.target.value = '' // reset input
  }

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await axios.post('/api/ai/analyze-resume', { resumeText: text })
      setAnalysis(res.data)
      toast.success('Analysis complete!')
    } catch { 
      setAnalysis(mockAnalysis)
      toast.error('AI Analysis failed, showing demo data')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Resume <span className="gradient-text">Analyzer</span></h1>
        <p className="text-muted-foreground mt-1">Get AI-powered insights to improve your resume</p>
      </motion.div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" /> Paste your resume text OR upload a PDF
            </div>
            <div className="relative">
              <Button variant="secondary" className="gap-2 relative overflow-hidden" disabled={uploadingPdf}>
                {uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                <Input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </Button>
            </div>
          </div>
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your entire resume content here... or use the Upload PDF button above" rows={8} className="font-mono text-xs shadow-inner" />
          <Button onClick={analyze} disabled={loading || !text.trim()} className="gap-2 w-full sm:w-auto">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Resume</>}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* ATS Score + Section Scores */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg width="128" height="128" className="-rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                      <circle cx="64" cy="64" r="56" fill="none" stroke={analysis.atsScore >= 80 ? '#10b981' : analysis.atsScore >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.atsScore / 100)}`} className="score-ring" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${scoreColor(analysis.atsScore)}`}>{analysis.atsScore}</span>
                      <span className="text-xs text-muted-foreground">ATS Score</span>
                    </div>
                  </div>
                  <Badge className="mt-4" variant={analysis.atsScore >= 80 ? 'success' : 'warning'}>{analysis.overallRating}</Badge>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Section Scores</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.sections).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium capitalize">{k}</span>
                        <span className={`text-sm font-semibold ${scoreColor(v.score)}`}>{v.score}%</span>
                      </div>
                      <Progress value={v.score} className="h-2" indicatorClassName={`bg-gradient-to-r ${scoreGrad(v.score)}`} />
                      <p className="text-xs text-muted-foreground mt-1">{v.feedback}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-5 h-5" /> Strengths</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span className="text-sm">{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-amber-400"><AlertTriangle className="w-5 h-5" /> Areas to Improve</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5">
                      <XCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><span className="text-sm">{w}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Skill Gaps + Suggestions */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Skill Gaps</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.skillGaps.map((sg, i) => <Badge key={i} variant={sg.priority === 'high' ? 'destructive' : 'warning'}>{sg.skill}</Badge>)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Suggestions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 font-semibold">{i + 1}</span>
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
