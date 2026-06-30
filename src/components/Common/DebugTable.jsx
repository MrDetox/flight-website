import { formatDateFriendly } from '../../utils.js';

export function DebugTable({ type, hub, arrTime, arrDate, depTime, depDate, nights, usable, total, adjustedPrice, score, vanDest, vanDropoff }) {
  const isVan = type === 'van';
  const arrLabel = isVan ? `Arrive ${hub} (Flight 1)` : `Arrive ${hub}`;
  const depLabel = isVan ? `Depart ${vanDest} (Flight 2)` : `Depart ${hub}`;
  
  return (
    <details className={`debug-details debug-details-${isVan ? 'van' : 'hub'}`}>
      <summary className="debug-summary">🔬 {isVan ? 'Van Relay' : 'Best Layover'} Score</summary>
      <table className="debug-table">
        <tbody>
          <tr><td className="debug-td-label">{arrLabel}:</td><td><strong>{arrTime || '?'}</strong> on {arrDate || '?'}</td></tr>
          {vanDropoff && <tr><td className="debug-td-label">Van drop-off:</td><td><strong>{formatDateFriendly(vanDropoff)}</strong></td></tr>}
          <tr><td className="debug-td-label">{depLabel}:</td><td><strong>{depTime || '?'}</strong> on {depDate || '?'}</td></tr>
          <tr><td className="debug-td-label">Calendar nights:</td><td><strong>{nights}</strong></td></tr>
          <tr><td className="debug-td-label">Usable daytime hrs (9am–11pm):</td><td><strong>{usable.toFixed(2)} h</strong></td></tr>
          <tr><td className="debug-td-label">Total price:</td><td><strong>£{total.toFixed(0)}</strong>{isVan ? ' (incl. van)' : ''}</td></tr>
          {adjustedPrice !== undefined && <tr><td className="debug-td-label">Adjusted price (+£50/night):</td><td><strong>£{adjustedPrice.toFixed(0)}</strong></td></tr>}
          <tr><td className="debug-td-label">Score (hrs/£):</td><td><strong>{score}</strong></td></tr>
        </tbody>
      </table>
    </details>
  );
}
