import React, { useState } from 'react';

export default function SearchHero({ onSearch }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [mustArriveBy, setMustArriveBy] = useState('');
    const [homeCity, setHomeCity] = useState('');
    const [earliestTravelDate, setEarliestTravelDate] = useState('');

    const handleFocus = (e) => {
        // Reveal advanced fields when user interacts
        if (!showAdvanced) setShowAdvanced(true);
    };

    const submitSearch = (e) => {
        e.preventDefault();
        onSearch({ origin, destination, mustArriveBy, homeCity, earliestTravelDate });
    };

    return (
        <section style={{ padding: '8rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h1 className="animate-fade-in" style={{ marginBottom: '1.5rem', background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Don't just fly over.<br />Stop over.
            </h1>
            <p className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '4rem', maxWidth: '600px', animationDelay: '0.1s' }}>
                Unlock the world\'s best layovers. We find the smartest routes to give you two vacations for the price of one.
            </p>

            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '800px', animationDelay: '0.2s', textAlign: 'left' }}>
                <form onSubmit={submitSearch}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label">Origin</label>
                            <input type="text" className="input-field" placeholder="LHR (London)" value={origin} onChange={e => setOrigin(e.target.value)} onFocus={handleFocus} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Destination</label>
                            <input type="text" className="input-field" placeholder="SYD (Sydney)" value={destination} onChange={e => setDestination(e.target.value)} onFocus={handleFocus} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Must Arrive By</label>
                            <input type="date" className="input-field" value={mustArriveBy} onChange={e => setMustArriveBy(e.target.value)} onFocus={handleFocus} required />
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.5rem',
                        maxHeight: showAdvanced ? '100px' : '0',
                        opacity: showAdvanced ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        marginBottom: showAdvanced ? '2rem' : '0'
                    }}>
                        <div className="input-group">
                            <label className="input-label">Home City (Ground Transit)</label>
                            <input type="text" className="input-field" placeholder="e.g. Leeds" value={homeCity} onChange={e => setHomeCity(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Earliest Travel Date</label>
                            <input type="date" className="input-field" value={earliestTravelDate} onChange={e => setEarliestTravelDate(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                            Find My Stayover
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
