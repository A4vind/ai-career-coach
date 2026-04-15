import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { getDashboardStats, getAnalyses, getInterviewSessions, getResumes } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText, Mic, TrendingUp, Target, Brain,
  ArrowUpRight, CheckCircle2, Clock, Zap, Loader2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const { user, demoMode } = useAuth()
  const name = user?.user_metadata?.full_name || 'User'

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    resumeCount: 0,
    latestAtsScore: null,
    avgInterviewScore: null,
    interviewCount: 0,
  })
  const [interviewChartData, setInterviewChartData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (!user) return
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)

    if (demoMode) {
      // Demo mode: show empty state
      setStats({ resumeCount: 0, latestAtsScore: null, avgInterviewScore: null, interviewCount: 0 })
      setInterviewChartData([])
      setRecentActivity([])
      setLoading(false)
      return
    }

    try {
      // Fetch all data in parallel
      const [dashStats, analysesRes, sessionsRes, resumesRes] = await Promise.all([
        getDashboardStats(user.id),
        getAnalyses(user.id),
        getInterviewSessions(user.id),
        getResumes(user.id),
      ])

      // Stats
      setStats({
        resumeCount: dashStats.resumeCount,
        latestAtsScore: dashStats.latestAtsScore,
        avgInterviewScore: dashStats.avgInterviewScore,
        interviewCount: dashStats.interviewSessions?.length || 0,
      })

      // Interview chart data (last 10 sessions, oldest first)
      const sessions = dashStats.interviewSessions || []
      const chartData = sessions
        .slice(0, 10)
        .reverse()
        .map((s, i) => ({
          date: `Session ${i + 1}`,
          score: s.average_score || 0,
          role: s.role,
        }))
      setInterviewChartData(chartData)

      // Build recent activity from all sources
      const activities = []

      // Add resume analyses
      const analyses = analysesRes.data || []
      analyses.slice(0, 5).forEach(a => {
        activities.push({
          type: 'analysis',
          title: `Resume Analysis — ATS: ${a.ats_score}%`,
          score: a.ats_score,
          time: a.created_at,
        })
      })

      // Add interview sessions
      const interviewSessions = sessionsRes.data || []
      interviewSessions.slice(0, 5).forEach(s => {
        activities.push({
          type: 'interview',
          title: `${s.role} Interview`,
          score: s.average_score,
          time: s.created_at,
        })
      })

      // Add resumes
      const resumes = resumesRes.data || []
      resumes.slice(0, 3).forEach(r => {
        activities.push({
          type: 'resume',
          title: `Resume: ${r.title || 'Untitled'}`,
          score: null,
          time: r.updated_at || r.created_at,
        })
      })

      // Sort by time (newest first) and take top 6
      activities.sort((a, b) => new Date(b.time) - new Date(a.time))
      setRecentActivity(activities.slice(0, 6))
    } catch (err) {
      console.error('Dashboard data error:', err)
    }

    setLoading(false)
  }

  const scoreCards = [
    {
      title: 'Resumes',
      value: stats.resumeCount,
      suffix: '',
      icon: FileText,
      color: 'from-blue-500 to-cyan-400',
    },
    {
      title: 'Interview Avg',
      value: stats.avgInterviewScore ?? '—',
      suffix: stats.avgInterviewScore != null ? '%' : '',
      icon: Mic,
      color: 'from-purple-500 to-pink-400',
    },
    {
      title: 'Interviews Done',
      value: stats.interviewCount,
      suffix: '',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-400',
    },
    {
      title: 'ATS Score',
      value: stats.latestAtsScore ?? '—',
      suffix: stats.latestAtsScore != null ? '%' : '',
      icon: Target,
      color: 'from-orange-500 to-red-400',
    },
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
        <h1 className="text-3xl font-bold">Welcome back, <span className="gradient-text">{name}</span> 👋</h1>
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
              </div>
              <div className="text-3xl font-bold">{card.value}<span className="text-lg text-muted-foreground">{card.suffix}</span></div>
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
            {interviewChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={interviewChartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
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
                  <Area
                    type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    fillOpacity={1} fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <Mic className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No interview sessions yet</p>
                <p className="text-xs">Complete a mock interview to see your progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    act.type === 'interview' ? 'bg-purple-500/20 text-purple-400' :
                    act.type === 'resume' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {act.type === 'interview' ? <Mic className="w-4 h-4" /> :
                     act.type === 'resume' ? <FileText className="w-4 h-4" /> :
                     <Target className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(act.time)}</p>
                  </div>
                  {act.score != null && (
                    <Badge variant={act.score >= 80 ? 'success' : act.score >= 60 ? 'warning' : 'destructive'}>{act.score}%</Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Clock className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs">Start by building a resume or taking a mock interview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: 'Build your resume using the AI Resume Builder', done: stats.resumeCount > 0 },
              { text: 'Analyze your resume for ATS compatibility', done: stats.latestAtsScore != null },
              { text: 'Complete a mock interview session', done: stats.interviewCount > 0 },
              { text: 'Aim for an ATS score above 80%', done: (stats.latestAtsScore || 0) >= 80 },
              { text: 'Score above 75% average in interviews', done: (stats.avgInterviewScore || 0) >= 75 },
            ].map((tip, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${tip.done ? 'bg-emerald-500/5' : 'bg-muted/50'}`}>
                <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${tip.done ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                <p className={`text-sm ${tip.done ? 'line-through text-muted-foreground' : ''}`}>{tip.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
