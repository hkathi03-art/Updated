import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { DEMO_PASS, DEMO_STUDENTS } from '../lib/data'
import { signInDemoStudent } from '../lib/demoAuth'

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Login() {
  const router = useRouter()
  const { signIn, signUp, signOut, resetPassword, user } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [loginAs, setLoginAs] = useState('student')

  const [liEmail, setLiEmail] = useState('')
  const [liPass, setLiPass] = useState('')

  const [suName, setSuName] = useState('')
  const [suCountry, setSuCountry] = useState('')
  const [suMajor, setSuMajor] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPass, setSuPass] = useState('')

  async function doDemoStudentLogin(student) {
    setLoading(true)
    setMsg(null)
    try {
      if (user?.email && user.email !== student.email) {
        await signOut()
      }
      await signInDemoStudent(supabase, student, DEMO_PASS)
      toast(`Welcome, ${student.name}!`, 'success')
      router.push('/dashboard')
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function doLogin() {
    if (!liEmail || !liPass) {
      setMsg({ type: 'error', text: 'Please enter email and password' })
      return
    }

    setLoading(true)
    setMsg(null)

    try {
      const authUser = await signIn(liEmail, liPass)

      if (loginAs === 'student') {
        toast('Welcome back! 👋', 'success')
        router.push('/dashboard')
        return
      }

      const email = (authUser?.email || liEmail).toLowerCase()

      const { data: profile } = authUser?.id
        ? await supabase.from('profiles').select('role, major').eq('id', authUser.id).maybeSingle()
        : { data: null }

      const role = (profile?.role || '').toLowerCase()
      const major = (profile?.major || '').toLowerCase()

      const isAdmin =
        role === 'admin' ||
        role === 'staff' ||
        role === 'faculty' ||
        (email.endsWith('@bowiestate.edu') && !email.includes('@students.')) ||
        major.includes('staff') ||
        major.includes('faculty')

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
      setMsg({ type: 'success', text: 'Password reset email sent. Check your inbox.' })
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
            <div className="auth-icon">🎓</div>
            <div className="auth-title">BSU International Portal</div>
          </div>

          {msg && (
            <div className={msg.type === 'error' ? 'error-box' : 'success-box'}>
              {msg.text}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={liEmail}
            onChange={(e) => setLiEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={liPass}
            onChange={(e) => setLiPass(e.target.value)}
          />

          <button onClick={doLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </div>
      </div>
    </div>
  )
}
