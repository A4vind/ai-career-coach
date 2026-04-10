import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText, Mic, TrendingUp, Target, Award, Brain,
  ArrowUpRight, CheckCircle2, Clock, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar
} from 'recharts'

const interviewData = [
  { date: 'Week 1', score: 45 },
  { date: 'Week 2', score: 52 },
  { date: 'Week 3', score: 68 },
  { date: 'Week 4', score: 72 },
  { date: 'Week 5', score: 78 },
  { date: 'Week 6', score: 85 },
]

const skillsData = [
  { name: 'React', score: 85 },
  { name: 'Node.js', score: 72 },
  { name: 'Python', score: 60 },
  { name: 'SQL', score: 78 },
  { name: 'System Design', score: 55 },
]

const recentActivity = [
  { type: 'interview', title: 'Frontend Mock Interview', score: 82, time: '2 hours ago' },
  { type: 'resume', title: 'Resume Updated', score: null, time: '1 day ago' },
  { type: 'interview', title: 'Backend Mock Interview', score: 75, time: '3 days ago' },
  { type: 'analysis', title: 'Resume Analysis', score: 78, time: '5 days ago' },
]

const scoreCards = [
  { title: 'Resume Score', value: 78, icon: FileText, color: 'from-blue-500 to-cyan-400', change: '+5' },
  { title: 'Interview Avg', value: 82, icon: Mic, color: 'from-purple-500 to-pink-400', change: '+12' },
  { title: 'Skills Growth', value: 65, icon: TrendingUp, color: 'from-emerald-500 to-teal-400', change: '+8' },
  { title: 'ATS Score', value: 72, icon: Target, color: 'from-orange-500 to-red-400', change: '+3' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function ScoreRing({ value, size = 100, strokeWidth = 8, color = '#6366f1' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="score-ring" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name || 'User'

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
                <Badge variant="success" className="text-xs">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />{card.change}
                </Badge>
              </div>
              <div className="text-3xl font-bold">{card.value}<span className="text-lg text-muted-foreground">%</span></div>
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
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={interviewData}>
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
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> Skills Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsData.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <span className="text-sm text-muted-foreground">{skill.score}%</span>
                </div>
                <Progress value={skill.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity + Suggestions */}
      <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((act, i) => (
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
                  <p className="text-xs text-muted-foreground">{act.time}</p>
                </div>
                {act.score && (
                  <Badge variant={act.score >= 80 ? 'success' : 'warning'}>{act.score}%</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: 'Add quantifiable achievements to your resume', done: false },
              { text: 'Practice system design interview questions', done: false },
              { text: 'Complete a full mock interview this week', done: true },
              { text: 'Update your skills section with latest tech', done: false },
              { text: 'Review STAR method for behavioral questions', done: true },
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
