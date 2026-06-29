import { Flight, FlightSegment, SearchParams } from '../types';
import { generateMicroItinerary } from './gemini';

// ─── Scraper API Types ───────────────────────────────────────────────────────

interface ScraperFlight {
  origin: string;
  destination: string;
  originAirportName: string;
  destinationAirportName: string;
  originAirportCode?: string;
  destinationAirportCode?: string;
  airline: string;
  price: string;
  duration: string;
  stops: string;
  departureTime: string;
  arrivalTime: string;
  bookingLink?: string;
}

interface ScraperResult {
  searchDate: string;
  flights: ScraperFlight[];
}

interface ScraperResponse {
  results: ScraperResult[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCRAPER_URL = '/scraper';
const TRANSFER_BUFFER_HOURS = 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a flat array of date strings from earliest to mustBe (inclusive). */
export function buildDateRange(earliest: string, mustBe: string): string[] {
  const dates: string[] = [];
  const start = new Date(earliest);
  const end = new Date(mustBe);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** Parses a price string like "$450" or "£120" → number */
function parsePrice(priceStr: string): number {
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? Infinity : num;
}

/** Extracts currency symbol from a price string */
function parseCurrency(priceStr: string): string {
  const match = priceStr.match(/^[^0-9]+/);
  return match ? match[0].trim() : '£';
}

/** Converts "8:30 PM" or "14:30" style time on a given date to a Date object */
function parseTimeToDate(timeStr: string, baseDate: string): Date {
  const base = new Date(baseDate + 'T00:00:00');

  // Handle 12-hour format: "8:30 PM"
  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    base.setHours(h, m, 0, 0);
    return base;
  }

  // Handle 24-hour format: "14:30"
  const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    base.setHours(parseInt(match24[1], 10), parseInt(match24[2], 10), 0, 0);
    return base;
  }

  return base;
}

/** Returns true if there is >= TRANSFER_BUFFER_HOURS gap between leg1 arrival and leg2 departure */
function hasValidTransfer(
  leg1: ScraperFlight,
  leg1Date: string,
  leg2: ScraperFlight,
  leg2Date: string
): boolean {
  const arrival = parseTimeToDate(leg1.arrivalTime, leg1Date);
  const departure = parseTimeToDate(leg2.departureTime, leg2Date);

  // If leg2 is on a later date, the departure is guaranteed to be far enough ahead
  if (leg2Date > leg1Date) {
    const msBetween = departure.getTime() - arrival.getTime();
    // Even same-day if dates differ (shouldn't happen), still check
    return msBetween >= TRANSFER_BUFFER_HOURS * 60 * 60 * 1000;
  }

  const msBetween = departure.getTime() - arrival.getTime();
  return msBetween >= TRANSFER_BUFFER_HOURS * 60 * 60 * 1000;
}

/** Calculates the layover duration string between two flights */
function calcLayoverDuration(leg1Date: string, leg2Date: string): string {
  const d1 = new Date(leg1Date);
  const d2 = new Date(leg2Date);
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Same Day';
  if (diffDays === 1) return '1 Day';
  return `${diffDays} Days`;
}

// ─── Phase A: Benchmark (Direct threshold) ───────────────────────────────────

/** Returns a Map of date → cheapest direct price (Infinity if no flight found) */
async function phaseA_benchmark(
  origin: string,
  destination: string,
  dates: string[]
): Promise<Map<string, number>> {
  const thresholds = new Map<string, number>();
  dates.forEach(d => thresholds.set(d, Infinity));

  try {
    const res = await fetch(`${SCRAPER_URL}/search/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, dates, nonstop: true, oneway: true }),
    });

    if (!res.ok) return thresholds;

    const data: ScraperResponse = await res.json();
    for (const result of data.results) {
      const min = Math.min(...result.flights.map(f => parsePrice(f.price)));
      if (min < Infinity) thresholds.set(result.searchDate, min);
    }
  } catch (err) {
    console.error('[flightSearch] Phase A (benchmark) failed:', err);
  }

  return thresholds;
}

// ─── Phase B: Discover hubs ───────────────────────────────────────────────────

interface HubCandidate {
  hub: string;
  date: string;
  flights: ScraperFlight[];
}

/** Discovers (hub, date, flights[]) combos reachable from origin, streaming results via callback */
async function phaseB_discover(
  origin: string, 
  dates: string[],
  onHubCandidate: (candidate: HubCandidate) => void
): Promise<void> {
  try {
    const res = await fetch(`${SCRAPER_URL}/search/explore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, dates, nonstop: true, oneway: true, stream: true }),
    });

    if (!res.ok || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const jsonStr = part.replace('data: ', '').trim();
          if (!jsonStr) continue;

          try {
            const result: ScraperResult = JSON.parse(jsonStr);
            const byHub = new Map<string, ScraperFlight[]>();
            for (const flight of result.flights) {
              const hub = flight.destination;
              if (!byHub.has(hub)) byHub.set(hub, []);
              byHub.get(hub)!.push(flight);
            }
            for (const [hub, flights] of byHub.entries()) {
              onHubCandidate({ hub, date: result.searchDate, flights });
            }
          } catch (e) {
            console.error('[flightSearch] Error parsing stream chunk:', e);
          }
        }
      }
    }
  } catch (err) {
    console.error('[flightSearch] Phase B (discover) failed:', err);
  }
}

