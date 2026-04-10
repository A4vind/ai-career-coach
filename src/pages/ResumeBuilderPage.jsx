import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { saveResume, getResumes } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User as UserIcon, GraduationCap, Wrench, Briefcase, FolderGit2,
  Plus, Trash2, Download, Sparkles, ChevronRight, ChevronLeft, Eye, Save, Loader2, Image as ImageIcon
} from 'lucide-react'

const steps = [
  { id: 'personal', label: 'Personal', icon: UserIcon },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
]

const defaultData = {
  fullName: '', email: '', phone: '', location: '', summary: '', linkedin: '',
  education: [{ school: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' }],
  skills: '',
  experience: [{ company: '', role: '', startDate: '', endDate: '', bullets: [''] }],
  projects: [{ name: '', description: '', tech: '', link: '' }],
}

function ModernTemplate({ data }) {
  return (
    <div className="bg-white text-gray-900 p-8 text-sm leading-relaxed" id="resume-preview">
      <div className="border-b-2 border-indigo-500 pb-4 mb-6 flex gap-6 items-center">
        {data.profileImage && <img src={data.profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100 shrink-0" />}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.fullName || 'Your Name'}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-gray-600 text-xs">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>• {data.phone}</span>}
            {data.location && <span>• {data.location}</span>}
            {data.linkedin && <span>• {data.linkedin}</span>}
          </div>
          {data.summary && <p className="mt-3 text-gray-700 text-xs">{data.summary}</p>}
        </div>
      </div>

      {data.experience?.some(e => e.company) && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Experience</h2>
          {data.experience.filter(e => e.company).map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold">{exp.role}</h3>
                <span className="text-xs text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              <p className="text-gray-600 text-xs">{exp.company}</p>
              <ul className="mt-1 space-y-0.5 list-disc pl-4 text-xs">
                {exp.bullets?.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.education?.some(e => e.school) && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Education</h2>
          {data.education.filter(e => e.school).map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <h3 className="font-semibold">{edu.school}</h3>
                <span className="text-xs text-gray-500">{edu.startYear} – {edu.endYear}</span>
              </div>
              <p className="text-xs text-gray-600">{edu.degree} in {edu.field} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
            </div>
          ))}
        </div>
      )}

      {data.skills && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.split(',').map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{s.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {data.projects?.some(p => p.name) && (
        <div>
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Projects</h2>
          {data.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} className="mb-3">
              <h3 className="font-semibold">{proj.name}</h3>
              <p className="text-xs text-gray-600">{proj.description}</p>
              {proj.tech && <p className="text-xs text-gray-500 mt-0.5">Tech: {proj.tech}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfessionalTemplate({ data }) {
  return (
    <div className="bg-white text-gray-900 text-sm leading-relaxed flex" id="resume-preview">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-800 text-white p-6">
        {data.profileImage && <img src={data.profileImage} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-slate-700 mx-auto mb-4" />}
        <h1 className="text-xl font-bold mb-1 text-center">{data.fullName || 'Your Name'}</h1>
        <div className="space-y-1 text-xs text-slate-300 mb-6">
          {data.email && <p>{data.email}</p>}
          {data.phone && <p>{data.phone}</p>}
          {data.location && <p>{data.location}</p>}
          {data.linkedin && <p>{data.linkedin}</p>}
        </div>
        {data.skills && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Skills</h2>
            <div className="space-y-1">
              {data.skills.split(',').map((s, i) => (
                <p key={i} className="text-xs">{s.trim()}</p>
              ))}
            </div>
          </div>
        )}
        {data.education?.some(e => e.school) && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Education</h2>
            {data.education.filter(e => e.school).map((edu, i) => (
              <div key={i} className="mb-3">
                <p className="font-semibold text-xs">{edu.school}</p>
                <p className="text-xs text-slate-300">{edu.degree} in {edu.field}</p>
                <p className="text-xs text-slate-400">{edu.startYear} – {edu.endYear}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Main */}
      <div className="flex-1 p-6">
        {data.summary && <p className="text-xs text-gray-600 mb-5 pb-4 border-b">{data.summary}</p>}
        {data.experience?.some(e => e.company) && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Experience</h2>
            {data.experience.filter(e => e.company).map((exp, i) => (
              <div key={i} className="mb-4">
                <h3 className="font-semibold text-sm">{exp.role}</h3>
                <p className="text-xs text-slate-500">{exp.company} • {exp.startDate} – {exp.endDate || 'Present'}</p>
                <ul className="mt-1 space-y-0.5 list-disc pl-4 text-xs">
                  {exp.bullets?.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {data.projects?.some(p => p.name) && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Projects</h2>
            {data.projects.filter(p => p.name).map((proj, i) => (
              <div key={i} className="mb-3">
                <h3 className="font-semibold text-sm">{proj.name}</h3>
                <p className="text-xs text-gray-600">{proj.description}</p>
                {proj.tech && <p className="text-xs text-gray-500">Tech: {proj.tech}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreativeTemplate({ data }) {
  return (
    <div className="bg-white text-gray-900 text-sm leading-relaxed" id="resume-preview">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8">
        <h1 className="text-3xl font-bold">{data.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-violet-200 text-xs">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
        </div>
        {data.summary && <p className="mt-3 text-violet-100 text-xs max-w-xl">{data.summary}</p>}
      </div>
      <div className="p-8">
        {data.skills && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.split(',').map((s, i) => (
                <span key={i} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium border border-violet-200">{s.trim()}</span>
              ))}
            </div>
          </div>
        )}
        {data.experience?.some(e => e.company) && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-3">Experience</h2>
            {data.experience.filter(e => e.company).map((exp, i) => (
              <div key={i} className="mb-4 pl-4 border-l-2 border-violet-300">
                <h3 className="font-semibold">{exp.role} <span className="font-normal text-gray-500">at {exp.company}</span></h3>
                <p className="text-xs text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</p>
                <ul className="mt-1 space-y-0.5 list-disc pl-4 text-xs">
                  {exp.bullets?.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {data.education?.some(e => e.school) && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-3">Education</h2>
            {data.education.filter(e => e.school).map((edu, i) => (
              <div key={i} className="mb-2 pl-4 border-l-2 border-violet-300">
                <h3 className="font-semibold">{edu.school}</h3>
                <p className="text-xs text-gray-600">{edu.degree} in {edu.field} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
              </div>
            ))}
          </div>
        )}
        {data.projects?.some(p => p.name) && (
          <div>
            <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-3">Projects</h2>
            {data.projects.filter(p => p.name).map((proj, i) => (
              <div key={i} className="mb-3 pl-4 border-l-2 border-violet-300">
                <h3 className="font-semibold">{proj.name}</h3>
                <p className="text-xs text-gray-600">{proj.description}</p>
                {proj.tech && <p className="text-xs text-gray-500">Tech: {proj.tech}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const templates = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
}

export default function ResumeBuilderPage() {
  const { user, demoMode } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [showPreview, setShowPreview] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resumeId, setResumeId] = useState(null)
  const { register, watch, setValue, getValues, reset, trigger, formState: { errors } } = useForm({ defaultValues: defaultData })
  const formData = watch()
  const previewRef = useRef(null)

  // Load saved resume
  useEffect(() => {
    if (demoMode || !user) return
    getResumes(user.id).then(({ data }) => {
      if (data && data.length > 0) {
        const latest = data[0]
        setResumeId(latest.id)
        setSelectedTemplate(latest.template || 'modern')
        reset(latest.data || defaultData)
      }
    })
  }, [user, demoMode])

  const handleSave = async () => {
    if (demoMode || !user) { toast.error('Demo mode — data not saved'); return }
    const isValid = await trigger()
    if (!isValid) { toast.error('Please fix validation errors before saving'); return }
    
    setSaving(true)
    const { data, error } = await saveResume(user.id, getValues(), selectedTemplate, formData.fullName || 'My Resume', resumeId)
    if (data) { setResumeId(data.id); toast.success('Resume saved successfully!') }
    else { toast.error('Failed to save resume') }
    setSaving(false)
  }

  const addItem = (field) => {
    const items = getValues(field)
    if (field === 'education') {
      setValue(field, [...items, { school: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' }])
    } else if (field === 'experience') {
      setValue(field, [...items, { company: '', role: '', startDate: '', endDate: '', bullets: [''] }])
    } else {
      setValue(field, [...items, { name: '', description: '', tech: '', link: '' }])
    }
  }

  const removeItem = (field, index) => {
    const items = getValues(field)
    if (items.length > 1) {
      setValue(field, items.filter((_, i) => i !== index))
    }
  }

  const addBullet = (expIndex) => {
    const exp = getValues('experience')
    exp[expIndex].bullets.push('')
    setValue('experience', [...exp])
  }

  const generateAIBullets = async (expIndex) => {
    const exp = getValues('experience')[expIndex]
    if (!exp.role || !exp.company) return
    setAiLoading(true)
    try {
      const res = await axios.post('/api/ai/generate-bullets', { role: exp.role, company: exp.company })
      const newExp = [...getValues('experience')]
      newExp[expIndex].bullets = res.data.bullets
      setValue('experience', newExp)
    } catch (err) {
      console.error('AI generation failed:', err)
    }
    setAiLoading(false)
  }

  const downloadPDF = async () => {
    const isValid = await trigger()
    if (!isValid) { toast.error('Please fix validation errors before downloading'); return }

    const element = document.getElementById('resume-preview')
    if (!element) return
    
    toast.loading('Generating PDF...', { id: 'pdf-toast' })
    const html2pdf = (await import('html2pdf.js')).default
    html2pdf().set({
      margin: 0,
      filename: `${formData.fullName || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save().then(() => {
      toast.success('PDF downloaded!', { id: 'pdf-toast' })
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 256
        let width = img.width, height = img.height
        if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE } 
        else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        setValue('profileImage', canvas.toDataURL('image/jpeg', 0.8))
        toast.success('Profile image added')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const TemplateComponent = templates[selectedTemplate]

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...register('fullName')} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register('email')} placeholder="john@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register('location')} placeholder="San Francisco, CA" />
              </div>
              <div className="space-y-4 col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {formData.profileImage ? (
                    <div className="relative group">
                      <img src={formData.profileImage} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                      <button type="button" onClick={() => setValue('profileImage', null)} className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border border-dashed">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer file:text-primary file:font-medium file:bg-primary/10 file:border-0 hover:file:bg-primary/20 file:mr-4 file:px-4 file:py-1 file:rounded-md transition-colors" />
                    <p className="text-xs text-muted-foreground mt-1.5">Square, max 2MB (will be downscaled automatically)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input 
                {...register('linkedin', { 
                  pattern: { value: /^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/i, message: 'Please enter a valid LinkedIn URL' } 
                })} 
                placeholder="https://linkedin.com/in/johndoe" 
                className={errors.linkedin ? "border-destructive" : ""}
              />
              {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Professional Summary</Label>
              <Textarea {...register('summary', { maxLength: { value: 600, message: 'Summary too long (max 600 chars)' }})} placeholder="Brief summary of your experience..." rows={4} className={errors.summary ? "border-destructive" : ""} />
              {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
            </div>
          </div>
        )
      case 'education':
        return (
          <div className="space-y-4">
            {formData.education?.map((_, i) => (
              <Card key={i} className="relative">
                <CardContent className="p-4 space-y-3">
                  {formData.education.length > 1 && (
                    <button type="button" onClick={() => removeItem('education', i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">School</Label>
                      <Input {...register(`education.${i}.school`)} placeholder="MIT" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Degree</Label>
                      <Input {...register(`education.${i}.degree`)} placeholder="B.S." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Field of Study</Label>
                      <Input {...register(`education.${i}.field`)} placeholder="Computer Science" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">GPA</Label>
                      <Input {...register(`education.${i}.gpa`)} placeholder="3.8" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Year</Label>
                      <Input {...register(`education.${i}.startYear`)} placeholder="2018" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Year</Label>
                      <Input {...register(`education.${i}.endYear`)} placeholder="2022" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => addItem('education')} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Education
            </Button>
          </div>
        )
      case 'skills':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Skills (comma-separated)</Label>
              <Textarea {...register('skills')} placeholder="React, Node.js, Python, TypeScript, AWS, Docker..." rows={6} />
            </div>
            <p className="text-xs text-muted-foreground">Tip: Include a mix of technical skills, tools, and soft skills</p>
          </div>
        )
      case 'experience':
        return (
          <div className="space-y-4">
            {formData.experience?.map((exp, i) => (
              <Card key={i} className="relative">
                <CardContent className="p-4 space-y-3">
                  {formData.experience.length > 1 && (
                    <button type="button" onClick={() => removeItem('experience', i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company</Label>
                      <Input {...register(`experience.${i}.company`)} placeholder="Google" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Role</Label>
                      <Input {...register(`experience.${i}.role`)} placeholder="Software Engineer" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Date</Label>
                      <Input {...register(`experience.${i}.startDate`)} placeholder="Jan 2022" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Date</Label>
                      <Input {...register(`experience.${i}.endDate`)} placeholder="Present" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Bullet Points</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => generateAIBullets(i)} disabled={aiLoading} className="text-xs gap-1 h-7">
                        <Sparkles className="w-3 h-3" /> AI Generate
                      </Button>
                    </div>
                    {exp.bullets?.map((_, j) => (
                      <Input key={j} {...register(`experience.${i}.bullets.${j}`)} placeholder="Describe your achievement..." />
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => addBullet(i)} className="text-xs gap-1 h-7">
                      <Plus className="w-3 h-3" /> Add Bullet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => addItem('experience')} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Experience
            </Button>
          </div>
        )
      case 'projects':
        return (
          <div className="space-y-4">
            {formData.projects?.map((_, i) => (
              <Card key={i} className="relative">
                <CardContent className="p-4 space-y-3">
                  {formData.projects.length > 1 && (
                    <button type="button" onClick={() => removeItem('projects', i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Project Name</Label>
                      <Input {...register(`projects.${i}.name`)} placeholder="E-commerce App" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Technologies</Label>
                      <Input {...register(`projects.${i}.tech`)} placeholder="React, Node.js" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea {...register(`projects.${i}.description`)} placeholder="What this project does..." rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link</Label>
                    <Input {...register(`projects.${i}.link`)} placeholder="github.com/..." />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => addItem('projects')} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Resume <span className="gradient-text">Builder</span></h1>
        <p className="text-muted-foreground mt-1">Create a professional resume with AI assistance</p>
      </motion.div>

      {/* Template Selection */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Template:</span>
        {Object.keys(templates).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTemplate(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${
              selectedTemplate === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2 lg:hidden">
          <Eye className="w-4 h-4" /> {showPreview ? 'Edit' : 'Preview'}
        </Button>
        <Button onClick={handleSave} variant="outline" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={downloadPDF} className="gap-2">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={showPreview ? 'hidden lg:block' : ''}>
          {/* Steps */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  currentStep === i
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <step.icon className="w-4 h-4" />
                {step.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className={`${!showPreview ? 'hidden lg:block' : ''}`}>
          <Card className="overflow-hidden sticky top-4">
            <CardHeader className="py-3 px-4 bg-muted/50">
              <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div ref={previewRef} className="overflow-auto max-h-[70vh] text-xs" style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%' }}>
                <TemplateComponent data={formData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
