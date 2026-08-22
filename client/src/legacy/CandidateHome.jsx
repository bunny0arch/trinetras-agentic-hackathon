import { useEffect, useMemo, useState } from 'react'
import './CandidateHome.css'
import { placementApi } from '../lib/placementApi'
import {
  askPlacementAssistant,
  checkEligibility,
  getSkillMatch,
} from './services/candidateAi.js'



const navItems = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'opportunities', label: 'Opportunities', icon: '⊹', count: '12' },
  { id: 'applications', label: 'Applications', icon: '↗', count: '4' },
  { id: 'schedule', label: 'Tests & interviews', icon: '◷' },
  { id: 'profile', label: 'My profile', icon: '◎' },
]

function CandidateHome({ onLogout }) {
  const [activeView, setActiveView] = useState('overview')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [savedJobs, setSavedJobs] = useState([])
  const [appliedJobs, setAppliedJobs] = useState([])
  const [dashboard, setDashboard] = useState({ profile: null, drives: [], applications: [], interviews: [], notifications: [], savedDriveIds: [] })
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [opportunityFilter, setOpportunityFilter] = useState('recommended')

  useEffect(() => {
    let active = true
    placementApi.placement.candidate.dashboard.query()
      .then((data) => {
        if (!active) return
        setDashboard(data)
        setSavedJobs(data.savedDriveIds ?? [])
        setAppliedJobs((data.applications ?? []).map((application) => application.placementDriveId))
      })
      .catch((error) => active && setActionError(error?.message || 'Unable to load your placement data.'))
      .finally(() => active && setDashboardLoading(false))
    return () => { active = false }
  }, [])

  const opportunities = useMemo(() => (dashboard.drives ?? []).map((drive, index) => {
    const profileSkills = new Set((dashboard.profile?.skills ?? []).map((skill) => skill.toLowerCase()))
    const requiredSkills = drive.requiredSkills ?? []
    const matchedSkills = requiredSkills.filter((skill) => profileSkills.has(skill.toLowerCase()))
    const profile = dashboard.profile
    const eligible = profile && Number(profile.cgpa) >= Number(drive.minCgpa) && profile.backlogs <= drive.maxBacklogs && profile.batch === drive.graduationBatch && (drive.allowedDepartments ?? []).includes(profile.department)
    return {
      ...drive,
      package: `₹${drive.packageLpa} LPA`,
      deadlineAt: drive.deadline,
      deadline: `Closes ${new Date(drive.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
      match: requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0,
      eligibility: profile ? (eligible ? 'Eligible' : 'Review needed') : 'Review needed',
      skills: requiredSkills,
      accent: ['coral', 'lime', 'amber'][index % 3],
    }
  }), [dashboard.drives, dashboard.profile])

  const visibleOpportunities = useMemo(() => {
    const filtered = opportunityFilter === 'saved'
      ? opportunities.filter((job) => savedJobs.includes(job.id))
      : [...opportunities]
    if (opportunityFilter === 'closing') filtered.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())
    if (opportunityFilter === 'match') filtered.sort((a, b) => b.match - a.match)
    return filtered
  }, [opportunities, opportunityFilter, savedJobs])

  const toggleSaved = async (job) => {
    const saved = !savedJobs.includes(job.id)
    setActionError('')
    setSavedJobs((current) => saved ? [...current, job.id] : current.filter((item) => item !== job.id))
    try {
      await placementApi.placement.candidate.saveDrive.mutate({ driveId: job.id, saved })
    } catch (error) {
      setSavedJobs((current) => saved ? current.filter((item) => item !== job.id) : [...current, job.id])
      setActionError(error?.message || 'Unable to update saved opportunities.')
    }
  }

  const applyToJob = async (job) => {
    if (appliedJobs.includes(job.id)) return
    setActionError('')
    try {
      const application = await placementApi.placement.candidate.applyToDrive.mutate({ driveId: job.id })
      setAppliedJobs((current) => [...current, application.placementDriveId])
      setDashboard((current) => ({ ...current, applications: [...current.applications, application] }))
      setSelectedOpportunity(null)
    } catch (error) {
      setActionError(error?.message || 'Unable to submit this application.')
    }
  }

  const openOpportunityAnalysis = async (job) => {
    setSelectedOpportunity(job)
    setAnalysis(null)
    setActionError('')
    try {
      const [eligibility, skillMatch] = await Promise.all([
        checkEligibility({ id: dashboard.profile?.id }, job),
        getSkillMatch({ id: dashboard.profile?.id }, job),
      ])
      setAnalysis({ eligibility, skillMatch })
    } catch (error) {
      setActionError(error?.message || 'Unable to calculate this match right now.')
    }
  }

  const askAssistant = async (question) => {
    const prompt = question || assistantQuestion
    if (!prompt.trim()) return
    setAssistantQuestion(prompt)
    setAssistantLoading(true)
    setAssistantResponse('')
    setActionError('')
    try {
      const response = await askPlacementAssistant({ id: dashboard.profile?.id }, prompt)
      setAssistantResponse(response.answer)
    } catch (error) {
      setActionError(error?.message || 'The placement assistant could not respond.')
    } finally {
      setAssistantLoading(false)
    }
  }

  const renderOpportunityCard = (job) => (
    <article className="opportunity-card" key={job.title}>
      <div className="opportunity-card-top"><span className={`company-mark ${job.accent}`}>{job.company.charAt(0)}</span><button type="button" className={`save-job ${savedJobs.includes(job.id) ? 'saved' : ''}`} onClick={() => toggleSaved(job)} aria-label={`${savedJobs.includes(job.id) ? 'Unsave' : 'Save'} ${job.title}`}>{savedJobs.includes(job.id) ? '★' : '☆'}</button></div>
      <span className="job-company">{job.company}</span><h3>{job.title}</h3><p className="job-location">{job.location}</p>
      <div className="job-meta"><strong>{job.package}</strong><span>{job.deadline}</span></div>
      <div className="match-row"><span className="match-score">{job.match}% match</span><span className={`eligibility ${job.eligibility === 'Eligible' ? 'eligible' : 'review'}`}>{job.eligibility}</span></div>
      <button type="button" className="job-details" onClick={() => openOpportunityAnalysis(job)}>See match analysis <span>→</span></button>
    </article>
  )

  const renderOverview = () => (
    <>
      <section className="candidate-hero"><div><span className="workspace-eyebrow">Candidate workspace</span><h1>Make your next move count.</h1><p>Your placement season, sorted into the actions that matter now.</p></div><div className="readiness-panel"><div className="readiness-score"><strong>{dashboard.profile?.profileCompletion ?? '—'}</strong><span>/100</span></div><div><span>Placement readiness</span><b>{dashboard.profile ? 'On track' : 'Loading'}</b><small>{dashboard.profile?.placementStatus ?? 'Resolving profile'}</small></div></div></section>
      <section className="stat-row" aria-label="Candidate summary"><div><span>Eligible opportunities</span><strong>{opportunities.length}</strong><small>Published drives</small></div><div><span>Applications active</span><strong>{dashboard.applications.length}</strong><small>{dashboard.applications.filter((item) => item.status === 'shortlisted').length} shortlisted</small></div><div><span>Upcoming activities</span><strong>{dashboard.interviews.length}</strong><small>{dashboard.interviews[0] ? new Date(dashboard.interviews[0].scheduledAt).toLocaleDateString() : 'No scheduled activity'}</small></div><div><span>Profile completeness</span><strong>{dashboard.profile?.profileCompletion ?? '—'}%</strong><small>{dashboard.profile?.studentCode ?? 'Profile pending'}</small></div></section>
      <div className="workspace-columns"><section className="workspace-section"><div className="section-bar"><div><span className="workspace-eyebrow">AI skill matching</span><h2>Recommended for you</h2></div><button type="button" className="text-button" onClick={() => setActiveView('opportunities')}>View all <span>→</span></button></div><div className="opportunity-grid">{opportunities.slice(0, 2).map(renderOpportunityCard)}</div></section><aside className="action-stack"><section className="action-card orange-card"><span className="card-icon">!</span><div><span className="workspace-eyebrow">Pending action</span><h3>Complete your preferred roles</h3><p>It helps us verify eligibility and improve matches.</p></div><button type="button" className="card-link" onClick={() => setActiveView('profile')}>Update profile →</button></section><section className="action-card notification-card"><div className="notification-heading"><span className="workspace-eyebrow">Recent notifications</span><span className="notification-count">3</span></div><p><b>Northstar Labs</b> moved your interview to tomorrow.</p><p>Your Vertex Systems assessment is due Friday.</p><button type="button" className="text-button">See notifications →</button></section></aside></div>
      <section className="workspace-section schedule-preview"><div className="section-bar"><div><span className="workspace-eyebrow">Your timeline</span><h2>Tests & interviews</h2></div><button type="button" className="text-button" onClick={() => setActiveView('schedule')}>Open schedule <span>→</span></button></div>{dashboard.interviews[0] ? <div className="timeline-row"><div className="timeline-date"><strong>{new Date(dashboard.interviews[0].scheduledAt).getDate()}</strong><span>{new Date(dashboard.interviews[0].scheduledAt).toLocaleString(undefined, { month: 'short' })}</span></div><div><span className="event-type interview">Interview · {dashboard.interviews[0].status}</span><h3>{dashboard.drives.find((drive) => drive.id === dashboard.applications.find((application) => application.id === dashboard.interviews[0].applicationId)?.placementDriveId)?.title ?? 'Placement interview'}</h3><p>{new Date(dashboard.interviews[0].scheduledAt).toLocaleString()} · {dashboard.interviews[0].mode === 'video' ? 'Video call' : 'In person'}</p></div><span className="event-status">{dashboard.interviews[0].status}</span></div> : <p className="data-state">No interviews are scheduled yet.</p>}</section>
    </>
  )

  const renderOpportunities = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Discovery workspace</span><h1>Find your next opportunity.</h1><p>Every listing is checked against your academic and skill profile.</p></div><button type="button" className="assistant-trigger" onClick={() => setAssistantOpen(true)}>Ask placement AI <span>✦</span></button></div><div className="filter-row"><button type="button" className={opportunityFilter === 'recommended' ? 'filter-active' : ''} onClick={() => setOpportunityFilter('recommended')}>Recommended · {opportunities.length}</button><button type="button" className={opportunityFilter === 'closing' ? 'filter-active' : ''} onClick={() => setOpportunityFilter('closing')}>Closing soon</button><button type="button" className={opportunityFilter === 'match' ? 'filter-active' : ''} onClick={() => setOpportunityFilter('match')}>Highest match</button><button type="button" className={opportunityFilter === 'saved' ? 'filter-active' : ''} onClick={() => setOpportunityFilter('saved')}>Saved · {savedJobs.length}</button></div><div className="opportunity-grid full-grid">{visibleOpportunities.map(renderOpportunityCard)}<article className="opportunity-card muted-card"><span className="company-mark neutral">+</span><span className="job-company">More coming soon</span><h3>Keep your profile updated</h3><p className="job-location">New roles are matched as placement cells publish them.</p><button type="button" className="job-details" onClick={() => setActiveView('profile')}>Improve my matches <span>→</span></button></article></div></section>

  const renderApplications = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Application tracker</span><h1>Your placement pipeline.</h1><p>One view of every application, action, and outcome.</p></div><span className="pipeline-summary">{dashboard.applications.length} active</span></div><div className="application-table"><div className="table-head"><span>Opportunity</span><span>Status</span><span>Next action</span><span>Updated</span></div>{dashboard.applications.map((application) => { const drive = dashboard.drives.find((item) => item.id === application.placementDriveId); return <div className="table-row" key={application.id}><div><strong>{drive?.title ?? 'Placement opportunity'}</strong><small>{drive?.company ?? 'Company pending'}</small></div><span className={`application-status ${application.status.replaceAll('_', '-')}`}>{application.status.replaceAll('_', ' ')}</span><button type="button" className="row-action" onClick={() => drive && openOpportunityAnalysis({ ...drive, package: `₹${drive.packageLpa} LPA`, deadline: '', match: application.matchScore, eligibility: application.eligibilityStatus, skills: drive.requiredSkills, accent: 'coral' })}>View details <span>→</span></button><time>{new Date(application.updatedAt).toLocaleDateString()}</time></div> })}</div></section>

  const renderSchedule = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Tests & interviews</span><h1>Your schedule, without the scramble.</h1><p>Meeting details, modes, panels, and confirmation status in one place.</p></div></div><div className="schedule-list">{dashboard.interviews.map((interview) => { const application = dashboard.applications.find((item) => item.id === interview.applicationId); const drive = dashboard.drives.find((item) => item.id === application?.placementDriveId); return <div className="schedule-item" key={interview.id}><div className="schedule-date"><strong>{new Date(interview.scheduledAt).getDate()}</strong><span>{new Date(interview.scheduledAt).toLocaleString(undefined, { month: 'short' })}</span></div><div className="schedule-content"><span className="event-type interview">Interview · {interview.status}</span><h2>{drive?.title ?? 'Placement interview'}</h2><p>{drive?.company ?? 'Company pending'} · {new Date(interview.scheduledAt).toLocaleString()}</p><small>{interview.mode === 'video' ? 'Video call' : 'In person'} · {interview.durationMinutes} minutes</small></div><button type="button" className="dark-action small-action" onClick={() => setAssistantOpen(true)}>Get preparation →</button></div> })}</div>{dashboard.interviews.length === 0 && <p className="data-state">No interviews are scheduled yet.</p>}</section>

  const renderProfile = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Candidate profile</span><h1>Make your profile do the talking.</h1><p>Your profile is shared with placement opportunities you are eligible for.</p></div><span className="pipeline-summary">84% complete</span></div><div className="profile-layout"><div className="profile-checklist">{[['Personal information', 'Complete'], ['Academic details', 'Complete'], ['Skills', 'Add 2 skills'], ['Projects', 'Add project links'], ['Certifications', 'Optional'], ['Resume', 'Uploaded']].map((item) => <div className="profile-row" key={item[0]}><span className="profile-check">{item[1] === 'Complete' || item[1] === 'Uploaded' ? '✓' : '·'}</span><strong>{item[0]}</strong><span className={item[1] === 'Complete' || item[1] === 'Uploaded' ? 'done' : 'needs-action'}>{item[1]}</span><button type="button" className="row-action" onClick={() => { setAssistantQuestion(`How do I update my ${item[0].toLowerCase()}?`); setAssistantOpen(true) }}>Edit →</button></div>)}</div><section className="skill-card"><span className="workspace-eyebrow">Skill readiness</span><h2>Your strongest signals</h2><div className="skill-line"><span>React</span><b>92%</b><i><em style={{ width: '92%' }} /></i></div><div className="skill-line"><span>Product thinking</span><b>78%</b><i><em style={{ width: '78%' }} /></i></div><div className="skill-line"><span>Communication</span><b>66%</b><i><em style={{ width: '66%' }} /></i></div><button type="button" className="assistant-trigger" onClick={() => setAssistantOpen(true)}>Get preparation advice <span>✦</span></button></section></div></section>

  return (
    <div className="candidate-home"><aside className="candidate-sidebar"><a className="candidate-brand" href="/" aria-label="Campus placement home"><span className="brand-symbol">CP</span><span>Campus placement</span></a><div className="sidebar-profile"><span className="candidate-avatar">{dashboard.profile?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'CP'}</span><div><strong>{dashboard.profile?.fullName || 'Candidate'}</strong><small>Candidate · {dashboard.profile?.batch || '—'} batch</small></div></div><nav className="candidate-nav" aria-label="Candidate navigation">{navItems.map((item) => <button key={item.id} type="button" className={activeView === item.id ? 'active' : ''} onClick={() => setActiveView(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.count && <small>{item.count}</small>}</button>)}</nav><button type="button" className="assistant-rail" onClick={() => setAssistantOpen(true)}><span>✦</span><div><strong>Placement AI</strong><small>Ask anything</small></div></button><button type="button" className="sidebar-signout" onClick={onLogout}>↪ <span>Sign out</span></button></aside><main className="candidate-content"><div className="candidate-orb-field" aria-hidden="true"><span className="candidate-orb orb-coral" /><span className="candidate-orb orb-amber" /><span className="candidate-orb orb-lime" /><span className="candidate-orb orb-mint" /><span className="candidate-orb orb-coral-small" /><span className="candidate-orb orb-amber-small" /></div><header className="candidate-header"><div className="mobile-brand"><span className="brand-symbol">CP</span> Candidate workspace</div><div className="header-actions"><button type="button" className="notification-button" aria-label="Notifications" onClick={() => setActionError(dashboard.notifications.length ? dashboard.notifications.map((item) => `${item.title}: ${item.body}`).join(' ') : 'No new notifications.')}>♧<span>{dashboard.notifications.length}</span></button><button type="button" className="header-avatar" onClick={() => setActiveView('profile')}>{dashboard.profile?.fullName?.[0] || 'C'}</button></div></header><div className="candidate-page">{dashboardLoading && <p className="data-state">Loading your live placement workspace…</p>}{actionError && <p className="data-state">{actionError}</p>}{activeView === 'overview' && renderOverview()}{activeView === 'opportunities' && renderOpportunities()}{activeView === 'applications' && renderApplications()}{activeView === 'schedule' && renderSchedule()}{activeView === 'profile' && renderProfile()}</div></main>
      {assistantOpen && <div className="assistant-overlay" onClick={() => setAssistantOpen(false)}><section className="assistant-panel" onClick={(event) => event.stopPropagation()}><div className="assistant-head"><div><span className="workspace-eyebrow">Placement AI</span><h2>What should we work on?</h2></div><button type="button" className="close-assistant" onClick={() => setAssistantOpen(false)}>×</button></div><p className="assistant-intro">Ask about eligibility, recommendations, skill gaps, interview preparation, or your next action.</p><div className="assistant-prompts"><button type="button" onClick={() => askAssistant('Why am I eligible for Product Design?')}>Why am I eligible for Product Design?</button><button type="button" onClick={() => askAssistant('What skills should I improve?')}>What skills should I improve?</button><button type="button" onClick={() => askAssistant("Prepare me for tomorrow's interview")}>Prepare me for tomorrow's interview</button></div>{assistantLoading && <p className="assistant-status">Reviewing your profile and placement context...</p>}{assistantResponse && <div className="assistant-response"><span className="workspace-eyebrow">Placement AI response</span><p>{assistantResponse}</p></div>}<div className="assistant-input"><input value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askAssistant()} placeholder="Ask placement AI..." /><button type="button" onClick={() => askAssistant()}>→</button></div></section></div>}
      {selectedOpportunity && <div className="opportunity-overlay" onClick={() => setSelectedOpportunity(null)}><section className="opportunity-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="close-assistant" onClick={() => setSelectedOpportunity(null)}>×</button><span className={`company-mark ${selectedOpportunity.accent}`}>{selectedOpportunity.company.charAt(0)}</span><span className="job-company">{selectedOpportunity.company}</span><h2>{selectedOpportunity.title}</h2><p className="job-location">{selectedOpportunity.location} · {selectedOpportunity.package}</p><div className="analysis-score"><strong>{analysis?.skillMatch.score || selectedOpportunity.match}%</strong><span>AI skill match</span></div>{analysis ? <div className="analysis-grid"><div><span className="workspace-eyebrow">Eligibility check</span><strong className="eligible-text">✓ {analysis.eligibility.status}</strong><p>{analysis.eligibility.explanation}</p><small>{analysis.eligibility.criteria.filter((criterion) => criterion.met).length}/{analysis.eligibility.criteria.length} criteria met</small></div><div><span className="workspace-eyebrow">Skill analysis</span><strong>{analysis.skillMatch.matchedSkills.join(' · ')}</strong><p>{analysis.skillMatch.explanation}</p><small>Focus next: {analysis.skillMatch.skillGaps.join(', ')}</small></div></div> : <p className="analysis-loading">AI is checking eligibility and skill fit...</p>}<button type="button" className="apply-button" onClick={() => applyToJob(selectedOpportunity)}>{appliedJobs.includes(selectedOpportunity.id) ? 'Application submitted ✓' : 'Apply to this opportunity →'}</button></section></div>}
    </div>
  )
}

export default CandidateHome
