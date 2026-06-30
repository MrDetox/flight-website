import { useState, useMemo } from 'preact/hooks';
import { formatDateFriendly, formatDuration, calendarNights } from '../../utils.js';
import { FlightLeg } from '../Common/FlightLeg.jsx';
import { DebugTable } from '../Common/DebugTable.jsx';
import { filterState } from '../../signals.js';
import { bestLayoverScore } from '../../utils.js';

export function HubCard({ options, hub }) {
  // Pick preferred initial based on current sort
  const preferredInitial = useMemo(() => {
    const s = filterState.sortBy.value;
    if (s === 'best-layover') return options.reduce((best, x) => bestLayoverScore(x) > bestLayoverScore(best) ? x : best);
    if (s === 'price-desc') return options.reduce((best, x) => x.totalPrice > best.totalPrice ? x : best);
    if (s === 'duration-desc') return options.reduce((best, x) => (x.layoverDurationHours || 0) > (best.layoverDurationHours || 0) ? x : best);
    return options.reduce((best, x) => x.totalPrice < best.totalPrice ? x : best);
  }, [options, filterState.sortBy.value]);

  const [curLeg1, setCurLeg1] = useState(preferredInitial.leg1);
  const [curLeg2, setCurLeg2] = useState(preferredInitial.leg2);

  const leg1Dates = useMemo(() => [...new Set(options.map(o => o.leg1.date))].sort(), [options]);
  const leg1TimesOnCurDate = useMemo(() => {
    const flights = options.filter(o => o.leg1.date === curLeg1.date).map(o => o.leg1);
    return [...new Map(flights.sort((a,b) => (a.priceValue||0)-(b.priceValue||0)).map(f => [`${f.departureTime}|${f.airline}`, f])).values()];
  }, [options, curLeg1.date]);

  const leg2Dates = useMemo(() => [...new Set(options.map(o => o.leg2.date))].sort(), [options]);
  const leg2TimesOnCurDate = useMemo(() => {
    const flights = options.filter(o => o.leg2.date === curLeg2.date).map(o => o.leg2);
    return [...new Map(flights.sort((a,b) => (a.priceValue||0)-(b.priceValue||0)).map(f => [`${f.departureTime}|${f.airline}`, f])).values()];
  }, [options, curLeg2.date]);

  const handleLeg1Change = ({ type, value }) => {
    let nextL1 = curLeg1;
    if (type === 'date') {
      nextL1 = options.filter(o => o.leg1.date === value).map(o => o.leg1).sort((a,b) => (a.priceValue||0)-(b.priceValue||0))[0];
    } else {
      nextL1 = value;
    }
    if (!nextL1) return;
    setCurLeg1(nextL1);

    const compatible = options.filter(o => o.leg1.date === nextL1.date && o.leg1.departureTime === nextL1.departureTime && o.leg1.airline === nextL1.airline);
    const stillOk = compatible.find(o => o.leg2.date === curLeg2.date && o.leg2.departureTime === curLeg2.departureTime && o.leg2.airline === curLeg2.airline);
    if (!stillOk && compatible.length > 0) {
      setCurLeg2(compatible.sort((a,b) => (a.totalPrice||0)-(b.totalPrice||0))[0].leg2);
    }
  };

  const handleLeg2Change = ({ type, value }) => {
    let nextL2 = curLeg2;
    if (type === 'date') {
      nextL2 = options.filter(o => o.leg2.date === value).map(o => o.leg2).sort((a,b) => (a.priceValue||0)-(b.priceValue||0))[0];
    } else {
      nextL2 = value;
    }
    if (!nextL2) return;
    setCurLeg2(nextL2);

    const compatible = options.filter(o => o.leg2.date === nextL2.date && o.leg2.departureTime === nextL2.departureTime && o.leg2.airline === nextL2.airline);
    const stillOk = compatible.find(o => o.leg1.date === curLeg1.date && o.leg1.departureTime === curLeg1.departureTime && o.leg1.airline === curLeg1.airline);
    if (!stillOk && compatible.length > 0) {
      setCurLeg1(compatible.sort((a,b) => (a.totalPrice||0)-(b.totalPrice||0))[0].leg1);
    }
  };

  const total = (curLeg1.priceValue || 0) + (curLeg2.priceValue || 0);
  const activeItin = options.find(o => o.leg1.date === curLeg1.date && o.leg1.departureTime === curLeg1.departureTime && o.leg1.airline === curLeg1.airline && o.leg2.date === curLeg2.date && o.leg2.departureTime === curLeg2.departureTime && o.leg2.airline === curLeg2.airline);
  
  const layLabel = activeItin ? formatDuration(activeItin.layoverDurationHours) : '?';
  const nights = calendarNights({ leg1: curLeg1, leg2: curLeg2 }) || 0;
  const usable = activeItin ? (activeItin.daytimeValue ?? 0) : 0;
  const adjustedPrice = total + (nights * 50);
  const score = adjustedPrice > 0 ? (usable / adjustedPrice).toFixed(4) : '—';

  return (
    <div className="flight-card card-hub">
      <h3 className="card-h3">{options[0].origin} → <strong>{hub}</strong> → {options[0].destination}</h3>
      <p className="itin-summary itin-summary-hub">
        <span className="itin-date">{curLeg1.date ? formatDateFriendly(curLeg1.date) : ''}</span> <strong>{curLeg1.departureTime}</strong> {options[0].origin}
        &nbsp;→&nbsp; <strong>{curLeg1.arrivalTime}</strong>
        <span className="itin-hub-date"> ({layLabel} / {nights} {nights === 1 ? 'night' : 'nights'}) </span>
        <span className="itin-date">{curLeg2.date ? formatDateFriendly(curLeg2.date) : ''}</span> <strong>{curLeg2.departureTime}</strong> {hub}
        &nbsp;→&nbsp; <strong>{curLeg2.arrivalTime}</strong> {options[0].destination}
      </p>
      <div className="total-row total-row-hub"><span><strong>Total: £{total.toFixed(0)}</strong></span></div>
      
      <FlightLeg 
        leg={curLeg1} 
        legNum={1} 
        legType="hub" 
        dates={leg1Dates} 
        times={leg1TimesOnCurDate} 
        label="Leg 1" 
        onLegChange={handleLeg1Change} 
      />
      <FlightLeg 
        leg={curLeg2} 
        legNum={2} 
        legType="hub" 
        dates={leg2Dates} 
        times={leg2TimesOnCurDate} 
        label="Leg 2" 
        onLegChange={handleLeg2Change} 
      />

      <DebugTable 
        type="hub" 
        hub={hub} 
        arrTime={curLeg1.arrivalTime} 
        arrDate={curLeg1.date} 
        depTime={curLeg2.departureTime} 
        depDate={curLeg2.date} 
        nights={nights} 
        usable={usable} 
        total={total} 
        adjustedPrice={adjustedPrice} 
        score={score} 
      />
    </div>
  );
}
