import { allItineraries, isSearching } from "./signals.js";

// Same-origin proxy: the Cloudflare Pages Function at /api injects the Bearer key
// server-side (see functions/api/[[path]].js), so no key ever reaches the browser.
const BASE = import.meta.env.VITE_API_BASE || '/api';
let activeSearch = null;

// Abort an in-flight search. searchFlights' finally resets isSearching + activeSearch.
export function cancelSearch() {
  if (activeSearch) activeSearch.abort();
}

// Closing or refreshing the tab aborts the search too. The browser already drops the
// connection on unload; pagehide makes the intent explicit (and fires on refresh/close).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { if (activeSearch) activeSearch.abort(); });
}

export async function searchFlights({ origin, destination, deadlineDates, layoverDays, nonstop, imoovaEnabled }) {
  if (activeSearch) activeSearch.abort();
  activeSearch = new AbortController();

  allItineraries.value = [];
  allItineraries.value = [];
  isSearching.value = true;

  try {
    const res = await fetch(`${BASE}/search/bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // stream:true → server emits SSE, which the reader below parses live.
      body: JSON.stringify({ origin, destination, deadlineDates, layoverDays, nonstop, oneway: true, imoovaEnabled, stream: true }),
      signal: activeSearch.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(err.error || `Server returned ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split('\n');
        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) data += line.slice(6);
        }

        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (eventType === 'error') throw new Error(parsed.error || 'Backend reported an error');
            handleEvent(parsed);
          } catch (e) {
            
          }
        }
      }
    }

  } catch (err) {
  } finally {
    isSearching.value = false;
    activeSearch = null;
  }
}

function handleEvent(event) {
  switch (event.type) {


    case 'DIRECT_FOUND': {
      const flight = event.flight;
      const price = flight.priceValue || 0;
      const itin = {
        type: 'DIRECT_FLIGHT',
        origin: flight.origin,
        destination: flight.destination,
        flight,
        totalPrice: price
      };
      allItineraries.value = [...allItineraries.value, itin];
      break;
    }

    case 'ITINERARY_FOUND':
      allItineraries.value = [...allItineraries.value, event];
      break;

    case 'IMOOVA_VAN_ITINERARY_FOUND': {
      const fTotal = (event.leg1?.priceValue || 0) + (event.leg2?.priceValue || 0);
      const vPrice = event.van?.priceValue || (event.van?.price ? parseFloat(event.van.price.replace(/[^0-9.]/g, '')) : 0);
      event.totalPrice = fTotal + vPrice;
      allItineraries.value = [...allItineraries.value, event];
      break;
    }
  }
}



export async function clearCache(type = 'all') {
  const endpoint = type === 'all' ? '' : `/${type}`;
  try {
    const res = await fetch(`${BASE}/cache${endpoint}`, { method: 'DELETE' });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function getCacheStats() {
  try {
    const res = await fetch(`${BASE}/cache/stats`);
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}
