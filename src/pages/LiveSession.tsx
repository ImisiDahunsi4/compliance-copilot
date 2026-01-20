import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useScribeAnalysis, type ScribeAnalysisResult } from '@/hooks/use-scribe-analysis'
import { useSettings } from '@/contexts/SettingsContext'
import { checkTranscript } from '@/lib/compliance'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Mic, Save, Loader2, Play, Pause, Settings, FileAudio } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function LiveSession() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { openSettings } = useSettings()

    const [scenario, setScenario] = useState<{
        id: string
        title: string
        keyterms: string[]
    } | null>(null)

    const [loading, setLoading] = useState(true)
    const [startTime, setStartTime] = useState<number | null>(null)

    // Audio File State
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)

    // Analysis State
    const { analyzeAudio, isAnalyzing, error: analysisError } = useScribeAnalysis()
    const [analysisResult, setAnalysisResult] = useState<ScribeAnalysisResult | null>(null)
    const [processedTranscript, setProcessedTranscript] = useState<string>('')

    // Mic State (Disabled for Scribe V2 transition)
    const [isMicActive] = useState(false)
    const micTranscript = ''
    const micRealtime = ''


    // Compliance Analysis State
    const [matches, setMatches] = useState<ReturnType<typeof checkTranscript>>([])

    // Load Scenario
    useEffect(() => {
        if (!id) return
        const loadScenario = async () => {
            const { data, error } = await supabase.from('scenarios').select('*').eq('id', id).single()
            if (data) {
                setScenario({
                    ...data,
                    keyterms: Array.isArray(data.keyterms) ? data.keyterms.map(k => String(k)) : []
                })
            } else {
                console.error("Scenario not found", error)
                navigate('/app/dashboard')
            }
            setLoading(false)
        }
        loadScenario()
    }, [id, navigate])

    // Update compliance checking
    useEffect(() => {
        if (!scenario?.keyterms) return

        let currentText = ''

        if (analysisResult) {
            // Progressive check based on currentTime
            // We verify words played up to the current timestamp
            const allWords = analysisResult.results.channels[0].alternatives[0].words || []
            const spokenWords = allWords.filter(w => w.start <= currentTime)
            currentText = spokenWords.map(w => w.word).join(' ')
        } else {
            // Mic mode (disabled)
            currentText = ''
        }

        const results = checkTranscript(currentText, scenario.keyterms)
        setMatches(results)
    }, [micTranscript, micRealtime, scenario, analysisResult, currentTime])

    const score = useMemo(() => {
        if (!scenario?.keyterms.length) return 0
        const matchedCount = matches.filter(m => m.matched).length
        return Math.round((matchedCount / scenario.keyterms.length) * 100)
    }, [matches, scenario])

    // Handle File Upload & Analyze
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAudioFile(file)
        setAudioUrl(URL.createObjectURL(file))
        setAnalysisResult(null)
        setProcessedTranscript('')

        console.log("[LiveSession] Analyzing file with Scribe:", file.name)
        const result = await analyzeAudio(file, { keyterms: scenario?.keyterms || [] })

        if (result) {
            console.log("[LiveSession] Scribe Analysis complete:", result)
            setAnalysisResult(result)

            // Construct full text for compliance check
            const fullText = result.results.channels[0].alternatives[0].transcript
            setProcessedTranscript(fullText)
        }
    }

    const togglePlayback = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
            if (!startTime) setStartTime(Date.now())
        }
        setIsPlaying(!isPlaying)
    }

    const toggleMic = () => {
        alert("Real-time streaming is currently disabled for Scribe V2 migration.")

    }

    const handleEndSession = async () => {
        // if (isMicActive) stopMic()
        if (isPlaying && audioRef.current) audioRef.current.pause()

        if (!user || !scenario) return

        const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
        const finalTranscript = analysisResult
            ? processedTranscript
            : micTranscript

        // Save to DB
        const { error } = await supabase.from('sessions').insert({
            user_id: user.id,
            scenario_id: scenario.id,
            transcript: finalTranscript,
            score: score,
            total_keyterms: scenario.keyterms.length,
            duration_seconds: durationSeconds,
            ended_at: new Date().toISOString()
        })

        if (error) {
            alert("Failed to save session")
        } else {
            // navigate('/app/dashboard')
            // Don't auto-nav, let them review
            alert("Session saved!")
        }
    }

    // Paragraphs for rendering
    const paragraphs = useMemo(() => {
        if (!analysisResult) return []
        // Scribe V2 adapted paragraphs structure
        return analysisResult.results.channels[0].alternatives[0].paragraphs?.paragraphs || []
    }, [analysisResult])


    if (loading || !scenario) return <Loader2 className="animate-spin mx-auto mt-20" />

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Hidden Audio Player */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/app/dashboard')}>
                        ← Exit
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {scenario.title}
                            <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">Live Session</Badge>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Controls */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border">
                        {!isMicActive && (
                            <>
                                <Input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    className="w-[200px] h-8 text-xs cursor-pointer"
                                    disabled={isAnalyzing || isPlaying}
                                />
                                {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                            </>
                        )}

                        {analysisResult && (
                            <Button size="sm" onClick={togglePlayback} className={isPlaying ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}>
                                {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                                {isPlaying ? "Pause" : "Play Script"}
                            </Button>
                        )}

                        {!analysisResult && !isAnalyzing && (
                            <Button size="sm" variant="secondary" onClick={toggleMic} className="opacity-50 cursor-not-allowed" title="Disabled for Scribe V2">
                                <Mic className="w-4 h-4 mr-1" /> Use Mic
                            </Button>
                        )}
                    </div>

                    {analysisError && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {analysisError}
                        </div>
                    )}


                    <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Score</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${score === 100 ? 'text-green-600' : 'text-slate-900'}`}>{score}%</span>
                            <Progress value={score} className="w-24 h-2" />
                        </div>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    <Button variant="ghost" size="icon" onClick={openSettings} title="ElevenLabs Settings">
                        <Settings className="w-5 h-5 text-slate-500" />
                    </Button>

                    <Button variant="outline" className="gap-2" onClick={handleEndSession}>
                        <Save className="w-4 h-4" /> Save Result
                    </Button>
                </div>
            </header>

            {/* Main Grid */}
            <main className="flex-1 grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto w-full">
                {/* Left: Transcript */}
                <div className="col-span-8 flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col shadow-md border-0 ring-1 ring-slate-200">
                        <CardHeader className="bg-slate-50 border-b py-3">
                            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                                <span>Transcript</span>
                                {(isAnalyzing || isMicActive) && (
                                    <Badge variant="secondary" className="animate-pulse bg-blue-100 text-blue-700">
                                        {isAnalyzing ? "Processing Audio..." : "Listening..."}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative">
                            <ScrollArea className="h-[calc(100vh-220px)] w-full p-6">
                                {analysisResult ? (
                                    <div className="space-y-6">
                                        {paragraphs.map((para, i) => (
                                            <div key={i} className={`flex gap-4 mb-6 ${para.speaker === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${para.speaker === 0 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {para.speaker === 0 ? 'AG' : 'CU'}
                                                </div>
                                                <div className={`flex-1 rounded-2xl p-4 ${
                                                    // Highlight active paragraph based on time
                                                    currentTime >= para.start && currentTime <= para.end
                                                        ? 'bg-yellow-50 ring-1 ring-yellow-200'
                                                        : 'bg-slate-50'
                                                    }`}>
                                                    <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">
                                                        {para.speaker === 0 ? 'Agent' : 'Customer'}
                                                    </div>
                                                    <p className="text-slate-800 leading-relaxed text-lg">
                                                        {para.sentences.map((sent, sIndex) => (
                                                            <span
                                                                key={sIndex}
                                                                className={`transition-colors duration-300 ${currentTime >= sent.start && currentTime <= sent.end
                                                                    ? 'bg-yellow-200 text-black font-medium'
                                                                    : ''
                                                                    }`}
                                                            >
                                                                {sent.text}{' '}
                                                            </span>
                                                        ))}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-lg leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                        {micTranscript}
                                        <span className="text-blue-500 animate-pulse"> {micRealtime}</span>
                                        {!micTranscript && !micRealtime && (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 mt-20">
                                                {audioFile ? (
                                                    <div className="text-center">
                                                        <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        <p>Audio file loaded.</p>
                                                        <p className="text-sm">Click "Play Script" to start.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Mic className="w-12 h-12 opacity-50" />
                                                        <p>Waiting for audio input...</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Checklist */}
                <div className="col-span-4 flex flex-col gap-4">
                    <Card className="shadow-md border-0 ring-1 ring-slate-200 h-full flex flex-col">
                        <CardHeader className="bg-slate-50 border-b py-4">
                            <CardTitle className="text-lg font-bold">Compliance Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <ScrollArea className="h-[calc(100vh-220px)]">
                                <div className="divide-y max-h-full">
                                    {matches.map((item) => (
                                        <div key={item.term} className={`p-4 flex items-start gap-3 transition-colors ${item.matched ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}>
                                            <div className={`mt-0.5 rounded-full p-1 ${item.matched ? 'text-green-600 bg-green-100' : 'text-slate-300 bg-slate-100'}`}>
                                                {item.matched ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-semibold ${item.matched ? 'text-slate-900' : 'text-slate-600'}`}>{item.term}</h4>
                                                {item.matched && <p className="text-xs text-green-600 font-medium mt-1">Detected</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {matches.length === 0 && <div className="p-8 text-center text-muted-foreground">Initializing...</div>}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