// ─── Phase C: Stitch legs ─────────────────────────────────────────────────────

let _resultCounter = 0;

async function phaseC_stitch(
  origin: string,
  candidate: HubCandidate,
  destination: string,
  mustBeDate: string,
  thresholds: Map<string, number>,
  tripDays: SearchParams['tripDays'],
  onResult: (flight: Flight) => void
): Promise<void> {
  const leg1Date = candidate.date;
  let leg2Dates: string[];

  // 1. Calculate Leg 2 date window
  if (tripDays?.min !== undefined || tripDays?.max !== undefined) {
    const min = tripDays.min ?? 1;
    const max = tripDays.max ?? min;
    const base = new Date(leg1Date);
    leg2Dates = [];
    for (let i = min; i <= max; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      if (ds <= mustBeDate) leg2Dates.push(ds);
    }
  } else {
    leg2Dates = buildDateRange(leg1Date, mustBeDate);
  }

  if (leg2Dates.length === 0) return;

  try {
    // 2. Fetch Leg 2 first (Hub -> Destination)
    const resLeg2 = await fetch(`${SCRAPER_URL}/search/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: candidate.hub, destination, dates: leg2Dates, nonstop: true, oneway: true }),
    });

    if (!resLeg2.ok) return;
    const dataLeg2: ScraperResponse = await resLeg2.json();
    
    // Check if we even found any leg2 flights before spending API quota on refining leg1
    const leg2FlightsTotal = dataLeg2.results.flatMap(r => r.flights);
    if (leg2FlightsTotal.length === 0) return;

    // 3. (Optimization) Quick threshold check using the cheapest leg1 we already have from Explore
    const bestExploreLeg1Price = Math.min(...candidate.flights.map(f => parsePrice(f.price)));
    const minLeg2Price = Math.min(...leg2FlightsTotal.map(f => parsePrice(f.price)));
    const threshold = thresholds.get(leg1Date) ?? Infinity;
    
    if (bestExploreLeg1Price + minLeg2Price >= threshold) {
      // Even with the cheapest flights, we won't beat the direct price benchmark. Early exit.
      return;
    }

    // 4. Now that we know a connection is likely and possible, fetch the REFINED Leg 1 (Origin -> Hub) for exact times
    const resLeg1 = await fetch(`${SCRAPER_URL}/search/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination: candidate.hub, dates: [leg1Date], nonstop: true, oneway: true }),
    });

    if (!resLeg1.ok) return;
    const dataLeg1: ScraperResponse = await resLeg1.json();
    const leg1Flights = dataLeg1.results.flatMap(r => r.flights);
    if (leg1Flights.length === 0) return;

    // 5. Final Stitching
    for (const result2 of dataLeg2.results) {
      for (const leg2 of result2.flights) {
        const leg2Price = parsePrice(leg2.price);
        if (leg2Price === Infinity) continue;

        for (const leg1 of leg1Flights) {
          const leg1Price = parsePrice(leg1.price);
          if (leg1Price === Infinity) continue;

          // Transfer buffer check
          if (!hasValidTransfer(leg1, leg1Date, leg2, result2.searchDate)) continue;

          const totalPrice = leg1Price + leg2Price;
          if (totalPrice >= threshold) continue;

          // ✅ Valid "bonus vacation" found — build the Flight object
          const currency = parseCurrency(leg1.price);
          const layoverDuration = calcLayoverDuration(leg1Date, result2.searchDate);
          
          const d1 = parseTimeToDate(leg1.arrivalTime, leg1Date);
          const d2 = parseTimeToDate(leg2.departureTime, result2.searchDate);
          const layoverHours = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);

          const segments: FlightSegment[] = [
            {
              from: leg1.origin,
              to: leg1.destination,
              departure: leg1.departureTime,
              departureDate: leg1Date,
              arrival: leg1.arrivalTime,
              arrivalDate: leg1Date,
              carrier: leg1.airline,
              duration: leg1.duration,
              type: 'flight',
            },
            {
              from: leg2.origin,
              to: leg2.destination,
              departure: leg2.departureTime,
              departureDate: result2.searchDate,
              arrival: leg2.arrivalTime,
              arrivalDate: result2.searchDate,
              carrier: leg2.airline,
              duration: leg2.duration,
              type: 'flight',
            },
          ];

          const id = `result-${++_resultCounter}`;

          const flight: Flight = {
            id,
            origin: leg1.origin,
            destination: leg2.destination,
            price: totalPrice,
            directPrice: threshold === Infinity ? totalPrice * 2 : threshold,
            currency,
            layoverCity: candidate.hub,
            layoverDuration,
            layoverHours,
            segments,
            vibeTags: [],        // Enriched by UI / Gemini
            estimatedLayoverCost: 0,
            aiTeaser: '',        // Enriched async below
          };

          // Dispatch immediately — don't wait for AI teaser
          onResult(flight);

          // Fire-and-forget AI teaser enrichment
          generateMicroItinerary(candidate.hub, layoverDuration)
            .then(teaser => {
              // We emit a second "update" so the UI can patch the teaser in
              onResult({ ...flight, aiTeaser: teaser });
            })
            .catch(() => { /* silent — teaser is non-critical */ });
        }
      }
    }
  } catch (err) {
    console.error(`[flightSearch] Phase C stitch failed for hub ${candidate.hub}:`, err);
  }
}

