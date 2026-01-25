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

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Calculate average volume for overall intensity
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i];
        }
        const avgVolume = audioData.length > 0 ? sum / audioData.length / 255 : 0;

        // Draw smooth pulsing bars - Siri/modern style
        const barCount = 5;
        const barWidth = 4;
        const barGap = 6;
        const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
        const startX = (width - totalWidth) / 2;
        const maxBarHeight = height * 0.7;
        const minBarHeight = 4;

        // Primary color gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4e4235');
        gradient.addColorStop(0.5, '#6b5a47');
        gradient.addColorStop(1, '#4e4235');

        ctx.fillStyle = gradient;
        ctx.lineCap = 'round';

        for (let i = 0; i < barCount; i++) {
            // Use different frequency bands for each bar
            const freqIndex = Math.floor((i / barCount) * (audioData.length * 0.5));
            const freqValue = audioData[freqIndex] || 0;
            const normalizedValue = freqValue / 255;

            // Create smooth animation with sine wave base
            const time = Date.now() / 200;
            const wave = Math.sin(time + i * 0.8) * 0.3 + 0.7;
            
            // Combine audio level with wave animation
            const intensity = Math.max(normalizedValue * 1.2, avgVolume * 0.5) * wave;
            const barHeight = Math.max(minBarHeight, intensity * maxBarHeight);

            const x = startX + i * (barWidth + barGap);
            const y = centerY - barHeight / 2;

            // Draw rounded bar
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
            ctx.fill();
        }

    }, [audioData]);

    return (
        <canvas
            ref={canvasRef}
            className="w-16 h-10"
            style={{ width: '64px', height: '40px' }}
        />
    );
};

export default AudioVisualizer;
