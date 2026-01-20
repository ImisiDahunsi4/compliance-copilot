import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { checkTranscript } from '@/lib/compliance'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

type SessionDetail = {
    id: string
    created_at: string
    score: number
    duration_seconds: number
    transcript: string
    scenarios: {
        title: string
        keyterms: string[]
    }
}

export default function SessionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [session, setSession] = useState<SessionDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        const fetchSession = async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select(`
          *,
          scenarios (
            title,
            keyterms
          )
        `)
                .eq('id', id)
                .single()

            if (data) setSession(data as any)
            setLoading(false)
        }

        fetchSession()
    }, [id])

    if (loading) return <div className="p-8 text-center">Loading details...</div>
    if (!session) return <div className="p-8 text-center">Session not found</div>

    const matches = checkTranscript(session.transcript || '', session.scenarios?.keyterms || [])

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/app/history')}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back to History
                        </Button>
                        <h1 className="text-2xl font-bold">Session Details</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(session.created_at), 'PPP p')}
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                        </div>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Scenario</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{session.scenarios?.title}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${session.score >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                {session.score}%
                            </div>
                            <Progress value={session.score} className="h-2 mt-2" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Keyterms Detected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {matches.filter(m => m.matched).length} / {session.scenarios?.keyterms?.length || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                    {/* Transcript */}
                    <Card className="md:col-span-2 flex flex-col">
                        <CardHeader className="border-b bg-white">
                            <CardTitle>Transcript</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-full p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {session.transcript || <span className="text-muted-foreground italic">No audio transcribed.</span>}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Compliance Results */}
                    <Card className="flex flex-col">
                        <CardHeader className="border-b bg-white">
                            <CardTitle>Checklist Results</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-full">
                                <div className="divide-y">
                                    {matches.map(item => (
                                        <div key={item.term} className="p-4 flex items-start gap-3">
                                            {item.matched ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-slate-300 mt-0.5" />
                                            )}
                                            <div>
                                                <div className={`font-medium ${item.matched ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {item.term}
                                                </div>
                                                {item.matched && (
                                                    <div className="text-xs text-green-600 mt-1">
                                                        Found {item.count} time{item.count !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Progress({ value, className }: { value: number, className?: string }) {
    return (
        <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full transition-all duration-500 ${value >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${value}%` }}
            />
        </div>
    )
}
