import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0], // Default name
                        }
                    }
                })
                if (error) throw error
                alert('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/app/dashboard')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
