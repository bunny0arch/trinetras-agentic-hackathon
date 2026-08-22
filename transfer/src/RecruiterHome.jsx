import { useState, useEffect } from 'react'
import './RecruiterHome.css'
import { useAuth } from './lib/AuthContext'
import { 
  getRecruiterStats, 
  getDrives, 
  getStudents, 
  getApplications, 
  getInterviews, 
  getTests,
  createDrive,
  updateApplication
} from './lib/database'
import { 
  askPlacementManager, 
  optimizeInterviewSchedule, 
  rankCandidates, 
  extractDriveRequirements 
} from './services/recruiterAi'

const navItems = [
  ['overview', 'Overview', '◈'],
  ['drives', 'Placement drives', '⊹'],
  ['students', 'Students', '◎'],
  ['applications', 'Applications', '↗'],
  ['assessments', 'Tests & assessments', '◷'],
  ['interviews', 'Interviews & rooms', '⌁'],
  ['analytics', 'Analytics', '▥'],
  ['settings', 'Profile & settings', '⚙'],
]

function RecruiterHome({ onLogout }) {
  const { user, profile, signOut } = useAuth()
  const [activeView, setActiveView] = useState('overview')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [driveModalOpen, setDriveModalOpen] = useState(false)
  
  // State for data
  const [stats, setStats] = useState(null)
  const [drives, setDrives] = useState([])
  const [students, setStudents] = useState([])
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [tests, setTests] = useState([])
  const [rankedStudents, setRankedStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const [newDrive, setNewDrive] = useState({
    title: '',
    company_name: '',
    job_description: '',
    min_cgpa: 7.0,
    branches: [],
    skills: [],
    application_deadline: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Use profile?.id if available, otherwise use 'demo' for demo mode
        const recruiterId = profile?.id || 'demo-recruiter'
        const [statsData, drivesData, studentsData, applicationsData, interviewsData, testsData] = await Promise.all([
          getRecruiterStats(recruiterId),
          getDrives(),
          getStudents(),
          getApplications(),
          getInterviews(),
          getTests()
        ])
        setStats(statsData || { active_drives: 0, total_students: 0, applications_received: 0, interviews_scheduled: 0 })
        setDrives(drivesData || [])
        setStudents(studentsData || [])
        setApplications(applicationsData || [])
        setInterviews(interviewsData || [])
        setTests(testsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        // Set default empty state so UI still renders
        setStats({ active_drives: 0, total_students: 0, applications_received: 0, interviews_scheduled: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile])

  const handleLogout = async () => {
    await signOut()
    onLogout?.()
  }

  const askManager = async (question) => {
    const prompt = question || assistantQuestion
    if (!prompt.trim()) return
    setAssistantLoading(true)
    try {
      const response = await askPlacementManager(prompt)
      setAssistantResponse(response.answer)
      setAssistantQuestion('')
    } catch (error) {
      setAssistantResponse('Unable to get response. Please try again.')
    } finally {
      setAssistantLoading(false)
    }
  }

  const runRanking = async () => {
    try {
      const selectedDrive = drives[0]
      if (!selectedDrive) return
      const result = await rankCandidates(students, selectedDrive)
      setRankedStudents(result)
      setActiveView('students')
    } catch (error) {
      console.error('Ranking failed:', error)
    }
  }

  const handleCreateDrive = async () => {
    try {
      const requirements = await extractDriveRequirements(newDrive)
      const driveData = {
        ...newDrive,
        recruiter_id: profile.id,
        status: 'active',
        skills: requirements.skills,
        eligibility_criteria: requirements.eligibility
      }
      await createDrive(driveData)
      setDriveModalOpen(false)
      setNewDrive({ title: '', company_name: '', job_description: '', min_cgpa: 7.0, branches: [], skills: [], application_deadline: '' })
      const updatedDrives = await getDrives()
      setDrives(updatedDrives)
    } catch (error) {
      console.error('Error creating drive:', error)
    }
  }

  const handleShortlist = async (applicationId) => {
    try {
      await updateApplication(applicationId, { status: 'shortlisted' })
      const updatedApplications = await getApplications()
      setApplications(updatedApplications)
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const renderOverview = () => (
    <>
      <section className="recruiter-hero">
        <div>
          <span className="recruiter-eyebrow">Campus Placement Portal</span>
          <h1>Turn placement data into momentum.</h1>
          <p>One operating view for every drive, student, and decision.</p>
        </div>
        <button type="button" className="recruiter-primary" onClick={() => setDriveModalOpen(true)}>
          Create placement drive <span>+</span>
        </button>
      </section>

      {stats && (
        <section className="recruiter-view">
          <div className="recruiter-view-heading">
            <div>
              <span className="recruiter-eyebrow">Placement overview</span>
              <h1>Here's where we stand.</h1>
              <p>Real-time metrics on drives, students, and pipeline movement.</p>
            </div>
          </div>
          <div className="analytics-grid">
            <div>
              <span>Total registered students</span>
              <strong>{stats.totalStudents}</strong>
              <small>Across all batches</small>
            </div>
            <div>
              <span>Active placement drives</span>
              <strong>{stats.activeDrives}</strong>
              <small>Currently recruiting</small>
            </div>
            <div>
              <span>Applications received</span>
              <strong>{stats.totalApplications}</strong>
              <small>In pipeline</small>
            </div>
            <div>
              <span>Students placed</span>
              <strong>{stats.totalPlacements}</strong>
              <small>Offers received</small>
            </div>
            <div>
              <span>Interviews scheduled</span>
              <strong>{stats.scheduledInterviews}</strong>
              <small>This week</small>
            </div>
            <div>
              <span>Tests scheduled</span>
              <strong>{stats.scheduledTests}</strong>
              <small>Pending</small>
            </div>
          </div>
        </section>
      )}

      <section className="recruiter-view">
        <div className="recruiter-view-heading">
          <div>
            <span className="recruiter-eyebrow">Pending actions</span>
            <h1>Keep the pipeline moving.</h1>
            <p>Address blockers to accelerate placements.</p>
          </div>
        </div>
        <div className="actions-list">
          <div className="action-item">
            <span>📋 Review pending applications</span>
            <small>{applications.filter(a => a.status === 'pending').length} awaiting decision</small>
          </div>
          <div className="action-item">
            <span>✅ Finalize interview panel assignments</span>
            <small>{interviews.filter(i => !i.panel_id).length} interviews without panels</small>
          </div>
          <div className="action-item">
            <span>⚡ Resolve scheduling conflicts</span>
            <small>2 overlapping interviews detected</small>
          </div>
        </div>
      </section>
    </>
  )

  const renderDrives = () => (
    <section className="recruiter-view">
      <div className="recruiter-view-heading">
        <div>
          <span className="recruiter-eyebrow">Placement drives</span>
          <h1>Manage job opportunities.</h1>
          <p>Create, configure, and track placement drives.</p>
        </div>
        <button type="button" className="text-action" onClick={() => setDriveModalOpen(true)}>
          New drive →
        </button>
      </div>
      <div className="drives-list">
        {drives.map(drive => (
          <div key={drive.id} className="drive-card">
            <div>
              <h3>{drive.company_name}</h3>
              <p>{drive.title}</p>
              <small>Deadline: {new Date(drive.application_deadline).toLocaleDateString()}</small>
            </div>
            <span className="drive-status">{drive.status}</span>
          </div>
        ))}
        {drives.length === 0 && <p>No active drives. Create one to get started.</p>}
      </div>
    </section>
  )

  const renderStudents = () => (
    <section className="recruiter-view">
      <div className="recruiter-view-heading">
        <div>
          <span className="recruiter-eyebrow">Student management</span>
          <h1>Find and rank candidates.</h1>
          <p>AI-powered matching and scoring system.</p>
        </div>
        <button type="button" className="text-action" onClick={runRanking}>
          Rank all candidates ✦
        </button>
      </div>
      <div className="students-table">
        <div className="table-header">
          <span>Name</span>
          <span>Branch</span>
          <span>CGPA</span>
          <span>Match Score</span>
          <span>Status</span>
        </div>
        {(rankedStudents.length > 0 ? rankedStudents : students).map((student, i) => (
          <div key={i} className="table-row">
            <span>{student.name}</span>
            <span>{student.branch}</span>
            <span>{student.cgpa}</span>
            <span><strong>{student.matchScore || student.score}</strong></span>
            <span>{student.status || 'Eligible'}</span>
          </div>
        ))}
      </div>
    </section>
  )

  const renderApplications = () => (
    <section className="recruiter-view">
      <div className="recruiter-view-heading">
        <div>
          <span className="recruiter-eyebrow">Application tracking</span>
          <h1>Manage submissions and decisions.</h1>
          <p>Shortlist, reject, or advance candidates.</p>
        </div>
      </div>
      <div className="applications-list">
        {applications.map(app => (
          <div key={app.id} className="app-card">
            <div>
              <h3>{app.student_id}</h3>
              <p>Applied to drive #{app.drive_id}</p>
              <small>Status: {app.status}</small>
            </div>
            <div className="app-actions">
              {app.status === 'pending' && (
                <>
                  <button onClick={() => handleShortlist(app.id)}>Shortlist</button>
                  <button onClick={() => updateApplication(app.id, { status: 'rejected' })}>Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
        {applications.length === 0 && <p>No applications yet.</p>}
      </div>
    </section>
  )

  const renderAnalytics = () => (
    <section className="recruiter-view">
      <div className="recruiter-view-heading">
        <div>
          <span className="recruiter-eyebrow">Placement analytics</span>
          <h1>See the placement picture.</h1>
          <p>Track conversion, packages, readiness, and bottlenecks across the cohort.</p>
        </div>
      </div>
      <div className="analytics-grid">
        <div>
          <span>Overall placement rate</span>
          <strong>{stats ? ((stats.totalPlacements / stats.totalStudents) * 100).toFixed(1) : 0}%</strong>
          <small>Current cycle</small>
        </div>
        <div>
          <span>Average package</span>
          <strong>₹12.5L</strong>
          <small>Across placed students</small>
        </div>
        <div>
          <span>Interview conversion</span>
          <strong>45%</strong>
          <small>Shortlisted to offers</small>
        </div>
        <div>
          <span>Unplaced students</span>
          <strong>{stats ? stats.totalStudents - stats.totalPlacements : 0}</strong>
          <small>Need readiness support</small>
        </div>
      </div>
    </section>
  )

  const renderSettings = () => (
    <section className="recruiter-view">
      <div className="recruiter-view-heading">
        <div>
          <span className="recruiter-eyebrow">Profile & settings</span>
          <h1>Manage your account.</h1>
          <p>Organization, preferences, and system configuration.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div>
          <span className="recruiter-eyebrow">Profile</span>
          <h2>{profile?.name || 'Recruiter'}</h2>
          <p>{profile?.organization || 'Placement Cell'}</p>
          <button type="button" className="row-action">Edit profile →</button>
        </div>
        <div>
          <span className="recruiter-eyebrow">Notification preferences</span>
          <h2>Alerts enabled</h2>
          <p>Drive, test, interview, and placement alerts active.</p>
          <button type="button" className="row-action">Manage →</button>
        </div>
        <div>
          <span className="recruiter-eyebrow">Sign out</span>
          <h2>End session</h2>
          <p>Securely log out from all devices.</p>
          <button type="button" className="row-action" onClick={handleLogout}>Sign out →</button>
        </div>
      </div>
    </section>
  )

  if (loading) {
    return <div className="recruiter-home"><p>Loading...</p></div>
  }

  return (
    <div className="recruiter-home">
      <aside className="recruiter-sidebar">
        <a className="recruiter-brand" href="/" aria-label="Campus placement home">
          <span className="recruiter-symbol">CP</span>
          <span>Campus placement</span>
        </a>
        <div className="recruiter-identity">
          <span className="recruiter-avatar">{profile?.name?.substring(0, 2).toUpperCase()}</span>
          <div>
            <strong>{profile?.name || 'Recruiter'}</strong>
            <small>Recruiter admin</small>
          </div>
        </div>
        <nav className="recruiter-nav" aria-label="Recruiter navigation">
          {navItems.map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              className={activeView === id ? 'active' : ''}
              onClick={() => setActiveView(id)}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <button type="button" className="manager-rail" onClick={() => setAssistantOpen(true)}>
          <span>✦</span>
          <div>
            <strong>Placement manager</strong>
            <small>Ask about your data</small>
          </div>
        </button>
        <button type="button" className="recruiter-signout" onClick={handleLogout}>
          ↪ <span>Sign out</span>
        </button>
      </aside>

      <main className="recruiter-content">
        <header className="recruiter-header">
          <span className="mobile-recruiter-label">Recruiter workspace</span>
          <button type="button" className="recruiter-alert" aria-label="Alerts">♧<b>{applications.filter(a => a.status === 'pending').length}</b></button>
        </header>
        <div className="recruiter-page">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'drives' && renderDrives()}
          {activeView === 'students' && renderStudents()}
          {activeView === 'applications' && renderApplications()}
          {activeView === 'assessments' && <section className="recruiter-view"><p>Test Management - Coming Soon</p></section>}
          {activeView === 'interviews' && <section className="recruiter-view"><p>Interview Management - Coming Soon</p></section>}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'settings' && renderSettings()}
        </div>
      </main>

      {assistantOpen && (
        <div className="recruiter-overlay" onClick={() => setAssistantOpen(false)}>
          <section className="manager-panel" onClick={(event) => event.stopPropagation()}>
            <div className="manager-head">
              <div>
                <span className="recruiter-eyebrow">AI placement manager</span>
                <h2>What should we inspect?</h2>
              </div>
              <button type="button" className="close-manager" onClick={() => setAssistantOpen(false)}>×</button>
            </div>
            <p>Ask about eligible candidates, bottlenecks, insights, or recommendations.</p>
            <div className="manager-prompts">
              <button type="button" onClick={() => askManager('Find the best candidates for the latest drive')}>Find top candidates</button>
              <button type="button" onClick={() => askManager('Detect scheduling conflicts')}>Detect conflicts</button>
              <button type="button" onClick={() => askManager('What is the current placement bottleneck?')}>Identify bottlenecks</button>
            </div>
            {assistantLoading && <div className="manager-loading">Analyzing placement data...</div>}
            {assistantResponse && (
              <div className="manager-response">
                <span className="recruiter-eyebrow">AI insight</span>
                <p>{assistantResponse}</p>
              </div>
            )}
            <div className="manager-input">
              <input value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askManager()} placeholder="Ask placement manager..." />
              <button type="button" onClick={() => askManager()}>→</button>
            </div>
          </section>
        </div>
      )}

      {driveModalOpen && (
        <div className="recruiter-overlay" onClick={() => setDriveModalOpen(false)}>
          <section className="drive-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-manager" onClick={() => setDriveModalOpen(false)}>×</button>
            <span className="recruiter-eyebrow">New placement drive</span>
            <h2>Turn a job description into a live drive.</h2>
            <p>Paste a description and AI will extract eligibility and skills.</p>
            <textarea placeholder="Job title" value={newDrive.title} onChange={(e) => setNewDrive({...newDrive, title: e.target.value})} />
            <textarea placeholder="Company name" value={newDrive.company_name} onChange={(e) => setNewDrive({...newDrive, company_name: e.target.value})} />
            <textarea placeholder="Paste job description here..." value={newDrive.job_description} onChange={(e) => setNewDrive({...newDrive, job_description: e.target.value})} />
            <div className="drive-fields">
              <label>Minimum CGPA<input type="number" value={newDrive.min_cgpa} onChange={(e) => setNewDrive({...newDrive, min_cgpa: parseFloat(e.target.value)})} /></label>
              <label>Application Deadline<input type="date" value={newDrive.application_deadline} onChange={(e) => setNewDrive({...newDrive, application_deadline: e.target.value})} /></label>
            </div>
            <button type="button" className="recruiter-primary" onClick={handleCreateDrive}>Extract requirements with AI ✦</button>
          </section>
        </div>
      )}
    </div>
  )
}

export default RecruiterHome
