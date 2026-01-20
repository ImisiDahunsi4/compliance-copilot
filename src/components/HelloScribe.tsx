import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Settings } from "lucide-react"
import { useScribeAnalysis } from "@/hooks/use-scribe-analysis"
import { useSettings } from "@/contexts/SettingsContext"

export default function HelloScribe() {
    const { analyzeAudio, isAnalyzing, error } = useScribeAnalysis()
    const { openSettings } = useSettings()
    const [result, setResult] = useState<any>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        console.log("Analyzing file:", file.name)
        const data = await analyzeAudio(file)
        setResult(data)
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">ElevenLabs Scribe Test</h2>
                    <Button variant="ghost" size="icon" onClick={openSettings}>
                        <Settings className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            disabled={isAnalyzing}
                        />
                        {isAnalyzing && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="min-h-[200px] border rounded-lg p-4 bg-slate-50 font-mono text-xs overflow-auto max-h-[400px]">
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </Card>

            <p className="text-sm text-muted-foreground">
                Upload an audio file to test ElevenLabs Scribe v2 analysis.
            </p>
        </div>
    )
}
