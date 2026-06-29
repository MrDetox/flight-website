import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Info, MapPin, Star } from 'lucide-react';
import { Activity } from '../types';

interface ItineraryTinderProps {
  activities: Activity[];
  onComplete: (selected: Activity[]) => void;
}

export default function ItineraryTinder({ activities, onComplete }: ItineraryTinderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Activity[]>([]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setSelected([...selected, activities[currentIndex]]);
    }

    if (currentIndex < activities.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete([...selected, direction === 'right' ? activities[currentIndex] : null].filter(Boolean) as Activity[]);
    }
  };

  const currentActivity = activities[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto h-[500px] relative flex flex-col">
      <div className="flex-1 relative">
        <AnimatePresence mode="popLayout">
          {currentActivity && (
            <motion.div
              key={currentActivity.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: selected.includes(currentActivity) ? 200 : -200, 
                opacity: 0, 
                rotate: selected.includes(currentActivity) ? 20 : -20 
              }}
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className="h-2/3 bg-slate-200 relative">
                <img
                  src={`https://picsum.photos/seed/${currentActivity.id}/400/600`}
                  alt={currentActivity.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    {currentActivity.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{currentActivity.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3">{currentActivity.description}</p>
                <div className="mt-auto flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">Top Rated</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Activity {currentIndex + 1} of {activities.length}
        </div>
      </div>
    </div>
  );
}
