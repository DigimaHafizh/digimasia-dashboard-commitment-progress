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
    if (fullPin.length < 4) {
      setError('Please enter your full 4-digit PIN.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { pin: fullPin })
      login(data)
      navigate(data.is_admin ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#DBEAFE' }}>
      {/* Subtle Loading Mask */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-12 h-12 border-4 border-[#1E2538] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main Card with Background Image */}
      <div
        className="rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.4)] overflow-hidden w-full max-w-[420px] text-center relative z-10 animate-in zoom-in-95 duration-500"
        style={{ backgroundImage: `url(${bg1Img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Darker Overlay to match Production Dense Navy */}
        <div className="bg-[#0F172A]/98 p-10 space-y-7">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={treeImg} alt="Tree" className="w-[84px] h-[84px] object-contain drop-shadow-xl" />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-[26px] font-extrabold text-white tracking-tight">Commitment Progress</h1>
            <p className="text-[13px] font-semibold text-slate-200 mt-1">X-Traordinary - Grow With Heart</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-4">
              <p className="text-[12px] font-bold text-white/80 uppercase tracking-widest">Enter your 4-digit PIN</p>

              {/* PIN Inputs */}
              <div className="flex gap-4 justify-center">
                {pin.map((d, i) => (
                  <input
                    key={i} id={`pin-${i}`}
                    type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-[54px] h-[54px] text-center text-2xl font-bold border-2 border-slate-500 bg-white/10 text-white rounded-[14px] focus:border-white focus:bg-white/20 focus:outline-none transition-all shadow-lg placeholder-white/20"
                  />
                ))}
              </div>

              {/* Show PIN Toggle */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 mx-auto pt-1 group"
              >
                <span className="bg-white/10 p-1 rounded-md group-hover:bg-white/20 transition-all">
                  {showPin ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  )}
                </span>
                {showPin ? 'Hide PIN' : 'Show PIN'}
              </button>
            </div>

            {error && <p className="text-red-400 text-xs font-bold py-1 bg-red-400/10 rounded-lg">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-[14px] bg-white text-[#0F172A] font-black text-[14px] uppercase tracking-wide hover:bg-slate-100 transition-all disabled:opacity-50 shadow-xl active:scale-[0.98]"
            >
              {loading ? 'Verifying...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
