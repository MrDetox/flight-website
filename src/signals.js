import { signal, computed } from "@preact/signals";
import { calendarNights, bestLayoverScore, parseTime } from "./utils.js";

export const allItineraries = signal([]);
export const isSearching = signal(false);

export const filterState = {
  maxPrice: signal(Infinity),
  minHours: signal(0),
  maxHours: signal(72),
  hotelNights: signal(null), 
  sortBy: signal('price-asc'),
  excludeHubs: signal([]),
  depAfter: signal(0),
  depBefore: signal(1440),
  arrAfter: signal(0),
  arrBefore: signal(1440),
  adjustTimesToMatch: signal(true)
};

export const filteredResults = computed(() => {
  const itineraries = allItineraries.value;
  const maxP = filterState.maxPrice.value;
  const minH = filterState.minHours.value;
  const maxH = filterState.maxHours.value;
  const hNights = filterState.hotelNights.value;
  const exclude = filterState.excludeHubs.value;
  const depAfterVal = filterState.depAfter.value;
  const depBeforeVal = filterState.depBefore.value;
  const arrAfterVal = filterState.arrAfter.value;
  const arrBeforeVal = filterState.arrBefore.value;
  const adjustTimesVal = filterState.adjustTimesToMatch.value;

  const filterNonTime = (itin) => {
    const price = itin.totalPrice || 0;
    const dur = itin.layoverDurationHours || 0;
    const hub = (itin.hub || '').toLowerCase();
    
    if (price > maxP) return false;
    if (dur < minH || dur > maxH) return false;
    if (exclude.some(ex => hub.includes(ex))) return false;
    
    if (hNights !== null) {
      const nights = calendarNights(itin);
      if (nights === null) return true;
      if (hNights === 0 && nights !== 0) return false;
      if (hNights === 1 && nights !== 1) return false;
      if (hNights === 2 && nights < 2) return false;
    }
    return true;
  };

  const filterTimeOnly = (itin) => {
    const firstFlight = itin.flight || itin.leg1;
    const lastFlight = itin.flight || itin.leg2;

    if (firstFlight) {
      const depTime = parseTime(firstFlight.departureTime);
      if (depTime !== null) {
        if (depTime < depAfterVal || depTime > depBeforeVal) return false;
      }
    }
    if (lastFlight) {
      const arrTime = parseTime(lastFlight.arrivalTime);
      if (arrTime !== null) {
        if (arrTime < arrAfterVal || arrTime > arrBeforeVal) return false;
      }
    }
    return true;
  };

  const baseFiltered = itineraries.filter(filterNonTime);

  if (adjustTimesVal) {
    return baseFiltered.filter(filterTimeOnly);
  } else {
    const getItinGroupKey = (itin) => {
      if (itin.type === 'DIRECT_FLIGHT') {
        return `direct:${itin.origin}|${itin.destination}`;
      } else if (itin.type === 'IMOOVA_VAN_ITINERARY_FOUND') {
        return `van:${itin.hub}|${itin.vanDestination}`;
      } else {
        return `hub:${itin.origin}|${itin.hub || 'Unknown'}|${itin.destination}`;
      }
    };

    const getPreferredOption = (options, sortBy) => {
      if (!options || options.length === 0) return null;
      if (sortBy === 'best-layover') {
        return options.reduce((best, x) => bestLayoverScore(x) > bestLayoverScore(best) ? x : best);
      }
      if (sortBy === 'price-desc') {
        return options.reduce((best, x) => x.totalPrice > best.totalPrice ? x : best);
      }
      if (sortBy === 'duration-desc') {
        return options.reduce((best, x) => (x.layoverDurationHours || 0) > (best.layoverDurationHours || 0) ? x : best);
      }
      if (sortBy === 'duration-asc') {
        return options.reduce((best, x) => (x.layoverDurationHours || 0) < (best.layoverDurationHours || 0) ? x : best);
      }
      return options.reduce((best, x) => x.totalPrice < best.totalPrice ? x : best);
    };

    const groups = {};
    baseFiltered.forEach(itin => {
      const key = getItinGroupKey(itin);
      if (!groups[key]) groups[key] = [];
      groups[key].push(itin);
    });

    const allowedItineraries = [];
    Object.keys(groups).forEach(key => {
      const groupOptions = groups[key];
      const preferred = getPreferredOption(groupOptions, filterState.sortBy.value);
      if (preferred && filterTimeOnly(preferred)) {
        groupOptions.forEach(o => {
          if (filterTimeOnly(o)) {
            allowedItineraries.push(o);
          }
        });
      }
    });
    return allowedItineraries;
  }
});



