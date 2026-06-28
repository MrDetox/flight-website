/* ============================================================
   STAYOVER — Application JavaScript
   Handles: Screen navigation, Canvas animations, Swipe logic,
            Drag-and-drop itinerary, Loading sequence
============================================================ */

'use strict';

// ── Global State ──────────────────────────────────────────────
let partyCount = 1;
let hackerOpen = false;
let currentRoute = 'barcelona';
let swipeIndex = 0;
let likedCards = [];
let dragSrcEl = null;

// ── Stage Navigation ─────────────────────────────────────────
function goToStage(stageId) {
  // 1. Manage Header State
  const header = document.getElementById('app-search-header');
  // Full-screen stages that should hide the persistent header
  const isFullScreen = ['stage-tinder', 'booking-overlay'].includes(stageId);
  
  if (header) {
    if (isFullScreen) {
      header.style.opacity = '0';
      header.style.pointerEvents = 'none';
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.opacity = '1';
      header.style.pointerEvents = 'all';
      header.style.transform = 'translateY(0)';
      
      // Update header "mode" (e.g. results mode might have a compact header)
      header.classList.toggle('header-compact', stageId === 'stage-results' || stageId === 'stage-loading');

      // Toggle "New Search" button
      const newSearchBtn = document.getElementById('header-new-search');
      if (newSearchBtn) {
        newSearchBtn.style.display = (stageId === 'stage-results') ? 'inline-block' : 'none';
      }
    }
  }

  // 2. Manage Workspace Stages
  document.querySelectorAll('.stage').forEach(s => {
    s.classList.remove('active');
  });
  
  const target = document.getElementById(stageId);
  if (target) {
    target.classList.add('active');
    // Scroll workspace to top
    const workspace = document.getElementById('app-workspace');
    if (workspace) workspace.scrollTop = 0;
  }

  // 3. Init Stage-specific Logic
  if (stageId === 'stage-home') initHomeGlobe();
  if (stageId === 'stage-loading') initLoadingGlobe();
  if (stageId === 'stage-results') initResultsMap();
}

// Global alias for legacy calls if any
const goToScreen = goToStage;

// ── SCREEN 1: HOME ────────────────────────────────────────────
function toggleHacker() {
  hackerOpen = !hackerOpen;
  const section = document.getElementById('hacker-section');
  const chevron = document.getElementById('hacker-chevron');
  section.classList.toggle('open', hackerOpen);
  chevron.classList.toggle('open', hackerOpen);
}

function changeParty(delta) {
  partyCount = Math.max(1, Math.min(9, partyCount + delta));
  const el = document.getElementById('party-count');
  el.textContent = partyCount === 1
    ? '1 Adult'
    : `${partyCount} Adults`;
}

function startSearch(isSurprise = false) {
  goToStage('stage-loading');
  runLoadingSequence();
}

// ── HOME CANVAS GLOBE ─────────────────────────────────────────
function initHomeGlobe() {
  const canvas = document.getElementById('globe-canvas-home');
  if (!canvas) return;
  drawStarGlobe(canvas, 0.5);
}

