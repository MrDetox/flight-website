import React from 'react';
import { motion } from 'motion/react';
import { List, Sparkles, Share2, Instagram, MessageCircle, ArrowRight, Clock, MapPin, Calendar, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Flight } from '../types';

interface FlightCardProps {
  flight: Flight;
  onSelect?: (flight: Flight) => void | Promise<void>;
  showTrueCost?: boolean;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect, showTrueCost }) => {
  const totalCost = flight.price + (showTrueCost && flight.estimatedLayoverCost ? flight.estimatedLayoverCost : 0);
  const savings = flight.directPrice - flight.price;

  const getLayoverBadges = () => {
    const totalHrs = flight.layoverHours || 0;
    const arrivalDay = new Date(flight.segments[0].arrivalDate + 'T00:00:00');
    const departureDay = new Date(flight.segments[1].departureDate + 'T00:00:00');
    const nights = Math.round((departureDay.getTime() - arrivalDay.getTime()) / (1000 * 60 * 60 * 24));

    const badges = [];

    // 1. Stay Type Badge (Indigo for Nights, Purple for Day Trip) - NOW AT TOP
    if (nights > 0) {
      badges.push({
        text: `${nights} NIGHT${nights > 1 ? "S" : ""}`,
        style: "bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-100"
      });
    } else {
      badges.push({
        text: "DAY TRIP",
        style: "bg-purple-50 text-purple-600 border-purple-100 ring-purple-100"
      });
    }

    // 2. Exploration Time Badge (Emerald)
    const exploreHrsTotal = Math.max(0, totalHrs - 4); // 4h airport overhead
    let exploreText = "";
    if (exploreHrsTotal >= 24) {
      const d = Math.floor(exploreHrsTotal / 24);
      const h = Math.floor(exploreHrsTotal % 24);
      exploreText = `${d}D ${h > 0 ? `${h}H ` : ""}TO EXPLORE`;
    } else {
      exploreText = `${Math.floor(exploreHrsTotal)}H TO EXPLORE`;
    }
    
    badges.push({
      text: exploreText,
      style: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-100"
    });

    return badges;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    // Use T00:00:00 to ensure the date is parsed in the local timezone, not UTC
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const badges = getLayoverBadges();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl w-full bg-white px-5 py-6 xl:px-8 xl:py-8 rounded-[2.5rem] border border-slate-100 shadow-xl group overflow-hidden"
    >
      <div className="flex items-center">
        
        {/* Journey Path Area */}
        <div className="flex-1 grid grid-cols-3 items-start pr-6 xl:pr-10 min-w-0">
          
          {/* Node: Origin */}
          <div className="flex flex-col items-start min-w-0 h-full">
            <div className="h-10 flex items-end mb-1 px-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origin</span>
            </div>
            <div className="flex items-center w-full gap-2 mb-3">
               <h3 className="text-base xl:text-lg font-bold text-slate-900 truncate uppercase leading-tight font-display flex-none">{flight.origin}</h3>
               <div className="flex-1 h-px bg-slate-100 mt-1" />
            </div>
            <div className="flex flex-col items-start whitespace-nowrap px-1">
               <span className="text-[10px] font-bold text-slate-400">{formatDate(flight.segments[0].departureDate)}</span>
               <span className="text-sm xl:text-base font-bold text-slate-700">{flight.segments[0].departure}</span>
            </div>
          </div>

          {/* Node: Layover */}
          <div className="flex flex-col items-center min-w-0 h-full">
            <div className="h-10 flex flex-col items-center justify-end mb-1 gap-1">
               {badges.map((badge, idx) => (
                  <span key={idx} className={`text-[8px] xl:text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full ring-1 border shadow-sm ${badge.style}`}>
                     {badge.text}
                  </span>
               ))}
            </div>
            <div className="flex items-center w-full gap-2 mb-3">
               <div className="flex-1 h-px bg-slate-100 mt-1" />
               <h3 className="text-base xl:text-lg font-bold text-slate-900 truncate uppercase leading-tight font-display text-center relative underline decoration-indigo-600/20 underline-offset-8 flex-none px-1">
                  {flight.layoverCity}
               </h3>
               <div className="flex-1 h-px bg-slate-100 mt-1" />
            </div>
            
            <div className="flex gap-4 xl:gap-8 items-start">
               <div className="flex flex-col items-center whitespace-nowrap">
                  <span className="text-[10px] font-bold text-slate-400">{formatDate(flight.segments[0].arrivalDate)}</span>
                  <span className="text-sm xl:text-base font-bold text-slate-700">{flight.segments[0].arrival}</span>
               </div>
               <div className="flex flex-col items-center whitespace-nowrap">
                  <span className="text-[10px] font-bold text-slate-400">{formatDate(flight.segments[1].departureDate)}</span>
                  <span className="text-sm xl:text-base font-bold text-slate-700">{flight.segments[1].departure}</span>
               </div>
            </div>
          </div>

          {/* Node: Destination */}
          <div className="flex flex-col items-end min-w-0 h-full">
            <div className="h-10 flex items-end mb-1 px-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destination</span>
            </div>
            <div className="flex items-center w-full gap-2 mb-3">
               <div className="flex-1 h-px bg-slate-100 mt-1" />
               <h3 className="text-base xl:text-lg font-bold text-slate-900 truncate uppercase leading-tight font-display text-right flex-none">{flight.destination}</h3>
            </div>
            <div className="flex flex-col items-end whitespace-nowrap px-1">
               <span className="text-[10px] font-bold text-slate-400">{formatDate(flight.segments[1].arrivalDate)}</span>
               <span className="text-sm xl:text-base font-bold text-slate-700">{flight.segments[1].arrival}</span>
            </div>
          </div>

        </div>

        {/* Separator & Price */}
        <div className="flex-none flex items-center h-auto min-h-[8rem]">
           <div className="w-px h-20 bg-slate-100 mr-5 xl:mr-8" />
           <div className="flex flex-col items-end">
              <div className="text-2xl xl:text-3xl font-bold text-slate-900 mb-1 tracking-tighter">{flight.currency}{totalCost}</div>
              {savings > 0 && (
                <div className="text-[8px] xl:text-[9px] font-bold text-emerald-500 uppercase mb-3 xl:mb-6">Saved {flight.currency}{savings}</div>
              )}
              <button 
                 onClick={(e) => { e.stopPropagation(); onSelect?.(flight); }}
                 className="flex items-center gap-2 xl:gap-3 px-5 py-3 xl:px-8 xl:py-4 bg-slate-900 hover:bg-black text-white rounded-[1rem] xl:rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-widest font-mono">Book</span>
                <ArrowRight size={16} className="xl:w-[18px] xl:h-[18px]" />
              </button>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

export default FlightCard;
