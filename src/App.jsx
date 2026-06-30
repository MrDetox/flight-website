import { SearchForm } from './components/SearchForm.jsx';
import { SmartFilters } from './components/SmartFilters.jsx';
import { ResultsList } from './components/ResultsList.jsx';
import { CacheManagement } from './components/CacheManagement.jsx';

export function App() {
  return (
    <div className="container">
      <header>
        <h1>✈️ Bonus Vacation</h1>
        <p><em>Two vacations for the price of one — we find layover cities worth exploring.</em></p>
      </header>
      <hr />

      <main>
        <SearchForm />
        <hr />
        
        <SmartFilters />
        <hr />

        <ResultsList />
        <hr />

        <CacheManagement />
      </main>

      <hr />
      <footer>
        <small>
          Bonus Vacation Platform · Backend at <code>http://localhost:4000</code> ·
          Search latency is 30–90 s (live Playwright scraping).
        </small>
      </footer>
    </div>
  );
}
