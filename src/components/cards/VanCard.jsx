import { useState, useMemo } from 'preact/hooks';
import { formatDateFriendly, calendarNights } from '../../utils.js';
import { FlightLeg } from '../Common/FlightLeg.jsx';
import { DebugTable } from '../Common/DebugTable.jsx';
import { filterState } from '../../signals.js';
import { bestLayoverScore } from '../../utils.js';

export function VanCard({ options }) {
  const sorted = useMemo(() => [...options].sort((a, b) => a.totalPrice - b.totalPrice), [options]);
  
  const preferredInitial = useMemo(() => {
    const s = filterState.sortBy.value;
    if (s === 'best-layover') return options.reduce((best, x) => bestLayoverScore(x) > bestLayoverScore(best) ? x : best);
    return sorted[0];
  }, [options, sorted, filterState.sortBy.value]);

  const [curItin, setCurItin] = useState(preferredInitial);
  const hub = sorted[0].hub;
  const vanDest = sorted[0].vanDestination;

  const handleLeg1Change = ({ type, value }) => {
    if (type === 'date') {
      const best = sorted.filter(o => o.leg1.date === value).sort((a, b) => a.totalPrice - b.totalPrice)[0];
      if (best) setCurItin(best);
    } else {
      const best = sorted.find(o => o.leg1.date === value.date && o.leg1.departureTime === value.departureTime && o.leg1.airline === value.airline);
      if (best) setCurItin(best);
    }
  };

  const handleLeg2Change = ({ type, value }) => {
    const compat = sorted.filter(o => o.leg1.date === curItin.leg1.date && o.leg1.departureTime === curItin.leg1.departureTime && o.leg1.airline === curItin.leg1.airline);
    if (type === 'date') {
      const best = compat.filter(o => o.leg2.date === value).sort((a, b) => a.totalPrice - b.totalPrice)[0];
      if (best) setCurItin(best);
    } else {
      const best = compat.find(o => o.leg2.date === value.date && o.leg2.departureTime === value.departureTime);
      if (best) setCurItin(best);
    }
  };

  const leg1Dates = useMemo(() => [...new Set(sorted.map(o => o.leg1.date))].filter(Boolean).sort(), [sorted]);
  const leg1Times = useMemo(() => [...new Map(sorted.filter(o => o.leg1.date === curItin.leg1.date).map(o => o.leg1).sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0)).map(f => [`${f.departureTime}|${f.airline}`, f])).values()], [sorted, curItin.leg1.date]);
  
  const leg2Compat = useMemo(() => sorted.filter(o => o.leg1.date === curItin.leg1.date && o.leg1.departureTime === curItin.leg1.departureTime && o.leg1.airline === curItin.leg1.airline), [sorted, curItin.leg1]);
  const leg2Dates = useMemo(() => [...new Set(leg2Compat.map(o => o.leg2.date))].filter(Boolean).sort(), [leg2Compat]);
  const leg2Times = useMemo(() => [...new Map(leg2Compat.filter(o => o.leg2.date === curItin.leg2.date).map(o => o.leg2).sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0)).map(f => [`${f.departureTime}|${f.airline}`, f])).values()], [leg2Compat, curItin.leg2.date]);

  const flightTotal = (curItin.leg1?.priceValue || 0) + (curItin.leg2?.priceValue || 0);
  const vanPrice = curItin.van.priceValue || (curItin.van.price ? parseFloat(curItin.van.price.replace(/[^0-9.]/g, '')) : 0);
  const grandTotal = flightTotal + vanPrice;
  const nights = calendarNights({ leg1: curItin.leg1, leg2: curItin.leg2 }) || 0;
  const usable = curItin.daytimeValue ?? 0;
  const score = grandTotal > 0 ? (usable / grandTotal).toFixed(4) : '—';

  const [showVanDetails, setShowVanDetails] = useState(false);

  return (
    <div className="flight-card card-van">
      <h3 className="card-h3">{curItin.origin} → <strong>{hub}</strong> 🚐 <strong>{vanDest}</strong> → {curItin.destination} <span className="badge badge-van">🚐 Van Relay</span></h3>
      <p className="itin-summary itin-summary-van">
        <span className="itin-date">{formatDateFriendly(curItin.leg1.date)}</span> <strong>{curItin.leg1.departureTime}</strong> {curItin.origin} &nbsp;→&nbsp; <strong>{curItin.leg1.arrivalTime}</strong> {hub}
        &nbsp;<span>🚐</span>&nbsp; {vanDest} <strong>{curItin.leg2.departureTime}</strong> &nbsp;→&nbsp; <strong>{curItin.leg2.arrivalTime}</strong> {curItin.destination}
        <span className="itin-date"> (van drop: {formatDateFriendly(curItin.vanDropoffDate)})</span>
      </p>
      <div className="total-row total-row-van">
        <span><strong>Total: £{flightTotal.toFixed(0)} (£{grandTotal.toFixed(0)} with van)</strong></span>
        <span className="itin-duration">{hub} → {vanDest} · {curItin.van.duration || 'van'} · 🔬 score: {score}</span>
      </div>

      <FlightLeg 
        leg={curItin.leg1} 
        legNum="vanleg1" 
        legType="van-flight" 
        dates={leg1Dates} 
        times={leg1Times} 
        label="Flight 1" 
        onLegChange={handleLeg1Change} 
      />

      <div className="leg-row leg-row-van-drive">
        <strong>🚐 Van:</strong>
        <span className="van-drop-date">Drop: {formatDateFriendly(curItin.vanDropoffDate)}</span>
        <span className="van-info-span">{hub} → {vanDest} &nbsp;·&nbsp; {curItin.van.duration || ''}</span>
        <div className="leg-price-col">
          {curItin.van.vehicleType || 'Campervan'} &nbsp; <strong>{curItin.van.price || '—'}</strong> 
          &nbsp; <button onClick={() => setShowVanDetails(!showVanDetails)} className="leg-details-btn">
            {showVanDetails ? '▲ Hide Details' : '▼ Details'}
          </button>
        </div>
        {showVanDetails && (
          <div className="leg-details leg-details-van-drive" style={{ display: 'block' }}>
            <p><strong>Route:</strong> {hub} → {vanDest}</p>
            <p><strong>Pickup Window:</strong> {curItin.van.dateRange || '—'}</p>
            <p><strong>Duration:</strong> {curItin.van.duration || '—'}</p>
            {curItin.van.bookingLink && <p><a href={curItin.van.bookingLink} target="_blank" rel="noopener">🔗 Book Van on Imoova</a></p>}
          </div>
        )}
      </div>

      <FlightLeg 
        leg={curItin.leg2} 
        legNum="vanleg2" 
        legType="van-flight" 
        dates={leg2Dates} 
        times={leg2Times} 
        label="Flight 2" 
        onLegChange={handleLeg2Change} 
      />

      <DebugTable 
        type="van" 
        hub={hub} 
        arrTime={curItin.leg1.arrivalTime} 
        arrDate={curItin.leg1.date} 
        depTime={curItin.leg2.departureTime} 
        depDate={curItin.leg2.date} 
        nights={nights} 
        usable={usable} 
        total={grandTotal} 
        score={score} 
        vanDest={vanDest} 
        vanDropoff={curItin.vanDropoffDate} 
      />
    </div>
  );
}
