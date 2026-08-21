import { useState } from 'react'
import './CandidateHome.css'
import {
  askPlacementAssistant,
  checkEligibility,
  getSkillMatch,
} from './services/candidateAi.js'

const opportunities = [
  { company: 'Northstar Labs', title: 'Product Design Intern', location: 'Bengaluru · Hybrid', package: '₹12 LPA', deadline: 'Closes in 3 days', match: 94, eligibility: 'Eligible', skills: ['Figma', 'User research', 'Prototyping'], missing: 'Design systems', accent: 'coral' },
  { company: 'Vertex Systems', title: 'Frontend Engineer', location: 'Remote · India', package: '₹16 LPA', deadline: 'Closes in 6 days', match: 87, eligibility: 'Eligible', skills: ['React', 'JavaScript', 'CSS'], missing: 'Testing fundamentals', accent: 'lime' },
  { company: 'Mosaic Finance', title: 'Data Analyst', location: 'Mumbai · On-site', package: '₹10 LPA', deadline: 'Closes in 9 days', match: 61, eligibility: 'Review needed', skills: ['SQL', 'Excel'], missing: 'Python and statistics', accent: 'amber' },
]

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
  const [appliedJobs, setAppliedJobs] = useState(['Product Design Intern'])

  const toggleSaved = (title) => setSavedJobs((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title])
  const applyToJob = (title) => {
    setAppliedJobs((current) => (current.includes(title) ? current : [...current, title]))
    setSelectedOpportunity(null)
  }

  const openOpportunityAnalysis = async (job) => {
    setSelectedOpportunity(job)
    setAnalysis(null)
    const [eligibility, skillMatch] = await Promise.all([
      checkEligibility({ id: 'aarav-rao' }, job),
      getSkillMatch({ id: 'aarav-rao' }, job),
    ])
    setAnalysis({ eligibility, skillMatch })
  }

  const askAssistant = async (question) => {
    const prompt = question || assistantQuestion
    if (!prompt.trim()) return
    setAssistantQuestion(prompt)
    setAssistantLoading(true)
    setAssistantResponse('')
    const response = await askPlacementAssistant({ id: 'aarav-rao' }, prompt)
    setAssistantResponse(response.answer)
    setAssistantLoading(false)
  }

  const renderOpportunityCard = (job) => (
    <article className="opportunity-card" key={job.title}>
      <div className="opportunity-card-top"><span className={`company-mark ${job.accent}`}>{job.company.charAt(0)}</span><button type="button" className={`save-job ${savedJobs.includes(job.title) ? 'saved' : ''}`} onClick={() => toggleSaved(job.title)} aria-label={`${savedJobs.includes(job.title) ? 'Unsave' : 'Save'} ${job.title}`}>{savedJobs.includes(job.title) ? '★' : '☆'}</button></div>
      <span className="job-company">{job.company}</span><h3>{job.title}</h3><p className="job-location">{job.location}</p>
      <div className="job-meta"><strong>{job.package}</strong><span>{job.deadline}</span></div>
      <div className="match-row"><span className="match-score">{job.match}% match</span><span className={`eligibility ${job.eligibility === 'Eligible' ? 'eligible' : 'review'}`}>{job.eligibility}</span></div>
      <button type="button" className="job-details" onClick={() => openOpportunityAnalysis(job)}>See match analysis <span>→</span></button>
    </article>
  )

  const renderOverview = () => (
    <>
      <section className="candidate-hero"><div><span className="workspace-eyebrow">Tuesday, 21 August 2026 · Candidate workspace</span><h1>Make your next move count.</h1><p>Your placement season, sorted into the actions that matter now.</p></div><div className="readiness-panel"><div className="readiness-score"><strong>78</strong><span>/100</span></div><div><span>Placement readiness</span><b>On track</b><small>+6 this week</small></div></div></section>
      <section className="stat-row" aria-label="Candidate summary"><div><span>Eligible opportunities</span><strong>12</strong><small>3 new this week</small></div><div><span>Applications active</span><strong>4</strong><small>1 needs your action</small></div><div><span>Upcoming activities</span><strong>3</strong><small>Next: tomorrow, 10:30</small></div><div><span>Profile completeness</span><strong>84%</strong><small>2 details remaining</small></div></section>
      <div className="workspace-columns"><section className="workspace-section"><div className="section-bar"><div><span className="workspace-eyebrow">AI skill matching</span><h2>Recommended for you</h2></div><button type="button" className="text-button" onClick={() => setActiveView('opportunities')}>View all <span>→</span></button></div><div className="opportunity-grid">{opportunities.slice(0, 2).map(renderOpportunityCard)}</div></section><aside className="action-stack"><section className="action-card orange-card"><span className="card-icon">!</span><div><span className="workspace-eyebrow">Pending action</span><h3>Complete your preferred roles</h3><p>It helps us verify eligibility and improve matches.</p></div><button type="button" className="card-link" onClick={() => setActiveView('profile')}>Update profile →</button></section><section className="action-card notification-card"><div className="notification-heading"><span className="workspace-eyebrow">Recent notifications</span><span className="notification-count">3</span></div><p><b>Northstar Labs</b> moved your interview to tomorrow.</p><p>Your Vertex Systems assessment is due Friday.</p><button type="button" className="text-button">See notifications →</button></section></aside></div>
      <section className="workspace-section schedule-preview"><div className="section-bar"><div><span className="workspace-eyebrow">Your timeline</span><h2>Tests & interviews</h2></div><button type="button" className="text-button" onClick={() => setActiveView('schedule')}>Open schedule <span>→</span></button></div><div className="timeline-row"><div className="timeline-date"><strong>22</strong><span>Aug</span></div><div><span className="event-type interview">Interview</span><h3>Product Design Intern · Northstar Labs</h3><p>Tomorrow · 10:30 AM · Video call · Panel: Priya Menon</p></div><span className="event-status">Confirmed</span></div></section>
    </>
  )

  const renderOpportunities = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Discovery workspace</span><h1>Find your next opportunity.</h1><p>Every listing is checked against your academic and skill profile.</p></div><button type="button" className="assistant-trigger" onClick={() => setAssistantOpen(true)}>Ask placement AI <span>✦</span></button></div><div className="filter-row"><button type="button" className="filter-active">Recommended · 12</button><button type="button">Closing soon</button><button type="button">Highest match</button><button type="button">Saved · {savedJobs.length}</button></div><div className="opportunity-grid full-grid">{opportunities.map(renderOpportunityCard)}<article className="opportunity-card muted-card"><span className="company-mark neutral">+</span><span className="job-company">More coming soon</span><h3>Keep your profile updated</h3><p className="job-location">New roles are matched as placement cells publish them.</p><button type="button" className="job-details" onClick={() => setActiveView('profile')}>Improve my matches <span>→</span></button></article></div></section>

  const renderApplications = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Application tracker</span><h1>Your placement pipeline.</h1><p>One view of every application, action, and outcome.</p></div><span className="pipeline-summary">4 active · 1 shortlisted</span></div><div className="application-table"><div className="table-head"><span>Opportunity</span><span>Status</span><span>Next action</span><span>Updated</span></div>{[['Product Design Intern', 'Northstar Labs', 'Shortlisted', 'Confirm interview', 'Today'], ['Frontend Engineer', 'Vertex Systems', 'Assessment pending', 'Complete test', 'Yesterday'], ['Business Analyst', 'Kiteworks', 'Under review', 'No action yet', '18 Aug'], ['UX Research Intern', 'Common Thread', 'Rejected', 'View feedback', '14 Aug']].map((item) => <div className="table-row" key={item[0]}><div><strong>{item[0]}</strong><small>{item[1]}</small></div><span className={`application-status ${item[2].toLowerCase().replaceAll(' ', '-')}`}>{item[2]}</span><button type="button" className="row-action">{item[3]} <span>→</span></button><time>{item[4]}</time></div>)}</div></section>

  const renderSchedule = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Tests & interviews</span><h1>Your schedule, without the scramble.</h1><p>Meeting details, modes, panels, and confirmation status in one place.</p></div></div><div className="schedule-list"><div className="schedule-item"><div className="schedule-date"><strong>22</strong><span>AUG</span></div><div className="schedule-content"><span className="event-type interview">Interview · Confirmed</span><h2>Product Design Intern</h2><p>Northstar Labs · Tomorrow at 10:30 AM</p><small>Video call · Panel: Priya Menon, Design Lead</small></div><button type="button" className="dark-action small-action">Join details →</button></div><div className="schedule-item"><div className="schedule-date"><strong>25</strong><span>AUG</span></div><div className="schedule-content"><span className="event-type assessment">Assessment · Pending</span><h2>Frontend Challenge</h2><p>Vertex Systems · Due Friday at 11:59 PM</p><small>Online assessment · Estimated time: 90 minutes</small></div><button type="button" className="dark-action small-action">Start prep →</button></div></div></section>

  const renderProfile = () => <section className="view-section"><div className="view-heading"><div><span className="workspace-eyebrow">Candidate profile</span><h1>Make your profile do the talking.</h1><p>Your profile is shared with placement opportunities you are eligible for.</p></div><span className="pipeline-summary">84% complete</span></div><div className="profile-layout"><div className="profile-checklist">{[['Personal information', 'Complete'], ['Academic details', 'Complete'], ['Skills', 'Add 2 skills'], ['Projects', 'Add project links'], ['Certifications', 'Optional'], ['Resume', 'Uploaded']].map((item) => <div className="profile-row" key={item[0]}><span className="profile-check">{item[1] === 'Complete' || item[1] === 'Uploaded' ? '✓' : '·'}</span><strong>{item[0]}</strong><span className={item[1] === 'Complete' || item[1] === 'Uploaded' ? 'done' : 'needs-action'}>{item[1]}</span><button type="button" className="row-action">Edit →</button></div>)}</div><section className="skill-card"><span className="workspace-eyebrow">Skill readiness</span><h2>Your strongest signals</h2><div className="skill-line"><span>React</span><b>92%</b><i><em style={{ width: '92%' }} /></i></div><div className="skill-line"><span>Product thinking</span><b>78%</b><i><em style={{ width: '78%' }} /></i></div><div className="skill-line"><span>Communication</span><b>66%</b><i><em style={{ width: '66%' }} /></i></div><button type="button" className="assistant-trigger" onClick={() => setAssistantOpen(true)}>Get preparation advice <span>✦</span></button></section></div></section>

  return (
    <div className="candidate-home"><aside className="candidate-sidebar"><a className="candidate-brand" href="/" aria-label="Campus placement home"><span className="brand-symbol">CP</span><span>Campus placement</span></a><div className="sidebar-profile"><span className="candidate-avatar">AR</span><div><strong>Aarav Rao</strong><small>Candidate · 2026 batch</small></div></div><nav className="candidate-nav" aria-label="Candidate navigation">{navItems.map((item) => <button key={item.id} type="button" className={activeView === item.id ? 'active' : ''} onClick={() => setActiveView(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.count && <small>{item.count}</small>}</button>)}</nav><button type="button" className="assistant-rail" onClick={() => setAssistantOpen(true)}><span>✦</span><div><strong>Placement AI</strong><small>Ask anything</small></div></button><button type="button" className="sidebar-signout" onClick={onLogout}>↪ <span>Sign out</span></button></aside><main className="candidate-content"><header className="candidate-header"><div className="mobile-brand"><span className="brand-symbol">CP</span> Candidate workspace</div><div className="header-actions"><button type="button" className="notification-button" aria-label="Notifications">♧<span>3</span></button><button type="button" className="header-avatar">AR</button></div></header><div className="candidate-page">{activeView === 'overview' && renderOverview()}{activeView === 'opportunities' && renderOpportunities()}{activeView === 'applications' && renderApplications()}{activeView === 'schedule' && renderSchedule()}{activeView === 'profile' && renderProfile()}</div></main>
      {assistantOpen && <div className="assistant-overlay" onClick={() => setAssistantOpen(false)}><section className="assistant-panel" onClick={(event) => event.stopPropagation()}><div className="assistant-head"><div><span className="workspace-eyebrow">Placement AI</span><h2>What should we work on?</h2></div><button type="button" className="close-assistant" onClick={() => setAssistantOpen(false)}>×</button></div><p className="assistant-intro">Ask about eligibility, recommendations, skill gaps, interview preparation, or your next action.</p><div className="assistant-prompts"><button type="button" onClick={() => askAssistant('Why am I eligible for Product Design?')}>Why am I eligible for Product Design?</button><button type="button" onClick={() => askAssistant('What skills should I improve?')}>What skills should I improve?</button><button type="button" onClick={() => askAssistant("Prepare me for tomorrow's interview")}>Prepare me for tomorrow's interview</button></div>{assistantLoading && <p className="assistant-status">Reviewing your profile and placement context...</p>}{assistantResponse && <div className="assistant-response"><span className="workspace-eyebrow">Placement AI response</span><p>{assistantResponse}</p></div>}<div className="assistant-input"><input value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askAssistant()} placeholder="Ask placement AI..." /><button type="button" onClick={() => askAssistant()}>→</button></div></section></div>}
      {selectedOpportunity && <div className="opportunity-overlay" onClick={() => setSelectedOpportunity(null)}><section className="opportunity-modal" onClick={(event) => event.stopPropagation()}><button type="button" className="close-assistant" onClick={() => setSelectedOpportunity(null)}>×</button><span className={`company-mark ${selectedOpportunity.accent}`}>{selectedOpportunity.company.charAt(0)}</span><span className="job-company">{selectedOpportunity.company}</span><h2>{selectedOpportunity.title}</h2><p className="job-location">{selectedOpportunity.location} · {selectedOpportunity.package}</p><div className="analysis-score"><strong>{analysis?.skillMatch.score || selectedOpportunity.match}%</strong><span>AI skill match</span></div>{analysis ? <div className="analysis-grid"><div><span className="workspace-eyebrow">Eligibility check</span><strong className="eligible-text">✓ {analysis.eligibility.status}</strong><p>{analysis.eligibility.explanation}</p><small>{analysis.eligibility.criteria.filter((criterion) => criterion.met).length}/{analysis.eligibility.criteria.length} criteria met</small></div><div><span className="workspace-eyebrow">Skill analysis</span><strong>{analysis.skillMatch.matchedSkills.join(' · ')}</strong><p>{analysis.skillMatch.explanation}</p><small>Focus next: {analysis.skillMatch.skillGaps.join(', ')}</small></div></div> : <p className="analysis-loading">AI is checking eligibility and skill fit...</p>}<button type="button" className="apply-button" onClick={() => applyToJob(selectedOpportunity.title)}>{appliedJobs.includes(selectedOpportunity.title) ? 'Application submitted ✓' : 'Apply to this opportunity →'}</button></section></div>}
    </div>
  )
}

export default CandidateHome
