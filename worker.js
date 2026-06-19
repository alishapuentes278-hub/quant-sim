// ============================================================
// 📈 AI量化模拟盘 — Cloudflare Worker
// 部署后国内就能直接打开，无需科学上网
// ============================================================

// 从 index_standalone.html 嵌入完整页面内容
// 下方 HTML_CONTENT 是自包含的页面（含数据和样式）
// 构建方式: python3 build_worker.py

const HTML_CONTENT = `{{HTML_PLACEHOLDER}}`;

// ===== 路由处理 =====
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 所有路径都返回同一个页面（SPA模式）
    // 如果请求 /data 或 /dashboard.json，返回 JSON（未来扩展用）
    // 目前所有数据已嵌入HTML内部
    
    return new Response(HTML_CONTENT, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=3600',
        'x-frame-options': 'DENY',
      },
    });
  },
};
