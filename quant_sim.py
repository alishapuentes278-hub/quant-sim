#!/usr/bin/env python3
"""
📈 AI量化模拟盘 - 回测引擎 + 学习工具
让你在手机上就能看懂K线、均线、策略怎么赚钱/亏钱

用法：
  python3 quant_sim.py              # 跑默认策略（科创50）
  python3 quant_sim.py --code 000300.SH --days 365  # 跑沪深300
"""

import akshare as ak
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json, os, argparse, sys

# ===== 配置 =====
DATA_DIR = "quant_data"
os.makedirs(DATA_DIR, exist_ok=True)

def fetch_data(code="000688.SH", name="科创50", days=365):
    """获取A股历史数据 - 先试 akshare，不行用 yfinance"""
    print(f"📥 正在获取 {name} 过去{days}天的数据...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # 先试 yfinance（更稳定）
    try:
        import yfinance as yf
        # Map A-share code to yfinance format
        yf_code = code.replace(".SH", ".SS").replace(".SZ", ".SZ")
        yf_code = yf_code if yf_code.endswith((".SS", ".SZ")) else yf_code + ".SS"
        
        df = yf.download(yf_code, start=start_date, end=end_date, progress=False, auto_adjust=True)
        if len(df) > 10:
            df = df.reset_index()
            df.columns = [c.lower() for c in df.columns]
            df.rename(columns={"date": "date", "open": "open", "close": "close",
                               "high": "high", "low": "low", "volume": "volume"}, inplace=True)
            print(f"✅ yfinance 获取到 {len(df)} 条数据")
            return df
    except Exception as e:
        print(f"yfinance 失败: {e}, 尝试 akshare...")
    
    # 再试 akshare
    try:
        import akshare as ak
        code_num = code.replace(".SH", "").replace(".SZ", "")
        df = ak.stock_zh_a_hist(symbol=code_num, period="daily",
                                 start_date=start_date.strftime("%Y%m%d"),
                                 end_date=end_date.strftime("%Y%m%d"), adjust="qfq")
        df.rename(columns={"日期": "date", "开盘": "open", "收盘": "close",
                           "最高": "high", "最低": "low", "成交量": "volume"}, inplace=True)
        df["date"] = pd.to_datetime(df["date"])
        df.sort_values("date", inplace=True)
        print(f"✅ akshare 获取到 {len(df)} 条数据")
        return df
    except Exception as e:
        print(f"akshare 也失败: {e}")
    
    # 最后：生成模拟数据（让用户能先玩起来）
    print("⚠️ 所有数据源都失败了，生成模拟数据供学习使用...")
    return generate_mock_data(start_date, end_date)

def generate_mock_data(start_date, end_date):
    """生成模拟行情数据，让用户先能玩起来"""
    np.random.seed(42)
    dates = pd.date_range(start=start_date, end=end_date, freq='B')
    n = len(dates)
    
    # 模拟真实市场：有明确的趋势切换，确保产生金叉/死叉信号
    price = 1000
    prices = []
    for i in range(n):
        # 更剧烈的趋势切换：每20-40天切换方向
        phase = (i // 25) % 4  # 4个阶段循环
        if phase == 0:  # 快速上涨
            change = np.random.randn() * 8 + 5
        elif phase == 1:  # 震荡
            change = np.random.randn() * 12
        elif phase == 2:  # 快速下跌
            change = np.random.randn() * 8 - 5
        else:  # 缓慢反弹
            change = np.random.randn() * 10 + 2
        
        price = max(price + change, 500)
        prices.append(price)
    
    df = pd.DataFrame({
        "date": dates,
        "open": [p * (1 + np.random.randn()*0.008) for p in prices],
        "close": prices,
        "high": [p * (1 + abs(np.random.randn())*0.015) for p in prices],
        "low": [p * (1 - abs(np.random.randn())*0.015) for p in prices],
        "volume": [int(np.random.randint(1000000, 10000000)) for _ in range(n)],
    })
    print(f"✅ 生成 {len(df)} 条模拟数据")
    return df

def calculate_indicators(df):
    """计算各种技术指标（学K线从这里开始！）"""
    data = df.copy()
    
    # ===== 均线系列（大佬屏幕上最基础的线）=====
    # MA5 = 过去5天的平均收盘价，反映短期走势
    # MA20 = 过去20天，反映中期走势
    # MA60 = 过去60天，反映长期走势
    # 💡 金叉 = MA5上穿MA20，短期涨得比中期快 → 买入信号
    # 💡 死叉 = MA5下穿MA20，短期跌得比中期快 → 卖出信号
    data["MA5"] = data["close"].rolling(window=5).mean()
    data["MA10"] = data["close"].rolling(window=10).mean()
    data["MA20"] = data["close"].rolling(window=20).mean()
    data["MA60"] = data["close"].rolling(window=60).mean()
    
    # ===== RSI（相对强弱指标）=====
    # 💡 RSI > 70 = 超买（涨太多了，可能要跌）
    # 💡 RSI < 30 = 超卖（跌太多了，可能要涨）
    delta = data["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    data["RSI"] = 100 - (100 / (1 + rs))
    
    # ===== MACD（指数平滑移动平均线）=====
    # 💡 MACD是看「涨的势头在变强还是变弱」
    # 💡 DIF线上穿DEA线 = 买入信号
    # 💡 DIF线下穿DEA线 = 卖出信号
    # 💡 红色柱子在变长 = 涨的势头在加强
    # 💡 绿色柱子在变长 = 跌的势头在加强
    exp12 = data["close"].ewm(span=12, adjust=False).mean()
    exp26 = data["close"].ewm(span=26, adjust=False).mean()
    data["MACD_DIF"] = exp12 - exp26  # 快线
    data["MACD_DEA"] = data["MACD_DIF"].ewm(span=9, adjust=False).mean()  # 慢线
    data["MACD"] = 2 * (data["MACD_DIF"] - data["MACD_DEA"])  # 柱状图
    
    # ===== 布林带（Bollinger Bands）=====
    # 💡 价格碰到上轨 = 可能太高了要回调
    # 💡 价格碰到下轨 = 可能太低了要反弹
    # 💡 布林带收紧 = 可能要暴涨/暴跌（变盘前兆）
    data["BB_middle"] = data["close"].rolling(window=20).mean()
    std = data["close"].rolling(window=20).std()
    data["BB_upper"] = data["BB_middle"] + 2 * std  # 上轨
    data["BB_lower"] = data["BB_middle"] - 2 * std  # 下轨
    
    # ===== 成交量均线 =====
    data["VOL_MA5"] = data["volume"].rolling(window=5).mean()
    
    return data

# ===== 策略库 =====

def strategy_golden_cross(data, verbose=False):
    """策略1：金叉买入 + 死叉卖出（最简单经典）"""
    signals = pd.Series(0, index=data.index)
    # 金叉信号：MA5上穿MA20
    cond_buy = (data["MA5"] > data["MA20"]) & (data["MA5"].shift(1) <= data["MA20"].shift(1))
    cond_sell = (data["MA5"] < data["MA20"]) & (data["MA5"].shift(1) >= data["MA20"].shift(1))
    signals[cond_buy] = 1
    signals[cond_sell] = -1
    # Debug: count signals
    if verbose:
        buy_count = cond_buy.sum()
        sell_count = cond_sell.sum()
        print(f"  [DEBUG] 金叉信号: {buy_count}, 死叉信号: {sell_count}")
    return signals

def strategy_rsi_reversal(data, verbose=False):
    """策略2：RSI超卖买入 + 超买卖出"""
    signals = pd.Series(0, index=data.index)
    # RSI < 30 买入（超卖反弹）
    signals[(data["RSI"] < 30) & (data["RSI"].shift(1) >= 30)] = 1
    # RSI > 70 卖出（超买回调）
    signals[(data["RSI"] > 70) & (data["RSI"].shift(1) <= 70)] = -1
    return signals

def strategy_macd_cross(data, verbose=False):
    """策略3：MACD金叉买入 + 死叉卖出"""
    signals = pd.Series(0, index=data.index)
    # DIF上穿DEA = 买入（涨的势头刚开始）
    signals[(data["MACD_DIF"] > data["MACD_DEA"]) & (data["MACD_DIF"].shift(1) <= data["MACD_DEA"].shift(1))] = 1
    # DIF下穿DEA = 卖出（涨的势头在减弱）
    signals[(data["MACD_DIF"] < data["MACD_DEA"]) & (data["MACD_DIF"].shift(1) >= data["MACD_DEA"].shift(1))] = -1
    return signals

def strategy_bollinger_band(data, verbose=False):
    """策略4：布林带下轨买入 + 上轨卖出"""
    signals = pd.Series(0, index=data.index)
    # 跌破下轨后反弹买入
    signals[(data["close"] >= data["BB_lower"]) & (data["close"].shift(1) < data["BB_lower"].shift(1))] = 1
    # 涨破上轨后回落卖出
    signals[(data["close"] <= data["BB_upper"]) & (data["close"].shift(1) > data["BB_upper"].shift(1))] = -1
    return signals

STRATEGIES = {
    "金叉死叉": strategy_golden_cross,
    "RSI反转": strategy_rsi_reversal,
    "MACD金叉": strategy_macd_cross,
    "布林带": strategy_bollinger_band,
}

def run_backtest(data, strategy_name="金叉死叉", initial_capital=5000, verbose=True, code="?", name="?"):
    """运行回测，模拟真实交易"""
    df = data.copy()
    strategy_fn = STRATEGIES.get(strategy_name)
    if not strategy_fn:
        print(f"❌ 未知策略: {strategy_name}，可选: {list(STRATEGIES.keys())}")
        return None
    
    signals = strategy_fn(df, verbose=True)
    df["signal"] = signals.values  # Use .values to avoid index alignment issues
    
    # ===== 模拟交易 =====
    capital = initial_capital  # 现金
    position = 0  # 持有的股数
    trades = []
    portfolio_values = []
    
    # 交易成本（A股佣金最低5元，印花税0.1%）
    COMMISSION_RATE = 0.00025  # 万2.5
    STAMP_TAX = 0.001  # 印花税千1（卖出时收）
    MIN_COMMISSION = 5  # 最低5元
    
    for i in range(1, len(df)):
        price = df["close"].iloc[i]
        signal = df["signal"].iloc[i]
        date = df["date"].iloc[i]
        
        # Debug first few signals
        if signal != 0 and len(trades) < 2:
            print(f"    [DEBUG] {date.date()} 信号={signal}(type={type(signal).__name__}) capital={capital:.2f} position={position}")
        
        if int(signal) == 1 and capital > 0:
            # Debug
            if len(trades) < 2:
                print(f"    [DEBUG-BUY] 进入买入条件! capital={capital:.2f} price={price:.2f}")
            # 买入信号
            buy_amount = capital * 0.95  # 留5%现金
            shares = int(buy_amount / price / 100) * 100  # 100股起
            if shares > 0:
                cost = shares * price
                commission = max(cost * COMMISSION_RATE, MIN_COMMISSION)
                total_cost = cost + commission
                if total_cost <= capital:
                    position += shares
                    capital -= total_cost
                    trades.append({"date": str(date.date()), "type": "买入", 
                                   "price": round(price, 2), "shares": shares,
                                   "cost": round(total_cost, 2),
                                   "reason": f"{strategy_name}买入信号"})
                    if verbose:
                        print(f"  🟢 {date.date()} 买入 {shares}股 @ {price:.2f} 花费{total_cost:.2f}")
        
        elif signal == -1 and position > 0:
            # 卖出信号
            revenue = position * price
            commission = max(revenue * COMMISSION_RATE, MIN_COMMISSION)
            tax = revenue * STAMP_TAX
            net_revenue = revenue - commission - tax
            capital += net_revenue
            trades.append({"date": str(date.date()), "type": "卖出",
                           "price": round(price, 2), "shares": position,
                           "revenue": round(net_revenue, 2),
                           "reason": f"{strategy_name}卖出信号"})
            if verbose:
                profit = net_revenue - (position * price)  # approximate
                print(f"  🔴 {date.date()} 卖出 {position}股 @ {price:.2f} 收入{net_revenue:.2f}")
            position = 0
        
        # 记录每日资产总值
        total_value = capital + position * price
        portfolio_values.append({
            "date": str(date.date()),
            "cash": round(capital, 2),
            "position_value": round(position * price, 2),
            "total": round(total_value, 2),
            "price": round(price, 2)
        })
    
    # 最后一天强制平仓
    if position > 0:
        final_price = df["close"].iloc[-1]
        revenue = position * final_price
        commission = max(revenue * COMMISSION_RATE, MIN_COMMISSION)
        tax = revenue * STAMP_TAX
        capital += revenue - commission - tax
        position = 0
    
    # ===== 计算结果 =====
    total_return = capital - initial_capital
    return_rate = (capital / initial_capital - 1) * 100
    
    # 买入持有收益率（就是一直拿着不卖）
    buy_hold_return = (df["close"].iloc[-1] / df["close"].iloc[0] - 1) * 100
    
    # 胜率
    if trades:
        buy_trades = [t for t in trades if t["type"] == "买入"]
        sell_trades = [t for t in trades if t["type"] == "卖出"]
        wins = 0
        for i in range(min(len(buy_trades), len(sell_trades))):
            if sell_trades[i].get("revenue", 0) > sum(b["cost"] for b in buy_trades[i:i+1]):
                wins += 1
        win_rate = wins / len(sell_trades) * 100 if sell_trades else 0
    else:
        win_rate = 0
    
    result = {
        "code": code,
        "name": name,
        "period": f"{df['date'].iloc[0].strftime('%Y-%m-%d')} 至 {df['date'].iloc[-1].strftime('%Y-%m-%d')}",
        "initial_capital": initial_capital,
        "final_capital": round(capital, 2),
        "total_return": round(total_return, 2),
        "return_rate": round(return_rate, 2),
        "buy_hold_return": round(buy_hold_return, 2),
        "strategy": strategy_name,
        "total_trades": len([t for t in trades if t["type"] == "买入"]),
        "win_rate": round(win_rate, 1),
        "trades": trades,
        "portfolio_values": portfolio_values,
        "data": {
            "dates": [str(d.date()) for d in df["date"]],
            "close": [round(x, 2) for x in df["close"]],
            "ma5": [round(x, 2) if not pd.isna(x) else None for x in df["MA5"]],
            "ma20": [round(x, 2) if not pd.isna(x) else None for x in df["MA20"]],
            "rsi": [round(x, 1) if not pd.isna(x) else None for x in df["RSI"]],
            "volume": [int(x) for x in df["volume"]],
        }
    }
    
    return result

def print_result(result):
    """打印回测结果"""
    print("\n" + "="*50)
    print(f"📊 回测报告")
    print("="*50)
    print(f"标的: {result['name']}({result['code']})")
    print(f"周期: {result['period']}")
    print(f"策略: {result['strategy']}")
    print(f"初始资金: {result['initial_capital']}元")
    print(f"最终资金: {result['final_capital']}元")
    print(f"总收益: {result['total_return']:+.2f}元 ({result['return_rate']:+.2f}%)")
    print(f"同期买入持有: {result['buy_hold_return']:+.2f}%")
    print(f"总交易次数: {result['total_trades']}次")
    print(f"胜率: {result['win_rate']}%")
    
    # 策略表现评价
    if result['return_rate'] > result['buy_hold_return'] * 1.2:
        print(f"\n🏆 策略跑赢了买入持有！策略有效！")
    elif result['return_rate'] > 0:
        print(f"\n✅ 策略赚钱了，但没跑赢买入持有")
    else:
        print(f"\n❌ 策略亏钱了... 还需要优化")
    
    print(f"\n💡 策略靠{result['total_trades']}次交易，胜率{result['win_rate']}%")
    if result['win_rate'] > 60:
        print("  胜率不错，说明策略的信号比较准")
    elif result['win_rate'] > 40:
        print("  胜率一般，但靠多笔交易赚钱也行")
    else:
        print("  胜率偏低，可能是手续费吃掉了利润")
    
    # 关键对比
    outperformance = result['return_rate'] - result['buy_hold_return']
    if outperformance > 0:
        print(f"\n🔥 策略比买入持有多赚了 {outperformance:+.2f}%")
    else:
        print(f"\n❄️ 策略比买入持有少赚了 {outperformance:+.2f}%")

def save_dashboard_data(results, filename="quant_data/dashboard.json"):
    """保存数据供网页仪表盘读取"""
    combined = []
    for name, result in results.items():
        combined.append(result)
    
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    
    print(f"\n📁 仪表盘数据已保存: {filename}")
    print(f"📱 打开 index.html 在手机上查看")

def main():
    parser = argparse.ArgumentParser(description="AI量化模拟盘 - 回测引擎")
    parser.add_argument("--code", default="000688.SH", help="股票代码，如 000688.SH(科创50)")
    parser.add_argument("--name", default="科创50", help="标的名称")
    parser.add_argument("--days", type=int, default=365, help="回测天数")
    parser.add_argument("--capital", type=int, default=5000, help="初始资金")
    parser.add_argument("--all", action="store_true", help="跑所有策略")
    args = parser.parse_args()
    
    # 获取数据
    df = fetch_data(args.code, args.name, args.days)
    if df is None:
        print("❌ 数据获取失败，尝试其他代码格式...")
        return
    
    # 计算技术指标
    print("🔧 计算技术指标（均线/RSI/MACD/布林带）...")
    df = calculate_indicators(df)
    
    # 选择策略
    if args.all:
        strategies_to_run = list(STRATEGIES.keys())
    else:
        strategies_to_run = ["金叉死叉"]
    
    results = {}
    for strategy_name in strategies_to_run:
        print(f"\n{'='*50}")
        print(f"📈 运行策略: {strategy_name}")
        print('='*50)
        result = run_backtest(df, strategy_name, args.capital, code=args.code, name=args.name)
        if result:
            print_result(result)
            results[strategy_name] = result
    
    if results:
        save_dashboard_data(results)

if __name__ == "__main__":
    # 如果没有参数，先看看akshare能不能用
    try:
        import akshare
    except ImportError:
        print("⚠️ 未安装 akshare，正在安装...")
        os.system("pip3 install akshare -q")
    
    main()
