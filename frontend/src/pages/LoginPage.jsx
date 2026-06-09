import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function LoginPage() {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[idx] = val
    setPin(next)
    if (val && idx < 3) document.getElementById(`pin-${idx + 1}`)?.focus()
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light p-4">
      <div className="bg-gradient-to-b from-indigo-50 to-white rounded-2xl shadow-2xl border border-white/60 p-10 w-full max-w-sm text-center">
        <div className="mb-4 flex justify-center">
          <img src="/src/asset/Pohon 10.png" alt="Tree" className="w-16 h-16 object-contain drop-shadow-md" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mb-1">Commitment Progress</h1>
        <p className="text-sm text-gray-500 mb-8">X-Traordinary · Grow With Heart</p>

        <form onSubmit={handleSubmit}>
          <p className="text-sm font-semibold text-gray-600 mb-3">Enter your 4-digit PIN</p>
          <div className="flex gap-3 justify-center mb-6">
            {pin.map((d, i) => (
              <input
                key={i} id={`pin-${i}`}
                type="password" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => handleChange(e.target.value, i)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-indigo-200 bg-white rounded-xl focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition shadow-sm"
              />
            ))}
          </div>
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark transition disabled:opacity-50 shadow-md"
          >
            {loading ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

