import { useState } from 'preact/hooks';
import { filterState } from '../signals.js';
import { formatTimeFriendly } from '../utils.js';

function TimeRangeSlider({ minSignal, maxSignal, label }) {
  const minVal = minSignal.value;
  const maxVal = maxSignal.value;
  const [activeInput, setActiveInput] = useState('min');

  const handleMinInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val >= maxVal) {
      minSignal.value = maxVal - 30;
    } else {
      minSignal.value = val;
    }
  };

  const handleMaxInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val <= minVal) {
      maxSignal.value = minVal + 30;
    } else {
      maxSignal.value = val;
    }
  };

  const updateActiveByCoord = (clientX, rect) => {
    const x = clientX - rect.left;
    const pct = x / rect.width;
    const val = pct * 1440;
    const distMin = Math.abs(val - minVal);
    const distMax = Math.abs(val - maxVal);
    setActiveInput(distMin < distMax ? 'min' : 'max');
  };

  const handleMouseMove = (e) => {
    updateActiveByCoord(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      updateActiveByCoord(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
    }
  };

  const minPercent = (minVal / 1440) * 100;
  const maxPercent = (maxVal / 1440) * 100;

  return (
    <div className="dual-slider-container">
      <div className="slider-label-row">
        <span><strong>{label}:</strong></span>
        <span>{formatTimeFriendly(minVal)} – {formatTimeFriendly(maxVal)}</span>
      </div>
      <div 
        className="range-slider-wrapper"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
      >
        <div className="slider-track" />
        <div 
          className="slider-track-highlight" 
          style={{ 
            left: `${minPercent}%`, 
            right: `${100 - maxPercent}%` 
          }} 
        />
        <input 
          type="range" 
          min="0" max="1440" step="30" 
          value={minVal} 
          onInput={handleMinInput} 
          className="range-input min-range"
          style={{ zIndex: activeInput === 'min' ? 5 : 4 }}
        />
        <input 
          type="range" 
          min="0" max="1440" step="30" 
          value={maxVal} 
          onInput={handleMaxInput} 
          className="range-input max-range"
          style={{ zIndex: activeInput === 'max' ? 5 : 4 }}
        />
      </div>
    </div>
  );
}



export function SmartFilters() {
  const handlePreset = (p) => {
    if (p === 'same') filterState.hotelNights.value = 0;
    else if (p === 'plus1') filterState.hotelNights.value = 1;
    else if (p === 'plus2') filterState.hotelNights.value = 2;
    else filterState.hotelNights.value = null;
  };

  return (
    <section id="filter-section">
      <h2>⚡ Smart Filters</h2>
      
      <div className="filter-grid">
        <div className="filter-group">
          <p><strong>Layover Duration</strong></p>
          <div className="preset-btns">
            <button 
              onClick={() => handlePreset('same')} 
              className={`preset-btn ${filterState.hotelNights.value === 0 ? 'active-preset' : ''}`}
            >Same Day (No Hotel)</button>
            <button 
              onClick={() => handlePreset('plus1')} 
              className={`preset-btn ${filterState.hotelNights.value === 1 ? 'active-preset' : ''}`}
            >One Night Hotel</button>
            <button 
              onClick={() => handlePreset('plus2')} 
              className={`preset-btn ${filterState.hotelNights.value === 2 ? 'active-preset' : ''}`}
            >Two+ Nights Hotel</button>
            <button 
              onClick={() => handlePreset('all')} 
              className={`preset-btn ${filterState.hotelNights.value === null ? 'active-preset' : ''}`}
            >Show All</button>
          </div>
          <small className="small-muted">Filters by calendar nights</small>
          <br />
          <label>Min Hours: 
            <input 
              type="number" 
              value={filterState.minHours.value} 
              onInput={e => filterState.minHours.value = parseFloat(e.target.value) || 0} 
              className="filter-input-small" 
            />
          </label>
          &nbsp;
          <label>Max Hours: 
            <input 
              type="number" 
              value={filterState.maxHours.value} 
              onInput={e => filterState.maxHours.value = parseFloat(e.target.value) || 0} 
              className="filter-input-small" 
            />
          </label>
        </div>

        <div className="filter-group">
          <p><strong>Budget & Type</strong></p>
          <label>Max Total Price: £<span>{filterState.maxPrice.value === Infinity ? 'Any' : filterState.maxPrice.value}</span>
            <input 
              type="range" 
              min="0" max="500" step="10" 
              value={filterState.maxPrice.value === Infinity ? 500 : filterState.maxPrice.value} 
              onInput={e => {
                const val = parseInt(e.target.value);
                filterState.maxPrice.value = val >= 500 ? Infinity : val;
              }} 
            />
          </label>
        </div>

        <div className="filter-group">
          <p><strong>Flight Times</strong></p>
          
          <TimeRangeSlider 
            minSignal={filterState.depAfter} 
            maxSignal={filterState.depBefore} 
            label="Departure Time" 
          />
          <small className="small-muted" style={{ marginTop: '2px' }}>Departure of first flight leg</small>
          
          <br />
          <TimeRangeSlider 
            minSignal={filterState.arrAfter} 
            maxSignal={filterState.arrBefore} 
            label="Arrival Time" 
          />
          <small className="small-muted" style={{ marginTop: '2px' }}>Arrival at final destination</small>
          
          <br />
          <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
            <input 
              type="checkbox" 
              checked={filterState.adjustTimesToMatch.value} 
              onChange={e => filterState.adjustTimesToMatch.value = e.target.checked} 
            />
            <span style={{ fontSize: '0.85em', fontWeight: '600', color: '#333' }}>Search all times to find matches (may increase price)</span>
          </label>
        </div>


        <div className="filter-group">
          <p><strong>Sort & Cities</strong></p>
          <label>Sort By:
            <select 
              value={filterState.sortBy.value} 
              onChange={e => filterState.sortBy.value = e.target.value}
            >
              <option value="price-asc">Price: Lowest First</option>
              <option value="price-desc">Price: Highest First</option>
              <option value="duration-desc">Duration: Longest Layover</option>
              <option value="duration-asc">Duration: Shortest Layover</option>
              <option value="best-layover">Best Layover (Value per Hour)</option>
              <option value="hub-asc">City: A-Z</option>
            </select>
          </label>
          <br /><br />
          <label>Exclude Cities: 
            <input 
              type="text" 
              placeholder="e.g. Dublin, Paris" 
              onInput={e => filterState.excludeHubs.value = e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)} 
            />
          </label>
        </div>
      </div>
    </section>
  );
}
