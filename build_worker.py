#!/usr/bin/env python3
"""
🏗️ 构建 Cloudflare Worker 部署包
用法：python3 build_worker.py
"""
import json, os, re

def main():
    # 1. 读取 dashboard.json
    if not os.path.exists('dashboard.json'):
        print("❌ 没找到 dashboard.json，先跑 python3 quant_sim.py --all")
        return

    with open('dashboard.json', 'r', encoding='utf-8') as f:
        raw = f.read()
    data = json.loads(raw)
    data_str = json.dumps(data, ensure_ascii=False)

    # 2. 读取原版 HTML
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 3. 替换 CDN 为 cdnjs（国内友好的CDN）
    html = html.replace(
        'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js',
        'https://cdnjs.cloudflare.com/ajax/libs/lightweight-charts/4.1.3/lightweight-charts.standalone.production.min.js'
    )

    # 4. 替换数据加载逻辑为内嵌数据
    old_load = html[html.find('async function loadData'):html.find('function renderStrategies')]
    new_load = '''// 数据已嵌入，直接加载
function loadData() {
  allData = EMBEDDED_DATA;
  if (allData.length === 0) { showError('暂无数据'); return; }
  renderStrategies();
  selectStrategy(0);
}

'''
    html = html.replace(old_load, new_load)

    # 5. 嵌入数据
    html = html.replace('let allData = [];', f'let allData = [];\nconst EMBEDDED_DATA = {data_str};')

    # 6. 转义 JS 模板字面量
    escaped = html.replace('`', '\\`').replace('${', '\\${')

    # 7. 生成 Worker
    worker = f'''// 📈 AI量化模拟盘 — Cloudflare Worker
// 由 build_worker.py 自动生成，编辑请改 index.html 然后重新构建

export default {{
  async fetch(request, env, ctx) {{
    return new Response(`{escaped}`, {{
      headers: {{'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600'}},
    }});
  }},
}};'''

    with open('worker.js', 'w', encoding='utf-8') as f:
        f.write(worker)

    print(f"✅ worker.js 构建完成！({len(worker)/1024:.0f}KB)")
    print("📤 部署步骤：")
    print("   1. 登录 https://dash.cloudflare.com")
    print("   2. Workers & Pages → 创建 Worker")
    print("   3. 粘贴 worker.js 全部内容 → 保存并部署")
    print("   4. 设置 → 触发器 → 自定义域 → 添加你的域名")

if __name__ == '__main__':
    main()
