'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechInputOptions {
    /** Called with the latest transcript and whether it is the final result for that utterance. */
    onTranscript: (text: string, isFinal: boolean) => void;
    /** BCP-47 language tag. Defaults to browser language. */
    lang?: string;
}

interface UseSpeechInputResult {
    isListening: boolean;
    isSupported: boolean;
    toggle: (currentInput: string) => void;
    stop: () => void;
}

export const useSpeechInput = ({
    onTranscript,
    lang,
}: UseSpeechInputOptions): UseSpeechInputResult => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const isSupported =
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const start = useCallback(() => {
        if (!isSupported) return;

        const SR =
            (window as any).SpeechRecognition ??
            (window as any).webkitSpeechRecognition;

        const recognition = new SR();
        recognition.continuous = true;     // keep listening until explicitly stopped
        recognition.interimResults = true;  // stream partial results
        recognition.lang = lang ?? navigator.language ?? 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onerror = (e: any) => {
            // 'no-speech' is normal; everything else is a real error
            if (e.error !== 'no-speech') {
                console.error('[Speech]', e.error);
            }
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const r = event.results[i];
                if (r.isFinal) {
                    final += r[0].transcript;
                } else {
                    interim += r[0].transcript;
                }
            }

            if (final) {
                onTranscript(final, true);
            } else if (interim) {
                onTranscript(interim, false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isSupported, lang, onTranscript]);

    const toggle = useCallback(
        (_currentInput: string) => {
            if (isListening) {
                stop();
            } else {
                start();
            }
        },
        [isListening, start, stop]
    );

    // Clean up on unmount
    useEffect(() => () => { recognitionRef.current?.abort(); }, []);

    return { isListening, isSupported, toggle, stop };
};
