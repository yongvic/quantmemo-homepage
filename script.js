(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US").replace(/,/g, "\u202f");

  /* ------------------------------------------------------------
     NAV
     ------------------------------------------------------------ */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 10);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    mobileMenu.hidden = open;
  });
  $$("a", mobileMenu).forEach((a) =>
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    })
  );

  /* ------------------------------------------------------------
     REVEAL + COUNTERS
     ------------------------------------------------------------ */
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealer.unobserve(e.target);
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    revealer.observe(el);
  });

  const countUp = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) return (el.textContent = fmt(target) + suffix);
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counter = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countUp(e.target);
        counter.unobserve(e.target);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => counter.observe(el));

  /* ------------------------------------------------------------
     COMMAND PALETTE
     ------------------------------------------------------------ */
  const INDEX = [
    ["Strategy", "Pairs trading", "Cointegration & spreads"],
    ["Strategy", "Time-series momentum", "Trend following"],
    ["Strategy", "Mean reversion", "Ornstein–Uhlenbeck"],
    ["Strategy", "Statistical arbitrage", "Factor-neutral baskets"],
    ["Strategy", "Volatility risk premium", "Short vol, hedged"],
    ["Strategy", "Market making", "Inventory & spread"],
    ["Concept", "Itô's lemma", "Stochastic calculus"],
    ["Concept", "Black–Scholes", "Option pricing"],
    ["Concept", "Kelly criterion", "Position sizing"],
    ["Concept", "Sharpe ratio", "Risk-adjusted return"],
    ["Concept", "Accounting valuation", "Core finance"],
    ["Concept", "Implied volatility smile", "Derivatives"],
    ["Concept", "Kyle's lambda", "Market microstructure"],
    ["Concept", "Purged k-fold CV", "ML in finance"],
    ["Tool", "Option pricer", "Greeks in the browser"],
    ["Tool", "Backtester", "Vectorised, walk-forward"],
    ["Tool", "Position sizer", "Kelly & vol targeting"],
    ["Tool", "Monte Carlo lab", "Simulate anything"],
    ["Firm", "Jane Street", "Probability · Brainteasers"],
    ["Firm", "SIG", "Mental math · Games"],
    ["Firm", "Citadel", "Statistics · Coding"],
    ["Firm", "Akuna", "Market making"],
    ["Firm", "Optiver", "Mental math"],
    ["Firm", "Two Sigma", "ML · Statistics"],
  ];
  const palette = $("#palette");
  const pInput = $("#paletteInput");
  const pList = $("#paletteList");
  let pActive = 0;
  let pItems = [];
  let lastFocus = null;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const highlight = (text, q) => {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  };
  const renderPalette = () => {
    const q = pInput.value.trim();
    pItems = INDEX.filter(([t, n, d]) => !q || (t + " " + n + " " + d).toLowerCase().includes(q.toLowerCase()));
    pActive = Math.min(pActive, Math.max(0, pItems.length - 1));
    if (!pItems.length) {
      pList.innerHTML = `<li class="palette__empty">No match for “${esc(q)}”. Try “kelly” or “Jane Street”.</li>`;
      return;
    }
    let html = "";
    let group = "";
    pItems.forEach(([t, n, d], i) => {
      if (t !== group) {
        group = t;
        html += `<li class="palette__group" role="presentation">${t}s</li>`;
      }
      html += `<li class="palette__item${i === pActive ? " is-active" : ""}" role="option" aria-selected="${i === pActive}" data-i="${i}"><span class="tag">${t}</span><span>${highlight(n, q)}</span><span class="desc">${esc(d)}</span></li>`;
    });
    pList.innerHTML = html;
    const act = $(".is-active", pList);
    if (act) act.scrollIntoView({ block: "nearest" });
  };
  const openPalette = () => {
    lastFocus = document.activeElement;
    palette.hidden = false;
    document.body.style.overflow = "hidden";
    pInput.value = "";
    pActive = 0;
    renderPalette();
    setTimeout(() => pInput.focus(), 10);
  };
  const closePalette = () => {
    palette.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };
  const choose = () => {
    const item = pItems[pActive];
    if (!item) return;
    closePalette();
    const page = { Strategy: "strategies.html", Concept: "concepts.html", Tool: "tools.html", Firm: "interviews.html" }[item[0]];
    location.href = page + "?q=" + encodeURIComponent(item[1]);
  };
  $("#searchTrigger").addEventListener("click", openPalette);
  pInput.addEventListener("input", () => { pActive = 0; renderPalette(); });
  pList.addEventListener("mousemove", (e) => {
    const li = e.target.closest(".palette__item");
    if (li && +li.dataset.i !== pActive) { pActive = +li.dataset.i; renderPalette(); }
  });
  pList.addEventListener("click", (e) => { if (e.target.closest(".palette__item")) choose(); });
  palette.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closePalette(); });
  addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      palette.hidden ? openPalette() : closePalette();
      return;
    }
    if (palette.hidden) return;
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); pActive = (pActive + 1) % Math.max(1, pItems.length); renderPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pActive = (pActive - 1 + pItems.length) % Math.max(1, pItems.length); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(); }
    else if (e.key === "Tab") { e.preventDefault(); pInput.focus(); }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $$(".search-trigger kbd").forEach((k) => (k.textContent = "⌘K"));

  /* ------------------------------------------------------------
     DAILY: issue number + countdown
     ------------------------------------------------------------ */
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const issue = 636 + Math.round((todayUTC - Date.UTC(2026, 8, 28)) / 864e5);
  $("#dailyMeta").textContent = `quant daily · #${issue} · ${new Date(todayUTC).toISOString().slice(0, 10)}`;

  const cd = $("#countdown");
  const pad = (n) => String(n).padStart(2, "0");
  const tickCountdown = () => {
    const d = new Date();
    const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
    let s = Math.max(0, Math.floor((next - d.getTime()) / 1000));
    cd.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  };
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ------------------------------------------------------------
     DAILY QUIZ
     ------------------------------------------------------------ */
  const QUIZ = [
    {
      cat: "Brainteasers", diff: 5,
      title: "Why four weighings handle thirty-nine coins",
      body: `<p>With one fake coin of unknown direction (heavier or lighter) among <i class="m">n</i> coins, a balance and no reference coin, three weighings can handle 12 coins, identifying the fake and its direction.</p>
             <ul><li>How many coins can four weighings handle?</li><li>Derive the general formula for <i class="m">w</i> weighings.</li><li>Describe the first weighing in the four-weighing case and check the branch sizes.</li></ul>`,
      options: ["40", "39", "41", "38"], answer: 1,
      explain: `With <i class="m">w</i> weighings you can handle <b>(3<sup>w</sup> − 3) / 2</b> coins. For <i class="m">w = 4</i> that is (81 − 3)/2 = <b>39</b>. First weighing: 13 vs 13, with 13 left aside.`,
    },
    {
      cat: "Probability", diff: 3,
      title: "What are the middle passenger's chances?",
      body: `<p>100 passengers board a full flight in order. Passenger 1 sits in a uniformly random seat; everyone else takes their own seat if free, otherwise a random free seat.</p><p>What is the probability that passenger 99 gets their own seat?</p>`,
      options: ["1/2", "2/3", "99/100", "1/3"], answer: 1,
      explain: `For passenger <i class="m">k ≥ 2</i>: <b>(n − k + 1)/(n − k + 2)</b>. With <i class="m">n = 100, k = 99</i> you get <b>2/3</b>.`,
    },
    {
      cat: "Coding", diff: 2,
      title: "Expected flips to see two heads in a row",
      body: `<p>You flip a fair coin until you see HH. What is the expected number of flips?</p>`,
      options: ["4", "6", "8", "3"], answer: 1,
      explain: `Set up states: <i class="m">E = ½(1 + E₁) + ½(1 + E)</i>, <i class="m">E₁ = ½·1 + ½(1 + E)</i>, which gives <b>E = 6</b>. For HT it is only 4.`,
    },
    {
      cat: "Market Making", diff: 4,
      title: "How big a daily move breaks even on your theta?",
      body: `<p>Delta-hedged long option, <i class="m">Γ = 0.05</i>, <i class="m">Θ = −0.04</i> per share per day, $100 stock at 20% implied vol. Which daily move breaks even?</p>`,
      options: ["$0.80", "$1.26", "$2.00", "$1.60"], answer: 1,
      explain: `<i class="m">½ Γ ΔS² = |Θ|</i> gives <b>ΔS ≈ $1.26</b>, which is exactly <i class="m">S·σ/√252</i>, the move implied vol priced in.`,
    },
    {
      cat: "Mental Math", diff: 2,
      title: "Estimate 1.015 to the 12th power",
      body: `<p>A fund returns 1.5% a month. What is <i class="m">(1.015)<sup>12</sup></i> to three decimals? Aim: under 20 seconds.</p>`,
      options: ["1.180", "1.196", "1.215", "1.172"], answer: 1,
      explain: `Binomial expansion: <i class="m">1 + 0.18 + 0.01485 + 0.00068 ≈ </i><b>1.196</b>.`,
    },
  ];
  const state = QUIZ.map(() => ({ picked: null }));
  let qi = 0;
  const qEls = {
    index: $("#qIndex"), bars: $$("#qBars i"), cat: $("#qCat"), diff: $("#qDiff"), title: $("#qTitle"),
    body: $("#qBody"), options: $("#qOptions"), explain: $("#qExplain"), back: $("#qBack"), skip: $("#qSkip"), quiz: $("#quiz"),
  };
  const quizMarkup = qEls.quiz.innerHTML;

  const renderQuiz = () => {
    const q = QUIZ[qi];
    const s = state[qi];
    qEls.index.textContent = pad(qi + 1);
    qEls.bars.forEach((b, i) => {
      b.className = "";
      if (i === qi) b.classList.add("is-current");
      else if (state[i].picked !== null) b.classList.add(state[i].picked === QUIZ[i].answer ? "is-right" : "is-done");
    });
    qEls.cat.textContent = q.cat;
    qEls.diff.innerHTML = "<b>●</b>".repeat(q.diff) + "<s>●</s>".repeat(5 - q.diff);
    qEls.diff.setAttribute("aria-label", `Difficulty ${q.diff} of 5`);
    qEls.title.textContent = q.title;
    qEls.body.innerHTML = q.body;
    qEls.options.innerHTML = q.options
      .map((o, i) => `<button class="opt" role="radio" aria-checked="${s.picked === i}" data-i="${i}"><span class="opt__key">${"ABCD"[i]}</span>${o}</button>`)
      .join("");
    if (s.picked !== null) lockOptions(s.picked);
    else qEls.explain.hidden = true;
    qEls.back.disabled = qi === 0;
    qEls.skip.textContent = s.picked !== null ? (qi === QUIZ.length - 1 ? "See my score →" : "Next question →") : "Skip this question →";
  };
  const lockOptions = (picked) => {
    const q = QUIZ[qi];
    $$(".opt", qEls.options).forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("is-right");
      if (i === picked && picked !== q.answer) b.classList.add("is-wrong");
    });
    qEls.explain.innerHTML = (picked === q.answer ? "✦ <b>Correct.</b> " : "<b>Not quite.</b> ") + q.explain;
    qEls.explain.hidden = false;
  };
  const renderDone = () => {
    const score = state.filter((s, i) => s.picked === QUIZ[i].answer).length;
    qEls.quiz.innerHTML = `<div class="quiz__done">
        <span class="chip">quant daily · #${issue}</span>
        <strong style="margin-top:22px">${score}/5</strong>
        <p>${score === 5 ? "A clean sheet. Come back tomorrow to keep your streak." : score >= 3 ? "Solid session. The worked solutions are waiting in the daily edition." : "Every miss is a pattern learned. Read the solutions and try again tomorrow."}</p>
        <button class="btn btn--dark" id="qRestart">Review the set</button>
      </div>`;
    $("#qRestart").addEventListener("click", () => {
      qEls.quiz.innerHTML = quizMarkup;
      Object.assign(qEls, {
        index: $("#qIndex"), bars: $$("#qBars i"), cat: $("#qCat"), diff: $("#qDiff"), title: $("#qTitle"),
        body: $("#qBody"), options: $("#qOptions"), explain: $("#qExplain"), back: $("#qBack"), skip: $("#qSkip"),
      });
      bindQuiz();
      qi = 0;
      renderQuiz();
    });
  };
  const bindQuiz = () => {
    qEls.options.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b || b.disabled) return;
      state[qi].picked = +b.dataset.i;
      renderQuiz();
    });
    qEls.back.addEventListener("click", () => { if (qi > 0) { qi--; renderQuiz(); } });
    qEls.skip.addEventListener("click", () => {
      if (qi < QUIZ.length - 1) { qi++; renderQuiz(); }
      else renderDone();
    });
  };
  bindQuiz();
  renderQuiz();

  /* ------------------------------------------------------------
     ATLAS MAP
     ------------------------------------------------------------ */
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const REGIONS = [
    { name: "Mathematics", x: 130, y: 135, n: 13, topics: ["linear algebra", "calculus", "optimisation", "real analysis", "numerical methods", "ODEs", "PDEs", "fourier analysis", "matrix calculus", "convexity", "series", "complex numbers", "measure theory"] },
    { name: "Probability", x: 305, y: 105, n: 12, topics: ["combinatorics", "conditional probability", "random variables", "expectation", "markov chains", "martingales", "brownian motion", "stochastic calculus", "generating functions", "limit theorems", "order statistics", "random walks"] },
    { name: "Statistics", x: 480, y: 120, n: 11, topics: ["estimation", "hypothesis testing", "bayesian inference", "bootstrap", "regression", "A/B testing", "robust statistics", "multiple testing", "MLE", "shrinkage", "copulas"] },
    { name: "Econometrics", x: 655, y: 95, n: 12, topics: ["time series", "ARIMA", "GARCH", "cointegration", "panel data", "instrumental variables", "state space", "kalman filter", "VAR", "regime switching", "unit roots", "event studies"] },
    { name: "Core Finance", x: 850, y: 140, n: 11, topics: ["accounting valuation", "time value of money", "bonds", "yield curves", "equities", "FX", "commodities", "CAPM", "factor models", "corporate finance", "credit"] },
    { name: "Portfolio", x: 170, y: 320, n: 12, topics: ["mean-variance", "black-litterman", "risk parity", "kelly sizing", "rebalancing", "transaction costs", "covariance shrinkage", "hierarchical risk parity", "benchmarking", "leverage", "turnover", "constraints"] },
    { name: "Risk", x: 355, y: 285, n: 11, topics: ["value at risk", "expected shortfall", "stress testing", "drawdowns", "tail risk", "liquidity risk", "counterparty risk", "risk budgeting", "scenario analysis", "hedging", "extreme value theory"] },
    { name: "Derivatives", x: 545, y: 295, n: 12, topics: ["forwards", "futures", "options", "black-scholes", "binomial trees", "greeks", "exotics", "american options", "interest rate swaps", "caps & floors", "credit default swaps", "put-call parity"] },
    { name: "Volatility", x: 735, y: 300, n: 11, topics: ["implied volatility", "vol smile", "local vol", "stochastic vol", "heston", "variance swaps", "vol surface", "VIX", "realised vol", "dispersion", "SABR"] },
    { name: "Strategies", x: 895, y: 365, n: 11, topics: ["momentum", "mean reversion", "pairs trading", "stat arb", "carry", "value", "trend following", "event driven", "volatility premium", "merger arb", "seasonality"] },
    { name: "Backtesting", x: 170, y: 480, n: 12, topics: ["data hygiene", "look-ahead bias", "survivorship", "walk-forward", "overfitting", "deflated sharpe", "slippage models", "vectorised backtests", "event-driven engines", "performance metrics", "cross-validation", "paper trading"] },
    { name: "Machine Learning", x: 380, y: 470, n: 11, topics: ["linear models", "trees & boosting", "neural nets", "feature engineering", "regularisation", "purged k-fold", "meta-labelling", "NLP for finance", "reinforcement learning", "clustering", "dimensionality reduction"] },
    { name: "Microstructure", x: 600, y: 470, n: 11, topics: ["order books", "bid-ask spread", "market impact", "kyle model", "optimal execution", "almgren-chriss", "VWAP & TWAP", "latency", "tick data", "adverse selection", "inventory models"] },
    { name: "Market Design", x: 810, y: 490, n: 10, topics: ["auctions", "exchanges", "dark pools", "clearing", "circuit breakers", "maker-taker fees", "regulation", "crypto venues", "fragmentation", "tick size"] },
  ];

  const blob = (cx, cy, r) => {
    const n = 9;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.78 + rand() * 0.4);
      pts.push([cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr]);
    }
    let d = "";
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  };

  const islands = [];
  const weights = [];
  REGIONS.forEach((reg, ri) => {
    const placed = [];
    for (let k = 0; k < reg.n; k++) {
      let x, y, r, tries = 0;
      do {
        const a = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * 72;
        x = reg.x + Math.cos(a) * dist * 1.25;
        y = reg.y + Math.sin(a) * dist * 0.85;
        r = 7 + rand() * 8;
        tries++;
      } while (tries < 200 && placed.some((p) => Math.hypot(p.x - x, (p.y - y) * 1.2) < (p.r + r) * 1.35 + 6));
      const isl = { id: islands.length, region: ri, x, y, r, name: reg.topics[k % reg.topics.length], flag: false };
      placed.push(isl);
      islands.push(isl);
      weights.push(r * r);
    }
  });
  const accounting = islands.find((i) => i.name === "accounting valuation");
  const totalW = weights.reduce((a, b) => a + b, 0);
  let assigned = 0;
  islands.forEach((isl, i) => {
    isl.concepts = Math.max(12, Math.round((weights[i] / totalW) * 5170));
    assigned += isl.concepts;
  });
  islands[islands.length - 1].concepts += 5170 - assigned;
  const fixDelta = accounting.concepts - 88;
  accounting.concepts = 88;
  islands.reduce((a, b) => (b !== accounting && b.concepts > a.concepts ? b : a), islands[0]).concepts += fixDelta;
  islands.forEach((isl) => (isl.checkpoints = isl === accounting ? 11 : Math.max(3, Math.round(isl.concepts / 8))));

  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const islandsLayer = $("#islandsLayer");
  const labelsLayer = $("#labelsLayer");
  const routesLayer = $("#routesLayer");
  const islandEls = [];

  islands.forEach((isl) => {
    const g = mk("g", { class: "isl", tabindex: "0", role: "button", "aria-label": `${isl.name}, ${REGIONS[isl.region].name.toLowerCase()}` });
    const d = blob(isl.x, isl.y, isl.r);
    g.append(mk("path", { d, class: "isl__shadow", transform: "translate(0 3)" }), mk("path", { d, class: "isl__body" }));
    const label = mk("text", { x: isl.x, y: isl.y - isl.r - 8, "text-anchor": "middle", class: "isl-label" });
    label.textContent = isl.name;
    islandsLayer.append(g, label);
    islandEls.push({ g, label });
    isl.el = g;
  });
  REGIONS.forEach((reg) => {
    const t = mk("text", { x: reg.x, y: reg.y - 78, "text-anchor": "middle", class: "region-label" });
    t.textContent = reg.name;
    labelsLayer.append(t);
  });

  // Routes
  const ROUTES = {
    scratch: { n: 15, regions: ["Mathematics", "Probability", "Statistics", "Core Finance", "Portfolio"] },
    fresher: { n: 16, regions: ["Mathematics", "Probability", "Statistics", "Derivatives", "Microstructure"] },
    switch: { n: 16, regions: ["Machine Learning", "Statistics", "Econometrics", "Strategies", "Backtesting"] },
    own: { n: 17, regions: ["Core Finance", "Risk", "Portfolio", "Backtesting", "Strategies", "Volatility"] },
    job: { n: 15, regions: ["Econometrics", "Backtesting", "Risk", "Portfolio", "Microstructure"] },
    "adv-micro": { n: 9, regions: ["Microstructure", "Market Design", "Strategies"] },
    "adv-vol": { n: 9, regions: ["Derivatives", "Volatility", "Mathematics"] },
    "adv-ml": { n: 8, regions: ["Statistics", "Machine Learning", "Backtesting"] },
    "adv-port": { n: 8, regions: ["Econometrics", "Risk", "Portfolio"] },
    "adv-design": { n: 8, regions: ["Core Finance", "Market Design", "Microstructure"] },
  };
  const regionIndex = (name) => REGIONS.findIndex((r) => r.name === name);
  const routeData = {};
  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };
  Object.entries(ROUTES).forEach(([key, r]) => {
    const per = Math.ceil(r.n / r.regions.length);
    const chosen = [];
    let cursor = null;
    r.regions.forEach((rn, idx) => {
      const remaining = r.n - chosen.length;
      const take = Math.min(per, remaining - (r.regions.length - idx - 1));
      const pool = islands.filter((i) => i.region === regionIndex(rn));
      for (let k = 0; k < take && pool.length; k++) {
        const ref = cursor || { x: pool[0].x - 200, y: pool[0].y };
        pool.sort((a, b) => Math.hypot(a.x - ref.x, a.y - ref.y) - Math.hypot(b.x - ref.x, b.y - ref.y));
        cursor = pool.shift();
        chosen.push(cursor);
      }
    });
    const d = smoothPath(chosen);
    const glow = mk("path", { d, class: "route-glow" });
    const line = mk("path", { d, class: "route" });
    routesLayer.append(glow, line);
    routeData[key] = { islands: chosen, els: [glow, line] };
  });

  const mapEl = $("#map");
  const showRoutes = (keys) => {
    Object.values(routeData).forEach((r) => r.els.forEach((e) => e.classList.remove("is-on")));
    islands.forEach((i) => i.el.classList.remove("is-on"));
    islandEls.forEach((e) => e.label.classList.remove("is-shown"));
    if (!keys.length) return mapEl.classList.remove("has-route");
    mapEl.classList.add("has-route");
    keys.forEach((k) => {
      const r = routeData[k];
      r.els.forEach((e) => e.classList.add("is-on"));
      r.islands.forEach((i) => i.el.classList.add("is-on"));
      [r.islands[0], r.islands[r.islands.length - 1]].forEach((i) => islandEls[i.id].label.classList.add("is-shown"));
    });
  };
  const ADV = ["adv-micro", "adv-vol", "adv-ml", "adv-port", "adv-design"];
  let pinned = null;
  $$(".roadmap, .subpath").forEach((btn) => {
    const keys = () => (btn.dataset.route === "advanced" ? ADV : [btn.dataset.route]);
    btn.addEventListener("mouseenter", () => showRoutes(keys()));
    btn.addEventListener("focus", () => showRoutes(keys()));
    btn.addEventListener("mouseleave", () => showRoutes(pinned ? pinned.keys : []));
    btn.addEventListener("click", () => {
      $$(".roadmap, .subpath").forEach((b) => b.classList.remove("is-active"));
      if (pinned && pinned.btn === btn) { pinned = null; showRoutes([]); return; }
      pinned = { btn, keys: keys() };
      btn.classList.add("is-active");
      showRoutes(pinned.keys);
    });
  });

  // Island card + flags
  const FLAG_KEY = "qm-flags";
  const saved = new Set(JSON.parse(localStorage.getItem(FLAG_KEY) || "[]"));
  const flagCount = $("#flagCount");
  const drawFlag = (isl) => {
    if (isl.flagEl) isl.flagEl.remove();
    if (!saved.has(isl.id)) return (isl.flagEl = null);
    const g = mk("g", { class: "isl__flag", transform: `translate(${isl.x} ${isl.y})` });
    g.append(
      mk("path", { d: "M0 0V-24", stroke: "#191A23", "stroke-width": "2", "stroke-linecap": "round" }),
      mk("path", { d: "M1 -24h14l-4 5 4 5H1z", fill: "#B9FF66", stroke: "#191A23", "stroke-width": "1.5", "stroke-linejoin": "round" })
    );
    labelsLayer.append(g);
    isl.flagEl = g;
  };
  const updateFlagCount = () => (flagCount.textContent = `${saved.size} flag${saved.size === 1 ? "" : "s"}`);
  islands.forEach(drawFlag);
  updateFlagCount();

  const card = $("#islandCard");
  const icFlag = $("#icFlag");
  let selected = null;
  const selectIsland = (isl) => {
    if (selected) selected.el.classList.remove("is-selected");
    selected = isl;
    isl.el.classList.add("is-selected");
    $("#icRegion").textContent = REGIONS[isl.region].name.toLowerCase();
    $("#icName").textContent = isl.name;
    $("#icStats").textContent = `${isl.concepts} concepts · ${isl.checkpoints} checkpoints`;
    icFlag.textContent = saved.has(isl.id) ? "Remove flag" : "Plant flag";
    card.hidden = false;
  };
  $("#islandClose").addEventListener("click", () => {
    card.hidden = true;
    if (selected) selected.el.classList.remove("is-selected");
    selected = null;
  });
  icFlag.addEventListener("click", () => {
    if (!selected) return;
    saved.has(selected.id) ? saved.delete(selected.id) : saved.add(selected.id);
    localStorage.setItem(FLAG_KEY, JSON.stringify([...saved]));
    drawFlag(selected);
    updateFlagCount();
    icFlag.textContent = saved.has(selected.id) ? "Remove flag" : "Plant flag";
  });

  // Pan / zoom / rotate
  const svg = $("#mapSvg");
  const world = $("#world");
  const view = { x: 0, y: 0, s: 1, r: 0 };
  const applyView = (animate) => {
    world.style.transition = "";
    world.setAttribute("transform", `translate(${view.x} ${view.y}) translate(500 280) rotate(${view.r}) scale(${view.s}) translate(-500 -280)`);
    void animate;
  };
  const toSvg = (dx, dy) => {
    const rect = svg.getBoundingClientRect();
    const k = Math.max(1000 / rect.width, 560 / rect.height);
    return [dx * k, dy * k];
  };
  const zoom = (f) => { view.s = Math.min(3.5, Math.max(0.7, view.s * f)); applyView(true); };

  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    const target = e.target.closest(".isl");
    drag = { x: e.clientX, y: e.clientY, moved: false, target, rotate: !e.shiftKey };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    svg.classList.add("is-dragging");
    if (drag.rotate) view.r += dx * 0.3;
    else {
      const [sx, sy] = toSvg(dx, dy);
      view.x += sx;
      view.y += sy;
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    applyView(false);
  });
  const endDrag = () => {
    if (drag && !drag.moved && drag.target) selectIsland(islands[islandEls.findIndex((i) => i.g === drag.target)]);
    drag = null;
    svg.classList.remove("is-dragging");
  };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", () => { drag = null; svg.classList.remove("is-dragging"); });
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.12 : 0.89);
  }, { passive: false });
  islandsLayer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const g = e.target.closest(".isl");
    if (!g) return;
    e.preventDefault();
    selectIsland(islands[islandEls.findIndex((i) => i.g === g)]);
  });
  $$(".map__controls button").forEach((b) =>
    b.addEventListener("click", () => {
      const a = b.dataset.map;
      if (a === "in") zoom(1.25);
      else if (a === "out") zoom(0.8);
      else if (a === "reset") { Object.assign(view, { x: 0, y: 0, s: 1, r: 0 }); applyView(true); }
      else if (a === "rotl") { view.r -= 15; applyView(true); }
      else if (a === "rotr") { view.r += 15; applyView(true); }
    })
  );
  applyView(false);

  /* ------------------------------------------------------------
     QUESTION BANK
     ------------------------------------------------------------ */
  const qs = $$(".q");
  const stopwatches = new Map();

  const toggleQ = (q, open) => {
    q.classList.toggle("is-open", open);
    $(".q__head", q).setAttribute("aria-expanded", String(open));
    const sw = $("[data-stopwatch]", q);
    if (!sw) return;
    clearInterval(stopwatches.get(q));
    if (open && !q.dataset.solved) {
      const t0 = performance.now();
      stopwatches.set(q, setInterval(() => {
        const s = (performance.now() - t0) / 1000;
        sw.textContent = s.toFixed(1).padStart(4, "0") + " s";
        sw.classList.toggle("is-over", s > +q.dataset.timer);
      }, 100));
    }
  };
  qs.forEach((q) => {
    $(".q__head", q).addEventListener("click", () => toggleQ(q, !q.classList.contains("is-open")));
  });
  toggleQ(qs[0], true);

  const parseAnswer = (raw) => {
    let s = raw.trim().toLowerCase().replace(/[\s,_$\u202f]/g, "").replace(/flips?|prisoners?|perarm/g, "");
    if (!s) return NaN;
    let mult = 1;
    if (s.endsWith("%")) { mult = 0.01; s = s.slice(0, -1); }
    else if (s.endsWith("k")) { mult = 1000; s = s.slice(0, -1); }
    if (s.includes("/")) {
      const [a, b] = s.split("/").map(Number);
      return (a / b) * mult;
    }
    return parseFloat(s.replace(/^~|≈/, "")) * mult;
  };

  qs.forEach((q) => {
    const form = $(".answer", q);
    const input = $("input", form);
    const fb = $(".answer__feedback", q);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = parseAnswer(input.value);
      form.classList.remove("is-wrong");
      if (Number.isNaN(v)) {
        fb.className = "answer__feedback";
        fb.textContent = "Type a number, a fraction like 1/2, or a percentage.";
        return;
      }
      if (Math.abs(v - +q.dataset.answer) <= +q.dataset.tol) {
        q.dataset.solved = "1";
        clearInterval(stopwatches.get(q));
        fb.className = "answer__feedback is-right";
        fb.innerHTML = `<b>✦ Correct.</b> ${q.dataset.solution}`;
      } else {
        void form.offsetWidth;
        form.classList.add("is-wrong");
        fb.className = "answer__feedback";
        fb.textContent = "Not quite. Take another pass, or open the full question for hints.";
      }
    });
  });

  const filters = $$(".filter");
  const applyFilter = (cat) => {
    filters.forEach((f) => {
      const on = f.dataset.filter === cat;
      f.classList.toggle("is-active", on);
      f.setAttribute("aria-selected", String(on));
    });
    let firstVisible = null;
    qs.forEach((q) => {
      const show = cat === "All" || q.dataset.cat === cat;
      q.classList.toggle("is-hidden", !show);
      if (show && !firstVisible) firstVisible = q;
    });
    if (cat !== "All" && firstVisible) toggleQ(firstVisible, true);
  };
  filters.forEach((f) => f.addEventListener("click", () => applyFilter(f.dataset.filter)));
  $$(".topic").forEach((t) =>
    t.addEventListener("click", () => {
      applyFilter(t.dataset.jump);
      $("#bank").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    })
  );

  // Monte Carlo
  const mcOut = $("#mcOut");
  $("#mcRun").addEventListener("click", () => {
    const N = 100000;
    const sim = (target) => {
      let total = 0;
      for (let i = 0; i < N; i++) {
        let prev = "", flips = 0;
        for (;;) {
          const c = Math.random() < 0.5 ? "H" : "T";
          flips++;
          if (prev + c === target) break;
          prev = c;
        }
        total += flips;
      }
      return total / N;
    };
    mcOut.textContent = "running…";
    setTimeout(() => {
      const t0 = performance.now();
      const hh = sim("HH");
      const ht = sim("HT");
      mcOut.textContent = `n = ${fmt(N)} trials   (${Math.round(performance.now() - t0)} ms)\ntarget HH   ->  ${hh.toFixed(3)} flips\ntarget HT   ->  ${ht.toFixed(3)} flips`;
    }, 30);
  });

  /* ------------------------------------------------------------
     LIVE TICKER
     ------------------------------------------------------------ */
  const FEED = [
    ["Coins on a round table", "Jump Trading · Statistics", "12 min ago"],
    ["Cards until the first ace", "Jane Street · Probability", "9 min ago"],
    ["Expected flips to see two heads in a row", "Jane Street · Coding", "just now"],
    ["Estimate 1.015 to the 12th power", "SIG · Mental Math", "1 min ago"],
    ["How big does the A/B test need to be?", "Meta · Statistics", "2 min ago"],
    ["How big a daily move breaks even on your theta?", "Akuna · Market Making", "3 min ago"],
    ["Why four weighings handle thirty-nine coins", "Brainteasers", "5 min ago"],
  ];
  const liveItem = $("#liveItem");
  let fi = 0;
  if (!reduceMotion) {
    setInterval(() => {
      liveItem.classList.remove("is-in");
      liveItem.classList.add("is-out");
      setTimeout(() => {
        fi = (fi + 1) % FEED.length;
        const [t, m, ago] = FEED[fi];
        liveItem.innerHTML = `Someone just solved <b>“${t}”</b><small>${m} · ${ago}</small>`;
        liveItem.classList.remove("is-out");
        liveItem.classList.add("is-in");
      }, 350);
    }, 4200);
  }

  /* ------------------------------------------------------------
     NEWSLETTER
     ------------------------------------------------------------ */
  const nlForm = $("#nlForm");
  const nlMsg = $("#nlMsg");
  nlForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#nlEmail").value.trim();
    nlForm.classList.remove("is-wrong");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      void nlForm.offsetWidth;
      nlForm.classList.add("is-wrong");
      nlMsg.textContent = "That email doesn't look right. Try again?";
      return;
    }
    nlForm.innerHTML = `<p class="chip" style="font-size:16px;padding:14px 20px">✦ You're on the list. The next memo lands at ${esc(email)}.</p>`;
    nlMsg.textContent = "";
  });
})();
