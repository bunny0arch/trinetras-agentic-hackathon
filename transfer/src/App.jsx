import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import CandidateHome from './CandidateHome.jsx'
import RecruiterHome from './RecruiterHome.jsx'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'

const roles = {
  candidate: {
    label: 'Candidate',
    accent: 'candidate',
    description: 'Track offers and interview readiness.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.25a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12.25Zm0 1.75c-3.35 0-6 2.15-6 4.8A1.45 1.45 0 0 0 7.45 20h9.1A1.45 1.45 0 0 0 18 18.8c0-2.65-2.65-4.8-6-4.8Z" />
      </svg>
    ),
  },
  recruiter: {
    label: 'Recruiter',
    accent: 'recruiter',
    description: 'Coordinate shortlists and hiring rounds.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8.5A2.5 2.5 0 0 1 9.5 6h5A2.5 2.5 0 0 1 17 8.5v7A2.5 2.5 0 0 1 14.5 18h-5A2.5 2.5 0 0 1 7 15.5v-7Zm3 0h4m-4 3h4M6 6.5V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1.5" />
      </svg>
    ),
  },
}

const metrics = [
  { value: '92%', label: 'offer readiness', detail: 'live candidate health' },
  { value: '5x', label: 'faster coordination', detail: 'reduce admin drag' },
  { value: '1.4K', label: 'interviews aligned', detail: 'across hiring rounds' },
]

