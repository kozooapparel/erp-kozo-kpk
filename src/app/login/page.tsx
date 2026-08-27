'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <>
            <style jsx global>{`
                @keyframes moveGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(40px, -60px) scale(1.1); }
                    50% { transform: translate(-30px, 30px) scale(0.95); }
                    75% { transform: translate(20px, 50px) scale(1.05); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(-50px, 40px) scale(1.15); }
                    50% { transform: translate(35px, -35px) scale(0.9); }
                    75% { transform: translate(-25px, -50px) scale(1.1); }
                }
                @keyframes float3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(25px, 45px) scale(1.08); }
                    50% { transform: translate(-40px, -30px) scale(0.92); }
                    75% { transform: translate(35px, -20px) scale(1.12); }
                }
                @keyframes float4 {
                    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    33% { transform: translate(-30px, 50px) scale(1.1) rotate(5deg); }
                    66% { transform: translate(40px, -30px) scale(0.9) rotate(-5deg); }
                }
                @keyframes shimmer {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                @keyframes rotateSlow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes dash {
                    0% { stroke-dashoffset: 1000; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes pulseRing {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 0.1; }
                    100% { transform: scale(0.8); opacity: 0.5; }
                }
                .login-bg {
                    background: linear-gradient(-45deg, #0f172a, #042f2e, #134e4a, #0c4a6e, #1e1b4b, #0f172a);
                    background-size: 400% 400%;
                    animation: moveGradient 20s ease infinite;
                }
            `}</style>

            <div className="login-bg min-h-screen relative flex items-center justify-center overflow-hidden">

                {/* === LARGE MESH GRADIENT ORBS === */}
                <div
                    className="absolute w-[700px] h-[700px] rounded-full blur-[120px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)',
                        top: '-20%', left: '-15%',
                        animation: 'float1 22s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
                        bottom: '-20%', right: '-10%',
                        animation: 'float2 28s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                        top: '30%', right: '10%',
                        animation: 'float3 20s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute w-[450px] h-[450px] rounded-full blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)',
                        bottom: '10%', left: '20%',
                        animation: 'float4 24s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute w-[350px] h-[350px] rounded-full blur-[80px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
                        top: '60%', left: '-5%',
                        animation: 'float2 18s ease-in-out infinite',
                    }}
                />

                {/* === SVG ABSTRACT SHAPES LAYER === */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Large rotating ring - top right */}
                    <circle cx="85%" cy="15%" r="120" fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth="1"
                        style={{ animation: 'rotateSlow 60s linear infinite', transformOrigin: '85% 15%' }} />
                    <circle cx="85%" cy="15%" r="150" fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth="0.5"
                        style={{ animation: 'rotateSlow 80s linear infinite reverse', transformOrigin: '85% 15%' }} />

                    {/* Pulsing rings - bottom left */}
                    <circle cx="10%" cy="80%" r="80" fill="none" stroke="rgba(20,184,166,0.1)" strokeWidth="1"
                        style={{ animation: 'pulseRing 6s ease-in-out infinite', transformOrigin: '10% 80%' }} />
                    <circle cx="10%" cy="80%" r="120" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.5"
                        style={{ animation: 'pulseRing 8s ease-in-out infinite', transformOrigin: '10% 80%' }} />

                    {/* Pulsing rings - center right */}
                    <circle cx="90%" cy="55%" r="60" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"
                        style={{ animation: 'pulseRing 7s ease-in-out infinite', transformOrigin: '90% 55%' }} />

                    {/* Diagonal lines */}
                    <line x1="0" y1="30%" x2="25%" y2="0" stroke="rgba(16,185,129,0.06)" strokeWidth="1" />
                    <line x1="75%" y1="100%" x2="100%" y2="70%" stroke="rgba(6,182,212,0.05)" strokeWidth="1" />
                    <line x1="60%" y1="0" x2="100%" y2="40%" stroke="rgba(20,184,166,0.04)" strokeWidth="0.5" />
                    <line x1="0" y1="60%" x2="15%" y2="100%" stroke="rgba(139,92,246,0.04)" strokeWidth="0.5" />

                    {/* Dashed curved paths */}
                    <path d="M 0 50 Q 200 20, 400 80 T 800 50" fill="none" stroke="rgba(16,185,129,0.05)" strokeWidth="1" strokeDasharray="8 12"
                        style={{ animation: 'dash 30s linear infinite' }} />
                    <path d="M 100 100% Q 50% 80%, 100% 90%" fill="none" stroke="rgba(6,182,212,0.04)" strokeWidth="1" strokeDasharray="6 10"
                        style={{ animation: 'dash 25s linear infinite' }} />

                    {/* Hexagon shapes */}
                    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.5"
                        transform="translate(120, 150) scale(0.8)" style={{ animation: 'rotateSlow 45s linear infinite', transformOrigin: '120px 150px' }} />
                    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="rgba(6,182,212,0.05)" strokeWidth="0.5"
                        transform="translate(900, 400) scale(1.2)" style={{ animation: 'rotateSlow 55s linear infinite reverse', transformOrigin: '900px 400px' }} />

                    {/* Triangle */}
                    <polygon points="50,10 90,85 10,85" fill="none" stroke="rgba(20,184,166,0.06)" strokeWidth="0.5"
                        transform="translate(750, 100) scale(0.7)" style={{ animation: 'rotateSlow 50s linear infinite', transformOrigin: '750px 100px' }} />
                </svg>

                {/* === GRID PATTERN === */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px',
                    }} />

                {/* === DOTS PATTERN === */}
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.4) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        backgroundPosition: '20px 20px',
                    }} />

                {/* === FLOATING DIAMONDS === */}
                <div className="absolute top-[8%] left-[8%] w-6 h-6 rotate-45 border border-emerald-500/15" style={{ animation: 'shimmer 4s ease-in-out infinite' }} />
                <div className="absolute top-[12%] left-[35%] w-3 h-3 rotate-45 bg-emerald-400/10" style={{ animation: 'shimmer 5s ease-in-out infinite' }} />
                <div className="absolute top-[20%] right-[12%] w-5 h-5 rotate-45 border border-teal-400/12" style={{ animation: 'shimmer 6s ease-in-out infinite' }} />
                <div className="absolute top-[5%] right-[40%] w-4 h-4 rotate-45 border border-cyan-500/10" style={{ animation: 'shimmer 3.5s ease-in-out infinite' }} />
                <div className="absolute bottom-[15%] left-[12%] w-7 h-7 rotate-45 border border-emerald-500/10" style={{ animation: 'shimmer 7s ease-in-out infinite' }} />
                <div className="absolute bottom-[25%] right-[8%] w-3 h-3 rotate-45 bg-teal-400/10" style={{ animation: 'shimmer 4.5s ease-in-out infinite' }} />
                <div className="absolute bottom-[8%] left-[40%] w-4 h-4 rotate-45 border border-purple-400/10" style={{ animation: 'shimmer 5.5s ease-in-out infinite' }} />
                <div className="absolute top-[45%] left-[3%] w-4 h-4 rotate-45 border border-cyan-400/10" style={{ animation: 'shimmer 6.5s ease-in-out infinite' }} />
                <div className="absolute top-[70%] right-[5%] w-5 h-5 rotate-45 border border-emerald-300/8" style={{ animation: 'shimmer 5s ease-in-out infinite' }} />
                <div className="absolute bottom-[40%] left-[25%] w-2 h-2 rotate-45 bg-cyan-400/15" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />

                {/* === FLOATING DOTS === */}
                <div className="absolute top-[6%] right-[25%] w-2 h-2 rounded-full bg-emerald-400/25" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
                <div className="absolute top-[18%] left-[20%] w-1.5 h-1.5 rounded-full bg-teal-300/20" style={{ animation: 'shimmer 4s ease-in-out infinite' }} />
                <div className="absolute top-[35%] right-[30%] w-1 h-1 rounded-full bg-cyan-400/30" style={{ animation: 'shimmer 5s ease-in-out infinite' }} />
                <div className="absolute top-[55%] left-[8%] w-2 h-2 rounded-full bg-emerald-300/20" style={{ animation: 'shimmer 3.5s ease-in-out infinite' }} />
                <div className="absolute bottom-[12%] right-[20%] w-1.5 h-1.5 rounded-full bg-teal-400/25" style={{ animation: 'shimmer 4.5s ease-in-out infinite' }} />
                <div className="absolute bottom-[35%] left-[15%] w-1 h-1 rounded-full bg-purple-400/20" style={{ animation: 'shimmer 6s ease-in-out infinite' }} />
                <div className="absolute top-[75%] left-[45%] w-1.5 h-1.5 rounded-full bg-cyan-300/20" style={{ animation: 'shimmer 5.5s ease-in-out infinite' }} />
                <div className="absolute top-[42%] right-[6%] w-2 h-2 rounded-full bg-emerald-400/15" style={{ animation: 'shimmer 4s ease-in-out infinite' }} />
                <div className="absolute bottom-[5%] right-[45%] w-1 h-1 rounded-full bg-teal-300/30" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
                <div className="absolute top-[85%] left-[5%] w-1.5 h-1.5 rounded-full bg-emerald-500/20" style={{ animation: 'shimmer 7s ease-in-out infinite' }} />

                {/* === CROSS SHAPES === */}
                <div className="absolute top-[30%] left-[6%]" style={{ animation: 'shimmer 5s ease-in-out infinite' }}>
                    <div className="w-4 h-[1px] bg-emerald-400/15 absolute top-1/2 left-0" />
                    <div className="w-[1px] h-4 bg-emerald-400/15 absolute left-1/2 top-0" />
                </div>
                <div className="absolute bottom-[18%] right-[15%]" style={{ animation: 'shimmer 6s ease-in-out infinite' }}>
                    <div className="w-3 h-[1px] bg-teal-400/12 absolute top-1/2 left-0" />
                    <div className="w-[1px] h-3 bg-teal-400/12 absolute left-1/2 top-0" />
                </div>
                <div className="absolute top-[65%] right-[35%]" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>
                    <div className="w-3 h-[1px] bg-cyan-400/10 absolute top-1/2 left-0" />
                    <div className="w-[1px] h-3 bg-cyan-400/10 absolute left-1/2 top-0" />
                </div>

                {/* ================================ */}
                {/* ========== CONTENT ============= */}
                {/* ================================ */}
                <div className="relative z-10 w-full max-w-md px-6">
                    {/* Logo & Title */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-5 shadow-lg shadow-emerald-500/25 transform hover:scale-105 transition-transform duration-300">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                            Kozo KPK
                        </h1>
                        <p className="text-emerald-300/70 text-sm tracking-widest uppercase">
                            Jersey Convection Management
                        </p>
                    </div>

                    {/* Login Card */}
                    <form onSubmit={handleLogin}>
                        <div
                            className="rounded-3xl p-8 border border-white/10 shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                            }}
                        >
                            {error && (
                                <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300 hover:bg-white/[0.08]"
                                            placeholder="admin@kozo.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300 hover:bg-white/[0.08]"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-7 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="inline-flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500/70">
                        Owner & Admin access only
                    </p>
                </div>
            </div>
        </>
    )
}
