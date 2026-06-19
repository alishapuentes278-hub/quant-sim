export default {
  async fetch(request) {
    const url = new URL(request.url);
    var code = (url.searchParams.get('code') || '000688').replace(/[^0-9]/g,'');
    if (code.length < 6) code = '000688';
    
    var sym = code;
    if (code.startsWith('6') || code.startsWith('9')) sym = 'SSE:' + code;
    else sym = 'SZSE:' + code;
    
    var stocks = [
      {n:'科创50',c:'000688'},{n:'上证指数',c:'000001'},
      {n:'沪深300',c:'000300'},{n:'创业板',c:'399006'},
      {n:'茅台',c:'600519'},{n:'宁德时代',c:'300750'},
      {n:'比亚迪',c:'002594'},{n:'纳指ETF',c:'513100'}
    ];
    
    var qbar = '';
    for (var i = 0; i < stocks.length; i++) {
      qbar += '<a class="qb" href="?code=' + stocks[i].c + '">' + stocks[i].n + '</a>';
    }
    
    var html = '<!DOCTYPE html><html lang="zh-CN"><head>';
    html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">';
    html += '<title>K线 - ' + code + '</title>';
    html += '<style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}';
    html += 'body{background:#131722;color:#d1d4dc;font-family:sans-serif;padding:10px}';
    html += '.h{text-align:center;padding:12px 0;border-bottom:1px solid #2a2e39;margin-bottom:12px}';
    html += '.h h1{font-size:18px;color:#2962ff}';
    html += '.s{display:flex;gap:8px;margin-bottom:12px}';
    html += '.s input{flex:1;padding:10px 14px;border-radius:6px;border:1px solid #2a2e39;background:#1e222d;color:#d1d4dc;font-size:16px;outline:none}';
    html += '.s input:focus{border-color:#2962ff}';
    html += '.s button{padding:10px 20px;border-radius:6px;border:none;background:#2962ff;color:#fff;font-size:14px;cursor:pointer}';
    html += '.q{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}';
    html += '.qb{padding:4px 12px;border-radius:12px;border:1px solid #2a2e39;background:#1e222d;color:#d1d4dc;font-size:11px;cursor:pointer;text-decoration:none}';
    html += '.qb:hover{background:#2962ff;border-color:#2962ff}';
    html += '.c{width:100%;height:calc(100vh - 180px);min-height:400px;border-radius:6px;overflow:hidden}';
    html += '.f{text-align:center;padding:10px 0;color:#434651;font-size:10px}';
    html += '</style></head><body>';
    html += '<div class="h"><h1>K线图</h1></div>';
    html += '<div class="s">';
    html += '<input id="i" placeholder="股票代码" value="' + code + '" onkeyup="if(event.key==\'Enter\')g()">';
    html += '<button onclick="g()">查</button></div>';
    html += '<div class="q">' + qbar + '</div>';
    html += '<div class="c"><div id="tv"></div></div>';
    html += '<div class="f">TradingView · 可拖拽缩放 · 支持指标</div>';
    html += '<script src="https://s3.tradingview.com/tv.js"></script>';
    html += '<script>';
    html += 'var w=null;function g(){';
    html += 'var c=document.getElementById("i").value.replace(/[^0-9]/g,"")||"000688";';
    html += 'window.location.href="?code="+c;';
    html += '}';
    html += 'function init(c){';
    html += 'var s=c.startsWith("6")||c.startsWith("9")?"SSE:":"SZSE:";';
    html += 'if(w)w.remove();';
    html += 'w=new TradingView.widget({';
    html += 'container:"tv",symbol:s+c,interval:"D",timezone:"Asia/Shanghai",';
    html += 'theme:"dark",style:"1",locale:"zh_CN",';
    html += 'toolbar_bg:"#131722",enable_publishing:false,';
    html += 'studies:["MASimple@tv-basicstudies","RSI@tv-basicstudies","MACD@tv-basicstudies"],';
    html += 'height:document.querySelector(".c").clientHeight,width:"100%",';
    html += 'overrides:{"paneProperties.background":"#131722"}});';
    html += '}';
    html += 'var p=new URLSearchParams(window.location.search);';
    html += 'var c=p.get("code")||"000688";';
    html += 'document.getElementById("i").value=c;';
    html += 'init(c);';
    html += 'window.addEventListener("resize",function(){';
    html += 'var ct=document.querySelector(".c");';
    html += 'if(w)w.resize(ct.clientWidth,ct.clientHeight);';
    html += '});';
    html += '</script></body></html>';
    
    return new Response(html, {
      headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache'}
    });
  }
};
