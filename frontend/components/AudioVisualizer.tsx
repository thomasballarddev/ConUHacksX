import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    audioData: Uint8Array;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Style: Siri-like vibrating line
        // We'll draw a smooth curve connecting the frequency points
        // Center line typically

        // However, the "audio line" look usually implies a waveform or frequency bars mirrored.
        // Let's do a glowing line that deforms based on volume/freq.

        const bufferLength = audioData.length;
        if (bufferLength === 0) {
            // Draw flat line
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#4e4235'; // Primary dark/brown color from theme or custom
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // We can create a multi-colored effect or just stick to one "clean" color
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.5, '#8BC34A');
        gradient.addColorStop(1, '#4CAF50');
        ctx.strokeStyle = gradient;

        ctx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        // Draw Frequency Domain as a centered wave
        // Low frequencies are at the start of audioData.
        // We want to mirror it for a symmetric look:  Low -> High -> Low

        // Easier approach for "Siri look":
        // Draw a base circle or line that expands.
        // The user asked for "audio line".

        ctx.moveTo(0, height / 2);

        // Simple visualizer: line + amplitude
        for (let i = 0; i < bufferLength; i++) {
            // audioData[i] is 0-255
            const v = audioData[i] / 128.0;
            const y = (v * height) / 2; // scale to canvas

            // We want 0 input to be height/2.
            // High input deviates from height/2.
            const amplitude = (audioData[i] / 255) * (height / 2) * 1.5;

            // Alternate up and down for "wave" (not accurate FFT but looks cool)
            // actually FFT is frequency magnitudes.
            // Let's just create a curve.

            if (i === 0) {
                ctx.moveTo(x, height / 2);
            } else {
                // Smooth curve
                // checking even/odd to create jagged wave or just using value as offset
                const direction = i % 2 === 0 ? 1 : -1;
                // Dampen the edges
                let dampener = 1;
                if (i < bufferLength * 0.1) dampener = i / (bufferLength * 0.1);
                if (i > bufferLength * 0.9) dampener = (bufferLength - i) / (bufferLength * 0.1);

                const yOffset = amplitude * direction * dampener;
                ctx.lineTo(x, (height / 2) + yOffset);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Add Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4CAF50';
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [audioData]);

    return (
        <div className="w-full h-24 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-green-500/20">
            <canvas
                ref={canvasRef}
                width={300}
                height={100}
                className="w-full h-full"
            />
        </div>
    );
};

export default AudioVisualizer;
