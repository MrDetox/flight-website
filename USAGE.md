# Flight Scraper – API Reference

This document describes every available API endpoint, request schema, and response format. It is intended for programmatic use — including by AI agents building on top of this backend.

> **Base URL:** `http://localhost:4000`  
> **All requests:** `Content-Type: application/json`  
> **All dates:** `YYYY-MM-DD` format only

---

## Quick Start

```bash
npm install && npm run build && npm start
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `CACHE_ENABLED` | `true` | Set to `"false"` to disable 24-hour response caching |

---

## Core Data Types

### `Flight` Object

Every flight result across all endpoints shares this schema:

| Field | Type | Description |
|-------|------|-------------|
| `origin` | string | Origin city name |
| `destination` | string | Destination city name |
| `originAirportName` | string | Full origin airport name |
| `destinationAirportName` | string | Full destination airport name |
| `originAirportCode` | string | IATA code (e.g. `"LHR"`) |
| `destinationAirportCode` | string | IATA code (e.g. `"CDG"`) |
| `airline` | string | Airline name (or `"Multiple"` for Explore results) |
| `price` | string | Display price string (e.g. `"£120"`) |
| `priceValue` | number | **Numeric.** Pre-parsed price for easy math (e.g. `120`) |
| `duration` | string | Flight duration (e.g. `"2h 30m"`) |
| `stops` | string | `"Nonstop"`, `"1 stop"`, `"2 stops"`, `"2+ stops"`, or `"Unknown"` |
| `departureTime` | string | Departure time string (e.g. `"6:00 AM"`) |
| `arrivalTime` | string | Arrival time string (e.g. `"8:30 PM+1"`) |
| `dayOffset` | number | **Integer.** Days added to the departure date to get the real arrival date. `0` = same day, `1` = next day. Use this for transfer gap math — do not parse `+1` from `arrivalTime` yourself. |
| `rawText` | string | Raw scraped text from the page (debug use) |
| `bookingLink` | string | Booking URL if available |

### `SearchResult` Object

```json
{
  "searchDate": "2025-05-21",
  "flights": [ /* Flight[] */ ]
}
```

---

## Endpoints

---

### `POST /search/direct`

Search for flights from an **origin to a specific destination** on one or more dates.

**Request:**
```json
{
  "origin": "London",
  "destination": "Paris",
  "dates": ["2025-05-21", "2025-05-22"],
  "nonstop": true,
  "oneway": true,
  "stream": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `origin` | string | Yes | — | Origin city or airport |
| `destination` | string | Yes | — | Destination city or airport |
| `dates` | string[] | Yes | — | One or more departure dates |
| `nonstop` | boolean | No | `true` | Nonstop flights only |
| `oneway` | boolean | No | `true` | One-way tickets only |
| `stream` | boolean | No | `false` | Enable SSE streaming (see below) |

**Response (non-streaming):**
```json
{ "results": [ /* SearchResult[] */ ] }
```

**Response (streaming, `stream: true`):**  
`Content-Type: text/event-stream` — emits one chunk per date as it completes:
```
data: { "searchDate": "2025-05-21", "flights": [...] }
```

---

### `POST /search/explore`

Search flights from an origin to **everywhere** (Google Flights Explore map). Returns the cheapest possible destinations.

> **Important for frontend builders:** This endpoint returns destination city names and prices only. `departureTime`, `arrivalTime`, and `dayOffset` will be empty/0 because Google's Explore map does not display flight times. Use this endpoint only for **hub discovery**. To get actual flight times for a hub, follow up with a `/search/direct` call.

**Request:**
```json
{
  "origin": "London",
  "dates": ["2025-05-19", "2025-05-20", "2025-05-21"],
  "nonstop": true,
  "oneway": true,
  "stream": true
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `origin` | string | Yes | — |
| `dates` | string[] | Yes | — |
| `nonstop` | boolean | No | `true` |
| `oneway` | boolean | No | `true` |
| `stream` | boolean | No | `false` |

---

### `POST /search/country`

Search flights from an origin to **all major cities in a country**.

**Request:**
```json
{
  "origin": "London",
  "country": "Bulgaria",
  "dates": ["2025-05-21"],
  "nonstop": true,
  "oneway": true,
  "stream": false
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `origin` | string | Yes | — |
| `country` | string | Yes | — |
| `dates` | string[] | Yes | — |
| `nonstop` | boolean | No | `true` |
| `oneway` | boolean | No | `true` |
| `stream` | boolean | No | `false` |

---

### `POST /search/bonus` ⭐

**The primary "Bonus Vacation" smart routing engine.** This is the flagship endpoint. Given an origin, destination, and a hard deadline date, it autonomously:

1. Checks for **direct flights** on the deadline date.
2. Discovers cheap **layover hubs** via the Explore API for the deadline date and up to 2 days prior.
3. Caps hub processing at the **Top 10 cheapest hubs** to prevent timeouts.
4. Fetches exact flight times for both legs (Origin → Hub, Hub → Destination).
5. Validates that each pair has a **minimum 2-hour transfer buffer** using `dayOffset` math.
6. Streams all events as they are discovered.

This endpoint always uses SSE streaming. Always consume it as `text/event-stream`.

**Request:**
```json
{
  "origin": "Leeds",
  "destination": "Sofia",
  "deadlineDate": "2025-05-23",
  "nonstop": true,
  "oneway": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `origin` | string | Yes | — | Origin city |
| `destination` | string | Yes | — | Final destination city |
| `deadlineDate` | string | Yes | — | Must arrive by this date (YYYY-MM-DD) |
| `layoverDays` | number | No | `3` | Search window prior to deadline (1-7 days) |
| `imoovaEnabled` | boolean | No | `false` | Include Campervan relocation routes |
| `nonstop` | boolean | No | `true` | Prefer nonstop legs |
| `oneway` | boolean | No | `true` | One-way trip |

**SSE Event Stream:**

The server streams a sequence of JSON objects. Each line will be in the format:
```
data: { "type": "...", ... }
```

**Event types:**

| `type` | Description | Extra Fields |
|--------|-------------|--------------|
| `STATUS` | Progress update for the UI loading state | `message: string` |
| `DIRECT_FOUND` | A direct flight was found for the deadline date | `flight: Flight` |
| `NO_DIRECT_FLIGHTS` | No direct flights exist | *(none)* |
| `ITINERARY_FOUND` | A valid 2-leg bonus vacation route was validated | See below |

**`ITINERARY_FOUND` payload:**
```json
{
  "type": "ITINERARY_FOUND",
  "origin": "Leeds",
  "hub": "Barcelona",
  "destination": "Sofia",
  "leg1": { /* Flight: Leeds → Barcelona */ },
  "leg2": { /* Flight: Barcelona → Sofia */ },
  "totalPrice": 87,
  "layoverDurationHours": 14.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `origin` | string | Departure city |
| `hub` | string | Layover city (bonus vacation destination) |
| `destination` | string | Final destination |
| `leg1` | Flight | Full flight object for Leg 1 |
| `leg2` | Flight | Full flight object for Leg 2 |
| `totalPrice` | number | Combined numeric price of both legs (e.g. `87`) |
| `layoverDurationHours` | number | Transfer gap in hours, already validated ≥ 2 (e.g. `14.5`) |

**Example JavaScript consumer:**
```js
const res = await fetch('http://localhost:4000/search/bonus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ origin: 'Leeds', destination: 'Sofia', deadlineDate: '2025-05-23' })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
  for (const line of lines) {
    const event = JSON.parse(line.slice(6));
    console.log(event.type, event);
  }
}
```

---

## Cache Endpoints

Search results are cached for 24 hours by default.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cache/stats` | Returns hit count, entry count, size |
| `DELETE` | `/cache` | Clears all cached entries |
| `DELETE` | `/cache/expired` | Clears only expired entries |

---

## Error Handling

| Status | Meaning |
|--------|---------|
| `400` | Invalid request body — schema validation failed. Response includes Zod error details. |
| `500` | Scraper failure. Response: `{ "error": "Internal Server Error" }` |

For SSE endpoints, errors are emitted as:
```
event: error
data: { "error": "Internal Server Error" }
```

---

## Notes for AI Consumers

1. **Latency:** Playwright scrapes real browser pages. A `/search/bonus` call can take 30–90 seconds. Always use SSE and show a loading state — do not poll or retry during this window.
2. **`dayOffset` is critical:** When doing any transfer gap calculation, use `flight.dayOffset` to determine if an arrival is a day later. Do not attempt to parse the `+1` suffix from `arrivalTime` strings yourself.
3. **Explore ≠ Times:** `/search/explore` results never contain `departureTime` or `arrivalTime`. Use `/search/direct` to resolve actual times for any hub.
4. **Caching:** Identical requests are cached for 24 hours. No need to deduplicate calls on the frontend.
5. **Concurrency:** The backend manages a Playwright browser semaphore internally. If you are calling multiple endpoints simultaneously (e.g. batching hub checks), do so in small groups of 3–4 to avoid stalling behind the internal queue.
6. **Hub Cap:** `/search/bonus` caps hub processing to the 10 cheapest destinations from the Explore API to guarantee reasonable response times.
