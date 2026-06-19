export default {
  async fetch() {
    // ===== 用户真实持仓数据 =====
    var funds = [
      {name:"天弘全球高端制造混合A",code:"016664",amount:133.36,profit:12.36,profitPct:11.23,type:"QDII混合"},
      {name:"南方上证科创板芯片ETF联接C",code:"021608",amount:23.75,profit:3.75,profitPct:18.76,type:"指数型"},
      {name:"天弘上证科创板综合指数增强C",code:"023896",amount:11.24,profit:1.24,profitPct:12.44,type:"指数型"},
      {name:"广发纳斯达克100ETF联接A",code:"270042",amount:13.19,profit:0.20,profitPct:2.03,type:"QDII指数"},
    ];
    
    var totalAmount = 0, totalProfit = 0;
    for (var i = 0; i < funds.length; i++) {
      totalAmount += funds[i].amount;
      totalProfit += funds[i].profit;
    }
    var totalPct = (totalProfit / (totalAmount - totalProfit) * 100);
    
    // 模拟净值走势（用真实数据生成一些点）
    var navHistory = [];
    var base = totalAmount - totalProfit;
    for (var i = 0; i < 30; i++) {
      navHistory.push({day:i+1,value:base + (totalProfit/30)*i + (Math.random()-0.5)*5});
    }
    
    // 构建HTML
    var h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>我的基金</title><style>';
    h += '*{margin:0;padding:0;box-sizing:border-box}';
    h += 'body{background:#f5f5f5;font-family:-apple-system,Helvetica Neue,sans-serif;padding:0;color:#333}';
    
    // 顶部风格
    h += '.top{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px 16px 20px;color:#fff}';
    h += '.top .label{font-size:12px;color:#8b9dc3}';
    h += '.top .amount{font-size:36px;font-weight:700;margin:4px 0 2px;letter-spacing:-1px}';
    h += '.top .amount span{font-size:16px;font-weight:400;color:#8b9dc3;margin-left:8px}';
    h += '.top .profit-row{display:flex;gap:24px;margin-top:8px}';
    h += '.top .profit-row div{font-size:13px}';
    h += '.top .profit-row .up{color:#ff4757}';
    h += '.top .profit-row .down{color:#2ed573}';
    h += '.top .profit-row .label-sm{color:#8b9dc3;font-size:11px}';
    
    // 日期选择
    h += '.tabs{display:flex;background:#fff;padding:0 16px;border-bottom:1px solid #eee;position:sticky;top:0;z-index:10}';
    h += '.tabs a{flex:1;text-align:center;padding:12px 0;font-size:13px;color:#666;text-decoration:none;border-bottom:2px solid transparent}';
    h += '.tabs a.active{color:#1a1a2e;border-bottom-color:#1a1a2e;font-weight:600}';
    
    // 卡片
    h += '.card{background:#fff;border-radius:12px;margin:12px 16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}';
    h += '.card-title{font-size:13px;color:#999;margin-bottom:10px}';
    h += '.card-title span{float:right;color:#1a1a2e;font-weight:600}';
    
    // 基金项
    h += '.fund{display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0}';
    h += '.fund:last-child{border:none}';
    h += '.fund-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;margin-right:12px;flex-shrink:0}';
    h += '.fund-info{flex:1;min-width:0}';
    h += '.fund-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
    h += '.fund-code{font-size:11px;color:#999;margin-top:2px}';
    h += '.fund-right{text-align:right;flex-shrink:0}';
    h += '.fund-amount{font-size:15px;font-weight:600}';
    h += '.fund-profit{font-size:12px;margin-top:2px}';
    h += '.fund-profit.up{color:#ff4757}';
    h += '.fund-profit.down{color:#2ed573}';
    
    // 图表容器
    h += '.chart-wrap{width:100%;height:200px;position:relative;margin-bottom:4px}';
    h += 'canvas{width:100%;height:100%;display:block}';
    h += '.legend{display:flex;gap:16px;justify-content:center;padding:4px 0;font-size:11px;color:#999}';
    
    // 底部按钮
    h += '.bottom-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #eee;display:flex;padding:8px 16px;gap:12px;padding-bottom:calc(8px + env(safe-area-inset-bottom))}';
    h += '.bottom-bar button{flex:1;padding:12px;border-radius:24px;border:none;font-size:15px;font-weight:600;cursor:pointer}';
    h += '.btn-buy{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}';
    h += '.btn-sell{background:#f0f0f0;color:#666}';
    
    h += '.footer{height:80px}';
    h += '</style></head><body>';
    
    // 顶部总资产
    var isUp = totalProfit >= 0;
    h += '<div class="top">';
    h += '<div class="label">总资产（元）</div>';
    h += '<div class="amount">' + totalAmount.toFixed(2) + '<span>CNY</span></div>';
    h += '<div class="profit-row">';
    h += '<div><div class="' + (isUp?'up':'down') + '">' + (isUp?'+':'') + totalProfit.toFixed(2) + '</div><div class="label-sm">累计收益</div></div>';
    h += '<div><div class="' + (isUp?'up':'down') + '">' + (isUp?'+':'') + totalPct.toFixed(2) + '%</div><div class="label-sm">收益率</div></div>';
    h += '<div><div>4</div><div class="label-sm">持有基金</div></div>';
    h += '</div></div>';
    
    // 净值走势
    h += '<div class="card">';
    h += '<div class="card-title">净值走势<span>近30天</span></div>';
    h += '<div class="chart-wrap"><canvas id="nc"></canvas></div>';
    h += '<div class="legend"><span style="color:#667eea">● 总资产</span></div>';
    h += '</div>';
    
    // 持仓列表
    h += '<div class="card">';
    h += '<div class="card-title">持仓明细</div>';
    var icons = ['🔧','💾','📊','🇺🇸'];
    var colors = ['#667eea','#f093fb','#4facfe','#43e97b'];
    for (var i = 0; i < funds.length; i++) {
      var f = funds[i];
      var fUp = f.profit >= 0;
      h += '<div class="fund">';
      h += '<div class="fund-icon" style="background:' + colors[i % colors.length] + '20;color:' + colors[i % colors.length] + '">' + icons[i % icons.length] + '</div>';
      h += '<div class="fund-info"><div class="fund-name">' + f.name + '</div><div class="fund-code">' + f.code + ' · ' + f.type + '</div></div>';
      h += '<div class="fund-right">';
      h += '<div class="fund-amount">' + f.amount.toFixed(2) + '</div>';
      h += '<div class="fund-profit ' + (fUp?'up':'down') + '">' + (fUp?'+':'') + f.profit.toFixed(2) + ' (' + (fUp?'+':'') + f.profitPct.toFixed(2) + '%)</div>';
      h += '</div></div>';
    }
    h += '</div>';
    
    // 底部按钮
    h += '<div class="bottom-bar">';
    h += '<button class="btn-buy">买入</button>';
    h += '<button class="btn-sell">卖出</button>';
    h += '</div>';
    h += '<div class="footer"></div>';
    
    // 画图脚本
    h += '<script>';
    h += 'var navs=' + JSON.stringify(navHistory) + ';';
    h += 'function draw(){var ca=document.getElementById("nc");if(!ca)return;var ct=ca.parentElement;var dpr=window.devicePixelRatio||1;var w=ct.clientWidth;var hgt=ct.clientHeight;ca.width=w*dpr;ca.height=hgt*dpr;ca.style.width=w+"px";ca.style.height=hgt+"px";var cx=ca.getContext("2d");cx.scale(dpr,dpr);';
    h += 'var n=navs.length;var vals=navs.map(function(v){return v.value});var mn=Math.min.apply(null,vals)*0.99;var mx=Math.max.apply(null,vals)*1.01;var rg=mx-mn||1;var pad={top:20,bottom:20,left:10,right:10};var cw=w-pad.left-pad.right;var ch=hgt-pad.top-pad.bottom;';
    h += 'function px(i){return pad.left+(i/(n-1))*cw}function py(v){return pad.top+ch-((v-mn)/rg)*ch}';
    // 渐变填充
    h += 'var grad=cx.createLinearGradient(0,pad.top,0,pad.top+ch);grad.addColorStop(0,"rgba(102,126,234,0.3)");grad.addColorStop(1,"rgba(102,126,234,0)")';
    h += 'cx.fillStyle=grad;cx.beginPath();cx.moveTo(px(0),py(vals[0]));for(var i=1;i<n;i++)cx.lineTo(px(i),py(vals[i]));cx.lineTo(px(n-1),pad.top+ch);cx.lineTo(px(0),pad.top+ch);cx.closePath();cx.fill()';
    // 线
    h += 'cx.strokeStyle="#667eea";cx.lineWidth=2;cx.beginPath();for(var i=0;i<n;i++){i===0?cx.moveTo(px(i),py(vals[i])):cx.lineTo(px(i),py(vals[i]))}cx.stroke()';
    // 点
    h += 'cx.fillStyle="#667eea";for(var i=0;i<n;i+=5){cx.beginPath();cx.arc(px(i),py(vals[i]),3,0,Math.PI*2);cx.fill()}';
    h += '}';
    h += 'window.addEventListener("load",function(){setTimeout(draw,100)});';
    h += 'window.addEventListener("resize",function(){draw()});';
    h += '</script></body></html>';
    
    return new Response(h, {
      headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache'}
    });
  }
};
