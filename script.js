let chartInstance = null;

// DOM Elements
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const convertedValueEl = document.getElementById('convertedValue');
const rateDetailEl = document.getElementById('rateDetail');
const watchlistGridEl = document.getElementById('watchlistGrid');
const baseWatchlistSymbolEl = document.getElementById('baseWatchlistSymbol');

// Initialize Dashboard
async function initDashboard() {
  try {
    const res = await fetch('https://api.frankfurter.app/currencies');
    const currencies = await res.json();
    
    // Populate Currency Selectors
    Object.keys(currencies).forEach(code => {
      const option1 = new Option(`${code} -${currencies[code]}`, code);
      const option2 = new Option(`${code} -${currencies[code]}`, code);
      fromSelect.add(option1);
      toSelect.add(option2);
    });

    fromSelect.value = 'USD';
    toSelect.value = 'EUR';

    // Event Listeners
    amountInput.addEventListener('input', updateAll);
    fromSelect.addEventListener('change', updateAll);
    toSelect.addEventListener('change', updateAll);
    swapBtn.addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      updateAll();
    });

    updateAll();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

function updateAll() {
  const amount = parseFloat(amountInput.value) || 0;
  const from = fromSelect.value;
  const to = toSelect.value;

  baseWatchlistSymbolEl.textContent = from;

  fetchConversion(amount, from, to);
  fetchWatchlist(from);
  fetchHistoricalTrend(from, to);
}

// 1. Fetch Conversion
async function fetchConversion(amount, from, to) {
  if (from === to) {
    convertedValueEl.textContent = `${amount.toFixed(2)}${to}`;
    rateDetailEl.textContent = `1 ${from} = 1.0000${to}`;
    return;
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
    const data = await res.json();
    const result = data.rates[to];
    const rate = (result / amount).toFixed(4);

    convertedValueEl.textContent = `${result.toLocaleString(undefined, {maximumFractionDigits: 2})}${to}`;
    rateDetailEl.textContent = `1 ${from} = ${rate}${to}`;
  } catch (err) {
    convertedValueEl.textContent = 'Error';
  }
}

// 2. Fetch Watchlist
async function fetchWatchlist(from) {
  const targets = ['EUR', 'GBP', 'JPY', 'INR', 'CAD'].filter(c => c !== from);
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${targets.join(',')}`);
    const data = await res.json();

    watchlistGridEl.innerHTML = '';
    Object.entries(data.rates).forEach(([symbol, rate]) => {
      const item = document.createElement('div');
      item.className = 'watch-item';
      item.innerHTML = `<span class="symbol">${symbol}</span><span class="rate">${rate.toFixed(4)}</span>`;
      watchlistGridEl.appendChild(item);
    });
  } catch (err) {
    watchlistGridEl.innerHTML = 'Failed to load rates';
  }
}

// 3. Render 30-Day History Chart
async function fetchHistoricalTrend(from, to) {
  if (from === to) return;

  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const res = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=${from}&to=${to}`);
    const data = await res.json();

    const dates = Object.keys(data.rates).map(d => d.slice(5));
    const rates = Object.keys(data.rates).map(d => data.rates[d][to]);

    renderChart(dates, rates, `${from} to${to}`);
  } catch (err) {
    console.error('Chart error:', err);
  }
}

function renderChart(labels, dataPoints, labelName) {
  const ctx = document.getElementById('rateChart').getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: labelName,
        data: dataPoints,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f3f4f6' } }
      }
    }
  });
}

initDashboard();
