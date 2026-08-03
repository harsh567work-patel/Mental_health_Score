/**
 * MindScore — script.js
 * AI Mental Health Predictor — Vanilla JavaScript
 * ─────────────────────────────────────────────────
 * Architecture:
 *   1. Background canvas (particle mesh)
 *   2. Theme management
 *   3. Multi-step form navigation & validation
 *   4. FastAPI prediction request (fetch)
 *   5. Animated loading screen
 *   6. Results dashboard renderer
 *   7. Charts (Chart.js)
 *   8. Scroll reveal
 *   9. Utility helpers
 *
 * ═══════════════════════════════════════════════
 * TO CUSTOMISE THE API ENDPOINT:
 *   Change API_CONFIG.baseURL and/or API_CONFIG.endpoint below.
 *
 * TO ADJUST FIELD NAMES:
 *   Each form <input> / <select> already uses name="" attributes
 *   that match your FastAPI schema exactly. If you rename a field,
 *   update the corresponding name="" in index.html.
 * ═══════════════════════════════════════════════
 */

/* ─── API CONFIG ───────────────────────────────
   ▶  Change these if your backend moves.
─────────────────────────────────────────────── */
const API_CONFIG = {
  baseURL: 'https://mental-health-score-atyu.onrender.com',
  endpoint: '/predict',
  get url() { return this.baseURL + this.endpoint; }
};

/* ─── Loading messages rotated during API call ─ */
const LOADING_MESSAGES = [
  'Analyzing behavior…',
  'Evaluating lifestyle…',
  'Checking emotional indicators…',
  'Running neural network…',
  'Generating AI report…',
  'Preparing prediction…'
];

/* ─── Status thresholds (score out of 100) ───── */
const STATUS_THRESHOLDS = [
  { max: 20, label: 'Critical', cls: 'critical' },
  { max: 40, label: 'High Risk', cls: 'high-risk' },
  { max: 60, label: 'Moderate', cls: 'moderate' },
  { max: 80, label: 'Good', cls: 'good' },
  { max: 101, label: 'Excellent', cls: 'excellent' }
];

const MODEL_SCORE_MIN = 3.6;
const MODEL_SCORE_MAX = 9.4;

function normalizeModelScore(rawScore) {
  const percent = ((rawScore - MODEL_SCORE_MIN) / (MODEL_SCORE_MAX - MODEL_SCORE_MIN)) * 100;
  const normalized = Math.min(100, Math.max(0, Math.round(percent)));
  console.log('[MindScore] normalizeModelScore', { rawScore, normalized, percent });
  return normalized;
}

/* ═══════════════════════════════════════════════
   1. BACKGROUND CANVAS — Particle mesh
═══════════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT = 55;
  const CONNECTION_DIST = 140;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1
      });
    }
  }

  function getAccentColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#63d7ff';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const accent = getAccentColor();

    particles.forEach(p => {
      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Bounce
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.35;
      ctx.fill();

      // Mouse attraction (subtle)
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        p.vx += dx * 0.00008;
        p.vy += dy * 0.00008;
      }
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECTION_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = accent;
          ctx.globalAlpha = (1 - d / CONNECTION_DIST) * 0.15;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });

  resize();
  createParticles();
  draw();
})();

/* ═══════════════════════════════════════════════
   2. THEME MANAGEMENT
═══════════════════════════════════════════════ */
(function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  const html = document.documentElement;

  // Recall saved preference
  const saved = localStorage.getItem('mindscore-theme') || 'dark';
  applyTheme(saved);

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('mindscore-theme', theme);

    // Refresh Chart.js colors after theme switch
    if (window._radarChart) window._radarChart.destroy();
    if (window._barChart) window._barChart.destroy();
  }
})();

