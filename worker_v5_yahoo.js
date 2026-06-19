// 📊 实时K线模拟盘 v5 — Yahoo Finance 版
// 每次请求从Yahoo Finance获取实时A股/港股/美股数据
// 无需API key，全球可用

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ===== API路由：获取K线数据 =====
    if (url.pathname === '/api/stock') {
      const code = url.searchParams.get('code') || '000688';
      const klt = url.searchParams.get('klt') || '101';
      
      // 天数映射
      const daysMap = { '101': '1y', '102': '2y', '103': '5y' };
      const range = daysMap[klt] || '1y';
      
      // 股票代码转Yahoo格式
      let cleanCode = code.replace(/[^0-9]/g, '');
      let yahooCode;
      if (cleanCode.startsWith('6') || cleanCode.startsWith('9')) {
        yahooCode = cleanCode + '.SS';
      } else if (cleanCode.startsWith('0') || cleanCode.startsWith('3') || cleanCode.startsWith('2')) {
        yahooCode = cleanCode + '.SZ';
      } else {
        yahooCode = cleanCode + '.SS';
      }
      
      const apiUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
        yahooCode + '?range=' + range + '&interval=1d';
      
      try {
        let resp = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        // 如果第一次失败，换交易所再试
        if (!resp.ok) {
          let altCode;
          if (cleanCode.startsWith('6')) {
            altCode = cleanCode + '.SZ';
          } else {
            altCode = cleanCode + '.SS';
          }
          resp = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/' + altCode + '?range=' + range + '&interval=1d',
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          yahooCode = altCode;
        }
        
        if (!resp.ok) {
          return new Response(JSON.stringify({
            error: '找不到股票 ' + cleanCode + '，请检查代码是否正确（沪市6开头，深市0/3开头）'
          }), {
            headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
          });
        }
        
        const data = await resp.json();
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        if (!quotes || !quotes.close || quotes.close.length < 5) {
          return new Response(JSON.stringify({
            error: '数据太少，换个股票或周期试试'
          }), {
            headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
          });
        }
        
        // Yahoo返回：最新→最旧，翻转成 最旧→最新
        const klines = [];
        for (let i = timestamps.length - 1; i >= 0; i--) {
          if (!quotes.close[i]) continue;
          const d = new Date(timestamps[i] * 1000);
          const dateStr = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
          klines.push(
            dateStr + ',' +
            (quotes.open[i] || quotes.close[i]).toFixed(2) + ',' +
            (quotes.high[i] || quotes.close[i]).toFixed(2) + ',' +
            (quotes.low[i] || quotes.close[i]).toFixed(2) + ',' +
            quotes.close[i].toFixed(2) + ',' +
            Math.round(quotes.volume[i] || 0)
          );
        }
        
        const meta = result.meta;
        return new Response(JSON.stringify({
          code: cleanCode,
          name: meta.symbol || yahooCode,
          klines: klines,
        }), {
          headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
        });
        
      } catch(e) {
        return new Response(JSON.stringify({
          error: '获取数据失败: ' + e.message
        }), {
          headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
        });
      }
    }

    // ===== 首页：返回HTML页面（带完整前端代码） =====
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>📊 实时K线模拟盘</title>
<meta http-equiv="refresh" content="30">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0d1117; color: #e6edf3; padding: 10px; }
.header { text-align: center; padding: 15px 0; border-bottom: 1px solid #30363d; margin-bottom: 15px; }
.header h1 { font-size: 20px; color: #58a6ff; }
.header p { font-size: 12px; color: #8b949e; margin-top: 4px; }
.card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
.card-title { font-size: 13px; color: #8b949e; margin-bottom: 8px; display: flex; justify-content: space-between; }
.row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.row .card { flex: 1; min-width: 80px; margin-bottom: 0; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-up { color: #26a69a; }
.stat-down { color: #ef5350; }
.stat-label { font-size: 11px; color: #8b949e; margin-top: 2px; }
.search-box { display: flex; gap: 8px; margin-bottom: 12px; }
.search-box input { flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #e6edf3; font-size: 16px; outline: none; }
.search-box input:focus { border-color: #58a6ff; }
.search-box button { padding: 10px 20px; border-radius: 8px; border: none; background: #1f6feb; color: #fff; font-size: 14px; cursor: pointer; }
.timeframe-btn { display: inline-block; padding: 6px 14px; margin: 2px; border-radius: 15px; border: 1px solid #30363d; background: #0d1117; color: #c9d1d9; font-size: 12px; cursor: pointer; }
.timeframe-btn.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }
canvas { width: 100%; height: 100%; display: block; }
.chart-box { width: 100%; height: 380px; position: relative; }
.loading { text-align: center; padding: 60px 20px; color: #8b949e; }
.loading .spinner { display: inline-block; width: 32px; height: 32px; border: 3px solid #30363d; border-top-color: #58a6ff; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-msg { background: #2e0f0f; border: 1px solid #ef5350; border-radius: 8px; padding: 12px; color: #ef5350; font-size: 13px; text-align: center; }
.info-text { font-size: 11px; color: #484f58; text-align: center; padding: 10px; }
.tag { display: inline-block; background: #1f3a5f; color: #58a6ff; border-radius: 4px; padding: 2px 6px; font-size: 10px; }
@media (max-width: 480px) { .row .card { min-width: calc(50% - 6px); } }
</style>
</head>
<body>

<div class="header">
  <h1>📊 实时K线模拟盘</h1>
  <p>输入股票代码 · 看实时K线</p>
</div>

<div class="search-box">
  <input type="text" id="stock-input" placeholder="股票代码，如 000688" value="000688">
  <button onclick="searchStock()">🔍 查看</button>
</div>

<div class="card" style="text-align:center">
  <div class="card-title">选择周期</div>
  <div id="timeframe-buttons">
    <button class="timeframe-btn active" onclick="selectTimeframe('101')">日K</button>
    <button class="timeframe-btn" onclick="selectTimeframe('102')">周K</button>
    <button class="timeframe-btn" onclick="selectTimeframe('103')">月K</button>
  </div>
</div>

<div id="main-content">
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <div>正在获取实时数据...</div>
  </div>
</div>

<div id="error-area"></div>

<div class="card" id="info-card" style="display:none">
  <div class="card-title">📖 怎么看K线</div>
  <div style="font-size:12px;color:#c9d1d9;line-height:1.6">
    🟢 绿色阳线 = 收盘价 > 开盘价（涨了）<br>
    🔴 红色阴线 = 收盘价 < 开盘价（跌了）<br>
    <span style="color:#f0b429">— MA5</span> = 5日均线（短期趋势）<br>
    <span style="color:#ff6b6b">— MA20</span> = 20日均线（中期趋势）<br>
    上影线长 = 抛压大 · 下影线长 = 有支撑<br>
    数据来源: Yahoo Finance
  </div>
</div>

<script>
let currentCode = '000688';
let currentKL = '101';
let chartData = null;

function selectTimeframe(kl) {
  currentKL = kl;
  document.querySelectorAll('.timeframe-btn').forEach(function(b) {
    b.classList.toggle('active', b.textContent.includes(kl === '101' ? '日K' : kl === '102' ? '周K' : '月K'));
  });
  searchStock();
}

function searchStock() {
  const input = document.getElementById('stock-input');
  let code = input.value.trim().replace(/[^0-9]/g, '');
  if (!code || code.length < 6) { code = '000688'; }
  currentCode = code;
  input.value = code;
  fetchData();
}

async function fetchData() {
  const main = document.getElementById('main-content');
  const errArea = document.getElementById('error-area');
  errArea.innerHTML = '';
  main.innerHTML = '<div class="loading"><div class="spinner"></div><div>正在获取 <b>' + currentCode + '</b> 的实时数据...</div></div>';

  try {
    const resp = await fetch('/api/stock?code=' + currentCode + '&klt=' + currentKL);
    const data = await resp.json();
    
    if (data.error) {
      main.innerHTML = '<div class="error-msg">' + data.error + '</div>';
      return;
    }
    
    if (!data.klines || data.klines.length < 5) {
      main.innerHTML = '<div class="error-msg">数据太少，换个股票或周期试试</div>';
      return;
    }
    
    chartData = data;
    renderPage(data);
    document.getElementById('info-card').style.display = 'block';
    
  } catch(e) {
    main.innerHTML = '<div class="error-msg">网络错误: ' + e.message + '</div>';
  }
}

function renderPage(d) {
  const klines = d.klines;
  
  // 解析数据
  const dates = [], opens = [], highs = [], lows = [], closes = [], volumes = [];
  for (const k of klines) {
    const parts = k.split(',');
    dates.push(parts[0]);
    opens.push(parseFloat(parts[1]));
    highs.push(parseFloat(parts[2]));
    lows.push(parseFloat(parts[3]));
    closes.push(parseFloat(parts[4]));
    volumes.push(parseInt(parts[5]) || 0);
  }
  
  const n = closes.length;
  
  // 计算MA5和MA20
  const ma5 = [], ma20 = [];
  for (let i = 0; i < n; i++) {
    if (i >= 4) { let s=0; for(let j=i-4;j<=i;j++) s+=closes[j]; ma5.push(s/5); }
    else { ma5.push(closes[i]); }
    if (i >= 19) { let s=0; for(let j=i-19;j<=i;j++) s+=closes[j]; ma20.push(s/20); }
    else { ma20.push(closes[i]); }
  }
  
  // 统计
  const latest = closes[n-1];
  const change = latest - closes[0];
  const changePct = change / closes[0] * 100;
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const avgVol = Math.round(volumes.reduce(function(a,b){return a+b;},0) / n);
  
  // 渲染统计卡片 + 图表容器
  main.innerHTML =
    '<div class="row">' +
      '<div class="card"><div class="stat-value ' + (change>=0?'stat-up':'stat-down') + '">' + latest.toFixed(2) + '</div><div class="stat-label">最新价</div></div>' +
      '<div class="card"><div class="stat-value ' + (change>=0?'stat-up':'stat-down') + '">' + (change>=0?'+':'') + changePct.toFixed(2) + '%</div><div class="stat-label">区间涨跌</div></div>' +
      '<div class="card"><div class="stat-value">' + high.toFixed(2) + '</div><div class="stat-label">最高</div></div>' +
      '<div class="card"><div class="stat-value">' + low.toFixed(2) + '</div><div class="stat-label">最低</div></div>' +
      '<div class="card"><div class="stat-value">' + (avgVol/10000).toFixed(0) + '万</div><div class="stat-label">均量</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-title"><span>K线图</span><span class="tag">' + d.name + ' (' + currentCode + ')</span></div><div class="chart-box"><canvas id="kline-canvas"></canvas></div></div>' +
    '<div class="card"><div class="card-title"><span>收盘价走势</span><span class="tag">' + d.name + '</span></div><div class="chart-box" style="height:200px"><canvas id="line-canvas"></canvas></div></div>';
  
  setTimeout(function() { drawKline(dates, opens, highs, lows, closes, ma5, ma20); }, 50);
  setTimeout(function() { drawLine(dates, closes); }, 50);
}

function drawKline(dates, opens, highs, lows, closes, ma5, ma20) {
  const canvas = document.getElementById('kline-canvas');
  if (!canvas) return;
  const container = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  const n = closes.length;
  const pad = { top: 20, bottom: 20, left: 50, right: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const minP = Math.min.apply(null, lows) * 0.98;
  const maxP = Math.max.apply(null, highs) * 1.02;
  const range = maxP - minP || 1;
  
  function px(i) { return pad.left + (i / (n-1)) * cw; }
  function py(v) { return pad.top + ch - ((v - minP) / range) * ch; }
  
  // 网格
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const y = pad.top + (ch / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((maxP - (range / 5) * i).toFixed(1), pad.left - 4, y + 4);
  }
  
  // 蜡烛图
  const barW = Math.max(2, cw / n * 0.6);
  for (let i = 0; i < n; i++) {
    const x = px(i);
    const isUp = closes[i] >= opens[i];
    ctx.fillStyle = isUp ? '#26a69a' : '#ef5350';
    ctx.strokeStyle = isUp ? '#26a69a' : '#ef5350';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, py(highs[i])); ctx.lineTo(x, py(lows[i])); ctx.stroke();
    const top = py(Math.max(opens[i], closes[i]));
    const bottom = py(Math.min(opens[i], closes[i]));
    const bh = Math.max(1, bottom - top);
    ctx.fillRect(x - barW/2, top, barW, bh);
    ctx.strokeRect(x - barW/2, top, barW, bh);
  }
  
  // MA5
  ctx.strokeStyle = '#f0b429';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    i === 0 ? ctx.moveTo(px(i), py(ma5[i])) : ctx.lineTo(px(i), py(ma5[i]));
  }
  ctx.stroke();
  
  // MA20
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    i === 0 ? ctx.moveTo(px(i), py(ma20[i])) : ctx.lineTo(px(i), py(ma20[i]));
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 日期标签
  ctx.fillStyle = '#8b949e';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  [0, Math.floor(n/3), Math.floor(n*2/3), n-1].forEach(function(i) {
    ctx.fillText(dates[i].substring(5), px(i), h - 2);
  });
}

function drawLine(dates, values) {
  const canvas = document.getElementById('line-canvas');
  if (!canvas) return;
  const container = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  const n = values.length;
  const pad = { top: 10, bottom: 15, left: 10, right: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const minV = Math.min.apply(null, values) * 0.98;
  const maxV = Math.max.apply(null, values) * 1.02;
  const range = maxV - minV || 1;
  
  function px(i) { return pad.left + (i / (n-1)) * cw; }
  function py(v) { return pad.top + ch - ((v - minV) / range) * ch; }
  
  // 填充区域
  ctx.fillStyle = '#1a3a5c';
  ctx.beginPath();
  ctx.moveTo(px(0), py(values[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(px(i), py(values[i]));
  ctx.lineTo(px(n-1), pad.top + ch);
  ctx.lineTo(px(0), pad.top + ch);
  ctx.closePath();
  ctx.fill();
  
  // 走势线
  ctx.strokeStyle = '#58a6ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    i === 0 ? ctx.moveTo(px(i), py(values[i])) : ctx.lineTo(px(i), py(values[i]));
  }
  ctx.stroke();
}

// 启动
window.addEventListener('load', function() {
  document.getElementById('stock-input').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') searchStock();
  });
  fetchData();
});
window.addEventListener('resize', function() {
  if (chartData) renderPage(chartData);
});
</script>
</body>
</html>`),
      headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate'},
    }};
  },
};
