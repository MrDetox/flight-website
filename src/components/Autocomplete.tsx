import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search } from 'lucide-react';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  cities: string[];
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function Autocomplete({
  value,
  onChange,
  placeholder,
  icon,
  cities,
  label,
  required = false,
  className = "relative group",
  inputClassName = "w-full pl-14 pr-6 py-4.5 bg-slate-50/50 rounded-[1.5rem] border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 outline-none text-base font-bold transition-all",
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.length < 2) {
      setFilteredCities([]);
      return;
    }

    const filtered = cities
      .filter(city => city.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 10);
    setFilteredCities(filtered);
  }, [inputValue, cities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredCities[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-emerald-500">
          {label}
        </label>
      )}
      <div className="relative">
        {icon !== null && (icon || <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />)}
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={inputClassName}
          required={required}
        />
      </div>

      <AnimatePresence>
        {isOpen && filteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-2">
              {filteredCities.map((city, index) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${
                    index === activeIndex ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className={`w-4 h-4 ${index === activeIndex ? 'text-emerald-500' : 'text-slate-300'}`} />
                  {city}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
