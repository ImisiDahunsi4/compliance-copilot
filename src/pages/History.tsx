import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Eye, Calendar } from 'lucide-react'
import { format } from 'date-fns'

type Session = {
    id: string
    created_at: string
    score: number
    duration_seconds: number
    scenarios: {
        title: string
    } | null
}

export default function History() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select(`
          id,
          created_at,
          score,
          duration_seconds,
          scenarios (
            title
          )
        `)
                .order('created_at', { ascending: false })

            if (data) setSessions(data as any)
            setLoading(false)
        }

        fetchSessions()
    }, [user])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/app/dashboard')}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
                    <p className="text-muted-foreground">Review your past compliance sessions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No sessions recorded yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Scenario</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map(session => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {format(new Date(session.created_at), 'MMM d, yyyy')}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(session.created_at), 'h:mm a')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {session.scenarios?.title || 'Unknown Scenario'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={session.score === 100 ? 'default' : session.score > 80 ? 'secondary' : 'destructive'}>
                                                {session.score}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(session.duration_seconds)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/app/session-detail/${session.id}`)}>
                                                <Eye className="w-4 h-4 mr-2" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
