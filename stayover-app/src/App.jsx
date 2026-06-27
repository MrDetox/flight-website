import React, { useState } from 'react';
import './index.css';
import SearchHero from './components/SearchHero';
import StayoverResults from './components/StayoverResults';

function App() {
  const [view, setView] = useState('home'); // 'home' or 'results'

  const handleSearch = (searchData) => {
    console.log("Search triggers:", searchData);
    setView('results');
  };

  return (
    <div className="app-container">
      {/* Premium Header */}
      <header style={{ padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-gold)' }}></div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Stayover</h2>
        </div>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <span style={{ cursor: 'pointer', fontFamily: 'Inter', opacity: 0.8 }}>Destinations</span>
          <span style={{ cursor: 'pointer', fontFamily: 'Inter', opacity: 0.8 }}>Concierge</span>
          <span style={{ cursor: 'pointer', fontFamily: 'Inter', opacity: 0.8 }}>Log In</span>
        </nav>
      </header>

      {/* Main Content Area */}
      <main>
        {view === 'home' ? (
          <SearchHero onSearch={handleSearch} />
        ) : (
          <StayoverResults onBack={() => setView('home')} />
        )}
      </main>

    </div>
  );
}

export default App;
