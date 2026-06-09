import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import treeImg from '../asset/Pohon 10.png'
import bg1Img from '../asset/BG1.png'

export default function LoginPage() {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[idx] = val
    setPin(next)
    if (val && idx < 3) document.getElementById(`pin-${idx + 1}`)?.focus()
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...pin]
      if (next[idx]) {
        next[idx] = ''
        setPin(next)
      } else if (idx > 0) {
        next[idx - 1] = ''
        setPin(next)
        document.getElementById(`pin-${idx - 1}`)?.focus()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullPin = pin.join('')
    if (fullPin.length < 4) { setError('Please enter your full 4-digit PIN.'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { pin: fullPin })
      login(data)
      navigate(data.is_admin ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#DBEAFE' }}>
      <div
        className="rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm text-center"
        style={{ backgroundImage: `url(${bg1Img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Overlay for readability */}
        <div className="bg-black/30 backdrop-blur-[2px] p-10">
          <div className="mb-4 flex justify-center">
            <img src={treeImg} alt="Tree" className="w-16 h-16 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1 drop-shadow">Commitment Progress</h1>
          <p className="text-sm text-blue-100 mb-8">X-Traordinary · Grow With Heart</p>

          <form onSubmit={handleSubmit}>
            <p className="text-sm font-semibold text-blue-100 mb-3">Enter your 4-digit PIN</p>
            <div className="flex gap-3 justify-center mb-3">
              {pin.map((d, i) => (
                <input
                  key={i} id={`pin-${i}`}
                  type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={1} value={d}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-blue-300/50 bg-white/20 text-white rounded-xl focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40 transition shadow-sm placeholder-white/40"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-xs text-blue-200 hover:text-white transition mb-4 flex items-center gap-1 mx-auto"
            >
              {showPin ? (
                <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Hide PIN</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Show PIN</>
              )}
            </button>
            {error && <p className="text-red-300 text-sm mb-4 font-medium">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-brand-dark font-bold hover:bg-blue-100 transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'Verifying...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
