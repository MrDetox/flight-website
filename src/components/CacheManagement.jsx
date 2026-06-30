import { useState } from 'preact/hooks';
import { clearCache, getCacheStats } from '../api.js';

export function CacheManagement() {
  const [output, setOutput] = useState('(No cache data fetched yet)');

  const handleStats = async () => {
    const stats = await getCacheStats();
    setOutput(JSON.stringify(stats, null, 2));
  };

  const handleClear = async (type) => {
    if (type === 'all' && !confirm('Clear ALL cached results?')) return;
    const res = await clearCache(type === 'all' ? 'all' : (type === 'expired' ? 'expired' : ''));
    setOutput(JSON.stringify(res, null, 2));
  };

  return (
    <details>
      <summary>🛠 Cache Management (Advanced)</summary>
      <br />
      <button onClick={handleStats}>📊 Get Cache Stats</button>
      &nbsp;
      <button onClick={() => handleClear('all')}>🗑 Clear All Cache</button>
      &nbsp;
      <button onClick={() => handleClear('expired')}>🧹 Clear Expired Cache</button>
      <br /><br />
      <pre id="cache-output">{output}</pre>
    </details>
  );
}
