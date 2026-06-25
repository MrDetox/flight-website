// ── Stayover App JS ──

// Set default date values
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 14);
document.getElementById('arriveBy').value = nextWeek.toISOString().split('T')[0];
document.getElementById('earliestDate').value = today.toISOString().split('T')[0];

// ── Nav scroll effect ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        nav.style.background = 'rgba(8,12,24,0.98)';
        nav.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    } else {
        nav.style.background = 'rgba(8,12,24,0.85)';
        nav.style.boxShadow = 'none';
    }
});

// ── Mobile menu toggle ──
document.getElementById('menuToggle').addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'fixed';
    links.style.top = '70px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(8,12,24,0.98)';
    links.style.padding = '24px';
    links.style.gap = '20px';
    links.style.backdropFilter = 'blur(20px)';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
});

// ── Swap button ──
document.getElementById('swapBtn').addEventListener('click', () => {
    const origin = document.getElementById('origin');
    const dest = document.getElementById('destination');
    [origin.value, dest.value] = [dest.value, origin.value];
    document.getElementById('swapBtn').style.transform = 'rotate(360deg)';
    setTimeout(() => { document.getElementById('swapBtn').style.transform = 'rotate(0deg)'; }, 400);
});

// ── Advanced toggle ──
const advancedToggle = document.getElementById('advancedToggle');
const advancedFields = document.getElementById('advancedFields');
advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('open');
    advancedFields.classList.toggle('open');
});

// ── Passenger counter ──
let paxCount = 1;
document.getElementById('paxMinus').addEventListener('click', () => {
    if (paxCount > 1) { paxCount--; document.getElementById('paxCount').textContent = paxCount; }
});
document.getElementById('paxPlus').addEventListener('click', () => {
    if (paxCount < 9) { paxCount++; document.getElementById('paxCount').textContent = paxCount; }
});

// ── Search button ──
document.getElementById('searchBtn').addEventListener('click', () => {
    const btn = document.getElementById('searchBtn');
    const origin = document.getElementById('origin').value.trim();
    const dest = document.getElementById('destination').value.trim();

    if (!origin || !dest) {
        shakeField(origin ? 'destination' : 'origin');
        return;
    }

    btn.innerHTML = '<span style="display:inline-block;animation:spin 0.8s linear infinite">⟳</span> Finding Stayovers…';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = '✓ Results Loaded Below!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Find My Stayover';
            btn.style.background = '';
            btn.disabled = false;
        }, 2500);
    }, 1800);
});

function shakeField(id) {
    const el = document.getElementById(id);
    el.style.borderColor = '#f87171';
    el.style.animation = 'shake 0.4s ease';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1200);
}

// ── Search tabs ──
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// ── Sort chips ──
document.querySelectorAll('.sort-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.sort-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

// ── Route selection ──
const routes = [
    { city: 'Singapore', code: 'SIN', hours: '31', price: '£547', flag: '🇸🇬' },
    { city: 'Dubai', code: 'DXB', hours: '43', price: '£492', flag: '🇦🇪' },
    { city: 'Tokyo', code: 'NRT', hours: '19', price: '£618', flag: '🇯🇵' },
];

function selectRoute(index) {
    // Highlight selected card
    document.querySelectorAll('.result-card').forEach((c, i) => {
        c.style.borderColor = i === index ? 'var(--teal)' : '';
        c.style.boxShadow = i === index ? '0 0 40px rgba(0,212,200,0.2)' : '';
    });

    const r = routes[index];
    document.querySelector('.timeline-header h2').textContent = `${r.hours} Hours in ${r.city} ${r.flag}`;
    document.querySelector('.window-time').textContent = `${parseInt(r.hours) - 5}:00 hrs`;
    document.getElementById('itinerary').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── AI Chat ──
const aiResponses = [
    "Great idea! I've updated your itinerary. The new route saves you 25 minutes and I've linked the best Viator experience for your window. 🎯",
    "Done! I remembered you prefer walkable routes — I've kept everything within a 2km radius of your luggage drop. 🗺️",
    "Updated! Budget estimate for this plan: ~$85 SGD including transport, lunch, and the skip-the-line ticket. Much less than the £389 you saved on the flight. 💚",
    "I've added a 45-minute buffer before your check-in deadline. All affiliate links are updated with your exact window. ✅",
    "Perfect. I've noted that — for all future trips I'll prioritize food experiences over museums. Your profile has been updated. 🍜",
];
let responseIndex = 0;

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    const text = input.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);
    input.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'msg typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        messages.removeChild(typing);
        const aiMsg = document.createElement('div');
        aiMsg.className = 'msg ai';
        aiMsg.textContent = aiResponses[responseIndex % aiResponses.length];
        messages.appendChild(aiMsg);
        responseIndex++;
        messages.scrollTop = messages.scrollHeight;
    }, 1400);
}

document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendChatMessage();
});

// ── Scroll animations ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stagger children
            entry.target.querySelectorAll('.step-card, .affiliate-card, .result-card, .timeline-event').forEach((child, i) => {
                setTimeout(() => child.classList.add('visible'), i * 80);
            });
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// ── Animated stat counter ──
function animateCounter(el, target, prefix = '', suffix = '') {
    let current = 0;
    const duration = 1800;
    const step = target / (duration / 16);
    const isDecimal = target % 1 !== 0;
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
        if (current >= target) clearInterval(timer);
    }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const nums = entry.target.querySelectorAll('.stat-number');
            const data = [
                { el: nums[0], target: 450, prefix: '$', suffix: '' },
                { el: nums[1], target: 85, prefix: '', suffix: '+' },
                { el: nums[2], target: 10, prefix: '', suffix: 'k+' },
                { el: nums[3], target: 2, prefix: '', suffix: '×' },
            ];
            data.forEach(d => d.el && animateCounter(d.el, d.target, d.prefix, d.suffix));
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-inner');
if (statsSection) statsObserver.observe(statsSection.closest('.stats-section'));

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
