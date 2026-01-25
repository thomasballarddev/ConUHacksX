import { useState, useEffect, useRef, useCallback } from 'react';

// Types for Web Speech API
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onend: () => void;
    onerror: (event: any) => void;
    onsoundend: () => void;
    onspeechend: () => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface UseVoiceInputProps {
    onFinalTranscript: (text: string) => void;
}

export const useVoiceInput = ({ onFinalTranscript }: UseVoiceInputProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState(''); // current session transcript (interim)
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Audio Analysis for Visualizer
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Silence detection
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSpeechTimeRef = useRef<number>(0);

    // Text-to-Speech
    // Text-to-Speech
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const updateVoices = () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
            }
        };

        updateVoices();

        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    // Keep reference to prevent garbage collection issues
    const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Browser TTS fallback function
    const speakWithBrowser = useCallback((text: string, onEnd?: () => void) => {
        console.log("[useVoiceInput] Using browser TTS fallback");

        if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
            console.error("[useVoiceInput] speechSynthesis not supported");
            onEnd?.();
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;

        const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const preferredVoice = currentVoices.find(v =>
            (v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Neural')) && v.lang.startsWith('en')
        ) || currentVoices.find(v => v.lang.startsWith('en')) || currentVoices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
            currentUtteranceRef.current = null;
            onEnd?.();
        };

        utterance.onerror = (e) => {
            console.error("[useVoiceInput] Browser TTS error:", e);
        };

        try {
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("[useVoiceInput] Exception during speak:", e);
        }
    }, [voices]);

    const speak = useCallback((text: string, onEnd?: () => void, audioBase64?: string) => {
        console.log("[useVoiceInput] speak called, audio provided:", !!audioBase64);

        // Cancel any ongoing speech
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }

        // If we have ElevenLabs audio, play it via Audio element
        if (audioBase64) {
            console.log("[useVoiceInput] Playing ElevenLabs audio");
            try {
                const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
                currentAudioRef.current = audio;

                audio.onended = () => {
                    console.log("[useVoiceInput] ElevenLabs audio finished");
                    currentAudioRef.current = null;
                    onEnd?.();
                };

                audio.onerror = (e) => {
                    console.error("[useVoiceInput] Audio playback error:", e);
                    currentAudioRef.current = null;
                    speakWithBrowser(text, onEnd);
                };

                audio.play().catch((e) => {
                    console.error("[useVoiceInput] Failed to play audio:", e);
                    speakWithBrowser(text, onEnd);
                });

                return;
            } catch (e) {
                console.error("[useVoiceInput] Error creating audio element:", e);
            }
        }

        // Fallback: Use browser TTS
        speakWithBrowser(text, onEnd);
    }, [speakWithBrowser]);

    const stopAudioAnalysis = () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // Don't close AudioContext, just reuse or suspend
    };

    const startAudioAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const ctx = audioContextRef.current;
            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = 256; // resolution

            sourceRef.current = ctx.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                // Create a copy to trigger state update
                setAudioData(new Uint8Array(dataArray));
                rafIdRef.current = requestAnimationFrame(update);
            };

            update();
        } catch (err) {
            console.error("Error accessing microphone for visualization:", err);
        }
    };

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        stopAudioAnalysis();
        setIsListening(false);

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    const startListening = useCallback(() => {
        // Stop any AI speech when user starts talking
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice recognition. Please use Chrome or Safari.");
            return;
        }

        // Initialize Recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscriptChunk = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptChunk += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Update transcript state for UI - accumulate all results
            const fullText = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join('');
            setTranscript(fullText);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                setIsListening(false);
                stopAudioAnalysis();
            }
        };

        recognition.onend = () => {
            // Checking if we manually stopped or it just timed out
            // If manually stopped via stopListening, isListening is already false.
            // If it stopped by itself but we wanted continuous, we might need to handle that.
            // For now, we assume onend means we're done.
            setIsListening(false);
            stopAudioAnalysis();
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setTranscript('');

        // Also start visualizer
        startAudioAnalysis();

    }, [onFinalTranscript, stopListening]);


    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        audioData,
        speak
    };
};
