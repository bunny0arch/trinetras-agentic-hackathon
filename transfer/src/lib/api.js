import { supabase } from './supabase'

// Auth functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Database functions for students
export const getStudents = async () => {
  const { data, error } = await supabase.from('students').select('*')
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
  return data
}

// Database functions for recruiters
export const getRecruiters = async () => {
  const { data, error } = await supabase.from('recruiters').select('*')
  if (error) throw error
  return data
}

export const getRecruiterById = async (id) => {
  const { data, error } = await supabase.from('recruiters').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

// Database functions for drives
export const getDrives = async () => {
  const { data, error } = await supabase.from('drives').select('*')
  if (error) throw error
  return data
}

export const getDriveById = async (id) => {
  const { data, error } = await supabase.from('drives').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export const createDrive = async (driveData) => {
  const { data, error } = await supabase.from('drives').insert([driveData]).select()
  if (error) throw error
  return data
}

export const updateDrive = async (id, updates) => {
  const { data, error } = await supabase.from('drives').update(updates).eq('id', id).select()
  if (error) throw error
  return data
}

// Database functions for applications
export const getApplications = async () => {
  const { data, error } = await supabase.from('applications').select('*')
  if (error) throw error
  return data
}

export const getApplicationsByStudentId = async (studentId) => {
  const { data, error } = await supabase.from('applications').select('*').eq('student_id', studentId)
  if (error) throw error
  return data
}

export const getApplicationsByDriveId = async (driveId) => {
  const { data, error } = await supabase.from('applications').select('*').eq('drive_id', driveId)
  if (error) throw error
  return data
}

export const createApplication = async (applicationData) => {
  const { data, error } = await supabase.from('applications').insert([applicationData]).select()
  if (error) throw error
  return data
}

export const updateApplication = async (id, updates) => {
  const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select()
  if (error) throw error
  return data
}

// Realtime subscriptions
export const subscribeToTable = (tableName, callback) => {
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
    .subscribe()
  
  return subscription
}

export const unsubscribeFromTable = (subscription) => {
  supabase.removeChannel(subscription)
}