function drawStarGlobe(canvas, speed = 1) {
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || window.innerWidth;
  canvas.height = canvas.offsetHeight || window.innerHeight;

  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.2,
    o: Math.random(),
    speed: Math.random() * 0.01 + 0.005,
  }));

  // Arc connections between cities (London, Barcelona, Sofia, Amsterdam, Rome)
  const cityPositions = [
    { x: 0.25, y: 0.38, label: 'Leeds', color: '#22d3ee' },
    { x: 0.38, y: 0.52, label: 'London', color: '#a78bfa' },
    { x: 0.52, y: 0.28, label: 'Barcelona', color: '#fbbf24' },
    { x: 0.67, y: 0.43, label: 'Sofia', color: '#4ade80' },
    { x: 0.44, y: 0.35, label: 'Amsterdam', color: '#60a5fa' },
    { x: 0.50, y: 0.46, label: 'Rome', color: '#fb923c' },
  ];

  const connections = [
    [0, 1], [1, 2], [2, 3], [1, 4], [4, 2], [1, 5], [5, 3]
  ];

  let frame = 0;
  let animId;

  function draw() {
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    stars.forEach(s => {
      s.o += s.speed * (Math.random() > 0.5 ? 1 : -1);
      s.o = Math.max(0.1, Math.min(1, s.o));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.fill();
    });

    const t = frame * 0.012 * speed;

    // Draw arcs
    connections.forEach(([aIdx, bIdx], i) => {
      const a = cityPositions[aIdx];
      const b = cityPositions[bIdx];
      const x1 = a.x * canvas.width;
      const y1 = a.y * canvas.height;
      const x2 = b.x * canvas.width;
      const y2 = b.y * canvas.height;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.35;

      // Static arc
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.strokeStyle = `rgba(139,92,246,0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animated travelling dot
      const phase = (t + i * 0.3) % 1;
      const bx = quadBezierPoint(x1, mx, x2, phase);
      const by = quadBezierPoint(y1, my, y2, phase);

      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = cityPositions[bIdx].color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = cityPositions[bIdx].color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw city dots
    cityPositions.forEach(city => {
      const cx = city.x * canvas.width;
      const cy = city.y * canvas.height;

      // Glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      grd.addColorStop(0, city.color + '55');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = city.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = city.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    frame++;
    animId = requestAnimationFrame(draw);
  }

  if (canvas._animId) cancelAnimationFrame(canvas._animId);
  draw();
  canvas._animId = animId;
}

function quadBezierPoint(p0, p1, p2, t) {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

// ── SCREEN 2: LOADING ─────────────────────────────────────────
const loadingMessages = [
  'Scraping train times from Leeds...',
  'Checking flights to 40+ European hubs...',
  'Connecting flights to Sofia...',
  'Calculating the true cost of tapas in Barcelona...',
];

function runLoadingSequence() {
  let step = 0;
  const statusEl = document.getElementById('loading-status');
  const dots = [0, 1, 2, 3].map(i => document.getElementById(`ldot${i}`));
  const lines = [[0, 1], [1, 2], [2, 3]].map(([a, b]) => document.getElementById(`lline${a}${b}`));

  function advance() {
    if (step < loadingMessages.length) {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.textContent = loadingMessages[step];
        statusEl.style.opacity = '1';
      }, 200);

      // Update dots
      dots.forEach((d, i) => {
        d.classList.remove('active', 'done');
        if (i < step) d.classList.add('done');
        if (i === step) d.classList.add('active');
      });
      lines.forEach((l, i) => {
        if (l) l.classList.toggle('done', i < step);
      });

      step++;
      if (step < loadingMessages.length) {
        setTimeout(advance, 2000);
      } else {
        setTimeout(() => {
          dots.forEach(d => { d.classList.remove('active'); d.classList.add('done'); });
          lines.forEach(l => { if (l) l.classList.add('done'); });
          setTimeout(() => goToStage('stage-results'), 600);
        }, 2000);
      }
    }
  }

  advance();
}

function initLoadingGlobe() {
  const canvas = document.getElementById('globe-canvas-loading');
  if (!canvas) return;
  canvas.width = 380;
  canvas.height = 380;
  drawLoadingGlobe(canvas);
}

function drawLoadingGlobe(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 160;
  let frame = 0;
  let rot = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Globe base
    const grd = ctx.createRadialGradient(cx - 30, cy - 30, 20, cx, cy, r);
    grd.addColorStop(0, '#1a1040');
    grd.addColorStop(0.5, '#0d0f1c');
    grd.addColorStop(1, '#050710');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Atmosphere glow
    const atmGrd = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 20);
    atmGrd.addColorStop(0, 'rgba(139,92,246,0.3)');
    atmGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.fillStyle = atmGrd;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Latitude lines
    const latLines = [-60, -30, 0, 30, 60];
    latLines.forEach(lat => {
      const y = cy + (lat / 90) * r;
      const halfW = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      ctx.beginPath();
      ctx.ellipse(cx, y, halfW, halfW * 0.15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.2)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Longitude lines (rotating)
    const numLon = 8;
    for (let i = 0; i < numLon; i++) {
      const angle = (i / numLon) * Math.PI + rot;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(Math.cos(angle)) * r, r, angle, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // City dots
    const cities = [
      { lat: 53.8, lon: -1.5, color: '#22d3ee', label: 'LBA' }, // Leeds
      { lat: 41.4, lon: 2.2, color: '#fbbf24', label: 'BCN' },   // Barcelona
      { lat: 42.7, lon: 23.3, color: '#4ade80', label: 'SOF' },  // Sofia
    ];

    cities.forEach(city => {
      const lonRad = (city.lon * Math.PI / 180) + rot;
      const latRad = city.lat * Math.PI / 180;
      const x3d = Math.cos(latRad) * Math.sin(lonRad);
      const y3d = -Math.sin(latRad);
      const z3d = Math.cos(latRad) * Math.cos(lonRad);

      if (z3d > -0.1) { // visible hemisphere
        const px = cx + x3d * r;
        const py = cy + y3d * r;
        const size = (z3d + 1) * 4;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = city.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = city.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Animated arc
    const arcProgress = (frame % 120) / 120;
    const startLon = -1.5 * Math.PI / 180 + rot;
    const endLon = 23.3 * Math.PI / 180 + rot;
    const midLon = 2.2 * Math.PI / 180 + rot;
    const startLat = 53.8 * Math.PI / 180;
    const endLat = 42.7 * Math.PI / 180;

    const arcPx = cx + Math.cos(startLat) * Math.sin(startLon + (midLon - startLon) * arcProgress) * r;
    const arcPy = cy - Math.sin(startLat + (endLat - startLat) * arcProgress) * r - 20 * Math.sin(arcProgress * Math.PI);

    ctx.beginPath();
    ctx.arc(arcPx, arcPy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fbbf24';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Specular highlight
    const specGrd = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx - r * 0.3, cy - r * 0.3, r * 0.6);
    specGrd.addColorStop(0, 'rgba(255,255,255,0.07)');
    specGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = specGrd;
    ctx.fill();

    rot += 0.005;
    frame++;
    canvas._animId = requestAnimationFrame(draw);
  }

  if (canvas._animId) cancelAnimationFrame(canvas._animId);
  draw();
}

// ── SCREEN 3: RESULTS MAP ─────────────────────────────────────
const mapRoutes = {
  barcelona: {
    cities: [
      { x: 0.15, y: 0.25, label: 'Leeds', type: 'origin', color: '#22d3ee' },
      { x: 0.35, y: 0.35, label: 'Manchester', type: 'hub', color: '#a78bfa' },
      { x: 0.55, y: 0.55, label: 'Barcelona', type: 'layover', color: '#fbbf24' },
      { x: 0.80, y: 0.40, label: 'Sofia', type: 'destination', color: '#4ade80' },
    ],
    connections: [[0, 1], [1, 2], [2, 3]],
  },
  rome: {
    cities: [
      { x: 0.15, y: 0.25, label: 'Leeds', type: 'origin', color: '#22d3ee' },
      { x: 0.35, y: 0.40, label: 'London', type: 'hub', color: '#a78bfa' },
      { x: 0.52, y: 0.65, label: 'Rome', type: 'layover', color: '#fbbf24' },
      { x: 0.80, y: 0.40, label: 'Sofia', type: 'destination', color: '#4ade80' },
    ],
    connections: [[0, 1], [1, 2], [2, 3]],
  },
  amsterdam: {
    cities: [
      { x: 0.15, y: 0.25, label: 'Leeds', type: 'origin', color: '#22d3ee' },
      { x: 0.22, y: 0.32, label: 'Hull', type: 'hub', color: '#a78bfa' },
      { x: 0.40, y: 0.20, label: 'Amsterdam', type: 'layover', color: '#fbbf24' },
      { x: 0.80, y: 0.40, label: 'Sofia', type: 'destination', color: '#4ade80' },
    ],
    connections: [[0, 1], [1, 2], [2, 3]],
  },
};

let activeMapRoute = null;
let mapAnimId = null;

function initResultsMap() {
  const canvas = document.getElementById('results-map-canvas');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  drawResultsMap(canvas, null);
}

function drawResultsMap(canvas, highlightRoute) {
  if (mapAnimId) cancelAnimationFrame(mapAnimId);
  const ctx = canvas.getContext('2d');
  let frame = 0;

  function draw() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    bgGrd.addColorStop(0, '#0d0f1c');
    bgGrd.addColorStop(1, '#07080f');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (stylized map)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw all muted routes
    Object.entries(mapRoutes).forEach(([key, route]) => {
      const isActive = key === highlightRoute;
      drawMapRoute(ctx, canvas, route, isActive, frame);
    });

    // Draw city labels for active route
    const activeData = highlightRoute ? mapRoutes[highlightRoute] : mapRoutes.barcelona;
    activeData.cities.forEach(city => {
      const x = city.x * canvas.width;
      const y = city.y * canvas.height;

      ctx.fillStyle = 'rgba(13,15,28,0.85)';
      const label = city.label;
      ctx.font = '600 12px Outfit, sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - 8, y + 14, tw + 16, 24, 6);
      ctx.fill();
      ctx.fillStyle = city.color;
      ctx.fillText(label, x - tw / 2, y + 30);
    });

    frame++;
    mapAnimId = requestAnimationFrame(draw);
  }

  draw();
}

function drawMapRoute(ctx, canvas, route, isActive, frame) {
  const opacity = isActive ? 1 : 0.18;
  const lineWidth = isActive ? 2 : 1;

  route.connections.forEach(([aIdx, bIdx]) => {
    const a = route.cities[aIdx];
    const b = route.cities[bIdx];
    const x1 = a.x * canvas.width;
    const y1 = a.y * canvas.height;
    const x2 = b.x * canvas.width;
    const y2 = b.y * canvas.height;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.3;

    // Draw arc
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, `rgba(34,211,238,${opacity})`);
    g.addColorStop(0.5, `rgba(139,92,246,${opacity})`);
    g.addColorStop(1, `rgba(74,222,128,${opacity})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(isActive ? [] : [4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Travelling dot for active
    if (isActive) {
      const t = (frame * 0.008) % 1;
      const dotX = quadBezierPoint(x1, mx, x2, t);
      const dotY = quadBezierPoint(y1, my, y2, t);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#fbbf24';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  // City dots
  route.cities.forEach(city => {
    const x = city.x * canvas.width;
    const y = city.y * canvas.height;
    const baseR = isActive ? 8 : 5;
    const pulse = isActive ? Math.sin(frame * 0.08) * 2 : 0;
    const r = baseR + pulse;

    if (isActive) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      glow.addColorStop(0, city.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? city.color : `rgba(${isActive ? '255,255,255' : '100,100,100'},${opacity + 0.2})`;
    ctx.shadowBlur = isActive ? 12 : 0;
    ctx.shadowColor = city.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function highlightRoute(routeKey) {
  const canvas = document.getElementById('results-map-canvas');
  if (!canvas) return;
  activeMapRoute = routeKey;
  drawResultsMap(canvas, routeKey);
}

function clearRouteHighlight() {
  const canvas = document.getElementById('results-map-canvas');
  if (!canvas) return;
  activeMapRoute = null;
  drawResultsMap(canvas, null);
}

function setFilter(el, filter) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');

  document.querySelectorAll('.route-card').forEach(card => {
    if (filter === 'all') {
      card.style.display = '';
    } else {
      const filters = card.dataset.filter || '';
      card.style.display = filters.includes(filter) ? '' : 'none';
    }
  });
}

function expandAI(el) { el.classList.add('expanded'); }
function collapseAI(el) { el.classList.remove('expanded'); }

function chooseRoute(route) {
  currentRoute = route;
  document.getElementById('layover-city-name').textContent =
    route === 'barcelona' ? 'Barcelona' :
    route === 'rome' ? 'Rome' : 'Amsterdam';
  goToStage('stage-tinder');
  initTinderStep1();
}

// ── SCREEN 4: TINDER BUILDER ──────────────────────────────────
const activities = [
  {
    name: 'Gothic Quarter Walking Tour',
    desc: 'Weave through medieval alleyways, hidden plazas, and Roman ruins.',
    emoji: '🏛️',
    bg: 'linear-gradient(135deg, #1a0533 0%, #330d66 100%)',
    tags: ['Culture', 'Walking', 'History'],
  },
  {
    name: 'Hidden Speakeasy Bar Crawl',
    desc: 'Find Barcelona\'s best secret cocktail bars, known only to locals.',
    emoji: '🍹',
    bg: 'linear-gradient(135deg, #0d1a33 0%, #1a3366 100%)',
    tags: ['Nightlife', 'Secret', 'Drinks'],
  },
  {
    name: 'Paella Making Class',
    desc: 'Learn to cook authentic paella from a third-generation Catalan chef.',
    emoji: '🥘',
    bg: 'linear-gradient(135deg, #331200 0%, #662600 100%)',
    tags: ['Food', 'Cooking', 'Culture'],
  },
  {
    name: 'Sagrada Família Sunrise',
    desc: 'Beat the crowds with an early ticket to Gaudí\'s unfinished masterpiece.',
    emoji: '⛪',
    bg: 'linear-gradient(135deg, #1a1200 0%, #3d2d00 100%)',
    tags: ['Architecture', 'Morning', 'Iconic'],
  },
  {
    name: 'Barceloneta Beach Day',
    desc: 'Sun, sea, and sangria on Barcelona\'s famous golden stretch of coastline.',
    emoji: '🏖️',
    bg: 'linear-gradient(135deg, #001a33 0%, #003366 100%)',
    tags: ['Beach', 'Relaxation', 'Summer'],
  },
  {
    name: 'Montjuïc Castle & Views',
    desc: 'Take the cable car up for jaw-dropping panoramic views and a 17th-century fortress.',
    emoji: '🏰',
    bg: 'linear-gradient(135deg, #0d330d 0%, #1a6600 100%)',
    tags: ['Views', 'History', 'Active'],
  },
  {
    name: 'Camp Nou Stadium Tour',
    desc: 'Walk in the footsteps of Messi at the world\'s most iconic football ground.',
    emoji: '⚽',
    bg: 'linear-gradient(135deg, #000d33 0%, #000066 100%)',
    tags: ['Football', 'Sports', 'Iconic'],
  },
  {
    name: 'El Born Tapas Trail',
    desc: 'Graze through Barcelona\'s hippest neighbourhood, tapas bar by tapas bar.',
    emoji: '🫒',
    bg: 'linear-gradient(135deg, #33180d 0%, #663300 100%)',
    tags: ['Food', 'Neighbourhood', 'Evening'],
  },
];

function initTinderStep1() {
  swipeIndex = 0;
  likedCards = [];
  updateTinderSteps(1);
}

function goTinderStep(step) {
  document.getElementById('tinder-step1-content').classList.add('hidden');
  document.getElementById('tinder-step2-content').classList.add('hidden');
  document.getElementById('tinder-step3-content').classList.add('hidden');

  if (step === 2) {
    document.getElementById('tinder-step2-content').classList.remove('hidden');
    buildSwipeStack();
  } else if (step === 3) {
    document.getElementById('tinder-step3-content').classList.remove('hidden');
    buildItinerary();
  } else {
    document.getElementById('tinder-step1-content').classList.remove('hidden');
  }
  updateTinderSteps(step);
}

function updateTinderSteps(active) {
  [1, 2, 3].forEach(n => {
    const el = document.getElementById(`tstep-${n}`);
    el.classList.remove('active', 'done');
    if (n === active) el.classList.add('active');
    if (n < active) el.classList.add('done');
  });
}

function buildSwipeStack() {
  const stack = document.getElementById('swipe-stack');
  stack.innerHTML = '';
  swipeIndex = 0;
  updateSwipeUI();

  activities.forEach((act, i) => {
    const card = document.createElement('div');
    card.className = 'swipe-card';
    card.dataset.index = i;

    if (i === swipeIndex) card.classList.add('top');
    else if (i === swipeIndex + 1) card.classList.add('behind-1');
    else if (i === swipeIndex + 2) card.classList.add('behind-2');
    else card.style.display = 'none';

    card.innerHTML = `
      <div class="card-bg" style="background:${act.bg}">
        <div class="card-emoji-bg">${act.emoji}</div>
        <div class="card-gradient"></div>
        <div class="card-info">
          <div class="card-name">${act.name}</div>
          <div class="card-desc">${act.desc}</div>
          <div class="card-tags">
            ${act.tags.map(t => `<span class="card-tag-pill">${t}</span>`).join('')}
          </div>
        </div>
        <div class="like-indicator">LOVE</div>
        <div class="skip-indicator">SKIP</div>
      </div>
    `;

    // Touch/mouse drag
    addSwipeDrag(card);

    stack.appendChild(card);
  });
}

function addSwipeDrag(card) {
  let startX = 0, curX = 0, isDragging = false;

  function onStart(e) {
    isDragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    card.style.transition = 'none';
  }

  function onMove(e) {
    if (!isDragging) return;
    curX = (e.touches ? e.touches[0].clientX : e.clientX);
    const diff = curX - startX;
    const rotate = diff * 0.1;
    card.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;
    const like = card.querySelector('.like-indicator');
    const skip = card.querySelector('.skip-indicator');
    if (diff > 30) { like.style.opacity = Math.min(1, (diff - 30) / 80); skip.style.opacity = 0; }
    else if (diff < -30) { skip.style.opacity = Math.min(1, (-diff - 30) / 80); like.style.opacity = 0; }
    else { like.style.opacity = 0; skip.style.opacity = 0; }
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    const diff = curX - startX;
    card.style.transition = '';
    card.style.transform = '';
    card.querySelector('.like-indicator').style.opacity = 0;
    card.querySelector('.skip-indicator').style.opacity = 0;

    if (Math.abs(diff) > 100) {
      swipeCard(diff > 0 ? 'right' : 'left');
    }
  }

  card.addEventListener('mousedown', onStart);
  card.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);
}

function swipeCard(direction) {
  const stack = document.getElementById('swipe-stack');
  const topCard = stack.querySelector('.swipe-card.top');
  if (!topCard) return;

  const activityIndex = parseInt(topCard.dataset.index);
  const activity = activities[activityIndex];
  const isLike = direction === 'right';

  topCard.classList.add(isLike ? 'swiping-right' : 'swiping-left');

  if (isLike) {
    likedCards.push(activity);
    // 30% chance of "match" for demo
    if (Math.random() < 0.4 || activityIndex === 0) {
      setTimeout(() => showMatch(activity.name), 200);
    }
  }

  swipeIndex++;
  updateSwipeUI();

  setTimeout(() => {
    topCard.remove();
    const cards = stack.querySelectorAll('.swipe-card');
    cards.forEach((c, i) => {
      c.classList.remove('top', 'behind-1', 'behind-2');
      c.style.display = '';
      if (i === 0) c.classList.add('top');
      else if (i === 1) c.classList.add('behind-1');
      else if (i === 2) c.classList.add('behind-2');
      else c.style.display = 'none';
    });

    if (swipeIndex >= activities.length) {
      setTimeout(() => goTinderStep(3), 500);
    }
  }, 400);
}

function updateSwipeUI() {
  const counter = document.getElementById('swipe-counter');
  const progBar = document.getElementById('swipe-prog-bar');
  const current = Math.min(swipeIndex + 1, activities.length);
  counter.textContent = `${current} / ${activities.length}`;
  progBar.style.width = `${(swipeIndex / activities.length) * 100}%`;
}

function showMatch(name) {
  const overlay = document.getElementById('match-overlay');
  document.getElementById('match-activity-name').textContent = name;
  overlay.classList.remove('hidden');
}

function hideMatch() {
  document.getElementById('match-overlay').classList.add('hidden');
}

// ── SCREEN 4 — ITINERARY BUILDER ─────────────────────────────
const fullItinerary = [
  { time: 'Day 1\n10:00', title: 'Check in to hotel', desc: 'Drop bags at your boutique hotel in El Born.', emoji: '🏨' },
  { time: 'Day 1\n11:00', title: 'Sagrada Família', desc: 'Gaudí\'s iconic basilica — book skip-the-line tickets.', emoji: '⛪' },
  { time: 'Day 1\n13:30', title: 'Lunch at La Boqueria', desc: 'Fresh seafood and tapas at the legendary market.', emoji: '🥘' },
  { time: 'Day 1\n15:00', title: 'Barceloneta Beach', desc: 'Sun, sea, and sangria! 🌊', emoji: '🏖️' },
  { time: 'Day 1\n19:00', title: 'Gothic Quarter walk', desc: 'Explore ancient Roman walls and hidden courtyards.', emoji: '🏛️' },
  { time: 'Day 1\n21:30', title: 'El Born tapas dinner', desc: 'Bar hop through Barcelona\'s hippest neighbourhood.', emoji: '🍷' },
  { time: 'Day 2\n10:00', title: 'Montjuïc morning', desc: 'Cable car to the castle for panoramic views.', emoji: '🏰' },
  { time: 'Day 2\n13:00', title: 'Paella on the seafront', desc: 'Traditional Valencian paella with ocean views.', emoji: '🫒' },
  { time: 'Day 2\n18:00', title: 'Head to airport', desc: 'Barcelona El Prat — allow 90 min for check-in.', emoji: '✈️' },
  { time: 'Day 2\n20:30', title: 'Flight to Sofia', desc: '2h flight, arriving 22:30 local time.', emoji: '🌙' },
];

function buildItinerary() {
  const timeline = document.getElementById('itinerary-timeline');
  timeline.innerHTML = '';

  const items = likedCards.length >= 3
    ? fullItinerary
    : fullItinerary;

  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.draggable = true;
    el.dataset.index = i;

    el.innerHTML = `
      <div class="ti-time">${item.time.replace('\n', '<br>')}</div>
      <div class="ti-dot"></div>
      <div class="ti-content">
        <div class="ti-title">${item.emoji} ${item.title}</div>
        <div class="ti-desc">${item.desc}</div>
        <div class="ti-actions">
          <button class="ti-action-btn" onclick="regenerateItem(this, ${i})">🔄 Regenerate</button>
          <button class="ti-action-btn" onclick="removeItem(this)">✕ Remove</button>
        </div>
      </div>
    `;

    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);

    timeline.appendChild(el);
  });
}

function regenerateItem(btn, index) {
  const item = btn.closest('.timeline-item');
  const desc = item.querySelector('.ti-desc');
  const alts = [
    'AI is finding something even better for you...',
    'How about a local secret? 🤫',
    'Exploring alternative options nearby...',
    'Found a hidden gem for this slot! ✨',
  ];
  desc.textContent = alts[Math.floor(Math.random() * alts.length)];
}

function removeItem(btn) {
  btn.closest('.timeline-item').remove();
}

function regenerateAll() {
  buildItinerary();
}

// Drag & Drop
function handleDragStart(e) {
  dragSrcEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}
function handleDrop(e) {
  e.stopPropagation();
  if (dragSrcEl !== this) {
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/html');
  }
  return false;
}
function handleDragEnd() {
  document.querySelectorAll('.timeline-item').forEach(el => el.classList.remove('dragging'));
}

// ── MISC ──────────────────────────────────────────────────────
function copyLink() {
  const link = 'stayover.app/plan/BCN-X7K9M';
  navigator.clipboard.writeText(link).catch(() => {});
  const btn = document.querySelector('.sync-copy-btn');
  btn.textContent = '✓ Copied!';
  btn.style.color = '#4ade80';
  setTimeout(() => { btn.textContent = '📋 Copy'; btn.style.color = ''; }, 2000);
}

function lockIn() {
  document.getElementById('booking-overlay').classList.remove('hidden');
}

function closeBooking() {
  document.getElementById('booking-overlay').classList.add('hidden');
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set default date values
  const today = new Date();
  const inTwoWeeks = new Date(today); inTwoWeeks.setDate(today.getDate() + 14);
  const inThreeWeeks = new Date(today); inThreeWeeks.setDate(today.getDate() + 21);

  const deadline = document.getElementById('inp-deadline');
  const earliest = document.getElementById('inp-earliest');
  if (deadline) deadline.value = inThreeWeeks.toISOString().split('T')[0];
  if (earliest) earliest.value = inTwoWeeks.toISOString().split('T')[0];

  // Set a destination placeholder interaction
  const dest = document.getElementById('inp-destination');
  if (dest) dest.value = 'Sofia';

  initHomeGlobe();
});

// Handle window resize for canvases
window.addEventListener('resize', () => {
  const homeCanvas = document.getElementById('globe-canvas-home');
  if (homeCanvas && document.getElementById('stage-home').classList.contains('active')) {
    initHomeGlobe();
  }
  const mapCanvas = document.getElementById('results-map-canvas');
  if (mapCanvas && document.getElementById('stage-results').classList.contains('active')) {
    initResultsMap();
  }
});
