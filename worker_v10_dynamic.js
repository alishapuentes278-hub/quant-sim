export default { async fetch() { return new Response(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>⏱ 动态模拟盘</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f5f5;font-family:-apple-system,Helvetica Neue,sans-serif;color:#333;padding-bottom:80px}
.top{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px 16px 20px;color:#fff}
.top .sm{font-size:12px;color:#8b9dc3}
.top .big{font-size:36px;font-weight:700;margin:4px 0 2px;letter-spacing:-1px}
.top .big span{font-size:14px;font-weight:400;color:#8b9dc3}
.top .row{display:flex;gap:20px;margin-top:8px}
.top .row div{font-size:13px}
.up{color:#ff4757}.dn{color:#2ed573}
.label{color:#8b9dc3;font-size:11px}
.card{background:#fff;border-radius:12px;margin:12px 16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
.card .tit{font-size:13px;color:#999;margin-bottom:8px;display:flex;justify-content:space-between}
.chart-box{width:100%;height:360px;position:relative;margin-bottom:4px}
canvas{width:100%;height:100%;display:block;border-radius:6px}
.lg{display:flex;gap:14px;padding:4px 0;font-size:11px;color:#999;flex-wrap:wrap;justify-content:center}
.lg i{display:inline-block;width:16px;height:2px;border-radius:2px;vertical-align:middle;margin-right:2px}
.stat{display:flex;gap:8px;flex-wrap:wrap}
.stat-item{flex:1;min-width:70px;text-align:center;padding:8px;background:#f8f9ff;border-radius:8px}
.stat-item .val{font-size:18px;font-weight:700}
.stat-item .lb{font-size:10px;color:#999;margin-top:2px}
.ctrl{display:flex;gap:8px;justify-content:center;padding:8px 0}
.ctrl button{padding:6px 16px;border-radius:20px;border:none;font-size:13px;font-weight:600;cursor:pointer}
.btn-pause{background:#ff4757;color:#fff}
.btn-play{background:#2ed573;color:#fff}
.btn-faster{background:#667eea;color:#fff}
.speed-badge{display:inline-block;background:#667eea20;color:#667eea;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600}
.tr-item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:12px}
.tr-item:last-child{border:none}
.tag-b{background:#fff0f0;color:#ff4757;padding:1px 6px;border-radius:4px;font-size:10px}
.tag-s{background:#f0fff4;color:#2ed573;padding:1px 6px;border-radius:4px;font-size:10px}
.tip{font-size:12px;color:#666;line-height:1.8;padding:8px;background:#f8f9ff;border-radius:8px;margin-top:6px}
#tradeLog{max-height:200px;overflow-y:auto}
#tradeLog::-webkit-scrollbar{width:3px}
#tradeLog::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
.day-counter{font-size:11px;color:#999;text-align:center;padding:4px}
</style></head><body>

<div class="top">
  <div class="sm">⏱ 动态AI模拟盘</div>
  <div class="big" id="totalVal">5,000.00 <span>CNY</span></div>
  <div class="row">
    <div><div class="up" id="retVal">+0.00%</div><div class="label">策略收益</div></div>
    <div><div class="up" id="bhVal">+0.00%</div><div class="label">买入持有</div></div>
    <div><div id="tradeCount">0笔</div><div class="label">交易次数</div></div>
    <div><div id="dayCount">0天</div><div class="label">模拟天数</div></div>
  </div>
</div>

<div class="ctrl">
  <button class="btn-play" id="playBtn" onclick="togglePlay()">⏸ 暂停</button>
  <button class="btn-faster" onclick="changeSpeed()">⚡ 加速</button>
  <button class="btn-faster" onclick="resetSim()">🔄 重置</button>
  <span class="speed-badge" id="speedBadge">1x (1天/秒)</span>
</div>

<div class="card">
  <div class="tit">实时K线 <span>科创50 模拟</span></div>
  <div class="chart-box"><canvas id="kc"></canvas></div>
  <div class="lg">
    <span><i style="background:#f0b429"></i>MA5</span>
    <span><i style="background:#ff6b6b"></i>MA20</span>
    <span style="color:#2ed573">▲买入 B</span>
    <span style="color:#ff4757">▼卖出 S</span>
  </div>
</div>

<div class="card">
  <div class="tit">策略表现</div>
  <div class="stat">
    <div class="stat-item"><div class="val up" id="sRet">+0.00%</div><div class="lb">策略收益</div></div>
    <div class="stat-item"><div class="val up" id="sBh">+0.00%</div><div class="lb">买入持有</div></div>
    <div class="stat-item"><div class="val" id="sWin">0%</div><div class="lb">胜率</div></div>
    <div class="stat-item"><div class="val" id="sTrades">0</div><div class="lb">交易次数</div></div>
  </div>
</div>

<div class="card">
  <div class="tit">交易日志 <span id="logCount">0笔</span></div>
  <div id="tradeLog"></div>
</div>

<div class="card">
  <div class="tit">📖 实时K线教学</div>
  <div class="tip" id="teachTip">
    模拟正在运行中...<br>
    每 <b>1秒</b> = 模拟 <b>1个交易日</b><br>
    现实1天 = 模拟约5个月<br><br>
    🔴 <b>绿柱子</b> = 涨 &nbsp; 🔴 <b>红柱子</b> = 跌<br>
    🟡 <b>MA5</b> 上穿 🔴 <b>MA20</b> = <b>金叉买入</b> ▲<br>
    🟡 <b>MA5</b> 下穿 🔴 <b>MA20</b> = <b>死叉卖出</b> ▼<br><br>
    看！K线正在一根根生成中... 🎬
  </div>
</div>

<script>
// ===== 模拟引擎 =====
var PRICE = 1000;  // 起始价格
var CASH = 5000;   // 起始资金
var POS = 0;       // 持仓数量
var EQUITY = 5000; // 总资产

var prices = [PRICE];
var dates = [];
var ma5 = [];
var ma20 = [];
var trades = [];
var equityHistory = [{day:0,val:5000}];

var simDay = 0;
var running = true;
var speed = 1;  // 1x = 1 day per second
var speedIdx = 0;
var speeds = [1, 2, 5, 10, 50];
var speedNames = ["1x (1天/秒)","2x (2天/秒)","5x (5天/秒)","10x (10天/秒)","50x (50天/秒)"];

var seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function generateNextPrice() {
  var last = prices[prices.length - 1];
  // 模拟市场：随机波动 + 偶尔的趋势
  var trend = Math.sin(simDay / 30) * 3;  // 周期30天的波动
  var noise = (rand() - 0.5) * 12;        // 随机噪声
  var newPrice = Math.max(last * 0.9, last + trend + noise);
  return Math.round(newPrice * 100) / 100;
}

function calcMA(arr, n) {
  if (arr.length < n) return arr[arr.length-1];
  var sum = 0;
  for (var i = arr.length - n; i < arr.length; i++) sum += arr[i];
  return sum / n;
}

function nextDay() {
  simDay++;
  var date = new Date(2025, 5, 18 + simDay);
  var dateStr = date.getFullYear() + '-' + 
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0');
  
  dates.push(dateStr);
  
  // 生成新价格
  var newP = generateNextPrice();
  prices.push(newP);
  
  // 计算均线
  var m5 = calcMA(prices, 5);
  var m20 = calcMA(prices, 20);
  ma5.push(m5);
  ma20.push(m20);
  
  // 金叉死叉策略
  if (prices.length > 21) {
    var prevM5 = ma5[ma5.length - 2];
    var prevM20 = ma20[ma20.length - 2];
    var hold = POS > 0;
    
    // 金叉买入
    if (!hold && prevM5 <= prevM20 && m5 > m20) {
      POS = Math.floor(CASH / newP);
      CASH -= POS * newP;
      trades.push({day:simDay,date:dateStr,type:"买入",price:newP,amount:POS * newP});
    }
    // 死叉卖出
    else if (hold && prevM5 >= prevM20 && m5 < m20) {
      CASH += POS * newP;
      trades.push({day:simDay,date:dateStr,type:"卖出",price:newP,amount:POS * newP});
      POS = 0;
    }
  }
  
  // 计算总资产
  EQUITY = CASH + POS * newP;
  equityHistory.push({day:simDay,val:EQUITY});
  
  // 更新界面
  updateUI();
  drawChart();
}

function updateUI() {
  var initVal = 5000;
  var ret = (EQUITY - initVal) / initVal * 100;
  var bhRet = (prices[prices.length-1] - 1000) / 1000 * 100;
  var winCount = 0;
  for (var i = 0; i < trades.length; i += 2) {
    if (i + 1 < trades.length) {
      var buyP = trades[i].price;
      var sellP = trades[i+1].price;
      if (sellP > buyP) winCount++;
    }
  }
  var winRate = trades.length >= 2 ? (winCount / Math.floor(trades.length/2) * 100).toFixed(0) : 0;
  
  document.getElementById('totalVal').innerHTML = EQUITY.toFixed(2) + ' <span>CNY</span>';
  document.getElementById('retVal').textContent = (ret >= 0 ? '+' : '') + ret.toFixed(2) + '%';
  document.getElementById('retVal').className = ret >= 0 ? 'up' : 'dn';
  document.getElementById('bhVal').textContent = (bhRet >= 0 ? '+' : '') + bhRet.toFixed(2) + '%';
  document.getElementById('bhVal').className = bhRet >= 0 ? 'up' : 'dn';
  document.getElementById('tradeCount').textContent = trades.length + '笔';
  document.getElementById('dayCount').textContent = simDay + '天';
  
  document.getElementById('sRet').textContent = (ret >= 0 ? '+' : '') + ret.toFixed(2) + '%';
  document.getElementById('sRet').className = ret >= 0 ? 'val up' : 'val dn';
  document.getElementById('sBh').textContent = (bhRet >= 0 ? '+' : '') + bhRet.toFixed(2) + '%';
  document.getElementById('sBh').className = bhRet >= 0 ? 'val up' : 'val dn';
  document.getElementById('sWin').textContent = winRate + '%';
  document.getElementById('sTrades').textContent = trades.length;
  document.getElementById('logCount').textContent = trades.length + '笔';
  
  // 交易日志（最新在最上）
  var logHtml = '';
  for (var i = trades.length - 1; i >= 0; i--) {
    var t = trades[i];
    logHtml += '<div class="tr-item"><span><span class="' + (t.type==='买入'?'tag-b':'tag-s') + '">' + t.type + '</span> ' + t.date + '</span><span><b>' + t.price.toFixed(2) + '</b> ' + t.amount.toFixed(2) + '元</span></div>';
  }
  document.getElementById('tradeLog').innerHTML = logHtml;
  
  // 教学提示
  if (trades.length > 0) {
    var last = trades[trades.length-1];
    document.getElementById('teachTip').innerHTML =
      '📊 模拟第 <b>' + simDay + '</b> 天<br>' +
      (last.type === '买入' 
        ? '🟢 刚刚 <b>金叉买入</b>！MA5上穿MA20，策略执行买入<br>买入价: ' + last.price.toFixed(2) + '元'
        : '🔴 刚刚 <b>死叉卖出</b>！MA5下穿MA20，策略执行卖出<br>卖出价: ' + last.price.toFixed(2) + '元') +
      '<br><br>💰 总资产: <b>' + EQUITY.toFixed(2) + '元</b><br>' +
      (EQUITY >= 5000 ? '✅ 赚了 ' + (EQUITY-5000).toFixed(2) + '元' : '❌ 亏了 ' + (5000-EQUITY).toFixed(2) + '元');
  }
}

function drawChart() {
  var ca = document.getElementById('kc');
  if (!ca || prices.length < 2) return;
  var ct = ca.parentElement;
  var dpr = window.devicePixelRatio || 1;
  var w = ct.clientWidth;
  var hgt = ct.clientHeight;
  ca.width = w * dpr;
  ca.height = hgt * dpr;
  ca.style.width = w + 'px';
  ca.style.height = hgt + 'px';
  var cx = ca.getContext('2d');
  cx.scale(dpr, dpr);
  
  var n = prices.length;
  var pad = {top:20,bottom:20,left:50,right:10};
  var cw = w - pad.left - pad.right;
  var ch = hgt - pad.top - pad.bottom;
  
  var mn = 1e9, mx = 0;
  for (var i = 0; i < n; i++) {
    if (prices[i] < mn) mn = prices[i];
    if (prices[i] > mx) mx = prices[i];
  }
  mn *= 0.97; mx *= 1.03;
  var rg = mx - mn || 1;
  
  function px(i) { return pad.left + (i / (n-1)) * cw; }
  function py(v) { return pad.top + ch - ((v - mn) / rg) * ch; }
  
  // 网格
  cx.strokeStyle = '#e8e8e8';
  cx.lineWidth = 0.5;
  for (var i = 0; i < 5; i++) {
    var y = pad.top + (ch/5) * i;
    cx.beginPath(); cx.moveTo(pad.left, y); cx.lineTo(w - pad.right, y); cx.stroke();
    cx.fillStyle = '#999'; cx.font = '9px sans-serif'; cx.textAlign = 'right';
    cx.fillText((mx - (rg/5)*i).toFixed(0), pad.left - 4, y + 4);
  }
  
  // 用close作为高/低模拟K线（因为没有OHLC数据，用随机模拟）
  // 实际这里为了视觉，用价格本身做close，open用前一天的close
  var bw = Math.max(1.5, cw / n * 0.5);
  for (var i = 1; i < n; i++) {
    var x = px(i);
    var open = prices[i-1];
    var close = prices[i];
    var high = Math.max(open, close) * (1 + rand() * 0.015);
    var low = Math.min(open, close) * (1 - rand() * 0.015);
    var isUp = close >= open;
    
    cx.fillStyle = isUp ? '#ff4757' : '#2ed573';
    cx.strokeStyle = isUp ? '#ff4757' : '#2ed573';
    cx.lineWidth = 0.5;
    cx.beginPath(); cx.moveTo(x, py(high)); cx.lineTo(x, py(low)); cx.stroke();
    var tp = py(Math.max(open, close));
    var bt = py(Math.min(open, close));
    var bh = Math.max(1, bt - tp);
    cx.fillRect(x - bw/2, tp, bw, bh);
  }
  
  // MA5
  if (ma5.length > 1) {
    cx.strokeStyle = '#f0b429'; cx.lineWidth = 1.5;
    cx.beginPath();
    for (var i = 0; i < n; i++) {
      var v = i < ma5.length ? ma5[i] : prices[i];
      i === 0 ? cx.moveTo(px(i), py(v)) : cx.lineTo(px(i), py(v));
    }
    cx.stroke();
  }
  
  // MA20
  if (ma20.length > 1) {
    cx.strokeStyle = '#ff6b6b'; cx.lineWidth = 1.5; cx.setLineDash([4,3]);
    cx.beginPath();
    for (var i = 0; i < n; i++) {
      var v = i < ma20.length ? ma20[i] : prices[i];
      i === 0 ? cx.moveTo(px(i), py(v)) : cx.lineTo(px(i), py(v));
    }
    cx.stroke();
    cx.setLineDash([]);
  }
  
  // 买卖点
  for (var i = 0; i < trades.length; i++) {
    var t = trades[i];
    var idx = t.day;
    if (idx >= n) continue;
    var x = px(idx);
    var y = py(prices[idx]);
    var isBuy = t.type === '买入';
    cx.fillStyle = isBuy ? '#2ed573' : '#ff4757';
    cx.beginPath();
    if (isBuy) { cx.moveTo(x, y-10); cx.lineTo(x-6, y-2); cx.lineTo(x+6, y-2); }
    else { cx.moveTo(x, y+10); cx.lineTo(x-6, y+2); cx.lineTo(x+6, y+2); }
    cx.fill();
    cx.fillStyle = '#fff'; cx.font = 'bold 8px sans-serif'; cx.textAlign = 'center';
    cx.fillText(isBuy ? 'B' : 'S', x, isBuy ? y-11 : y+14);
  }
  
  // 日期
  cx.fillStyle = '#999'; cx.font = '8px sans-serif'; cx.textAlign = 'center';
  var steps = [0];
  if (n > 2) { steps.push(Math.floor(n/2)); steps.push(n-1); }
  for (var i = 0; i < steps.length; i++) {
    cx.fillText(dates[steps[i]] || '', px(steps[i]), hgt - 2);
  }
}

function togglePlay() {
  running = !running;
  document.getElementById('playBtn').textContent = running ? '⏸ 暂停' : '▶ 继续';
  document.getElementById('playBtn').className = running ? 'btn-play' : 'btn-pause';
}

function changeSpeed() {
  speedIdx = (speedIdx + 1) % speeds.length;
  speed = speeds[speedIdx];
  document.getElementById('speedBadge').textContent = speedNames[speedIdx];
  
  // 重启定时器
  if (timer) clearInterval(timer);
  timer = setInterval(simTick, 1000 / speed);
}

function resetSim() {
  // 重置所有状态
  PRICE = 1000; CASH = 5000; POS = 0; EQUITY = 5000;
  prices = [PRICE]; dates = []; ma5 = []; ma20 = [];
  trades = []; equityHistory = [{day:0,val:5000}];
  simDay = 0; seed = 42; running = true;
  document.getElementById('playBtn').textContent = '⏸ 暂停';
  document.getElementById('playBtn').className = 'btn-play';
  document.getElementById('teachTip').innerHTML =
    '🔄 已重置！<br>每 <b>1秒</b> = 模拟 <b>1个交易日</b><br>现实1天 = 模拟约5个月<br><br>马上开始...';
  updateUI();
  drawChart();
}

// 速度调整：每个tick推进1天
function simTick() {
  if (!running) return;
  nextDay();
}

// 启动
var timer = setInterval(simTick, 1000 / speed);
// 先画初始状态
updateUI();
setTimeout(function() {
  drawChart();
  document.getElementById('teachTip').innerHTML =
    '🚀 模拟已启动！K线正在生成中...<br><br>' +
    '每 <b>1秒</b> = 模拟 <b>1个交易日</b><br>' +
    '现实1天 = 模拟约5个月<br><br>' +
    '🟡 看MA5和🔴 MA20的交差<br>' +
    '▲ <b>金叉</b>（MA5上穿MA20）= 买入<br>' +
    '▼ <b>死叉</b>（MA5下穿MA20）= 卖出<br><br>' +
    '耐心看几分钟，你就能看到完整的一年行情！';
}, 500);

window.addEventListener('resize', function() { drawChart(); });
</script>
</body></html>`, {headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}}); } };