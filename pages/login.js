import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { DEMO_PASS, DEMO_STUDENTS } from '../lib/data'
import { signInDemoStudent } from '../lib/demoAuth'

export default function Login() {
  const router = useRouter()
  const { signIn, signUp, signOut, resetPassword, user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [loginAs, setLoginAs] = useState('student')
  const [studentAction, setStudentAction] = useState('signin')
  const [selectedStudentKey, setSelectedStudentKey] = useState(DEMO_STUDENTS[0]?.key || '')

  const selectedStudent = useMemo(
    () => DEMO_STUDENTS.find((student) => student.key === selectedStudentKey) || null,
    [selectedStudentKey]
  )

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  if (user) return null

  // Login form state
  const [liEmail, setLiEmail] = useState('')
  const [liPass, setLiPass] = useState('')

  // Signup form state
  const [suName, setSuName] = useState('')
  const [suCountry, setSuCountry] = useState('')
  const [suMajor, setSuMajor] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPass, setSuPass] = useState('')

  async function doLogin() {
    if (loginAs === 'student') {
      if (!selectedStudent) {
        setMsg({ type: 'error', text: 'Please choose a student from the list.' })
        return
      }

      setLoading(true)
      setMsg(null)
      try {
        if (studentAction === 'signout') {
          await signOut()
          toast(`${selectedStudent.name} signed out.`, 'success')
          setMsg({ type: 'success', text: `${selectedStudent.name} is now signed out.` })
          return
        }

        await signInDemoStudent(supabase, selectedStudent, DEMO_PASS)
        toast(`Welcome, ${selectedStudent.name}!`, 'success')
        router.push('/dashboard')
      } catch (e) {
        setMsg({ type: 'error', text: e.message })
      } finally {
        setLoading(false)
      }
      return
    }

    if (!liEmail || !liPass) {
      setMsg({ type: 'error', text: 'Please enter email and password' })
      return
    }

    setLoading(true)
    setMsg(null)
    try {
      const authUser = await signIn(liEmail, liPass)
      const email = (authUser?.email || liEmail || '').toLowerCase()
      const { data: profile } = authUser?.id
        ? await supabase.from('profiles').select('role, major').eq('id', authUser.id).maybeSingle()
        : { data: null }
      const role = (profile?.role || '').toLowerCase()
      const major = (profile?.major || '').toLowerCase()
      const isAdmin = (
        role === 'admin' ||
        role === 'staff' ||
        role === 'faculty' ||
        (email.endsWith('@bowiestate.edu') && !email.includes('@students.')) ||
        major.includes('staff') ||
        major.includes('faculty')
      )

      if (!isAdmin) {
        setMsg({ type: 'error', text: 'This account is not authorized as Admin/Staff.' })
        return
      }

      toast('Welcome back! 👋', 'success')
      router.push('/admin')
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function doSignUp() {
    if (!suName || !suEmail || !suPass) {
      setMsg({ type: 'error', text: 'Please fill in all required fields' })
      return
    }
    if (suPass.length < 8) {
      setMsg({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await signUp(suEmail, suPass, suName, suCountry, suMajor)
      setMsg({ type: 'success', text: 'Account created! Check your email to confirm, then sign in.' })
      setTab('login')
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!liEmail) {
      setMsg({ type: 'error', text: 'Enter your email first, then click Forgot Password.' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await resetPassword(liEmail)
      setMsg({ type: 'success', text: 'Password reset email sent. Check your inbox for the reset link.' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main-wrap">
      <div className="auth-wrap">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
            <div className="auth-icon" style={{ display: 'inline-flex' }}>🎓</div>
            <div className="auth-title">BSU International Portal</div>
            <div className="auth-sub">{tab === 'login' ? 'Sign in to your account' : 'Create your student account'}</div>
          </div>

          <div className="auth-tabs">
            <div className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setMsg(null) }}>Sign In</div>
            <div className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setMsg(null) }}>Create Account</div>
          </div>

          {msg && <div className={msg.type === 'error' ? 'error-box' : 'success-box'}>{msg.text}</div>}

          {tab === 'login' ? (
            <>
              <div className="auth-role-switch" role="tablist" aria-label="Sign-in role">
                <button
                  type="button"
                  className={`auth-role-btn${loginAs === 'student' ? ' active' : ''}`}
                  onClick={() => setLoginAs('student')}
                >
                  Sign in as Student
                </button>
                <button
                  type="button"
                  className={`auth-role-btn${loginAs === 'admin' ? ' active' : ''}`}
                  onClick={() => setLoginAs('admin')}
                >
                  Sign in as Admin
                </button>
              </div>

              {loginAs === 'student' ? (
                <>
                  <div className="auth-action-switch" role="tablist" aria-label="Student sign-in status">
                    <button
                      type="button"
                      className={`auth-action-btn${studentAction === 'signin' ? ' active' : ''}`}
                      onClick={() => setStudentAction('signin')}
                    >
                      Sign In Student
                    </button>
                    <button
                      type="button"
                      className={`auth-action-btn${studentAction === 'signout' ? ' active' : ''}`}
                      onClick={() => setStudentAction('signout')}
                    >
                      Sign Out Student
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Choose Student</label>
                    <select
                      className="form-input"
                      value={selectedStudentKey}
                      onChange={(e) => setSelectedStudentKey(e.target.value)}
                    >
                      {DEMO_STUDENTS.map((student) => (
                        <option key={student.key} value={student.key}>
                          {student.name} · {student.major}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStudent && (
                    <div className="auth-student-preview">
                      <strong>{selectedStudent.name}</strong>
                      <span>{selectedStudent.email}</span>
                    </div>
                  )}

                  <button className="btn btn-primary btn-full" onClick={doLogin} disabled={loading}>
                    {loading
                      ? studentAction === 'signin' ? 'Signing in…' : 'Signing out…'
                      : studentAction === 'signin' ? 'Sign In' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="you@bowiestate.edu"
                      value={liEmail} onChange={e => setLiEmail(e.target.value)} autoComplete="email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="Your password"
                      value={liPass} onChange={e => setLiPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && doLogin()} />
                  </div>
                  <button className="btn btn-primary btn-full" onClick={doLogin} disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In as Admin'}
                  </button>
                  <button className="auth-link-btn" onClick={handleForgotPassword} disabled={loading}>
                    Forgot Password?
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Your full name" value={suName} onChange={e => setSuName(e.target.value)} />
              </div>
              <div className="form-2col">
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" placeholder="e.g. Nigeria" value={suCountry} onChange={e => setSuCountry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Major</label>
                  <input className="form-input" placeholder="e.g. Computer Science" value={suMajor} onChange={e => setSuMajor(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="you@students.bowiestate.edu" value={suEmail} onChange={e => setSuEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" placeholder="At least 8 characters" value={suPass} onChange={e => setSuPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSignUp()} />
              </div>
              <button className="btn btn-primary btn-full" onClick={doSignUp} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
