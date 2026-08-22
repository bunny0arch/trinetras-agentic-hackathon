import { supabase } from './supabase'

// STUDENTS/CANDIDATES
export const getStudents = async (filters = {}) => {
  let query = supabase.from('students').select('*')
  if (filters.branch) query = query.eq('branch', filters.branch)
  if (filters.cgpa) query = query.gte('cgpa', filters.cgpa)
  if (filters.status) query = query.eq('placement_status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getStudentById = async (id) => {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export const updateStudent = async (id, updates) => {
  const { data, error } = await supabase.from('students').update(updates).eq('id', id).select()
  if (error) throw error
  return data[0]
}

// PLACEMENT DRIVES
export const getDrives = async (filters = {}) => {
  let query = supabase.from('placement_drives').select('*')
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.company) query = query.ilike('company_name', `%${filters.company}%`)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getDriveById = async (id) => {
  const { data, error } = await supabase.from('placement_drives').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export const createDrive = async (driveData) => {
  const { data, error } = await supabase.from('placement_drives').insert([driveData]).select()
  if (error) throw error
  return data[0]
}

export const updateDrive = async (id, updates) => {
  const { data, error } = await supabase.from('placement_drives').update(updates).eq('id', id).select()
  if (error) throw error
  return data[0]
}

// APPLICATIONS
export const getApplications = async (filters = {}) => {
  let query = supabase.from('applications').select('*')
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  if (filters.driveId) query = query.eq('drive_id', filters.driveId)
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createApplication = async (applicationData) => {
  const { data, error } = await supabase.from('applications').insert([applicationData]).select()
  if (error) throw error
  return data[0]
}

export const updateApplication = async (id, updates) => {
  const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select()
  if (error) throw error
  return data[0]
}

// TESTS
export const getTests = async (filters = {}) => {
  let query = supabase.from('tests').select('*')
  if (filters.driveId) query = query.eq('drive_id', filters.driveId)
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query.order('scheduled_date', { ascending: true })
  if (error) throw error
  return data
}

export const createTest = async (testData) => {
  const { data, error } = await supabase.from('tests').insert([testData]).select()
  if (error) throw error
  return data[0]
}

export const getTestAssignments = async (testId) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .select('*')
    .eq('test_id', testId)
  if (error) throw error
  return data
}

export const assignStudentToTest = async (testId, studentId) => {
  const { data, error } = await supabase
    .from('test_assignments')
    .insert([{ test_id: testId, student_id: studentId }])
    .select()
  if (error) throw error
  return data[0]
}

// INTERVIEWS
export const getInterviews = async (filters = {}) => {
  let query = supabase.from('interviews').select('*')
  if (filters.driveId) query = query.eq('drive_id', filters.driveId)
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query.order('scheduled_date', { ascending: true })
  if (error) throw error
  return data
}

export const createInterview = async (interviewData) => {
  const { data, error } = await supabase.from('interviews').insert([interviewData]).select()
  if (error) throw error
  return data[0]
}

export const updateInterview = async (id, updates) => {
  const { data, error } = await supabase.from('interviews').update(updates).eq('id', id).select()
  if (error) throw error
  return data[0]
}

// INTERVIEW PANELS
export const getPanels = async () => {
  const { data, error } = await supabase.from('interview_panels').select('*')
  if (error) throw error
  return data
}

export const createPanel = async (panelData) => {
  const { data, error } = await supabase.from('interview_panels').insert([panelData]).select()
  if (error) throw error
  return data[0]
}

// NOTIFICATIONS
export const getNotifications = async (userId, role) => {
  const table = role === 'recruiter' ? 'recruiter_notifications' : 'student_notifications'
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createNotification = async (notificationData, role) => {
  const table = role === 'recruiter' ? 'recruiter_notifications' : 'student_notifications'
  const { data, error } = await supabase.from(table).insert([notificationData]).select()
  if (error) throw error
  return data[0]
}

export const markNotificationRead = async (id, role) => {
  const table = role === 'recruiter' ? 'recruiter_notifications' : 'student_notifications'
  const { data, error } = await supabase
    .from(table)
    .update({ read: true })
    .eq('id', id)
    .select()
  if (error) throw error
  return data[0]
}

// PLACEMENTS
export const getPlacementRecords = async (filters = {}) => {
  let query = supabase.from('placements').select('*')
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  if (filters.driveId) query = query.eq('drive_id', filters.driveId)
  const { data, error } = await query.order('offer_date', { ascending: false })
  if (error) throw error
  return data
}

export const createPlacement = async (placementData) => {
  const { data, error } = await supabase.from('placements').insert([placementData]).select()
  if (error) throw error
  return data[0]
}

// DASHBOARD STATS
export const getRecruiterStats = async (recruiterId) => {
  try {
    const students = await supabase.from('students').select('id').count('exact')
    const drives = await supabase.from('placement_drives').select('id').count('exact')
    const applications = await supabase.from('applications').select('id').count('exact')
    const placements = await supabase.from('placements').select('id').count('exact')
    const interviews = await supabase.from('interviews').select('id').count('exact')
    const tests = await supabase.from('tests').select('id').count('exact')

    return {
      totalStudents: students.count || 0,
      activeDrives: drives.count || 0,
      totalApplications: applications.count || 0,
      totalPlacements: placements.count || 0,
      scheduledInterviews: interviews.count || 0,
      scheduledTests: tests.count || 0,
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error fetching recruiter stats:', error)
    return null
  }
}

export const getCandidateStats = async (studentId) => {
  try {
    const applications = await getApplications({ studentId })
    const interviews = await getInterviews({ studentId })
    const tests = await supabase
      .from('test_assignments')
      .select('*')
      .eq('student_id', studentId)
      .count('exact')

    const shortlisted = applications.filter(a => a.status === 'shortlisted').length
    const rejected = applications.filter(a => a.status === 'rejected').length
    const selected = applications.filter(a => a.status === 'selected').length

    return {
      totalApplications: applications.length,
      shortlisted,
      rejected,
      selected,
      upcomingInterviews: interviews.length,
      upcomingTests: tests.count || 0,
      placementReadinessScore: calculateReadinessScore(applications, interviews),
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error fetching candidate stats:', error)
    return null
  }
}

const calculateReadinessScore = (applications, interviews) => {
  let score = 50
  if (applications.length > 0) score += 10
  if (applications.some(a => a.status === 'shortlisted')) score += 15
  if (applications.some(a => a.status === 'selected')) score += 15
  if (interviews.length > 0) score += 10
  return Math.min(score, 100)
}

// SUBSCRIPTIONS
export const subscribeToStudentUpdates = (studentId, callback) => {
  return supabase
    .channel(`student:${studentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students', filter: `id=eq.${studentId}` },
      callback
    )
    .subscribe()
}

export const subscribeToDriveUpdates = (driveId, callback) => {
  return supabase
    .channel(`drive:${driveId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'placement_drives', filter: `id=eq.${driveId}` },
      callback
    )
    .subscribe()
}

export const subscribeToApplicationUpdates = (studentId, callback) => {
  return supabase
    .channel(`applications:${studentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'applications', filter: `student_id=eq.${studentId}` },
      callback
    )
    .subscribe()
}
