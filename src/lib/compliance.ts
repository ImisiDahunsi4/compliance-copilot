export type MatchResult = {
    term: string;
    matched: boolean;
    count: number;
};

export function checkTranscript(transcript: string, keyterms: string[]): MatchResult[] {
    if (!transcript || !keyterms || keyterms.length === 0) {
        return [];
    }

    const normalizedTranscript = transcript.toLowerCase();

    return keyterms.map((term) => {
        const normalizedTerm = term.toLowerCase();
        // Simple substring match for now. 
        // Could upgrade to regex for word boundaries if needed: new RegExp(`\\b${term}\\b`, 'i')
        // But conversational speech might not always be perfect word boundaries (e.g. "recording line" vs "recorded line").
        // Let's stick to simple inclusion for robustness in demo.

        // Count occurrences
        const regex = new RegExp(escapeRegExp(normalizedTerm), 'gi');
        const matches = normalizedTranscript.match(regex);
        const count = matches ? matches.length : 0;

        return {
            term,
            matched: count > 0,
            count,
        };
    });
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
