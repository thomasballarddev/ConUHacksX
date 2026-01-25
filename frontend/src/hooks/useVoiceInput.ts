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

    const speak = useCallback((text: string, onEnd?: () => void) => {
        console.log("[useVoiceInput] speak called with text:", text);

        if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
            console.error("[useVoiceInput] speechSynthesis not supported in this browser");
            onEnd?.(); // Trigger callback anyway so flow continues? Or maybe not.
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance; // Store ref

        // Try to select a "natural" or "enhanced" voice if available
        // Use the voices state which ensures they are loaded
        const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

        console.log("[useVoiceInput] Available voices count:", currentVoices.length);

        const preferredVoice = currentVoices.find(v =>
            (v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Neural')) && v.lang.startsWith('en')
        ) || currentVoices.find(v => v.lang.startsWith('en')) || currentVoices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log("[useVoiceInput] Selected voice:", preferredVoice.name);
        } else {
            console.warn("[useVoiceInput] No suitable voice found, using default");
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Cleanup ref on end
        utterance.onend = () => {
            console.log("[useVoiceInput] Speech finished");
            currentUtteranceRef.current = null;
            if (onEnd) {
                console.log("[useVoiceInput] Executing onEnd callback");
                onEnd();
            }
        };

        utterance.onerror = (e) => {
            console.error("[useVoiceInput] Speech error:", e);
        };

        console.log("[useVoiceInput] Calling window.speechSynthesis.speak");
        try {
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("[useVoiceInput] Exception during speak:", e);
        }
    }, [voices]);

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

            // Update transcript state for UI
            setTranscript(interimTranscript || finalTranscriptChunk); // Prefer interim for live feedback

            // Silence Detection Logic
            lastSpeechTimeRef.current = Date.now();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            // If we have a final chunk or just updated interim, wait 2.5s for silence to confirm "done"
            // Ideally, we want to detect when the user STOPS talking for 2-3s.
            silenceTimerRef.current = setTimeout(() => {
                // If silence threshold met and we have some text
                if (Date.now() - lastSpeechTimeRef.current > 2000) {
                    stopListening(); // Use the callback properly
                    // Get the FULL recognized text from the event if possible or rely on state. 
                    // actually event.results accumulates. 
                    // Let's just grab the latest full text.
                    const fullText = Array.from(event.results)
                        .map((r: any) => r[0].transcript)
                        .join('');

                    if (fullText.trim()) {
                        onFinalTranscript(fullText.trim());
                    }
                }
            }, 2500);
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
