'use client';

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid">
            <div
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-marcan-glow/20 rounded-full blur-[150px] animate-pulse-slow"
            />
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow"
                style={{ animationDelay: '2s' }}
            />
        </div>
    );
}
