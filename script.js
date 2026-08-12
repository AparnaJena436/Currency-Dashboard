let chartInstance = null;

const currencies = {
  USD: "United States Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  INR: "Indian Rupee",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  SGD: "Singapore Dollar"
};

let ratesCache = {};

window.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');
  const amountInput = document.getElementById('amount');
  const swapBtn = document.getElementById('swapBtn');

  // Populate Dropdowns
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';
  
  Object.keys(currencies).forEach(code => {
    fromSelect.add(new Option(`${code} - ${currencies[code]}`, code));
    toSelect.add(new Option(`${code} - ${currencies[code]}`, code));
  });

  fromSelect.value = 'USD';
  toSelect.value = 'EUR';

  // Event Listeners
  amountInput.addEventListener('input', updateDashboard);
  fromSelect.addEventListener('change', updateDashboard);
  toSelect.addEventListener('change', updateDashboard);
  swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateDashboard();
  });

  updateDashboard();
}

async function updateDashboard() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;

  document.getElementById('baseWatchlistSymbol').textContent = from;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();

    if (data && data.rates) {
      ratesCache = data.rates;

      // Update Conversion
      const rate = ratesCache[to] || 1;
      const total = amount * rate;
      document.getElementById('convertedValue').textContent = `${total.toLocaleString(undefined, {maximumFractionDigits: 2})} ${to}`;
      document.getElementById('rateDetail').textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

      // Update Watchlist
      renderWatchlist(from);

      // Render Chart
      renderChart(from, to, rate);
    }
  } catch (err) {
    document.getElementById('convertedValue').textContent = "Error loading data";
    console.error(err);
  }
}

function renderWatchlist(from) {
  const grid = document.getElementById('watchlistGrid');
  const targets = ['EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'].filter(c => c !== from);
  
  grid.innerHTML = '';
  targets.forEach(symbol => {
    if (ratesCache[symbol]) {
      const item = document.createElement('div');
      item.className = 'watch-item';
      item.innerHTML = `<span class="symbol">${symbol}</span><span class="rate">${ratesCache[symbol].toFixed(4)}</span>`;
      grid.appendChild(item);
    }
  });
}

function renderChart(from, to, currentRate) {
  const canvas = document.getElementById('rateChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const labels = [];
  const points = [];

  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    
    // Simulate trend around live rate
    const variation = (Math.sin(i) * 0.015) * currentRate;
    points.push(+(currentRate + variation).toFixed(4));
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${from} to ${to}`,
        data: points,
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
