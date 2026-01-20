import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export type ScribeAnalysisResult = {
    metadata: {
        duration: number;
        channels: number;
    };
    results: {
        channels: Array<{
            alternatives: Array<{
                transcript: string;
                confidence: number;
                words: Array<{
                    word: string;
                    start: number;
                    end: number;
                    confidence: number;
                    speaker?: number;
                }>;
                paragraphs?: {
                    paragraphs: Array<{
                        sentences: Array<{
                            text: string;
                            start: number;
                            end: number;
                        }>;
                        speaker: number;
                        num_words: number;
                        start: number;
                        end: number;
                    }>;
                };
                entities?: Array<{
                    label: string;
                    value: string;
                    confidence: number;
                    start_word: number;
                    end_word: number;
                }>;
            }>;
        }>;
    };
};

export function useScribeAnalysis() {
    const { elevenLabsApiKey, openSettings } = useSettings();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeAudio = async (file: File, options?: { keyterms?: string[] }): Promise<ScribeAnalysisResult | null> => {
        setIsAnalyzing(true);
        setError(null);

        if (!elevenLabsApiKey) {
            openSettings();
            setError("Please enter your ElevenLabs API Key");
            return null;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model_id', 'scribe_v2');
            formData.append('tag_audio_events', 'true');
            // Entity Detection (PII)
            // Scribe API expects array parameters to be appended individually with the same key
            formData.append('entity_detection[]', 'pii');

            // Keyterm Prompting
            if (options?.keyterms && options.keyterms.length > 0) {
                options.keyterms.forEach(term => {
                    formData.append('keyterms[]', term);
                });
            }

            const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                method: 'POST',
                headers: {
                    'xi-api-key': elevenLabsApiKey,
                    // Content-Type is set automatically by FormData
                },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`ElevenLabs Analysis Failed: ${response.status} ${errText}`);
            }

            const scribeData = await response.json();

            // ADAPTER: Convert Scribe response to standardized structure
            const adaptedResult: ScribeAnalysisResult = adaptScribeResponse(scribeData);
            return adaptedResult;

        } catch (err: any) {
            console.error("Analysis Error:", err);
            setError(err.message || "Unknown error occurred");
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        analyzeAudio,
        isAnalyzing,
        error
    };
}

// Helper: Adapts Scribe JSON to Scribe/Standardized structure
function adaptScribeResponse(scribeData: any): ScribeAnalysisResult {
    const words = scribeData.words || [];
    const text = scribeData.text || "";

    // Group words into paragraphs based on speaker_id changes or pauses
    const paragraphs: any[] = [];
    let currentAndroidSpeaker = words[0]?.speaker_id || "speaker_0";
    let currentSentences: any[] = [];
    let currentSentenceWords: string[] = [];
    let sentenceStart = words[0]?.start || 0;

    // Naive sentence grouping (Scribe might not return sentences, only words)
    // We'll reconstruct sentences based on punctuation or speaker change
    words.forEach((word: any, index: number) => {
        const wText = word.text;
        const wStart = word.start;
        const wEnd = word.end;
        const wSpeaker = word.speaker_id || "speaker_0"; // Scribe usually returns string IDs like "speaker_0", "speaker_1"

        // Speaker changed?
        if (wSpeaker !== currentAndroidSpeaker) {
            // Push current paragraph
            if (currentSentences.length > 0 || currentSentenceWords.length > 0) {
                if (currentSentenceWords.length > 0) {
                    currentSentences.push({
                        text: currentSentenceWords.join(''), // Scribe words often have leading spaces
                        start: sentenceStart,
                        end: words[index - 1]?.end || wEnd
                    });
                }

                paragraphs.push({
                    speaker: speakerLabelToNumber(currentAndroidSpeaker),
                    sentences: [...currentSentences],
                    start: currentSentences[0]?.start || 0,
                    end: currentSentences[currentSentences.length - 1]?.end || 0,
                    num_words: currentSentences.reduce((acc: number, s: any) => acc + s.text.split(' ').length, 0)
                });
            }

            // Reset
            currentAndroidSpeaker = wSpeaker;
            currentSentences = [];
            currentSentenceWords = [];
            sentenceStart = wStart;
        }

        currentSentenceWords.push(wText);

        // End of sentence?
        if (/[.!?]$/.test(wText.trim()) || index === words.length - 1) { // Trim to check punctuation
            currentSentences.push({
                text: currentSentenceWords.join(''), // Join with empty string as Scribe tokens usually include spacing
                start: sentenceStart,
                end: wEnd
            });
            currentSentenceWords = [];
            sentenceStart = words[index + 1]?.start || wEnd;
        }
    });

    // Push last paragraph
    if (paragraphs.length === 0 && currentSentences.length > 0) {
        paragraphs.push({
            speaker: speakerLabelToNumber(currentAndroidSpeaker),
            sentences: currentSentences,
            start: currentSentences[0].start,
            end: currentSentences[currentSentences.length - 1].end,
            num_words: 10 // Arbitrary
        });
    }

    return {
        metadata: {
            duration: scribeData.duration || 0, // Scribe might not return duration directly
            channels: 1
        },
        results: {
            channels: [{
                alternatives: [{
                    transcript: text,
                    confidence: 1.0,
                    words: words.map((w: any) => ({
                        word: w.text,
                        start: w.start,
                        end: w.end,
                        confidence: 1.0,
                        speaker: speakerLabelToNumber(w.speaker_id)
                    })),
                    paragraphs: {
                        paragraphs: paragraphs
                    },
                    entities: [] // Scribe currently mapping via tag_audio_events if implemented, or blank
                }]
            }]
        }
    };
}

function speakerLabelToNumber(label: string | undefined): number {
    if (!label) return 0;
    // Map "speaker_0" -> 0, "speaker_1" -> 1
    // or just hash/random map
    if (label === 'speaker_0' || label === 'A') return 0;
    if (label === 'speaker_1' || label === 'B') return 1;

    // Fallback: extract number
    const match = label.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}
