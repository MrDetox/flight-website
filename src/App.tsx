import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, List, Sparkles, Share2, Instagram, MessageCircle, ArrowLeft, Car } from 'lucide-react';
import SearchBar from './components/SearchBar';
import FlightCard from './components/FlightCard';
import ItineraryTinder from './components/ItineraryTinder';
import { Flight, SearchParams, Activity } from './types';
import { generateActivities } from './services/gemini';
import { runSearch } from './services/flightSearchService';

type SortOption = 'savings' | 'price' | 'shortest-layover' | 'longest-layover';

export default function App() {
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showTrueCost, setShowTrueCost] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [itineraryComplete, setItineraryComplete] = useState(false);
  const [finalSelectedActivities, setFinalSelectedActivities] = useState<Activity[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchStatus, setSearchStatus] = useState('Hacking the flight model...');
  const [sortBy, setSortBy] = useState<SortOption>('savings');

  // Track seen IDs so we can update teaser-enriched results in place
  const flightMap = useRef<Map<string, Flight>>(new Map());

  const handleResult = useCallback((flight: Flight) => {
    flightMap.current.set(flight.id, flight);
    setFlights(Array.from(flightMap.current.values()));
    setHasResults(true);
    setSearchStatus(`Found ${flightMap.current.size} bonus vacation${flightMap.current.size === 1 ? '' : 's'} so far...`);
  }, []);

  const handleSearch = async (params: SearchParams) => {
    setSearchParams(params);
    setIsSearching(true);
    setHasResults(false);
    setFlights([]);
    flightMap.current.clear();
    setSearchStatus('Hacking the flight model...');

    try {
      await runSearch(params, handleResult);
    } catch (err) {
      console.error('[App] Search failed:', err);
    } finally {
      setIsSearching(false);
      if (flightMap.current.size === 0) {
        setSearchStatus('No bonus vacations found. Try different dates or origin.');
      } else {
        setSearchStatus(`Done! Found ${flightMap.current.size} bonus vacation${flightMap.current.size === 1 ? '' : 's'}.`);
      }
    }
  };

  const handleSelectFlight = async (flight: Flight) => {
    setSelectedFlight(flight);
    if (flight.layoverCity) {
      const acts = await generateActivities(flight.layoverCity);
      setActivities(acts);
    }
  };

  const handleItineraryComplete = (selected: Activity[]) => {
    setFinalSelectedActivities(selected);
    setItineraryComplete(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {/* Header / Search Bar Anchor */}
      <div className={`transition-all duration-700 ${hasResults ? 'h-24' : 'h-screen flex flex-col items-center justify-center'}`}>
        {!hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 px-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-100">
              <Sparkles className="w-4 h-4" />
              Two Vacations. One Price.
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-4">
              Stop Over, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Start Exploring.</span>
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-lg">
              Our AI finds the hidden layovers that turn travel time into bonus vacations.
            </p>
          </motion.div>
        )}
        
        <SearchBar onSearch={handleSearch} isSticky={hasResults} />
      </div>

      <AnimatePresence>
        {isSearching && !hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-xl font-bold text-slate-800">{searchStatus}</div>
            <div className="text-sm text-slate-500 mt-2">Searching for cheap multi-leg connections...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasResults && !selectedFlight && (
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 pb-20 mt-8"
        >
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-start mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${showTrueCost ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <motion.div
                    animate={{ x: showTrueCost ? 20 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showTrueCost}
                    onChange={(e) => setShowTrueCost(e.target.checked)}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600">True Cost Transparency</span>
              </label>

              <div className="h-8 w-px bg-slate-200 hidden md:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-50 border-none text-xs font-bold text-slate-900 rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                >
                  <option value="savings">Biggest Savings</option>
                  <option value="price">Lowest Price</option>
                  <option value="shortest-layover">Shortest Layover</option>
                  <option value="longest-layover">Longest Layover</option>
                </select>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Streaming Banner */}
              <AnimatePresence>
                {isSearching && hasResults && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-6 shadow-sm">
                      <div className="relative">
                        <div className="w-12 h-12 border-2 border-emerald-200 rounded-full" />
                        <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plane className="w-5 h-5 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-900 leading-tight mb-1">
                          {searchStatus}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Searching for cheap multi-leg connections...
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {isSearching && hasResults
                    ? `Found ${flights.length} so far...`
                    : `Found ${flights.length} Bonus Vacation${flights.length === 1 ? '' : 's'}`}
                </h2>
                <div className="text-xs text-slate-500">
                  Sorted by {sortBy.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
              </div>
              {flights.length === 0 && !isSearching && (
                <div className="text-center py-20 text-slate-400">
                  <div className="text-5xl mb-4">✈️</div>
                  <div className="font-bold text-lg">No bonus vacations found</div>
                  <div className="text-sm mt-1">Try expanding your date range or changing the origin city.</div>
                </div>
              )}
              {[...flights]
                .sort((a, b) => {
                  if (sortBy === 'savings') {
                    return (b.directPrice - b.price) - (a.directPrice - a.price);
                  } else if (sortBy === 'price') {
                    return a.price - b.price;
                  } else if (sortBy === 'shortest-layover') {
                    return (a.layoverHours || 0) - (b.layoverHours || 0);
                  } else if (sortBy === 'longest-layover') {
                    return (b.layoverHours || 0) - (a.layoverHours || 0);
                  }
                  return 0;
                })
                .map((flight) => (
                  <div key={flight.id}>
                    <FlightCard
                      flight={flight}
                      onSelect={(f) => { handleSelectFlight(f); }}
                      showTrueCost={showTrueCost}
                    />
                  </div>
                ))}
            </div>
          </div>
        </motion.main>
      )}

      {/* Selected Flight Detail / Itinerary Tinder */}
      <AnimatePresence>
        {selectedFlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[100] overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-4 py-8">
              <button
                onClick={() => {
                  setSelectedFlight(null);
                  setItineraryComplete(false);
                }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Results
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5">
                  <div className="sticky top-8 space-y-8">
                    {/* Brag Receipt */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
                      <h2 className="text-3xl font-bold mb-4">You just hacked the system. 🥂</h2>
                      <p className="text-slate-400 mb-6">
                        By stopping in {selectedFlight.layoverCity}, you saved {selectedFlight.currency}{selectedFlight.directPrice - selectedFlight.price} on your flight to {selectedFlight.destination}—enough to cover your tapas and beachside hotel.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                        <div className="text-xs font-bold text-emerald-400">75% Cheaper</div>
                      </div>
                    </motion.div>

                    {/* Door-to-Door Journey Timeline */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Door-to-Door Journey</h3>
                      <div className="space-y-8 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100" />
                        
                        {searchParams?.homeCity && (
                          <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-400 flex items-center justify-center">
                              <Car className="w-3 h-3 text-blue-400" />
                            </div>
                            <div className="text-sm font-bold">Home to Departure</div>
                            <div className="text-xs text-slate-500">{searchParams.homeCity} to {selectedFlight.origin} (2h 15m)</div>
                          </div>
                        )}

                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-300 flex items-center justify-center">
                            <Plane className="w-3 h-3 text-slate-300" />
                          </div>
                          <div className="text-sm font-bold">Flight to {selectedFlight.layoverCity}</div>
                          <div className="text-xs text-slate-500">Departs 08:00 • 2h 15m</div>
                        </div>

                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                          </div>
                          <div className="text-sm font-bold">{selectedFlight.layoverDuration} in {selectedFlight.layoverCity}</div>
                          <div className="text-xs text-emerald-600 font-medium">Bonus Vacation Active</div>
                        </div>

                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-300 flex items-center justify-center">
                            <Plane className="w-3 h-3 text-slate-300" />
                          </div>
                          <div className="text-sm font-bold">Flight to {selectedFlight.destination}</div>
                          <div className="text-xs text-slate-500">Arrives Sunday 18:15</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  {!itineraryComplete ? (
                    <div className="space-y-8">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">Build Your {selectedFlight.layoverCity} Vibe</h2>
                        <p className="text-slate-500">Swipe right to keep, left to replace. AI will learn your style.</p>
                      </div>
                      {activities.length > 0 ? (
                        <ItineraryTinder activities={activities} onComplete={handleItineraryComplete} />
                      ) : (
                        <div className="h-[500px] flex items-center justify-center">
                          <div className="animate-pulse text-slate-400 font-medium">AI is curating local gems...</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-3xl font-bold">Your Custom Escape</h2>
                          <p className="text-slate-500">Personalized itinerary for {selectedFlight.layoverCity}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                            Book Journey
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {finalSelectedActivities.map((act, i) => (
                          <div key={act.id} className="flex gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                              <img src={`https://picsum.photos/seed/${act.id}/200/200`} alt={act.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{act.category}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Day {Math.floor(i/2) + 1}</span>
                              </div>
                              <h3 className="text-lg font-bold mb-1">{act.title}</h3>
                              <p className="text-sm text-slate-500">{act.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                        <h3 className="text-xl font-bold text-emerald-900 mb-4">Ready to share your hack?</h3>
                        <div className="flex justify-center gap-4">
                          <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                            <Instagram className="w-5 h-5 text-pink-500" /> Instagram
                          </button>
                          <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                            <MessageCircle className="w-5 h-5 text-emerald-500" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