function LoginPage() {
  const { signIn, signUp } = useAuth()
  const shellRef = useRef(null)
  const rippleTimersRef = useRef(new Set())
  const supportNoticeTimerRef = useRef(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSupportNotice, setShowSupportNotice] = useState(false)
  const [closingSupportNotice, setClosingSupportNotice] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    role: 'Candidate',
  })
  const [ripples, setRipples] = useState([])
  const [loginError, setLoginError] = useState(null)

  const activeRole = useMemo(
    () => (selectedRole ? roles[selectedRole] : null),
    [selectedRole],
  )

  useEffect(() => {
    const rippleTimers = rippleTimersRef.current

    const handlePointerDown = (event) => {
      const target = event.target
      if (!target || target.closest('button, input, textarea, a, label, select')) {
        return
      }

      const shell = shellRef.current
      if (!shell) return

      const rect = shell.getBoundingClientRect()
      const ripple = {
        id: `${Date.now()}-${Math.random()}`,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        size: 150,
      }

      setRipples((current) => [...current, ripple])
      const rippleTimer = window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id))
        rippleTimers.delete(rippleTimer)
      }, 700)
      rippleTimers.add(rippleTimer)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      rippleTimers.forEach((timer) => window.clearTimeout(timer))
      rippleTimers.clear()
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedRole) return
    setLoginError(null)
    try {
      await signIn(form.email, form.password)
    } catch (err) {
      console.error('Login error:', err)
      setLoginError(err.message || 'Invalid login credentials')
    }
  }

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    setLoginError(null)
    try {
      await signUp(signUpForm.email, signUpForm.password, {
        name: signUpForm.name,
        college: signUpForm.college,
        role: signUpForm.role.toLowerCase()
      })
      setAccountCreated(true)
    } catch (err) {
      console.error('Signup error:', err)
      setLoginError(err.message || 'Failed to create account')
    }
  }

  const resetCreateAccount = () => {
    setShowCreateAccount(false)
    setAccountCreated(false)
    setShowSignupPassword(false)
    setLoginError(null)
    setSignUpForm({
      name: '',
      email: '',
      password: '',
      college: '',
      role: selectedRole === 'recruiter' ? 'Recruiter' : 'Candidate',
    })
  }

  const openCreateAccount = () => {
    setLoginError(null)
    setSignUpForm((current) => ({
      ...current,
      role: selectedRole === 'recruiter' ? 'Recruiter' : 'Candidate',
    }))
    setShowCreateAccount(true)
  }

  const handleForgotPassword = () => {
    setClosingSupportNotice(false)
    setShowSupportNotice(true)
  }

  const dismissSupportNotice = () => {
    setClosingSupportNotice(true)
    supportNoticeTimerRef.current = window.setTimeout(() => {
      setShowSupportNotice(false)
      supportNoticeTimerRef.current = null
    }, 260)
  }

  useEffect(() => () => {
    if (supportNoticeTimerRef.current) {
      window.clearTimeout(supportNoticeTimerRef.current)
    }
  }, [])

  return (
    <div className="placement-shell" ref={shellRef}>
      <div className="orb-field" aria-hidden="true">
        <span className="small-orb small-orb-one" />
        <span className="small-orb small-orb-two" />
        <span className="small-orb small-orb-three" />
        <span className="small-orb small-orb-four" />
        <span className="small-orb small-orb-five" />
        <span className="small-orb small-orb-six" />
        <span className="small-orb small-orb-seven" />
        <span className="small-orb small-orb-eight" />
      </div>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="global-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      <main className="login-layout">
        <section className="hero-panel">
          <h1>Campus placement, coordinated by intelligence.</h1>
          <p className="lede">
            AI Campus Placement Operations &amp; Interview Coordination Agent
          </p>

          <div className="role-selector" aria-label="Select role">
            {Object.entries(roles).map(([key, role]) => (
              <button
                key={key}
                type="button"
                className={`role-button ${role.accent} ${selectedRole === key ? 'selected' : ''}`}
                onClick={() => setSelectedRole(key)}
              >
                <span className={`role-badge ${role.accent}`}>{role.icon}</span>
                <span className="role-copy">
                  <strong>{role.label}</strong>
                  <small>{role.description}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="insight-dashboard" aria-label="Placement insights">
            <div className="insight-heading">
              <span className="insight-kicker">Placement operations</span>
              <span className="insight-status"><i /> Live signal</span>
            </div>
            <div className="insight-strip">
              {metrics.map((metric) => (
                <div key={metric.label} className="insight-tile">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {selectedRole && activeRole && (
          <section className="portal-panel visible" key={selectedRole}>
            <div className="panel-frame">
              <div className="panel-header">
                <span className="status-tag">Welcome back</span>
                <span className="live-dot" aria-label="online status" />
              </div>

              <div className="panel-identity">
                <div className={`identity-badge ${activeRole.accent}`}>
                  {activeRole.label.charAt(0)}
                </div>
                <div className="identity-copy">
                  <span>Continue as</span>
                  <h2>{activeRole.label}</h2>
                </div>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                {loginError && <div className="error-message" style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.9rem' }}>{loginError}</div>}
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="name@college.edu"
                  />
                </label>

                <label>
                  <span>Password</span>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <div className="form-footer">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="text-link" onClick={handleForgotPassword}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="primary-action">
                  Access {activeRole.label} portal
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={openCreateAccount}
                >
                  Create account
                </button>
              </form>
            </div>
          </section>
        )}

        {showCreateAccount && (
          <div className="signup-overlay" onClick={() => setShowCreateAccount(false)}>
            <div className="signup-panel" onClick={(event) => event.stopPropagation()}>
              {!accountCreated ? (
                <>
                  <div className="signup-header">
                    <div>
                      <span className="eyebrow-small">New account</span>
                      <h3>Create your profile</h3>
                    </div>
                    <button
                      type="button"
                      className="close-button"
                      onClick={() => setShowCreateAccount(false)}
                    >
                      ×
                    </button>
                  </div>

                  <form className="signup-form" onSubmit={handleCreateAccount}>
                    {loginError && <div className="error-message" style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.9rem' }}>{loginError}</div>}
                    <label>
                      <span>Full name</span>
                      <input
                        type="text"
                        value={signUpForm.name}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Your full name"
                      />
                    </label>

                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={signUpForm.email}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, email: event.target.value }))
                        }
                        placeholder="you@example.com"
                      />
                    </label>

                    <label>
                      <span>Password</span>
                      <div className="password-field signup-password">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signUpForm.password}
                          onChange={(event) =>
                            setSignUpForm((current) => ({ ...current, password: event.target.value }))
                          }
                          placeholder="Create a secure password"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowSignupPassword((current) => !current)}
                        >
                          {showSignupPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>

                    <label>
                      <span>College / Institute</span>
                      <input
                        type="text"
                        value={signUpForm.college}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, college: event.target.value }))
                        }
                        placeholder="Enter your institution"
                      />
                    </label>

                    <label className={`select-field ${signUpForm.role === 'Recruiter' ? 'recruiter' : 'candidate'}`}>
                      <span>Role</span>
                      <select
                        value={signUpForm.role}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, role: event.target.value }))
                        }
                      >
                        <option value="Candidate">Candidate</option>
                        <option value="Recruiter">Recruiter</option>
                      </select>
                    </label>

                    <button type="submit" className="primary-action full-width">
                      Create account
                    </button>

                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setShowCreateAccount(false)}
                    >
                      Back to login
                    </button>
                  </form>
                </>
              ) : (
                <div className="success-toast" aria-live="polite">
                  <div className="success-toast-icon">✓</div>
                  <div className="success-toast-copy">
                    <strong>Account created</strong>
                    <span>
                      Welcome, {signUpForm.name || 'there'}. Your {signUpForm.role.toLowerCase()} profile is ready.
                    </span>
                  </div>
                  <button type="button" className="toast-action" onClick={resetCreateAccount}>
                    Back to login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showSupportNotice && (
          <div
            className={`support-toast ${closingSupportNotice ? 'closing' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div className="support-toast-icon">i</div>
            <div className="support-toast-copy">
              <strong>Password assistance</strong>
              <span>
                Please contact the IT Department to resolve this issue at{' '}
                <a href="mailto:trinetras@gmail.com">trinetras@gmail.com</a>.
              </span>
            </div>
            <button
              type="button"
              className="toast-action"
              onClick={dismissSupportNotice}
              aria-label="Dismiss password assistance notification"
            >
              Dismiss
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function MainApp() {
  const { isAuthenticated, role, loading, signOut } = useAuth()

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>
  }

  if (isAuthenticated && role === 'candidate') {
    return <CandidateHome onLogout={signOut} />
  }

  if (isAuthenticated && role === 'recruiter') {
    return <RecruiterHome onLogout={signOut} />
  }

  return <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export { LoginPage }
export default App
