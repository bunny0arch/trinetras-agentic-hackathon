const demoInsights = {
  overview: 'Applications are moving well, but interview-room capacity is the current bottleneck. Rebalance two panels before the next drive.',
  ranking: 'These candidates rank highest because their skills, academic profile, projects, and resume signals align with the drive requirements.',
  conflicts: 'Two interviews overlap with Panel 03 availability. Consider moving the second round to Room B at 3:30 PM.',
}

export async function extractDriveRequirements(jobDescription) {
  return { title: jobDescription?.title || 'New placement drive', eligibility: { cgpa: 7.5, branches: ['Computer Science', 'Information Science'], graduationYear: 2026, backlogsAllowed: false }, skills: ['JavaScript', 'React', 'Problem solving'], source: 'demo-fallback' }
}

export async function verifyStudentEligibility(student, drive) {
  return { eligible: student.cgpa >= drive.eligibility.cgpa, reasons: ['CGPA checked', 'Branch checked', 'Graduation year checked'] }
}

export async function rankCandidates(students, drive) {
  return students.map((student, index) => ({ ...student, matchScore: 96 - index * 7, reason: demoInsights.ranking })).sort((first, second) => second.matchScore - first.matchScore)
}

export async function optimizeInterviewSchedule(schedule) {
  return { conflicts: 2, suggestions: ['Move Panel 03 to Room B', 'Shift the 3:00 PM interview by 30 minutes'], summary: demoInsights.conflicts }
}

export async function askPlacementManager(question) {
  const normalized = question.toLowerCase()
  const answer = normalized.includes('conflict') || normalized.includes('schedule') ? demoInsights.conflicts : normalized.includes('candidate') || normalized.includes('shortlist') ? demoInsights.ranking : demoInsights.overview
  return { answer, source: 'demo-fallback', nextActions: ['Review pending actions', 'Open the affected placement drive'] }
}

// Replace these demo functions with protected backend AI routes. Keep return shapes stable for RecruiterHome.
