import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Plus, Play, History as HistoryIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Scenario = {
    id: string
    title: string
    description: string
    keyterms: string[]
    created_at: string
}

export default function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchScenarios = async () => {
            const { data, error } = await supabase
                .from('scenarios')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setScenarios(data as Scenario[])
            setLoading(false)
        }

        fetchScenarios()
    }, [user])

    const createDefaultScenario = async () => {
        if (!user) return

        // Seed a scenario for quick testing
        await supabase.from('scenarios').insert({
            user_id: user.id,
            title: "Mortgage Compliance Check",
            description: "Standard checklist for mortgage application calls.",
            keyterms: ["Recorded line", "Annual percentage rate", "NMLS ID", "Privacy policy", "Closing disclosure"]
        })

        // Refresh
        const { data } = await supabase.from('scenarios').select('*').order('created_at', { ascending: false })
        if (data) setScenarios(data as Scenario[])
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your compliance scenarios and sessions.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate('/app/history')}>
                        <HistoryIcon className="w-4 h-4 mr-2" /> History
                    </Button>
                    <Button onClick={createDefaultScenario} className="gap-2">
                        <Plus className="w-4 h-4" /> New Scenario
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Loading...</p>
                ) : scenarios.length === 0 ? (
                    <Card className="col-span-full p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <h3 className="text-lg font-semibold mt-4">No Scenarios Yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first compliance checklist to get started.</p>
                        <Button onClick={createDefaultScenario}>Create Default Scenario</Button>
                    </Card>
                ) : (
                    scenarios.map(scenario => (
                        <Card key={scenario.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{scenario.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{scenario.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex flex-wrap gap-2">
                                    {scenario.keyterms?.slice(0, 3).map((term: string) => (
                                        <Badge key={term} variant="secondary" className="text-xs">{term}</Badge>
                                    ))}
                                    {(scenario.keyterms?.length || 0) > 3 && (
                                        <Badge variant="outline" className="text-xs">+{scenario.keyterms.length - 3}</Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-slate-50/50">
                                <Button className="w-full" onClick={() => navigate(`/app/session/${scenario.id}`)}>
                                    <Play className="w-4 h-4 mr-2" /> Start Session
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