// ─── Public Orchestrator ──────────────────────────────────────────────────────

/**
 * Runs the unified flight search engine.
 * Calls `onResult` each time a valid "bonus vacation" is found (streaming).
 * @returns a promise that resolves when all searches are complete.
 */
export async function runSearch(
  params: SearchParams,
  onResult: (flight: Flight) => void
): Promise<void> {
  _resultCounter = 0;

  const earliest = params.earliestDate || params.mustBeDate;
  const mustBe = params.mustBeDate;
  const dates = buildDateRange(earliest, mustBe);

  // Phase A runs concurrently, but returns a Promise to be awaited inside Phase C
  const thresholdsPromise = phaseA_benchmark(params.origin, params.destination, dates);

  const activeStitches: Promise<void>[] = [];
  const handledHubDates = new Set<string>();

  // Phase B + C streaming assembly line
  await phaseB_discover(params.origin, dates, (candidate) => {
    // Basic deduplication: only process each hub+date combo once
    const key = `${candidate.hub}-${candidate.date}`;
    if (handledHubDates.has(key)) return;
    handledHubDates.add(key);

    const stitchPromise = thresholdsPromise.then(thresholds => 
      phaseC_stitch(
        params.origin,
        candidate,
        params.destination,
        mustBe,
        thresholds,
        params.tripDays,
        onResult
      )
    );
    activeStitches.push(stitchPromise);
  });

  // Wait for all fan-out stitches to complete
  await Promise.all(activeStitches);
}
