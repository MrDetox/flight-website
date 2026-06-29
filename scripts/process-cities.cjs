const fs = require('fs');
const path = require('path');

// Configuration
const CSV_PATH = path.join(__dirname, '../data/worldcities.csv');
const OUTPUT_PATH = path.join(__dirname, '../src/data/city-data.json');
const MIN_POPULATION = 50000; // Filter to keep file size reasonable

console.log('--- Processing City Data ---');

try {
    if (!fs.existsSync(CSV_PATH)) {
        throw new Error(`CSV file not found at ${CSV_PATH}`);
    }

    const csvData = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = csvData.split(/\r?\n/);
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const cityIdx = header.indexOf('city_ascii');
    const latIdx = header.indexOf('lat');
    const lngIdx = header.indexOf('lng');
    const countryIdx = header.indexOf('country');
    const popIdx = header.indexOf('population');

    if (cityIdx === -1 || latIdx === -1 || lngIdx === -1) {
        throw new Error('Required columns missing in CSV');
    }

    const cityData = {};

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Simple CSV parser for quoted values
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const matches = lines[i].match(/"[^"]*"|[^,]+/g) || [];
        const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

        if (values.length <= Math.max(cityIdx, latIdx, lngIdx)) continue;

        const name = values[cityIdx];
        const lat = parseFloat(values[latIdx]);
        const lng = parseFloat(values[lngIdx]);
        const country = values[countryIdx] || '';
        const population = parseFloat(values[popIdx]) || 0;

        // Filter: Keep cities with population > MIN_POPULATION or if they are major capitals (population might be empty but we want them)
        // For this use case, we'll keep it simple and filter by population to avoid a massive JSON.
        if (population > MIN_POPULATION || !population) {
            // We'll store as an object for O(1) lookup
            // If duplicate names exist, higher population wins
            if (!cityData[name] || population > (cityData[name].pop || 0)) {
                cityData[name] = {
                    lat,
                    lng,
                    country,
                    pop: population
                };
            }
        }
    }

    // Convert to a format easy for the service
    const finalData = {};
    Object.keys(cityData).forEach(name => {
        finalData[name.toLowerCase()] = {
            lat: cityData[name].lat,
            lng: cityData[name].lng,
            country: cityData[name].country
        };
    });

    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
    console.log(`Successfully processed ${Object.keys(finalData).length} cities.`);
    console.log(`Saved to: ${OUTPUT_PATH}`);

} catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
}
