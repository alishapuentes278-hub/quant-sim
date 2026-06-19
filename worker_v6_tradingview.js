// 📊 实时K线模拟盘 v6 — TradingView 专业版
// 嵌入TradingView图表，支持：拖拽缩放、均线、RSI、MACD、各种指标
// 数据来自TradingView，全球可用

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '000688';

    // 股票代码转TradingView格式
    let cleanCode = code.replace(/[^0-9]/g, '');
    let tvSymbol;
    if (cleanCode.startsWith('6') || cleanCode.startsWith('9')) tvSymbol = 'SSE:' + cleanCode;
    else tvSymbol = 'SZSE:' + cleanCode;

    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>📊 实时K线 - ${cleanCode}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #131722; color: #d1d4dc; font-family: -apple-system, sans-serif; padding: 10px; }
.header { text-align: center; padding: 12px 0; border-bottom: 1px solid #2a2e39; margin-bottom: 12px; }
.header h1 { font-size: 18px; color: #2962ff; }
.search-box { display: flex; gap: 8px; margin-bottom: 12px; }
.search-box input { flex: 1; padding: 10px 14px; border-radius: 6px; border: 1px solid #2a2e39; background: #1e222d; color: #d1d4dc; font-size: 16px; outline: none; }
.search-box input:focus { border-color: #2962ff; }
.search-box button { padding: 10px 20px; border-radius: 6px; border: none; background: #2962ff; color: #fff; font-size: 14px; cursor: pointer; }
.chart-container { width: 100%; height: calc(100vh - 180px); min-height: 400px; border-radius: 6px; overflow: hidden; }
.tv-widget { width: 100%; height: 100%; }
.quick-stocks { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.quick-btn { padding: 4px 12px; border-radius: 12px; border: 1px solid #2a2e39; background: #1e222d; color: #d1d4dc; font-size: 11px; cursor: pointer; text-decoration: none; }
.quick-btn:hover { background: #2962ff; border-color: #2962ff; }
.footer { text-align: center; padding: 10px 0; color: #434651; font-size: 10px; }
</style>
</head>
<body>

<div class="header">
  <h1>📊 专业K线图</h1>
</div>

<div class="search-box">
  <input type="text" id="stock-input" placeholder="股票代码" value="${cleanCode}" onkeyup="if(event.key==='Enter')searchStock()">
  <button onclick="searchStock()">🔍</button>
</div>

<div class="quick-stocks" id="quickBar"></div>

<div class="chart-container">
  <div class="tv-widget" id="tv-chart"></div>
</div>

<div class="footer">
  数据由TradingView提供 · 可拖拽/缩放/切换周期 · 支持所有技术指标
</div>

<script src="https://s3.tradingview.com/tv.js"></script>
<script>
const QUICK = [
  {n:'科创50',c:'000688'}, {n:'上证指数',c:'000001'},
  {n:'沪深300',c:'000300'}, {n:'创业板',c:'399006'},
  {n:'茅台',c:'600519'}, {n:'宁德时代',c:'300750'},
  {n:'比亚迪',c:'002594'}, {n:'纳指ETF',c:'513100'}
];

let widget = null;

function getTvSymbol(code) {
  code = code.replace(/[^0-9]/g,'');
  if (code.startsWith('6')||code.startsWith('9')) return 'SSE:'+code;
  return 'SZSE:'+code;
}

function renderQuickBar() {
  document.getElementById('quickBar').innerHTML = QUICK.map(s =>
    '<a class="quick-btn" href="?code='+s.c+'">'+s.n+'</a>'
  ).join('');
}

function searchStock() {
  const input = document.getElementById('stock-input');
  const code = input.value.trim().replace(/[^0-9]/g,'') || '000688';
  input.value = code;
  window.location.href = '?code=' + code;
}

function initChart(code) {
  const symbol = getTvSymbol(code);
  if (widget) widget.remove();
  
  widget = new TradingView.widget({
    container: 'tv-chart',
    symbol: symbol,
    interval: 'D',
    timezone: 'Asia/Shanghai',
    theme: 'dark',
    style: '1',
    locale: 'zh_CN',
    toolbar_bg: '#131722',
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    studies: [
      'MASimple@tv-basicstudies',   // 均线
      'RSI@tv-basicstudies',        // RSI
      'MACD@tv-basicstudies',       // MACD
    ],
    height: document.querySelector('.chart-container').clientHeight,
    width: '100%',
    loading_screen: { backgroundColor: '#131722', foregroundColor: '#2962ff' },
    overrides: {
      'paneProperties.background': '#131722',
      'paneProperties.vertGridProperties.color': '#1e222d',
      'paneProperties.horzGridProperties.color': '#1e222d',
    },
  });
}

renderQuickBar();
const params = new URLSearchParams(window.location.search);
const stockCode = params.get('code') || '000688';
document.getElementById('stock-input').value = stockCode;
initChart(stockCode);

// 窗口变化时重置高度
window.addEventListener('resize', function() {
  const container = document.querySelector('.chart-container');
  if (widget) widget.resize(container.clientWidth, container.clientHeight);
});
</script>
</body>
</html>`),
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate' }},
  }},
};
