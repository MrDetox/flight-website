import { useState, useEffect } from 'preact/hooks';
import { isSearching, allItineraries } from '../signals.js';

// The backend streams result events, not a percentage, so this is an indeterminate
// bar (honest "working…") plus a live count + elapsed timer. A real % would need
// the server to emit progress events.
const STYLE = `
@keyframes bh-indeterminate { 0% { left: -40%; } 100% { left: 100%; } }
.bh-progress { margin: 14px 0; }
.bh-progress__track { position: relative; height: 6px; background: rgba(21,101,192,0.15); border-radius: 4px; overflow: hidden; }
.bh-progress__bar { position: absolute; top: 0; height: 100%; width: 40%; background: #1565c0; border-radius: 4px; animation: bh-indeterminate 1.1s infinite ease-in-out; }
.bh-progress__meta { font-size: 0.85em; color: #555; margin-top: 6px; }
`;

export function SearchProgress() {
  const searching = isSearching.value;
  const count = allItineraries.value.length;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!searching) { setElapsed(0); return; }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [searching]);

  if (!searching) return null;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div class="bh-progress">
      <style>{STYLE}</style>
      <div class="bh-progress__track"><div class="bh-progress__bar" /></div>
      <div class="bh-progress__meta">Searching… {count} option{count === 1 ? '' : 's'} found · {mm}:{ss}</div>
    </div>
  );
}
