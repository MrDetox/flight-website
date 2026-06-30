import { useMemo } from 'preact/hooks';
import { filteredResults, filterState } from '../signals.js';
import { bestLayoverScore } from '../utils.js';
import { HubCard } from './cards/HubCard.jsx';
import { DirectCard } from './cards/DirectCard.jsx';
import { VanCard } from './cards/VanCard.jsx';

export function ResultsList() {
  const itineraries = filteredResults.value;

  const groupedCards = useMemo(() => {
    const hubGroups = {};
    const vanGroups = {};
    const directGroups = {};

    itineraries.forEach(itin => {
      if (itin.type === 'DIRECT_FLIGHT') {
        const key = `${itin.origin}|${itin.destination}`;
        if (!directGroups[key]) directGroups[key] = [];
        directGroups[key].push(itin);
      } else if (itin.type === 'IMOOVA_VAN_ITINERARY_FOUND') {
        const key = `${itin.hub}|${itin.vanDestination}`;
        if (!vanGroups[key]) vanGroups[key] = [];
        vanGroups[key].push(itin);
      } else {
        const key = `${itin.origin}|${itin.hub || 'Unknown'}|${itin.destination}`;
        if (!hubGroups[key]) hubGroups[key] = [];
        hubGroups[key].push(itin);
      }
    });

    const cards = [
      ...Object.keys(hubGroups).map(key => ({ type: 'hub', key, options: hubGroups[key] })),
      ...Object.keys(vanGroups).map(key => ({ type: 'van', key, options: vanGroups[key] })),
      ...Object.keys(directGroups).map(key => ({ type: 'direct', key, options: directGroups[key] }))
    ];

    const s = filterState.sortBy.value;
    const getPrice = (grp) => Math.min(...grp.options.map(o => o.totalPrice));
    const getScore = (grp) => grp.type === 'direct' ? 0 : Math.max(...grp.options.map(bestLayoverScore));
    const getDur = (grp) => grp.type === 'direct' ? 0 : Math.max(...grp.options.map(o => o.layoverDurationHours || 0));

    cards.sort((a, b) => {
      if (s === 'hub-asc') {
        const hubA = a.type === 'hub' ? a.key.split('|')[1] : (a.type === 'direct' ? 'Direct' : a.key.split('|')[0]);
        const hubB = b.type === 'hub' ? b.key.split('|')[1] : (b.type === 'direct' ? 'Direct' : b.key.split('|')[0]);
        return hubA.localeCompare(hubB);
      }
      if (s === 'best-layover') {
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA === scoreB) return getPrice(a) - getPrice(b);
        return scoreB - scoreA;
      }
      if (s === 'price-desc') return getPrice(b) - getPrice(a);
      if (s === 'duration-desc') return getDur(b) - getDur(a);
      if (s === 'duration-asc') return getDur(a) - getDur(b);
      return getPrice(a) - getPrice(b); // price-asc
    });

    return cards;
  }, [itineraries, filterState.sortBy.value]);

  if (itineraries.length === 0) {
    return (
      <div id="empty-state">
        <p><em>Your results will appear here once you run a search.</em></p>
      </div>
    );
  }

  return (
    <section id="results-section">
      <div id="itineraries-wrapper">
        <div className="results-header">
          <h2>All Routes</h2>
        </div>
        <p className="results-subheader">Direct flights and layover routes to your destination — sorted by price.</p>
        <div id="itineraries-list">
          {groupedCards.map(card => {
            if (card.type === 'hub') return <HubCard key={card.key} options={card.options} hub={card.key.split('|')[1]} />;
            if (card.type === 'van') return <VanCard key={card.key} options={card.options} />;
            if (card.type === 'direct') return <DirectCard key={card.key} options={card.options} />;
            return null;
          })}
        </div>
      </div>
    </section>
  );
}
