import { useState, useMemo } from 'preact/hooks';
import { formatDateFriendly } from '../../utils.js';
import { FlightLeg } from '../Common/FlightLeg.jsx';

export function DirectCard({ options }) {
  const sorted = useMemo(() => [...options].sort((a, b) => (a.flight.priceValue || 0) - (b.flight.priceValue || 0)), [options]);
  const uniqueFlights = useMemo(() => [...new Map(sorted.map(o => o.flight).reverse().map(f => [`${f.date}|${f.departureTime}|${f.airline}`, f])).values()], [sorted]);
  const dates = useMemo(() => [...new Set(uniqueFlights.map(f => f.date))].sort(), [uniqueFlights]);

  const [curFlight, setCurFlight] = useState(sorted[0].flight);

  const flightsOnDate = useMemo(() => uniqueFlights.filter(f => f.date === curFlight.date).sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0)), [uniqueFlights, curFlight.date]);

  const handleLegChange = ({ type, value }) => {
    if (type === 'date') {
      const bestOnDate = uniqueFlights.filter(f => f.date === value).sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0))[0];
      if (bestOnDate) setCurFlight(bestOnDate);
    } else {
      setCurFlight(value);
    }
  };

  const itin0 = options[0];
  const total = curFlight.priceValue || 0;

  return (
    <div className="flight-card card-direct">
      <h3 className="card-h3 card-h3-direct">
        {itin0.origin} → {itin0.destination} <span className="badge badge-direct">✈️ Direct</span>
      </h3>
      <p className="itin-summary itin-summary-direct">
        <span className="itin-date">{formatDateFriendly(curFlight.date)}</span>
        <strong>{curFlight.departureTime}</strong> {itin0.origin} &nbsp;→&nbsp; <strong>{curFlight.arrivalTime}</strong> {itin0.destination}
      </p>
      <div className="total-row total-row-direct">
        <span><strong>Total: £{total.toFixed(0)}</strong></span>
        <span className="itin-duration">{curFlight.duration || ''}</span>
      </div>
      <FlightLeg 
        leg={curFlight} 
        legNum={1} 
        legType="direct" 
        dates={dates} 
        times={flightsOnDate} 
        label="Direct Flight" 
        onLegChange={handleLegChange} 
      />
    </div>
  );
}
