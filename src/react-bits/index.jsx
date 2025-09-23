import React, { useState, useEffect, useContext, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// Theme context for light/dark mode
const ThemeContext = React.createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const t = localStorage.getItem('theme')
            return t === 'dark' ? 'dark' : 'light'
        } catch (e) { return 'light' }
    })

    useEffect(() => {
        try {
            localStorage.setItem('theme', theme)
            if (theme === 'dark') document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
        } catch (e) { }
    }, [theme])

    const toggle = () => {
        console.log('[ThemeProvider] toggle called, current:', theme)
        setTheme((t) => {
            const next = t === 'dark' ? 'light' : 'dark'
            console.log('[ThemeProvider] changing theme ->', next)
            return next
        })
    }
    const wrappedSetTheme = (v) => { console.log('[ThemeProvider] setTheme called with', v); setTheme(v) }
    return <ThemeContext.Provider value={{ theme, setTheme: wrappedSetTheme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    return useContext(ThemeContext)
}

export function Card({ children, className = '', hover = true, ...props }) {
    return (
        <motion.div whileHover={hover ? { y: -4, boxShadow: '0 10px 30px rgba(2,6,23,0.2)' } : {}} className={`bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow p-6 ${className}`} {...props}>
            {children}
        </motion.div>
    )
}

export function Background({ children, variant = 'soft', className = '', style = {}, ...props }) {
    // variant: 'soft' | 'vivid'
    const variants = {
        soft: 'bg-gradient-to-b from-slate-100 via-white to-slate-100',
        vivid: 'bg-gradient-to-br from-sky-500 via-indigo-400 to-purple-600 text-white',
    }
    // Add animated gradient for vivid
    const animation = variant === 'vivid' ? 'animate-gradient-x' : ''
    return (
        <div className={`relative overflow-hidden ${variants[variant] || variants.soft} min-h-screen flex items-center justify-center ${animation} ${className}`} style={style} {...props}>
            {/* Animated floating SVG shapes for vivid backgrounds */}
            {variant === 'vivid' && (
                <>
                    <svg className="absolute left-[-80px] top-[-80px] w-64 h-64 opacity-30 animate-float-slow pointer-events-none" viewBox="0 0 200 200" fill="none">
                        <circle cx="100" cy="100" r="100" fill="#38bdf8" />
                    </svg>
                    <svg className="absolute right-[-60px] top-1/2 w-40 h-40 opacity-20 animate-float-fast pointer-events-none" viewBox="0 0 160 160" fill="none">
                        <rect x="0" y="0" width="160" height="160" rx="80" fill="#6366f1" />
                    </svg>
                    <svg className="absolute left-1/2 bottom-[-60px] w-32 h-32 opacity-20 animate-float-medium pointer-events-none" viewBox="0 0 128 128" fill="none">
                        <ellipse cx="64" cy="64" rx="64" ry="48" fill="#a21caf" />
                    </svg>
                </>
            )}
            <div className="relative z-10 w-full">{children}</div>
        </div>
    )
}

export function Input(props) {
    return (
        <input
            {...props}
            className={`mt-1 mb-3 block w-full rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-sky-300 px-3 py-2 transition-all duration-200 focus:scale-[1.03] focus:shadow-lg hover:shadow-md ${props.className || ''}`}
        />
    )
}

export function Textarea(props) {
    return (
        <textarea
            {...props}
            className={`flex-1 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 h-16 resize-none px-3 py-2 ${props.className || ''}`}
        />
    )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
    const base = 'px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:scale-[1.04] hover:scale-[1.03] hover:shadow-lg active:scale-100'
    const styles = {
        primary: 'bg-sky-600 text-white',
        ghost: 'bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700',
        danger: 'bg-red-600 text-white',
    }
    const hover = variant === 'ghost' ? { scale: 1.02 } : { scale: 1.03 }
    return (
        <motion.button whileHover={hover} className={`${base} ${styles[variant] || styles.primary} ${className}`} {...props}>
            {children}
        </motion.button>
    )
}

export function FadeInSection({ children, className = '' }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: 'easeOut' }} className={className}>
            {children}
        </motion.div>
    )
}

export function Skeleton({ className = '', style = {} }) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} style={style} />
}

export function LazyImage({ src, alt = '', className = '', style = {}, placeholder = null }) {
    const imgRef = useRef(null)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        if (!imgRef.current) return
        if (visible) return
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    setVisible(true)
                    obs.disconnect()
                }
            })
        })
        obs.observe(imgRef.current)
        return () => obs.disconnect()
    }, [imgRef.current])
    return (
        <div ref={imgRef} className={`inline-block ${className}`} style={style}>
            {visible ? <img src={src} alt={alt} className="w-full h-auto" /> : (placeholder || <Skeleton className="w-48 h-32" />)}
        </div>
    )
}

export function IconButton({ children, title, className = '', ...props }) {
    return (
        <button title={title} className={`p-2 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 ${className}`} {...props}>
            {children}
        </button>
    )
}

export function Navbar({ logo, links = [], className = '', children }) {
    const theme = useContext(ThemeContext)
    return (
        <nav className={`w-full flex items-center justify-between py-3 px-4 md:px-8 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">{logo || 'AI'}</div>
                    <div className="hidden sm:block text-lg font-semibold">English Chat</div>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
                {links.map((l) => (
                    <a key={l.href} href={l.href} className="text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900">{l.label}</a>
                ))}
                {children}
            </div>
            {/* Theme toggle always visible (mobile + desktop) */}
            <div className="flex items-center gap-2">
                <IconButton onClick={theme?.toggle} aria-label="Toggle theme" className="ml-2">
                    {theme?.theme === 'dark' ? '🌙' : '☀️'}
                </IconButton>
            </div>
        </nav>
    )
}

export function Hero({ title, subtitle, ctaLabel = 'Get started', onCta, className = '', children }) {
    return (
        <section className={`w-full max-w-6xl mx-auto py-12 px-4 md:px-8 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{title}</h1>
                    <p className="text-base text-slate-700 mb-6">{subtitle}</p>
                    <div className="flex gap-3">
                        <Button onClick={onCta}>{ctaLabel}</Button>
                        <Button variant="ghost">Learn more</Button>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    {children}
                </div>
            </div>
        </section>
    )
}

export function Avatar({ name, size = 32, className = '' }) {
    const initials = (name || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    return (
        <div className={`rounded-full bg-sky-500 text-white flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <span className="text-sm font-semibold">{initials}</span>
        </div>
    )
}

export function FloatingButton({ href = '#', children, className = '' }) {
    return (
        <a href={href} className={`fixed z-50 bottom-6 left-1/2 transform -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-8 md:right-8 md:rounded-full md:shadow-lg md:opacity-0 md:pointer-events-none ${className}`} aria-label="Call to action">
            <div className="block md:hidden">
                <div className="mx-auto w-44 max-w-full px-4 py-3 bg-sky-600 text-white rounded-full shadow-lg text-center text-sm font-medium">{children}</div>
            </div>
        </a>
    )
}

export default {
    Card,
    Background,
    Input,
    Textarea,
    Button,
    IconButton,
    Avatar,
    Navbar,
    Hero,
    ThemeProvider,
    useTheme,
}
