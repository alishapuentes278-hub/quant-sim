export default { async fetch() { return new Response(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>⏱ 多策略动态模拟盘</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f5f5;font-family:-apple-system,Helvetica Neue,sans-serif;color:#333;padding-bottom:80px;overflow-x:hidden}
.top{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px 16px 20px;color:#fff}
.top .sm{font-size:12px;color:#8b9dc3}
.top .big{font-size:36px;font-weight:700;margin:4px 0 2px;letter-spacing:-1px}
.top .big span{font-size:14px;font-weight:400;color:#8b9dc3}
.top .row{display:flex;gap:16px;margin-top:8px;flex-wrap:wrap}
.top .row div{font-size:13px}
.up{color:#ff4757}.dn{color:#2ed573}
.label{color:#8b9dc3;font-size:11px}
.card{background:#fff;border-radius:12px;margin:12px 16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
.card .tit{font-size:13px;color:#999;margin-bottom:8px;display:flex;justify-content:space-between}
.chart-box{width:100%;height:360px;background:#fafafa;border-radius:8px;overflow:hidden;position:relative}
canvas{width:100%;height:100%;display:block}
.ctrl{display:flex;gap:6px;justify-content:center;padding:6px;flex-wrap:wrap}
.ctrl button{padding:5px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;touch-action:manipulation}
.btn-play{background:#2ed573;color:#fff}.btn-pause{background:#ff4757;color:#fff}.btn-ctrl{background:#667eea;color:#fff}.btn-ctrl2{background:#f0f0f0;color:#666}
.speed-badge{display:inline-block;background:#667eea20;color:#667eea;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600}
.strat-bar{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px}
.sbtn{padding:4px 10px;border-radius:12px;border:1px solid #ddd;font-size:11px;cursor:pointer;background:#fff;touch-action:manipulation}
.sbtn.act{background:#667eea;color:#fff;border-color:#667eea}
.stat{display:flex;gap:6px;flex-wrap:wrap}
.stat-item{flex:1;min-width:60px;text-align:center;padding:6px 4px;background:#f8f9ff;border-radius:8px}
.stat-item .val{font-size:16px;font-weight:700}
.stat-item .lb{font-size:9px;color:#999;margin-top:1px}
.tip{font-size:12px;color:#666;line-height:1.8;padding:8px;background:#f8f9ff;border-radius:8px;margin-top:6px}
.pk{display:flex;gap:4px;flex-wrap:wrap}
.pk-item{flex:1;min-width:45%;padding:6px 8px;border-radius:8px;font-size:11px;border:1px solid #eee}
.pk-item.win{background:#fff0f0;border-color:#ff4757}
.pk-name{font-weight:600;font-size:11px}
.pk-eq{float:right}
#log{max-height:160px;overflow-y:auto;font-size:11px}
#log::-webkit-scrollbar{width:3px}#log::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
.tag-b{background:#fff0f0;color:#ff4757;padding:1px 5px;border-radius:3px;font-size:10px}
.tag-s{background:#f0fff4;color:#2ed573;padding:1px 5px;border-radius:3px;font-size:10px}
.lg{display:flex;gap:14px;padding:4px 0;font-size:11px;color:#999;flex-wrap:wrap;justify-content:center}
.lg i{display:inline-block;width:16px;height:2px;border-radius:2px;vertical-align:middle;margin-right:2px}
</style></head><body>
<div class="top">
  <div class="sm">⏱ 多策略动态模拟盘</div>
  <div class="big" id="tv">5,000.00 <span>CNY</span></div>
  <div class="row">
    <div><div id="retV" class="up">+0.00%</div><div class="label">收益</div></div>
    <div><div id="bhV" class="up">+0.00%</div><div class="label">买入持有</div></div>
    <div><div id="dayV">0天</div><div class="label">天数</div></div>
    <div><div id="bestV">—</div><div class="label">最优策略</div></div>
  </div>
</div>
<div class="ctrl">
  <button id="playBtn" class="btn-play" onclick="togglePlay()">⏸ 暂停</button>
  <button class="btn-ctrl" onclick="chSpeed()">⚡<span id="sb">1x</span></button>
  <button class="btn-ctrl2" onclick="resetAll()">🔄 重置</button>
</div>
<div class="card" style="padding:10px 16px">
  <div class="tit" style="margin-bottom:4px">选择策略</div>
  <div class="strat-bar" id="sbar"></div>
</div>
<div class="card">
  <div class="tit">K线图 · <span id="ct">金叉死叉</span></div>
  <div class="chart-box" id="cbox"><canvas id="kc"></canvas></div>
  <div class="lg">
    <span><i style="background:#f0b429"></i>MA5</span>
    <span><i style="background:#ff6b6b"></i>MA20</span>
    <span style="color:#2ed573">▲买入</span>
    <span style="color:#ff4757">▼卖出</span>
  </div>
</div>
<div class="card">
  <div class="tit">策略PK</div>
  <div class="pk" id="pkArea"></div>
</div>
<div class="card">
  <div class="tit">交易日志 <span id="logCount">0笔</span></div>
  <div id="log">暂无</div>
</div>
<div class="card">
  <div class="tit">📖 教学</div>
  <div class="tip" id="tip">启动中...</div>
</div>
<script>
// === 数据 ===
var seed=42,day=0,price=1000,cash=5000,pos=0,eq=5000;
var prices=[1000],dates=[];
var s={
  "金叉死叉":{c:5000,p:0,e:5000,t:[],m5:[],m20:[]},
  "RSI反转":{c:5000,p:0,e:5000,t:[],r:[]},
  "突破买入":{c:5000,p:0,e:5000,t:[],h:[]},
  "趋势追踪":{c:5000,p:0,e:5000,t:[],m10:[],m30:[],ep:0}
};
var sel="金叉死叉",run=true,spd=1,spi=0;
var spds=[1,2,5,10,50];
var MAX=250,tid=null;

function rnd(){seed=(seed*9301+49297)%233280;return seed/233280}

function gp(last,d){
  var ph=Math.floor(d/50)%5,t=0;
  if(ph===0)t=(rnd()-0.3)*8+6;
  else if(ph===1)t=(rnd()-0.5)*14;
  else if(ph===2)t=(rnd()-0.7)*8-6;
  else if(ph===3)t=(rnd()-0.4)*10+3;
  else t=rnd()*22+12;
  var p=Math.max(last*0.85,last+t+(rnd()-0.5)*10);
  if(p>1500)p+=(1500-p)*0.02;
  return p;
}

function ma(arr,n){
  if(arr.length<n)return arr[arr.length-1];
  var sum=0;for(var i=arr.length-n;i<arr.length;i++)sum+=arr[i];
  return sum/n;
}

function rsi(arr,n){
  if(arr.length<n+1)return 50;
  var g=0,l=0;
  for(var i=arr.length-n;i<arr.length;i++){
    var d=arr[i]-arr[i-1];
    if(d>0)g+=d;else l-=d;
  }
  return l===0?100:100-100/(1+g/l);
}

function runAll(p){
  var x;
  // 金叉死叉
  x=s["金叉死叉"];var m5=ma(prices,5),m20=ma(prices,20);
  x.m5.push(m5);x.m20.push(m20);
  if(prices.length>21){
    if(!x.p&&x.m5[x.m5.length-2]<=x.m20[x.m20.length-2]&&m5>m20){
      x.p=Math.floor(x.c/p);x.c-=x.p*p;
      x.t.push({d:day,ty:"买",p:p,a:x.p*p});
    }else if(x.p&&x.m5[x.m5.length-2]>=x.m20[x.m20.length-2]&&m5<m20){
      x.c+=x.p*p;x.t.push({d:day,ty:"卖",p:p,a:x.p*p});x.p=0;
    }
  }
  x.e=x.c+x.p*p;
  
  // RSI
  x=s["RSI反转"];var rs=rsi(prices,14);x.r.push(rs);
  if(prices.length>15){
    if(!x.p&&rs<30){
      x.p=Math.floor(x.c/p);x.c-=x.p*p;
      x.t.push({d:day,ty:"买",p:p,a:x.p*p,n:"RSI="+rs.toFixed(0)});
    }else if(x.p&&rs>70){
      x.c+=x.p*p;x.t.push({d:day,ty:"卖",p:p,a:x.p*p,n:"RSI="+rs.toFixed(0)});x.p=0;
    }
  }
  x.e=x.c+x.p*p;
  
  // 突破
  x=s["突破买入"];var h20=Math.max.apply(null,prices.slice(-20));x.h.push(h20);
  if(prices.length>20){
    if(!x.p&&p>h20*1.015){
      x.p=Math.floor(x.c/p);x.c-=x.p*p;x.ep=p;
      x.t.push({d:day,ty:"买",p:p,a:x.p*p,n:"突破↑"});
    }else if(x.p){
      var pp=(p-x.ep)/x.ep*100;
      if(pp>20||pp<-6||p<h20*0.95){
        var nt=pp>20?"🎯止盈":pp<-6?"🛑止损":"📉回落";
        x.c+=x.p*p;x.t.push({d:day,ty:"卖",p:p,a:x.p*p,n:nt});x.p=0;
      }
    }
  }
  x.e=x.c+x.p*p;
  
  // 趋势
  x=s["趋势追踪"];var m10=ma(prices,10),m30=ma(prices,30);
  x.m10.push(m10);x.m30.push(m30);
  if(prices.length>31){
    if(!x.p&&x.m10[x.m10.length-2]<=x.m30[x.m30.length-2]&&m10>m30){
      x.p=Math.floor(x.c/p);x.c-=x.p*p;x.ep=p;
      x.t.push({d:day,ty:"买",p:p,a:x.p*p,n:"趋势↑"});
    }else if(x.p){
      var pp=(p-x.ep)/x.ep*100;
      if(m10<m30||pp>25||pp<-8){
        var nt=pp>25?"🎯止盈":pp<-8?"🛑止损":"死叉";
        x.c+=x.p*p;x.t.push({d:day,ty:"卖",p:p,a:x.p*p,n:nt});x.p=0;
      }
    }
  }
  x.e=x.c+x.p*p;
}

function tick(){
  if(!run||day>=MAX)return;
  var batch=Math.min(spd,10);
  for(var i=0;i<batch;i++){
    if(day>=MAX)break;
    day++;
    var d=new Date(2025,5,18+day);
    dates.push(d.getFullYear()+'-'+(d.getMonth()+1+'').padStart(2,'0')+'-'+(d.getDate()+'').padStart(2,'0'));
    price=gp(prices[prices.length-1],day);
    prices.push(price);
    runAll(price);
  }
  drawUI();
  drawChart(sel);
  if(day>=MAX){showDone();return;}
  tid=setTimeout(tick,16);
}

function drawUI(){
  var s2=s[sel];
  eq=s2.e;
  document.getElementById('tv').innerHTML=eq.toFixed(2)+' <span>CNY</span>';
  var r=(eq-5000)/5000*100;
  document.getElementById('retV').textContent=(r>=0?'+':'')+r.toFixed(2)+'%';
  document.getElementById('retV').className=r>=0?'up':'dn';
  var br=(price-1000)/1000*100;
  document.getElementById('bhV').textContent=(br>=0?'+':'')+br.toFixed(2)+'%';
  document.getElementById('bhV').className=br>=0?'up':'dn';
  document.getElementById('dayV').textContent=day+'天';
  // 最优
  var bk="",bv=-9999;
  for(var k in s){if(s[k].e>bv){bv=s[k].e;bk=k;}}
  document.getElementById('bestV').textContent=bk;
  // 策略按钮
  var sb='';
  for(var k in s){
    var sr=(s[k].e-5000)/5000*100;
    sb+='<button class="sbtn'+(k===sel?' act':'')+'" onclick="pick(\''+k+'\')">'+k+' '+(sr>=0?'+':'')+sr.toFixed(1)+'%</button>';
  }
  document.getElementById('sbar').innerHTML=sb;
  // PK
  var pk='';
  for(var k in s){
    var sr=(s[k].e-5000)/5000*100,tr=s[k].t.length;
    pk+='<div class="pk-item'+(k===sel?' win':'')+'"><div class="pk-name">'+k+' <span class="pk-eq">'+(sr>=0?'+':'')+sr.toFixed(2)+'%</span></div><div style="color:#999;font-size:10px">'+tr+'笔</div></div>';
  }
  document.getElementById('pkArea').innerHTML=pk;
  // 日志
  showLog(sel);
}

function showLog(name){
  var x=s[name];
  if(!x.t.length){document.getElementById('log').innerHTML='暂无';document.getElementById('logCount').textContent='0笔';return;}
  var h='';
  for(var i=x.t.length-1;i>=0;i--){
    var t=x.t[i];
    h+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:12px">'+
      '<span><span class="'+(t.ty==='买'?'tag-b':'tag-s')+'">'+t.ty+'</span> '+(dates[t.d]||'')+'</span>'+
      '<span><b>'+t.p.toFixed(2)+'</b> '+t.a.toFixed(0)+'元'+(t.n?' <span style="color:#999;font-size:10px">'+t.n+'</span>':'')+'</span></div>';
  }
  document.getElementById('log').innerHTML=h;
  document.getElementById('logCount').textContent=x.t.length+'笔';
}

function drawChart(name){
  var ca=document.getElementById('kc');
  if(!ca||!ca.parentElement||prices.length<2)return;
  var ct=ca.parentElement,dpr=window.devicePixelRatio||1,w=ct.clientWidth,h=ct.clientHeight;
  if(w<10||h<10)return;
  ca.width=w*dpr;ca.height=h*dpr;ca.style.width=w+'px';ca.style.height=h+'px';
  var cx=ca.getContext('2d');cx.scale(dpr,dpr);
  var n=prices.length,pad={t:20,b:20,l:50,r:10},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  var mn=1e9,mx=0;
  for(var i=0;i<n;i++){if(prices[i]<mn)mn=prices[i];if(prices[i]>mx)mx=prices[i]}
  mn*=0.97;mx*=1.03;var rg=mx-mn||1;
  function px(i){return pad.l+(i/(n-1))*cw}
  function py(v){return pad.t+ch-((v-mn)/rg)*ch}
  cx.strokeStyle='#e8e8e8';cx.lineWidth=0.5;
  for(var i=0;i<5;i++){var y=pad.t+(ch/5)*i;cx.beginPath();cx.moveTo(pad.l,y);cx.lineTo(w-pad.r,y);cx.stroke();cx.fillStyle='#999';cx.font='9px sans-serif';cx.textAlign='right';cx.fillText((mx-(rg/5)*i).toFixed(0),pad.l-4,y+4)}
  var bw=Math.max(1.5,cw/n*0.5);
  for(var i=1;i<n;i++){
    var x=px(i),op=prices[i-1],cl=prices[i],hg=Math.max(op,cl)*(1+rnd()*0.015),lw=Math.min(op,cl)*(1-rnd()*0.015),up=cl>=op;
    cx.fillStyle=up?'#ff4757':'#2ed573';cx.strokeStyle=up?'#ff4757':'#2ed573';cx.lineWidth=0.3;cx.beginPath();cx.moveTo(x,py(hg));cx.lineTo(x,py(lw));cx.stroke();
    var tp=py(Math.max(op,cl)),bt=py(Math.min(op,cl)),bh=Math.max(1,bt-tp);cx.fillRect(x-bw/2,tp,bw,bh);
  }
  var x2=s[name];
  if(x2.m5&&x2.m5.length>1){cx.strokeStyle='#f0b429';cx.lineWidth=1.5;cx.beginPath();for(var i=0;i<x2.m5.length;i++){i===0?cx.moveTo(px(i),py(x2.m5[i])):cx.lineTo(px(i),py(x2.m5[i]))}cx.stroke()}
  if(x2.m20&&x2.m20.length>1){cx.strokeStyle='#ff6b6b';cx.lineWidth=1.5;cx.setLineDash([4,3]);cx.beginPath();for(var i=0;i<x2.m20.length;i++){i===0?cx.moveTo(px(i),py(x2.m20[i])):cx.lineTo(px(i),py(x2.m20[i]))}cx.stroke();cx.setLineDash([])}
  for(var i=0;i<x2.t.length;i++){
    var t=x2.t[i],idx=t.d,b=t.ty==='买';
    if(idx>=n)continue;var x=px(idx),y=py(prices[idx]);
    cx.fillStyle=b?'#2ed573':'#ff4757';cx.beginPath();
    if(b){cx.moveTo(x,y-10);cx.lineTo(x-6,y-2);cx.lineTo(x+6,y-2)}else{cx.moveTo(x,y+10);cx.lineTo(x-6,y+2);cx.lineTo(x+6,y+2)}cx.fill();
    cx.fillStyle='#fff';cx.font='bold 7px sans-serif';cx.textAlign='center';cx.fillText(b?'B':'S',x,b?y-11:y+14);
  }
  cx.fillStyle='#999';cx.font='8px sans-serif';cx.textAlign='center';
  var si=[0];if(n>2){si.push(Math.floor(n/3));si.push(Math.floor(n*2/3));si.push(n-1)}
  for(var i=0;i<si.length;i++){cx.fillText(dates[si[i]]||'',px(si[i]),h-2)}
}

function showDone(){
  var bk="",bv=-9999;
  for(var k in s){if(s[k].e>bv){bv=s[k].e;bk=k;}}
  var br=(price-1000)/1000*100;
  var html='✅ <b>模拟结束！</b>共'+MAX+'个交易日<br><br>';
  html+='🏆 <b>最优策略：'+bk+'</b> '+bv.toFixed(2)+'元<br>';
  for(var k in s){var sr=(s[k].e-5000)/5000*100;html+='&nbsp;&nbsp;'+(k===bk?'⭐ ':'')+k+'：'+(sr>=0?'+':'')+sr.toFixed(2)+'% ('+s[k].t.length+'笔)<br>';}
  html+='<br>📈 买入持有：'+(br>=0?'+':'')+br.toFixed(2)+'%<br>';
  html+='<br>💡 '+(bv/5000-1>br/100?'策略跑赢买入持有！🎯':'这次策略没跑赢买入持有...市场随机性很大');
  document.getElementById('tip').innerHTML=html;
}

function pick(n){sel=n;document.getElementById('ct').textContent=n;drawUI();drawChart(n)}

function togglePlay(){run=!run;document.getElementById('playBtn').textContent=run?'⏸ 暂停':'▶ 继续';document.getElementById('playBtn').className=run?'btn-play':'btn-pause';if(run){tid=setTimeout(tick,16)}}

function chSpeed(){spi=(spi+1)%spds.length;spd=spds[spi];document.getElementById('sb').textContent=spd+'x'}

function resetAll(){
  day=0;price=1000;cash=5000;pos=0;eq=5000;prices=[1000];dates=[];seed=42;run=true;
  for(var k in s){var x=s[k];x.c=5000;x.p=0;x.e=5000;x.t=[];x.m5=[];x.m20=[];x.r=[];x.h=[];x.m10=[];x.m30=[];}
  document.getElementById('playBtn').textContent='⏸ 暂停';document.getElementById('playBtn').className='btn-play';
  if(tid)clearTimeout(tid);
  drawUI();drawChart(sel);
  document.getElementById('tip').innerHTML='🔄 已重置！马上重新开始...';
  tid=setTimeout(tick,16);
}

// 启动
renderStratButtons(); // quick initial render
document.getElementById('tip').innerHTML='🚀 <b>模拟启动！</b><br>4个策略同时在跑，选择不同的策略查看它们的交易';
tid=setTimeout(tick,16);
window.addEventListener('resize',function(){if(prices.length>1)drawChart(sel)});
</script>
</body></html>
`, {headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}}); } };