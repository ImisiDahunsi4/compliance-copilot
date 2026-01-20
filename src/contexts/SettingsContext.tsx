import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
    elevenLabsApiKey: string | null;
    setElevenLabsApiKey: (key: string) => void;
    isSettingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [elevenLabsApiKey, setApiKeyState] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('elevenlabs_api_key');
        if (storedKey) {
            setApiKeyState(storedKey);
        }
    }, []);

    const setElevenLabsApiKey = (key: string) => {
        setApiKeyState(key);
        if (key) {
            localStorage.setItem('elevenlabs_api_key', key);
        } else {
            localStorage.removeItem('elevenlabs_api_key');
        }
    };

    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    return (
        <SettingsContext.Provider value={{
            elevenLabsApiKey,
            setElevenLabsApiKey,
            isSettingsOpen,
            openSettings,
            closeSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
