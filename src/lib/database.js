import { supabase } from './supabase'

// ============================================
// Profiles
// ============================================
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ============================================
// Resumes
// ============================================
export async function getResumes(userId) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export async function getResume(resumeId) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single()
  return { data, error }
}

export async function saveResume(userId, resumeData, template, title, resumeId) {
  if (resumeId) {
    const { data, error } = await supabase
      .from('resumes')
      .update({ data: resumeData, template, title, updated_at: new Date().toISOString() })
      .eq('id', resumeId)
      .select()
      .single()
    return { data, error }
  }
  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: userId, data: resumeData, template, title })
    .select()
    .single()
  return { data, error }
}

export async function deleteResume(resumeId) {
  const { error } = await supabase.from('resumes').delete().eq('id', resumeId)
  return { error }
}

// ============================================
// Resume Analyses
// ============================================
export async function saveAnalysis(userId, resumeText, atsScore, overallRating, analysis) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .insert({ user_id: userId, resume_text: resumeText, ats_score: atsScore, overall_rating: overallRating, analysis })
    .select()
    .single()
  return { data, error }
}

export async function getAnalyses(userId) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ============================================
// Interview Sessions
// ============================================
export async function saveInterviewSession(userId, role, questions, answers, evaluations, averageScore) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({ user_id: userId, role, questions, answers, evaluations, average_score: averageScore })
    .select()
    .single()
  return { data, error }
}

export async function getInterviewSessions(userId) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ============================================
// Career Roadmaps
// ============================================
export async function saveRoadmap(userId, interests, roadmap) {
  const { data, error } = await supabase
    .from('career_roadmaps')
    .insert({ user_id: userId, interests, roadmap })
    .select()
    .single()
  return { data, error }
}

export async function getRoadmaps(userId) {
  const { data, error } = await supabase
    .from('career_roadmaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ============================================
// Dashboard Stats
// ============================================
export async function getDashboardStats(userId) {
  const [resumes, analyses, sessions] = await Promise.all([
    supabase.from('resumes').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('resume_analyses').select('ats_score').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('interview_sessions').select('average_score, created_at, role').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  const latestAtsScore = analyses.data?.[0]?.ats_score || null
  const interviewScores = sessions.data || []
  const avgInterview = interviewScores.length
    ? Math.round(interviewScores.reduce((a, s) => a + s.average_score, 0) / interviewScores.length)
    : null

  return {
    resumeCount: resumes.count || 0,
    latestAtsScore,
    interviewSessions: interviewScores,
    avgInterviewScore: avgInterview,
  }
}
