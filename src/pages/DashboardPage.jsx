import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { getDashboardStats, getAnalyses, getInterviewSessions, getResumes } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText, Mic, TrendingUp, Target, Brain,
  Clock, Zap, Loader2, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function ScoreRing({ value, size = 100, strokeWidth = 8, color = '#6366f1' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((value || 0) / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={value != null ? color : '#555'} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="score-ring" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value ?? '—'}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, demoMode } = useAuth()
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const [loading, setLoading]           = useState(true)
  const [resumeCount, setResumeCount]   = useState(0)
  const [latestAts, setLatestAts]       = useState(null)
  const [avgInterview, setAvgInterview] = useState(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [chartData, setChartData]       = useState([])
  const [activity, setActivity]         = useState([])

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)

    if (demoMode) {
      // Show empty state in demo mode rather than fake numbers
      setLoading(false)
      return
    }

    try {
      const [stats, analysesRes, sessionsRes, resumesRes] = await Promise.all([
        getDashboardStats(user.id),
        getAnalyses(user.id),
        getInterviewSessions(user.id),
        getResumes(user.id),
      ])

      setResumeCount(stats.resumeCount)
      setLatestAts(stats.latestAtsScore)
      setAvgInterview(stats.avgInterviewScore)
      setSessionCount(stats.interviewSessions?.length || 0)

      // Build chart data from real interview sessions
      const sessions = stats.interviewSessions || []
      const chart = sessions
        .slice(0, 10)
        .reverse()
        .map((s, i) => ({ date: `S${i + 1}`, score: s.average_score || 0, role: s.role }))
      setChartData(chart)

      // Build unified activity feed
      const acts = []
      ;(analysesRes.data || []).slice(0, 4).forEach(a =>
        acts.push({ type: 'analysis', title: `Resume Analysis — ATS ${a.ats_score}%`, score: a.ats_score, time: a.created_at })
      )
      ;(sessionsRes.data || []).slice(0, 4).forEach(s =>
        acts.push({ type: 'interview', title: `${s.role} Interview`, score: s.average_score, time: s.created_at })
      )
      ;(resumesRes.data || []).slice(0, 3).forEach(r =>
        acts.push({ type: 'resume', title: `Resume: ${r.title || 'Untitled'}`, score: null, time: r.updated_at || r.created_at })
      )
      acts.sort((a, b) => new Date(b.time) - new Date(a.time))
      setActivity(acts.slice(0, 6))
    } catch (err) {
      console.error('Dashboard load error:', err)
    }

    setLoading(false)
  }

  const scoreCards = [
    { title: 'Resumes',       value: resumeCount,  suffix: '',  icon: FileText,   color: 'from-blue-500 to-cyan-400' },
    { title: 'ATS Score',     value: latestAts,    suffix: latestAts != null ? '%' : '', icon: Target, color: 'from-orange-500 to-red-400' },
    { title: 'Interview Avg', value: avgInterview, suffix: avgInterview != null ? '%' : '', icon: Mic, color: 'from-purple-500 to-pink-400' },
    { title: 'Sessions',      value: sessionCount, suffix: '',  icon: TrendingUp, color: 'from-emerald-500 to-teal-400' },
  ]

  const tips = [
    { text: 'Build your first resume',              done: resumeCount > 0 },
    { text: 'Analyze your resume for ATS score',    done: latestAts != null },
    { text: 'Complete a mock interview session',    done: sessionCount > 0 },
    { text: 'Reach ATS score above 80%',            done: (latestAts || 0) >= 80 },
    { text: 'Score above 75% in interviews',        done: (avgInterview || 0) >= 75 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{name}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your career progress overview</p>
      </motion.div>

      {/* Score Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map((card) => (
          <Card key={card.title} className="overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                {card.value != null && card.value !== 0 && (
                  <Badge variant="success" className="text-xs">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />Live
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold">
                {card.value ?? '—'}
                <span className="text-lg text-muted-foreground">{card.suffix}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{card.title}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
        {/* Interview Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Interview Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <Mic className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No interview sessions yet</p>
                <p className="text-xs mt-1 opacity-60">Complete a mock interview to see your progress here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Getting Started / Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${tip.done ? 'bg-emerald-500/5' : 'bg-muted/50'}`}>
                <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${tip.done ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                <p className={`text-sm ${tip.done ? 'line-through text-muted-foreground' : ''}`}>{tip.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity + Score Rings */}
      <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length > 0 ? (
              activity.map((act, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    act.type === 'interview' ? 'bg-purple-500/20 text-purple-400' :
                    act.type === 'resume'    ? 'bg-blue-500/20 text-blue-400' :
                                              'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {act.type === 'interview' ? <Mic className="w-4 h-4" /> :
                     act.type === 'resume'    ? <FileText className="w-4 h-4" /> :
                                               <Target className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(act.time)}</p>
                  </div>
                  {act.score != null && (
                    <Badge variant={act.score >= 80 ? 'success' : 'warning'}>{act.score}%</Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
                <Clock className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1 opacity-60">Start by building a resume or taking a mock interview</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> Score Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing value={latestAts} color="#f59e0b" />
                <span className="text-xs text-muted-foreground">ATS Score</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ScoreRing value={avgInterview} color="#6366f1" />
                <span className="text-xs text-muted-foreground">Interview Avg</span>
              </div>
            </div>
            {latestAts == null && avgInterview == null && (
              <p className="text-center text-xs text-muted-foreground mt-2 pb-2">
                Complete activities to see your scores
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
