import React from 'react';

export default function MapWidget() {
    return (
        <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#1a1a24', marginBottom: '1.5rem' }}>

            {/* Decorative Mock Map Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                opacity: 0.5
            }} />

            {/* Mock Map Points */}
            <div style={{ position: 'absolute', top: '40%', left: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--color-accent-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-accent-glow)' }} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: 600 }}>Airport</span>
            </div>

            <div style={{ position: 'absolute', top: '60%', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-accent-primary)', borderRadius: '50%', background: 'var(--color-bg-elevated)' }} />
                <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Luggage (Stasher)</span>
            </div>

            <div style={{ position: 'absolute', top: '30%', left: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: 'var(--color-text-primary)', borderRadius: '50%', boxShadow: '0 0 15px rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>Marina Bay</span>
            </div>

            {/* Mock Path Line */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path d="M 30% 40% Q 40% 60% 50% 60% T 70% 30%" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" strokeDasharray="4 4" style={{ opacity: 0.6 }} />
            </svg>

            {/* Overlay Badge */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-bg-glass)', backdropFilter: 'blur(4px)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                AI Optimized Route
            </div>
        </div>
    );
}
