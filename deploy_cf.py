#!/usr/bin/env python3
"""
Cloudflare Worker 自动部署脚本
用法：
  1. 先去 https://dash.cloudflare.com/profile/api-tokens 创建 API Token
     （权限选 Workers > Edit）
  2. 运行：python3 deploy_cf.py <API_TOKEN> <WORKER_NAME>
  
  可选：绑定自定义域
  运行：python3 deploy_cf.py <API_TOKEN> <WORKER_NAME> --domain your-domain.xyz
"""
import json, sys, os, requests

def main():
    if len(sys.argv) < 3:
        print("用法: python3 deploy_cf.py <API_TOKEN> <WORKER_NAME> [--domain 你的域名]")
        return

    api_token = sys.argv[1]
    worker_name = sys.argv[2]
    domain = None
    if len(sys.argv) > 3 and sys.argv[3] == '--domain':
        domain = sys.argv[4]

    # 读取 worker_final.js
    if not os.path.exists('worker_final.js'):
        print("❌ 没找到 worker_final.js，请确认当前目录")
        return

    with open('worker_final.js', 'r', encoding='utf-8') as f:
        code = f.read()

    print(f"📄 读取 worker_final.js ({len(code)//1024}KB)")

    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json',
    }

    # 获取账号ID
    print("🔍 获取账号信息...")
    resp = requests.get('https://api.cloudflare.com/client/v4/accounts', headers=headers)
    if not resp.json()['success']:
        print(f"❌ API验证失败: {resp.json()}")
        print("请检查 API Token 是否正确（权限需要 Workers:Edit）")
        return
    
    account_id = resp.json()['result'][0]['id']
    print(f"✅ 账号: {resp.json()['result'][0]['name']} (ID: {account_id[:8]}...)")

    # 部署Worker
    print(f"🚀 部署 Worker: {worker_name}...")
    deploy_url = f'https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}'
    
    # Worker 的 multipart/form-data 格式
    metadata = json.dumps({
        "main_module": "worker.js",
    })
    
    files = {
        'worker.js': ('worker.js', code, 'application/javascript'),
        'metadata': ('metadata.json', metadata, 'application/json'),
    }
    
    resp = requests.put(deploy_url, headers={'Authorization': f'Bearer {api_token}'}, files=files)
    
    if resp.json()['success']:
        worker_url = f'https://{worker_name}.{account_id}.workers.dev'
        print(f"✅ 部署成功！")
        print(f"🌐 访问地址: {worker_url}")
    else:
        print(f"❌ 部署失败: {resp.json()}")
        return

    # 绑定自定义域名（可选）
    if domain:
        print(f"🔗 绑定域名: {domain}...")
        # 先获取 zone_id
        zones_resp = requests.get(
            f'https://api.cloudflare.com/client/v4/zones',
            headers=headers,
            params={'name': '.'.join(domain.split('.')[-2:])}
        )
        if zones_resp.json()['success'] and len(zones_resp.json()['result']) > 0:
            zone_id = zones_resp.json()['result'][0]['id']
            
            # 添加DNS记录
            dns_resp = requests.post(
                f'https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records',
                headers=headers,
                json={
                    'type': 'CNAME',
                    'name': domain.split('.')[0],
                    'content': f'{worker_name}.{account_id}.workers.dev',
                    'proxied': True,
                }
            )
            if dns_resp.json()['success']:
                print(f"✅ DNS记录已添加: https://{domain}")
            else:
                print(f"⚠️ DNS记录添加失败，你可能需要手动添加: {domain} → {worker_name}.{account_id}.workers.dev")
        else:
            print(f"⚠️ 未找到域名 {domain} 的Zone，请手动绑定")

    print("\n📱 手机打开上面 🌐 地址就能看模拟盘了！")

if __name__ == '__main__':
    main()