/* ═══════════════════════════════════════════════
   3. SMOOTH SCROLL TO FORM
═══════════════════════════════════════════════ */
function scrollToForm() {
  document.getElementById('assessmentForm').scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════
   4. SLIDER — live value & gradient update
═══════════════════════════════════════════════ */
(function initSliders() {
  const sliders = [
    { id: 'studyHours', valId: 'studyHoursVal', suffix: 'h' },
    { id: 'physicalHours', valId: 'physicalVal', suffix: 'h' },
    { id: 'sleepHours', valId: 'sleepVal', suffix: 'h' },
    { id: 'usageHours', valId: 'usageVal', suffix: 'h' }
  ];

  sliders.forEach(({ id, valId, suffix }) => {
    const el = document.getElementById(id);
    const val = document.getElementById(valId);
    if (!el || !val) return;

    function update() {
      const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
      el.style.setProperty('--slider-pct', pct + '%');
      val.textContent = el.value + suffix;
      val.style.transform = 'scale(1.15)';
      setTimeout(() => { val.style.transform = ''; }, 180);
    }

    el.addEventListener('input', update);
    update(); // init
  });
})();

/* ═══════════════════════════════════════════════
   5. DAILY UNLOCKS — number input helpers
═══════════════════════════════════════════════ */
function adjustUnlocks(delta) {
  const el = document.getElementById('dailyUnlocks');
  if (!el) return;
  const val = parseInt(el.value, 10) || 0;
  el.value = Math.max(0, Math.min(300, val + delta));
}

/* ═══════════════════════════════════════════════
   6. MULTI-STEP FORM NAVIGATION
═══════════════════════════════════════════════ */
let currentStep = 1;
const TOTAL_STEPS = 3;

/**
 * Validate a specific step's fields.
 * Returns true if all fields pass, false otherwise.
 */
function validateStep(stepNum) {
  let valid = true;

  if (stepNum === 1) {
    const ageValue = parseInt(document.getElementById('age').value, 10);
    if (isNaN(ageValue) || ageValue < 10 || ageValue > 100) {
      showError('ageErr', 'Enter an age between 10 and 100.');
      markInvalid('field-age');
      valid = false;
    } else {
      clearError('ageErr');
      markValid('field-age');
    }

    // Study hours — always valid (slider)
    clearError('studyHoursErr');
    // Physical hours — always valid (slider)
    clearError('physicalErr');
    // Sleep hours — always valid (slider)
    clearError('sleepErr');
    // Stress level — radio, always has default
    clearError('stressErr');
  }

  if (stepNum === 2) {
    // Avg daily usage — always valid (slider)
    clearError('usageErr');

    // Daily unlocks — validate range
    const unlocks = parseInt(document.getElementById('dailyUnlocks').value, 10);
    if (isNaN(unlocks) || unlocks < 0 || unlocks > 300) {
      showError('unlocksErr', 'Enter a number between 0 and 300.');
      markInvalid('field-unlocks');
      valid = false;
    } else {
      clearError('unlocksErr');
      markValid('field-unlocks');
    }

    // Platform
    const platform = document.getElementById('platform').value;
    if (!platform) {
      showError('platformErr', 'Please select your most used platform.');
      markInvalid('field-platform');
      valid = false;
    } else {
      clearError('platformErr');
      markValid('field-platform');
    }

    // Purpose — radio, default set
    clearError('purposeErr');
  }

  if (stepNum === 3) {
    // Gender — radio, default set
    clearError('genderErr');

    // Academic level
    const academic = document.getElementById('academicLevel').value;
    if (!academic) {
      showError('academicErr', 'Please select your academic level.');
      markInvalid('field-academic');
      valid = false;
    } else {
      clearError('academicErr');
      markValid('field-academic');
    }

    // Country
    const country = document.getElementById('country').value;
    if (!country) {
      showError('countryErr', 'Please select your country or region.');
      markInvalid('field-country');
      valid = false;
    } else {
      clearError('countryErr');
      markValid('field-country');
    }
  }

  return valid;
}

function nextStep(from) {
  if (!validateStep(from)) return;

  const fromEl = document.getElementById('step' + from);
  const toEl = document.getElementById('step' + (from + 1));
  if (!toEl) return;

  fromEl.classList.remove('active');
  toEl.classList.add('active');
  currentStep = from + 1;

  updateProgress(currentStep);
  updateStepIndicators(currentStep);

  // Scroll to form top
  document.getElementById('assessmentForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function prevStep(from) {
  const fromEl = document.getElementById('step' + from);
  const toEl = document.getElementById('step' + (from - 1));
  if (!toEl) return;

  fromEl.classList.remove('active');
  toEl.classList.add('active');
  currentStep = from - 1;

  updateProgress(currentStep);
  updateStepIndicators(currentStep);

  document.getElementById('assessmentForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress(step) {
  const pct = (step / TOTAL_STEPS) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  // Update ARIA
  const container = document.querySelector('.progress-container');
  if (container) container.setAttribute('aria-valuenow', step);
}

function updateStepIndicators(activeStep) {
  document.querySelectorAll('.step-indicator').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.remove('active', 'completed');
    if (s === activeStep) el.classList.add('active');
    if (s < activeStep) el.classList.add('completed');
  });
}

/* Error helpers */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  }
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function markValid(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) { el.classList.add('valid'); el.classList.remove('invalid'); }
}

