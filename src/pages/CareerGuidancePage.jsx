import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Compass, Sparkles, Loader2, BookOpen, FolderGit2, TrendingUp, CheckCircle2, ChevronRight, Target } from 'lucide-react'
import { toast } from 'sonner'

const statusColors = { 'learning': 'success', 'beginner': 'warning', 'not-started': 'secondary' }
const priorityColors = { 'high': 'destructive', 'medium': 'warning', 'low': 'secondary' }

export default function CareerGuidancePage() {
  const [interests, setInterests] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState(null)

  const generate = async () => {
    if (!interests.trim()) return
    setRoadmap(null)
    setLoading(true)
    try {
      const res = await axios.post('/api/ai/career-guidance', { interests })
      setRoadmap(res.data)
      toast.success('Roadmap generated!')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unknown error'
      toast.error(`Failed: ${msg}`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Career <span className="gradient-text">Guidance</span></h1>
        <p className="text-muted-foreground mt-1">Get AI-powered career roadmap and skill recommendations</p>
      </motion.div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Compass className="w-4 h-4" /> Describe your interests & goals</div>
          <Input value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g., I'm a React developer wanting to become a senior frontend engineer..." />
          <Button onClick={generate} disabled={loading || !interests.trim()} className="gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Roadmap</>}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {roadmap && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Overview */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Current Level', value: roadmap.currentLevel, icon: Target },
                { label: 'Target Role', value: roadmap.targetRole, icon: TrendingUp },
                { label: 'Timeline', value: roadmap.timeline, icon: BookOpen },
              ].map(item => (
                <Card key={item.label}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><item.icon className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="font-semibold">{item.value}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skills Roadmap */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Skills to Learn</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {roadmap.skills.map((skill, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{skill.name}</span>
                        <Badge variant={priorityColors[skill.priority]} className="text-[10px]">{skill.priority}</Badge>
                        <Badge variant={statusColors[skill.status]} className="text-[10px]">{skill.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{skill.resources.join(' • ')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Project Suggestions */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FolderGit2 className="w-5 h-5 text-primary" /> Recommended Projects</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roadmap.projects.map((proj, i) => (
                  <Card key={i} className="group hover:shadow-md transition-all hover:-translate-y-1">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1">{proj.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{proj.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {proj.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                      <Badge variant={proj.difficulty === 'Advanced' ? 'warning' : 'secondary'} className="text-[10px]">{proj.difficulty}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
