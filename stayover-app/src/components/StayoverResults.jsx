import React, { useState } from 'react';
import MapWidget from './MapWidget';
import ChatAssistant from './ChatAssistant';
import CheckoutModal from './CheckoutModal';

export default function StayoverResults({ onBack }) {
    const [showCheckout, setShowCheckout] = useState(false);

    return (
        <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
            {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}

            <button onClick={onBack} className="btn btn-glass" style={{ marginBottom: '2rem' }}>
                ← Back to Search
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Curated Journey</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>We found a premium layover connecting your flights. Arrive refreshed.</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Flight 1 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Flight 1</p>
                                <h3 style={{ fontSize: '1.4rem' }}>LHR → SIN</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 600 }}>British Airways</p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>14h 20m</p>
                            </div>
                        </div>

                        {/* Stayover Block */}
                        <div style={{ borderLeft: '2px solid var(--color-accent-primary)', paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                            <div style={{ display: 'inline-block', background: 'rgba(191, 149, 63, 0.1)', color: 'var(--color-accent-primary)', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                24h Stayover in Singapore
                            </div>
                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Arrive: Oct 12, 18:00</h4>
                            <p style={{ color: 'var(--color-text-secondary)' }}>Explore Marina Bay, Gardens by the Bay, and local street food.</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'var(--color-bg-base)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>🏨 Marina Bay Sands (+£200)</span>
                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'var(--color-bg-base)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>🧳 Stasher Hub</span>
                            </div>
                        </div>

                        {/* Flight 2 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Flight 2</p>
                                <h3 style={{ fontSize: '1.4rem' }}>SIN → SYD</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 600 }}>Qantas</p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>7h 45m</p>
                            </div>
                        </div>

                        <button onClick={() => setShowCheckout(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Book Complete Itinerary</button>
                    </div>
                </div>

                {/* Map / Itinerary Area */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🗺️</span> Interactive Itinerary
                    </h3>

                    <MapWidget />
                    <ChatAssistant />
                </div>
            </div>
        </div>
    );
}