function markInvalid(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) { el.classList.add('invalid'); el.classList.remove('valid'); }
}

/* ═══════════════════════════════════════════════
   7. FORM SUBMISSION & PREDICTION REQUEST
═══════════════════════════════════════════════ */
document.getElementById('predictForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!validateStep(3)) return;

  // ─── Collect all form data ─────────────────────
  //
  // Field names here MUST match your FastAPI /predict endpoint schema.
  // If your model expects different key names, update them below.
  //
  const payload = {
    /* Numeric fields */
    Age: parseInt(document.getElementById('age').value, 10),
    Study_Hours: parseFloat(document.getElementById('studyHours').value),
    Physical_Activity_Hours: parseFloat(document.getElementById('physicalHours').value),
    Sleep_Hours_Per_Night: parseFloat(document.getElementById('sleepHours').value),
    Avg_Daily_Usage_Hours: parseFloat(document.getElementById('usageHours').value),
    Daily_Unlocks: parseInt(document.getElementById('dailyUnlocks').value, 10),

    /* Categorical fields */
    Stress_Level: getRadioValue('Stress_Level'),
    Gender: getRadioValue('Gender'),
    Academic_Level: document.getElementById('academicLevel').value,
    Most_Used_Platform: document.getElementById('platform').value,
    Purpose_Of_Use: getRadioValue('Purpose_Of_Use'),
    Grouped_Countries: document.getElementById('country').value
  };

  console.log('[MindScore] Sending payload to', API_CONFIG.url, payload);

  // Show loading screen
  showLoading();

  try {
    /* ─── FastAPI prediction request ─────────────
       ▶  To change the endpoint, edit API_CONFIG at the top.
       ▶  To change the HTTP method, update 'method' below.
    ──────────────────────────────────────────── */
    const response = await fetch(API_CONFIG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Server error ${response.status}: ${errBody}`);
    }

    const result = await response.json();
    console.log('[MindScore] API response:', result);

    // ─── Extract the score from the response ─────
    //
    // Adjust `result.prediction` if your FastAPI returns a different key.
    // Common alternatives: result.score, result.mental_health_score, result[0]
    //
    const rawScore = result.predicted_mental_health_score ?? result.prediction ?? result.score ?? result.mental_health_score ?? result;
    const percent = result.predicted_mental_health_percent ?? null;
    const score = percent !== null ? parseFloat(percent) : normalizeModelScore(parseFloat(rawScore));

    console.log('[MindScore] API response', { result, rawScore, percent, score });

    if (isNaN(score)) throw new Error('Invalid prediction value from API: ' + JSON.stringify(result));

    hideLoading();
    renderResults(score, payload);

  } catch (err) {
    console.error('[MindScore] API Error:', err);
    hideLoading();
    showApiError(err.message);
  }
});

/* Helper: get selected radio value */
function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

/* ═══════════════════════════════════════════════
   8. LOADING SCREEN
═══════════════════════════════════════════════ */
let _loadingTimer = null;
let _loadingProgress = null;
let _msgIndex = 0;

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  const barEl = document.getElementById('loadingBar');

  overlay.classList.remove('hidden');
  _msgIndex = 0;
  barEl.style.width = '0%';

  // Rotate messages
  textEl.textContent = LOADING_MESSAGES[0];
  _loadingTimer = setInterval(() => {
    _msgIndex = (_msgIndex + 1) % LOADING_MESSAGES.length;
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = LOADING_MESSAGES[_msgIndex];
      textEl.style.opacity = '1';
    }, 200);
  }, 900);

  // Progress bar animation
  let progress = 0;
  _loadingProgress = setInterval(() => {
    progress = Math.min(progress + (Math.random() * 8 + 2), 92);
    barEl.style.width = progress + '%';
  }, 200);
}

function hideLoading() {
  clearInterval(_loadingTimer);
  clearInterval(_loadingProgress);

  const barEl = document.getElementById('loadingBar');
  barEl.style.width = '100%';

  setTimeout(() => {
    document.getElementById('loadingOverlay').classList.add('hidden');
  }, 350);
}

function showApiError(msg) {
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  textEl.textContent = '❌ ' + (msg || 'Could not reach API. Is the backend running?');
  setTimeout(() => {
    overlay.classList.add('hidden');
    textEl.textContent = LOADING_MESSAGES[0];
  }, 3500);
}

/* ═══════════════════════════════════════════════
   9. COMPOSITE SCORING — blends ML prediction
      with individual lifestyle sub-scores so the
      overall number can never be 100 when multiple
      lifestyle metrics are in the danger zone.
═══════════════════════════════════════════════ */
function computeLifestyleSubScores(payload) {
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);
  const stress = payload.Stress_Level;

  const stressMap = { Low: 95, Normal: 95, Medium: 70, High: 40, 'Very High': 15 };

  return {
    sleep: Math.min(100, Math.round((sleep / 9) * 100)),
    stress: stressMap[stress] ?? 60,
    activity: Math.min(100, Math.round((activity / 4) * 100)),
    screen: Math.max(0, Math.round(100 - (screen / 18) * 100)),
  };
}

function computeCompositeScore(mlPercent, payload) {
  const subs = computeLifestyleSubScores(payload);
  const lifestyleAvg = (subs.sleep + subs.stress + subs.activity + subs.screen) / 4;

  // 50 % ML model  +  50 % lifestyle sub-scores
  const composite = (mlPercent * 0.50) + (lifestyleAvg * 0.50);
  const final = Math.round(Math.min(100, Math.max(0, composite)));

  console.log('[MindScore] compositeScore', { mlPercent, subs, lifestyleAvg, composite, final });
  return final;
}

/* ═══════════════════════════════════════════════
   10. RESULTS DASHBOARD RENDERER
═══════════════════════════════════════════════ */
function renderResults(rawScore, payload) {
  // rawScore is already a 0–100 percent from the API (or normalizeModelScore).
  // Do NOT re-normalise — the old code called normalizeModelScore() again here,
  // which treated 72 as a 3.6–9.4 raw value and produced ≈100 every time.
  const mlPercent = Math.round(Math.min(100, Math.max(0, rawScore)));

  // Blend ML prediction with lifestyle sub-scores
  const score = computeCompositeScore(mlPercent, payload);

  // Determine status
  const status = STATUS_THRESHOLDS.find(t => score < t.max) || STATUS_THRESHOLDS[STATUS_THRESHOLDS.length - 1];

  // Show results section
  const section = document.getElementById('resultsDashboard');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Animate score counter
  animateCounter('scoreDisplay', score, 1200);

  // Animate gauge
  animateGauge(score, status);

  // Status badge (no emoji)
  const badge = document.getElementById('statusBadge');
  badge.textContent = status.label;
  badge.className = 'status-badge ' + status.cls;

  // Meta cards
  populateMetaCards(payload);

  // Insight cards
  populateInsights(score, payload);

  // Recommendations
  populateRecommendations(score, payload);

  // Charts (defer slightly so DOM is painted)
  setTimeout(() => {
    renderRadarChart(score, payload);
    renderBarChart(score, payload);
  }, 300);

  // Animate horizontal meter + stat bars
  setTimeout(() => {
    animateScoreMeter(score, status);
    animateStatBars(payload);
  }, 100);

  // Staggered reveal for cards
  setTimeout(() => revealCards(), 400);

  // Score color coding
  const scoreEl = document.getElementById('scoreDisplay');
  if (score >= 80) scoreEl.style.color = 'var(--green)';
  else if (score >= 60) scoreEl.style.color = 'var(--accent)';
  else if (score >= 40) scoreEl.style.color = 'var(--yellow)';
  else if (score >= 20) scoreEl.style.color = 'var(--orange)';
  else scoreEl.style.color = 'var(--red)';
}

/* ─── Gauge animation ──────────────────────── */
function animateGauge(score, status) {
  const circle = document.getElementById('gaugeFill');
  const circ = 2 * Math.PI * 80; // r=80
  const target = circ - (score / 100) * circ;

  // Color by status
  const colors = {
    'excellent': 'var(--green)',
    'good': 'var(--accent)',
    'moderate': 'var(--yellow)',
    'high-risk': 'var(--orange)',
    'critical': 'var(--red)'
  };

  circle.style.stroke = colors[status.cls] || 'var(--accent)';
  circle.style.filter = `drop-shadow(0 0 8px ${colors[status.cls] || 'var(--accent)'})`;

  // Animate stroke-dashoffset
  let current = 502;
  const step = (current - target) / 60;
  const anim = setInterval(() => {
    current -= step;
    if (current <= target) {
      current = target;
      clearInterval(anim);
    }
    circle.style.strokeDashoffset = current;
  }, 16);
}

/* ─── Horizontal score meter animation ─────── */
function animateScoreMeter(score, status) {
  const fill = document.getElementById('scoreMeterFill');
  const thumb = document.getElementById('scoreMeterThumb');
  if (!fill || !thumb) return;

  const pct = Math.min(100, Math.max(0, score)) + '%';
  fill.style.width = pct;
  thumb.style.left = pct;

  // Match thumb border color to status
  const colors = {
    'excellent': 'var(--green)',
    'good': 'var(--accent)',
    'moderate': 'var(--yellow)',
    'high-risk': 'var(--orange)',
    'critical': 'var(--red)'
  };
  thumb.style.borderColor = colors[status.cls] || 'var(--accent)';
}

/* ─── Stat bar animations in meta cards ──────── */
function animateStatBars(payload) {
  const subs = computeLifestyleSubScores(payload);

  function setBar(id, pct, hue) {
    const el = document.getElementById(id);
    if (!el) return;
    // Color: green >= 70, yellow >= 45, orange >= 25, red < 25
    let color;
    if (pct >= 70) color = 'var(--green)';
    else if (pct >= 45) color = 'var(--yellow)';
    else if (pct >= 25) color = 'var(--orange)';
    else color = 'var(--red)';

    el.style.background = color;
    el.style.width = pct + '%';
  }

  setBar('statBarSleep', subs.sleep);
  setBar('statBarStress', subs.stress);
  setBar('statBarScreen', subs.screen);
  setBar('statBarActivity', subs.activity);
}

/* ─── Count-up animation ───────────────────── */
function animateCounter(id, target, duration) {
  const el = document.getElementById(id);
  const start = 0;
  const range = target - start;
  const step = duration / range;
  let current = start;

  const timer = setInterval(() => {
    current++;
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, step);
}

/* ─── Meta cards ────────────────────────────── */
function populateMetaCards(payload) {
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);
  const stress = payload.Stress_Level;

  setText('metaSleepVal', sleep < 6 ? 'Low (' + sleep + 'h)' : sleep + 'h / night');

  // Clean text labels without emojis
  setText('metaStressVal', stress);

  setText('metaScreenVal', screen + 'h / day');
  setText('metaActivityVal', activity < 1 ? 'Low (' + activity + 'h)' : activity + 'h / day');
}

/* ─── Insight cards ─────────────────────────── */
function populateInsights(score, payload) {
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const study = parseFloat(payload.Study_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const stress = payload.Stress_Level;
  const purpose = payload.Purpose_Of_Use;

  setText('insightSleepText',
    sleep >= 8 ? 'Great! You\'re getting excellent rest. Consistent sleep supports memory and emotional regulation.' :
      sleep >= 6 ? 'Your sleep is adequate, but aiming for 7–9 hours can significantly improve cognitive performance.' :
        'Your sleep is below the recommended threshold. Prioritise rest — it\'s foundational to mental health.');

  setText('insightStressText',
    stress === 'Normal' ? 'Your stress levels are well-managed. Keep practising healthy coping strategies.' :
      stress === 'Medium' ? 'Moderate stress can be productive, but watch for signs of burnout or anxiety spikes.' :
        stress === 'High' ? 'High stress requires active management. Consider structured breaks and breathing exercises.' :
          'Critical stress levels detected. Please consider speaking with a counsellor or trusted person.');

  setText('insightScreenText',
    screen <= 3 ? 'Healthy screen time! Low digital consumption correlates with better focus and mood.' :
      screen <= 6 ? 'Moderate screen use. Set app limits and take regular digital breaks.' :
        'High screen time may be contributing to disrupted sleep and reduced attention span.');

  setText('insightActivityText',
    activity >= 2 ? 'Excellent — regular physical activity is one of the strongest predictors of good mental health.' :
      activity >= 1 ? 'Some activity detected. Even short daily walks can measurably reduce anxiety.' :
        'Low physical activity is a risk factor. Start with 20 minutes of movement per day.');

  // ── Social / Digital Interaction insight ─────────────────────
  // Use actual data (screen time, unlocks, purpose) instead of
  // generic statements about entertainment.
  const unlocks = parseInt(payload.Daily_Unlocks, 10) || 0;
  let socialMsg;
  if (screen > 6 && unlocks > 80) {
    socialMsg = 'Your screen time (' + screen + 'h) and phone unlocks (' + unlocks + '/day) are both high. ' +
      'Consider setting app timers and dedicating time to offline social interaction.';
  } else if (screen > 6) {
    socialMsg = 'With ' + screen + 'h of daily screen time, it\'s important to balance digital activity ' +
      'with face-to-face connection and outdoor time.';
  } else if (purpose === 'Entertainment' && screen > 3) {
    socialMsg = 'Your primary use is entertainment at ' + screen + 'h/day. Moderate use is fine, but ' +
      'supplementing with in-person social activities can improve wellbeing.';
  } else if (purpose === 'Networking') {
    socialMsg = 'Social networking can build meaningful relationships when used mindfully. ' +
      'Your screen time (' + screen + 'h) is within a healthy range.';
  } else if (purpose === 'News') {
    socialMsg = 'Staying informed is healthy — but limit excessive news consumption to reduce anxiety.';
  } else {
    socialMsg = 'Your digital habits appear balanced. Ensure technology supplements, not replaces, real connection.';
  }
  setText('insightSocialText', socialMsg);

  // ── Overall Wellness insight ─────────────────────────────────
  // Must acknowledge individual risk factors even when the
  // composite score is decent, so the narrative stays consistent.
  const concerns = [];
  if (stress === 'High' || stress === 'Very High') concerns.push('elevated stress');
  if (screen > 6) concerns.push('high screen time (' + screen + 'h)');
  if (activity < 1) concerns.push('low physical activity (' + activity + 'h)');
  if (sleep < 6) concerns.push('insufficient sleep (' + sleep + 'h)');

  let wellnessMsg;
  if (concerns.length === 0 && score >= 80) {
    wellnessMsg = 'Your mental wellness profile is strong. Maintain these habits and check in with yourself regularly.';
  } else if (concerns.length === 0 && score >= 60) {
    wellnessMsg = 'Your wellness is generally positive. A few focused improvements could bring meaningful gains.';
  } else if (concerns.length > 0 && score >= 60) {
    wellnessMsg = 'While your overall score is fair, your report flags ' + concerns.join(', ') +
      '. Addressing these areas will strengthen your mental health profile.';
  } else if (concerns.length > 0 && score >= 40) {
    wellnessMsg = 'Your assessment highlights ' + concerns.join(', ') +
      '. Small, consistent changes in these areas can make a meaningful difference.';
  } else {
    wellnessMsg = 'Your mental wellness score suggests you may benefit from speaking with a mental health professional. ' +
      (concerns.length ? 'Key areas: ' + concerns.join(', ') + '.' : '');
  }
  setText('insightWellnessText', wellnessMsg);
}

/* ─── Recommendations ───────────────────────── */
const ALL_RECOMMENDATIONS = [
  { text: 'Practice meditation or mindfulness daily' },
  { text: 'Exercise for 30 minutes every day' },
  { text: 'Sleep earlier — aim for 8 hours' },
  { text: 'Reduce screen time with app limits' },
  { text: 'Take regular study breaks (Pomodoro technique)' },
  { text: 'Talk with family or a trusted friend' },
  { text: 'Connect with friends in person' },
  { text: 'Spend time outdoors in natural light' },
  { text: 'Drink at least 8 glasses of water daily' },
  { text: 'Organise your daily schedule with a planner' },
  { text: 'Maintain a balanced, nutritious diet' },
  { text: 'Seek professional counselling if needed' },
  { text: 'Study with structured breaks and clear goals' },
  { text: 'Explore a creative hobby to decompress' },
  { text: 'Set a device-free hour before bedtime' }
];

function populateRecommendations(score, payload) {
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);
  const stress = payload.Stress_Level;

  // Score-based selection
  let picks = [];
  if (sleep < 7) picks.push(2);
  if (activity < 1) picks.push(1, 7);
  if (screen > 5) picks.push(3, 14);
  if (stress === 'High' || stress === 'Very High') picks.push(0, 5, 11);
  if (score < 40) picks.push(11);
  if (score < 60) picks.push(4, 9);
  picks.push(6, 10, 12); // always include a few social/general

  // Deduplicate and limit
  const unique = [...new Set(picks)].slice(0, 8);

  const grid = document.getElementById('recoGrid');
  grid.innerHTML = '';

  unique.forEach(idx => {
    const r = ALL_RECOMMENDATIONS[idx];
    const el = document.createElement('div');
    el.className = 'reco-card';
    el.innerHTML = `<span class="reco-bullet"></span><span>${r.text}</span>`;
    grid.appendChild(el);
  });

  // Stagger entrance
  setTimeout(() => {
    grid.querySelectorAll('.reco-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 80);
    });
  }, 600);
}

/* ═══════════════════════════════════════════════
   10. CHARTS (Chart.js)
═══════════════════════════════════════════════ */
function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: style.getPropertyValue('--accent').trim() || '#63d7ff',
    accent2: style.getPropertyValue('--accent-2').trim() || '#a78bfa',
    accent3: style.getPropertyValue('--accent-3').trim() || '#f472b6',
    muted: style.getPropertyValue('--text-muted').trim() || '#7878a0',
    border: style.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.07)',
    primary: style.getPropertyValue('--text-primary').trim() || '#e8e8f0'
  };
}

function renderRadarChart(score, payload) {
  if (window._radarChart) window._radarChart.destroy();
  const c = getChartColors();
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);
  const study = parseFloat(payload.Study_Hours);

  const stressMap = { Normal: 95, Medium: 70, High: 40, 'Very High': 15 };
  const stressScore = stressMap[payload.Stress_Level] ?? 60;

  // Normalised percentages for radar axes
  const sleepScore = Math.min(100, Math.round((sleep / 9) * 100));
  const activityScore = Math.min(100, Math.round((activity / 4) * 100));
  const screenScore = Math.max(0, Math.round(100 - (screen / 18) * 100));
  const studyScore = Math.min(100, Math.round((study / 8) * 100));

  window._radarChart = new Chart(
    document.getElementById('radarChart'),
    {
      type: 'radar',
      data: {
        labels: ['Sleep', 'Stress Control', 'Activity', 'Screen Balance', 'Study Focus', 'Overall'],
        datasets: [{
          label: 'Your Profile',
          data: [sleepScore, stressScore, activityScore, screenScore, studyScore, score],
          backgroundColor: c.accent + '18',
          borderColor: c.accent,
          pointBackgroundColor: c.accent,
          pointBorderColor: '#000',
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1200, easing: 'easeInOutQuart' },
        scales: {
          r: {
            min: 0, max: 100,
            grid: { color: c.border },
            angleLines: { color: c.border },
            ticks: { color: c.muted, backdropColor: 'transparent', stepSize: 25 },
            pointLabels: { color: c.primary, font: { size: 12, weight: '600' } }
          }
        },
        plugins: {
          legend: { labels: { color: c.muted, font: { size: 12 } } }
        }
      }
    }
  );
}

function renderBarChart(score, payload) {
  if (window._barChart) window._barChart.destroy();
  const c = getChartColors();
  const sleep = parseFloat(payload.Sleep_Hours_Per_Night);
  const activity = parseFloat(payload.Physical_Activity_Hours);
  const screen = parseFloat(payload.Avg_Daily_Usage_Hours);

  const sleepPct = Math.min(100, Math.round((sleep / 9) * 100));
  const activityPct = Math.min(100, Math.round((activity / 4) * 100));
  const screenPct = Math.max(0, Math.round(100 - (screen / 18) * 100));

  window._barChart = new Chart(
    document.getElementById('barChart'),
    {
      type: 'bar',
      data: {
        labels: ['MH Score', 'Sleep', 'Activity', 'Screen Balance'],
        datasets: [
          {
            label: 'You',
            data: [score, sleepPct, activityPct, screenPct],
            backgroundColor: [c.accent + 'CC', c.accent2 + 'CC', c.accent3 + 'CC', c.accent + '99'],
            borderColor: [c.accent, c.accent2, c.accent3, c.accent],
            borderWidth: 2,
            borderRadius: 8
          },
          {
            label: 'Ideal',
            data: [85, 89, 75, 80],
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 2,
            borderDash: [4, 4],
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        animation: { duration: 1000, easing: 'easeInOutQuart' },
        scales: {
          x: {
            grid: { color: c.border },
            ticks: { color: c.muted }
          },
          y: {
            min: 0, max: 100,
            grid: { color: c.border },
            ticks: { color: c.muted }
          }
        },
        plugins: {
          legend: { labels: { color: c.muted, font: { size: 12 } } }
        }
      }
    }
  );
}

/* ═══════════════════════════════════════════════
   11. SCROLL REVEAL
═══════════════════════════════════════════════ */
function revealCards() {
  const cards = document.querySelectorAll('.reveal-card');
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add('visible'), i * 100);
  });
}

/* IntersectionObserver for elements outside results */
(function initScrollReveal() {
  if (!window.IntersectionObserver) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-card').forEach(el => io.observe(el));
})();

/* ═══════════════════════════════════════════════
   12. RESET — back to form
═══════════════════════════════════════════════ */
function resetForm() {
  // Hide results
  document.getElementById('resultsDashboard').classList.add('hidden');

  // Reset to step 1
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step1').classList.add('active');
  currentStep = 1;
  updateProgress(1);
  updateStepIndicators(1);

  // Clear all errors & validity classes
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.field-group').forEach(el => {
    el.classList.remove('valid', 'invalid');
  });

  // Reset form fields
  document.getElementById('predictForm').reset();

  // Re-init slider displays
  ['studyHours', 'physicalHours', 'sleepHours', 'usageHours'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input'));
  });

  // Scroll to form
  document.getElementById('assessmentForm').scrollIntoView({ behavior: 'smooth' });

  // Destroy charts
  if (window._radarChart) { window._radarChart.destroy(); window._radarChart = null; }
  if (window._barChart) { window._barChart.destroy(); window._barChart = null; }

  // Reset meter + stat bars
  const meterFill = document.getElementById('scoreMeterFill');
  const meterThumb = document.getElementById('scoreMeterThumb');
  if (meterFill) meterFill.style.width = '0%';
  if (meterThumb) meterThumb.style.left = '0%';
  document.querySelectorAll('.stat-bar-fill').forEach(el => { el.style.width = '0%'; });
}

/* ═══════════════════════════════════════════════
   13. BUTTON RIPPLE EFFECT
═══════════════════════════════════════════════ */
document.querySelectorAll('.btn-primary, .btn-submit').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = this.querySelector('.btn-ripple');
    if (!ripple) return;
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top:  ${e.clientY - rect.top - size / 2}px;
      animation: rippleAnim 0.6s ease-out;
    `;
    ripple.addEventListener('animationend', () => { ripple.style.animation = ''; }, { once: true });
  });
});

/* Inject ripple keyframes */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleAnim {
      from { transform: scale(0); opacity: 0.4; }
      to   { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════
   14. UTILITY HELPERS
═══════════════════════════════════════════════ */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* Keyboard accessibility: ensure radio cards respond to Enter/Space */
document.querySelectorAll('.radio-card, .toggle-card').forEach(card => {
  const input = card.querySelector('input');
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (input) { input.checked = true; input.dispatchEvent(new Event('change')); }
    }
  });
});