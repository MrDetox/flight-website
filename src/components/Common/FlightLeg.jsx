import { useState } from 'preact/hooks';
import { formatDateFriendly } from '../../utils.js';

export function FlightLeg({ leg, legNum, legType, dates, times, label, onLegChange }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    onLegChange({ type: 'date', value: newDate });
  };

  const handleTimeChange = (e) => {
    const idx = parseInt(e.target.value);
    onLegChange({ type: 'time', value: times[idx] });
  };

  const originLabel = leg.originAirportCode && leg.originAirportCode !== '?' ? `${leg.originAirportCode} (${leg.originAirportName || leg.origin})` : leg.originAirportName || leg.origin;
  const destLabel = leg.destinationAirportCode && leg.destinationAirportCode !== '?' ? `${leg.destinationAirportCode} (${leg.destinationAirportName || leg.destination})` : leg.destinationAirportName || leg.destination;

  return (
    <div className={`leg-row leg-row-${legType}`}>
      {label && <strong>{label}:</strong>}
      
      <div className="leg-controls">
        <label className="leg-label">Date:</label>
        <select value={leg.date} onChange={handleDateChange} className={`leg-select leg-select-${legType}`}>
          {dates.map(d => <option key={d} value={d}>{formatDateFriendly(d)}</option>)}
        </select>
      </div>

      <div className="leg-controls">
        <label className="leg-label">Time:</label>
        <select 
          value={times.findIndex(t => t.departureTime === leg.departureTime && t.airline === leg.airline)} 
          onChange={handleTimeChange} 
          className={`leg-select leg-select-${legType}`}
        >
          {times.map((t, idx) => (
            <option key={idx} value={idx}>
              {t.departureTime} → {t.arrivalTime} ({t.price || '—'}) - {t.airline}
            </option>
          ))}
        </select>
      </div>

      <div className="leg-price-col">
        <strong>{leg.price || '—'}</strong>
        &nbsp; <button onClick={() => setShowDetails(!showDetails)} className="leg-details-btn">
          {showDetails ? '▲ Hide Details' : '▼ Details'}
        </button>
      </div>

      {showDetails && (
        <div className={`leg-details leg-details-${legType}`} style={{ display: 'block' }}>
          <details open>
            <summary>{label || `Leg ${legNum}`}</summary>
            <p><strong>Airline:</strong> {leg.airline || '—'}</p>
            <p><strong>Price:</strong> {leg.price || '—'}</p>
            <p><strong>Departure:</strong> {leg.departureTime || '—'} &nbsp; <strong>Arrival:</strong> {leg.arrivalTime || '—'}</p>
            <p><strong>Duration:</strong> {leg.duration || '—'}</p>
            <p><strong>Stops:</strong> {leg.stops || '—'}</p>
            <p><strong>Route:</strong> {originLabel} → {destLabel}</p>
            {leg.bookingLink && <p><a href={leg.bookingLink} target="_blank" rel="noopener">🔗 Book this flight</a></p>}
          </details>
        </div>
      )}
    </div>
  );
}
