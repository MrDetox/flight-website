import { useState, useEffect } from 'preact/hooks';
import { searchFlights, cancelSearch } from '../api.js';
import { isSearching, allItineraries } from '../signals.js';
import { SearchProgress } from './SearchProgress.jsx';

export function SearchForm() {
  const [origin, setOrigin] = useState(() => {
    return localStorage.getItem('flight_origin') || 'Leeds, Manchester';
  });
  const [destination, setDestination] = useState(() => {
    return localStorage.getItem('flight_destination') || 'Sofia, Plovdiv';
  });
  const [deadlineDates, setDeadlineDates] = useState(() => {
    const saved = localStorage.getItem('flight_deadline_dates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return [d.toISOString().split('T')[0]];
  });
  const [layoverDays, setLayoverDays] = useState(3);
  const [nonstop, setNonstop] = useState(true);
  const [imoovaEnabled, setImoovaEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem('flight_origin', origin);
  }, [origin]);

  useEffect(() => {
    localStorage.setItem('flight_destination', destination);
  }, [destination]);

  useEffect(() => {
    localStorage.setItem('flight_deadline_dates', JSON.stringify(deadlineDates));
  }, [deadlineDates]);

  const handleAddDate = (e) => {
    const dateVal = e.target.value;
    if (dateVal && !deadlineDates.includes(dateVal)) {
      setDeadlineDates([...deadlineDates, dateVal].sort());
    }
    e.target.value = '';
  };

  const handleRemoveDate = (dateToRemove) => {
    setDeadlineDates(deadlineDates.filter(d => d !== dateToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // While a search is running, the button doubles as a Stop button.
    if (isSearching.value) {
      cancelSearch();
      return;
    }
    if (deadlineDates.length === 0) {
      alert('Please select at least one deadline date.');
      return;
    }
    searchFlights({ origin, destination, deadlineDates, layoverDays, nonstop, imoovaEnabled });
  };

  const handleClear = () => {
    allItineraries.value = [];
  };

  return (
    <section id="search-section">
      <h2>Search Flights</h2>
      <form id="search-form" onSubmit={handleSubmit}>
        <fieldset id="outbound-fieldset">
          <legend>Outbound Flight</legend>

          <label>Origin City (comma-separated):</label><br />
          <input 
            type="text" 
            value={origin} 
            onInput={e => setOrigin(e.target.value)} 
            placeholder="e.g. Leeds, Manchester" 
            required 
          /><br /><br />

          <label>Final Destination City (comma-separated):</label><br />
          <input 
            type="text" 
            value={destination} 
            onInput={e => setDestination(e.target.value)} 
            placeholder="e.g. Sofia, Plovdiv" 
            required 
          /><br /><br />

          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Must Arrive By (Deadline Dates):</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {deadlineDates.map(date => (
              <span key={date} style={{
                background: 'rgba(21, 101, 192, 0.15)',
                border: '1px solid #1565c0',
                color: '#0d47a1',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.9em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}>
                {date}
                <button 
                  type="button" 
                  onClick={() => handleRemoveDate(date)} 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0d47a1',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1em',
                    padding: '0 2px',
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: '1'
                  }}
                  onMouseOver={e => e.target.style.color = '#ff1744'}
                  onMouseOut={e => e.target.style.color = '#0d47a1'}
                >
                  ×
                </button>
              </span>
            ))}
            {deadlineDates.length === 0 && (
              <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9em', alignSelf: 'center' }}>No dates selected</span>
            )}
          </div>
          <input 
            type="date" 
            onChange={handleAddDate}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '0.95em'
            }}
          /><br /><br />

          <label>Search Window (Days):</label><br />
          <input 
            type="number" 
            value={layoverDays} 
            onInput={e => setLayoverDays(parseInt(e.target.value))} 
            min="1" max="7" 
            required 
          /><br /><br />

          <label>
            <input 
              type="checkbox" 
              checked={nonstop} 
              onChange={e => setNonstop(e.target.checked)} 
            />
            Nonstop legs only
          </label>
          <br />
          <label>
            <input 
              type="checkbox" 
              checked={imoovaEnabled} 
              onChange={e => setImoovaEnabled(e.target.checked)} 
            />
            Include Imoova Campervan relocation routes
          </label>
        </fieldset>

        <br />
        <button type="submit" id="search-btn">
          {isSearching.value ? '⏹ Stop Search' : '🔍 Find Bonus Vacations'}
        </button>
        &nbsp;
        <button type="button" id="clear-btn" onClick={handleClear} disabled={isSearching.value}>
          ✖ Clear Results
        </button>

        <SearchProgress />
      </form>
    </section>
  );
}
