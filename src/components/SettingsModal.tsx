import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

export function SettingsModal() {
    const { isSettingsOpen, closeSettings, elevenLabsApiKey, setElevenLabsApiKey } = useSettings();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isSettingsOpen) {
            setInputValue(elevenLabsApiKey || '');
        }
    }, [isSettingsOpen, elevenLabsApiKey]);

    const handleSave = () => {
        setElevenLabsApiKey(inputValue);
        closeSettings();
    };

    return (
        <Dialog open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Details</DialogTitle>
                    <DialogDescription>
                        Enter your ElevenLabs API Key to enable transcription and analysis features.
                        Your key is stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="apiKey" className="sr-only">
                            API Key
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="apiKey"
                                placeholder="xi-api-..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="pl-9"
                                type="password"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <div className="text-xs text-muted-foreground pt-2">
                        Get your key from <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="underline hover:text-primary">elevenlabs.io</a>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleSave}>
                        Save Key
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
