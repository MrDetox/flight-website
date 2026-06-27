import React from 'react';

export default function CheckoutModal({ onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative' }}>

                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>

                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Complete Your Stayover</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span>Flights (LHR → SIN → SYD)</span>
                        <span>£840.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span>Marina Bay Sands (1 Night)</span>
                        <span>£200.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <span>Stasher Luggage Hub</span>
                        <span>£15.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-accent-primary)' }}>
                        <span>Bundle Discount</span>
                        <span>-£45.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', paddingTop: '0.5rem' }}>
                        <span>Total Trip Cost</span>
                        <span>£1,010.00</span>
                    </div>
                </div>

                {/* Sherpa Visa Integration Mock */}
                <div style={{ background: 'rgba(191, 149, 63, 0.1)', border: '1px solid var(--color-accent-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🛂</span> Transit Visa Required</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>You need an Electronic Travel Authorization for your 24h layover in Singapore.</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked /> Automatically apply via Sherpa (+£10)
                    </label>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>Confirm & Pay</button>

            </div>
        </div>
    );
}
