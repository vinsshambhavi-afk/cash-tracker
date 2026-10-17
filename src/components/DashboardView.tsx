import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Banknote, 
  QrCode, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  HandCoins, 
  BellRing, 
  Filter, 
  Layers, 
  BarChart3,
  CheckCircle2,
  Clock,
  Wifi,
  Download
} from 'lucide-react';
import { useISP } from '../context/ISPContext';

interface MonthData {
  monthKey: string;     // e.g. "2026-05"
  monthLabel: string;   // e.g. "May 2026"
  shortLabel: string;   // e.g. "May '26"
  cash: number;
  digital: number;
  total: number;
  receiptCount: number;
}

export const DashboardView: React.FC = () => {
  const { payments, customers, settings, openReceiveCash } = useISP();

  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');

  // Compute Monthly Trends from payments ledger
  const monthlyData: MonthData[] = useMemo(() => {
    const map = new Map<string, { cash: number; digital: number; count: number }>();

    payments.forEach(payment => {
      if (!payment.date) return;
      const d = new Date(payment.date);
      if (isNaN(d.getTime())) return;

      const yearMonth = payment.date.substring(0, 7); // "YYYY-MM"
      const current = map.get(yearMonth) || { cash: 0, digital: 0, count: 0 };

      if (payment.method === 'Cash') {
        current.cash += payment.amount;
      } else {
        current.digital += payment.amount;
      }
      current.count += 1;
      map.set(yearMonth, current);
    });

    // Sort chronologically
    const sortedKeys = Array.from(map.keys()).sort();

    const formatted: MonthData[] = sortedKeys.map(key => {
      const [year, month] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const stats = map.get(key)!;

      return {
        monthKey: key,
        monthLabel,
        shortLabel: `${shortLabel} '${year.slice(-2)}`,
        cash: stats.cash,
        digital: stats.digital,
        total: stats.cash + stats.digital,
        receiptCount: stats.count
      };
    });

    // Apply timeRange filter
    if (timeRange === '6m') {
      return formatted.slice(-6);
    } else if (timeRange === '12m') {
      return formatted.slice(-12);
    }
    return formatted;
  }, [payments, timeRange]);

  // Current and Previous Month Calculations for MoM Trends
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.substring(0, 7);

  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthKey = prevMonthDate.toISOString().split('T')[0].substring(0, 7);

  const currentMonthPayments = payments.filter(p => p.date.startsWith(currentMonthKey));
  const currentMonthTotal = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentMonthCash = currentMonthPayments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0);
  const currentMonthDigital = currentMonthTotal - currentMonthCash;

  const prevMonthPayments = payments.filter(p => p.date.startsWith(prevMonthKey));
  const prevMonthTotal = prevMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  const momGrowth = prevMonthTotal > 0 
    ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
    : 0;

  // Expected pending collections from customers due/overdue
  const pendingRenewalsTotal = customers
    .filter(c => c.status === 'due_today' || c.status === 'due_soon' || c.status === 'overdue')
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  const dueCustomersCount = customers.filter(
    c => c.status === 'due_today' || c.status === 'overdue'
  ).length;

  // Area-wise collection distribution
  const areaCollections = useMemo(() => {
    const areaMap: Record<string, { total: number; cash: number; digital: number }> = {};
    payments.forEach(p => {
      const cust = customers.find(c => c.id === p.customerId);
      const area = cust?.area || 'Main Sector';
      if (!areaMap[area]) areaMap[area] = { total: 0, cash: 0, digital: 0 };
      areaMap[area].total += p.amount;
      if (p.method === 'Cash') {
        areaMap[area].cash += p.amount;
      } else {
        areaMap[area].digital += p.amount;
      }
    });

    return Object.entries(areaMap)
      .map(([area, data]) => ({ area, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [payments, customers]);

  // Plan popularity
  const planDistribution = useMemo(() => {
    const planMap: Record<string, number> = {};
    customers.forEach(c => {
      planMap[c.planName] = (planMap[c.planName] || 0) + 1;
    });
    return Object.entries(planMap).map(([plan, count]) => ({ plan, count }));
  }, [customers]);

  // Export summary report
  const handleExportSummary = () => {
    const headers = ['Month', 'Cash Collections', 'Digital / UPI Collections', 'Total Collections', 'Receipt Count'];
    const rows = monthlyData.map(m => [
      `"${m.monthLabel}"`,
      m.cash,
      m.digital,
      m.total,
      m.receiptCount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISP_Monthly_Collection_Trends_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as MonthData;
      const cashVal = dataItem.cash || 0;
      const digitalVal = dataItem.digital || 0;
      const totalVal = dataItem.total || 0;
      const cashPercent = totalVal > 0 ? Math.round((cashVal / totalVal) * 100) : 0;
      const digitalPercent = totalVal > 0 ? Math.round((digitalVal / totalVal) * 100) : 0;

      return (
        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-700 min-w-[200px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-100">{dataItem.monthLabel}</span>
            <span className="text-[11px] font-mono text-slate-400">{dataItem.receiptCount} receipts</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Cash Received:
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {settings.currencySymbol}{cashVal.toLocaleString()} ({cashPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                Digital / UPI:
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {settings.currencySymbol}{digitalVal.toLocaleString()} ({digitalPercent}%)
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-700/80 flex items-center justify-between font-bold text-white text-sm">
            <span>Total Collections:</span>
            <span className="font-mono tabular-nums text-emerald-300">
              {settings.currencySymbol}{totalVal.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            ISP Billing & Revenue Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize monthly cash vs digital collections, recurring renewal health, and locality performance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Trends (CSV)</span>
          </button>

          <button
            onClick={() => openReceiveCash()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <HandCoins className="w-4 h-4" />
            <span>Receive Cash</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections This Month */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Monthly Collections (Current)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{currentMonthTotal.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {momGrowth >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{momGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {momGrowth.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-400">vs last month ({settings.currencySymbol}{prevMonthTotal.toLocaleString()})</span>
          </div>
        </div>

        {/* Cash vs Digital Ratio */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Cash in Hand (This Month)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {settings.currencySymbol}{currentMonthCash.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {currentMonthTotal > 0 ? Math.round((currentMonthCash / currentMonthTotal) * 100) : 0}% of monthly collections in physical cash
          </div>
        </div>

        {/* Pending Expected Renewals */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Pending Renewal Dues</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {settings.currencySymbol}{pendingRenewalsTotal.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {dueCustomersCount} subscribers due / overdue today
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Subscribers Base</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {customers.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {customers.filter(c => c.status === 'active').length} active lines connected
          </div>
        </div>
      </div>

      {/* Main Monthly Collection Trends Chart Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Monthly Collection Trends (Cash vs Digital)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical revenue performance segmented by physical Cash receipts vs UPI / Bank Transfer
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Chart Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setChartMode('stacked')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  chartMode === 'stacked'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stacked Total</span>
              </button>
              <button
                onClick={() => setChartMode('grouped')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  chartMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  timeRange === '6m'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 6M
              </button>
              <button
                onClick={() => setTimeRange('12m')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  timeRange === '12m'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 12M
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  timeRange === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Data
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Stats Quick Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
              <span className="font-semibold text-slate-700">Cash Received</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span>
              <span className="font-semibold text-slate-700">UPI / Digital Payment</span>
            </div>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Average monthly collection:{' '}
            <strong className="text-slate-900 tabular-nums">
              {settings.currencySymbol}
              {monthlyData.length > 0 
                ? Math.round(monthlyData.reduce((s, m) => s + m.total, 0) / monthlyData.length).toLocaleString() 
                : 0}
            </strong>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-80 w-full pt-2">
          {monthlyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No collection data available for selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                barSize={chartMode === 'stacked' ? 36 : 18}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="shortLabel" 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  dy={8}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => `${settings.currencySymbol}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                  dx={-4}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9', opacity: 0.6 }} />
                
                {/* Cash Bar */}
                <Bar 
                  dataKey="cash" 
                  name="Cash Received" 
                  stackId={chartMode === 'stacked' ? 'a' : undefined} 
                  fill="#059669" 
                  radius={chartMode === 'stacked' ? [0, 0, 4, 4] : [4, 4, 0, 0]} 
                />

                {/* Digital / UPI Bar */}
                <Bar 
                  dataKey="digital" 
                  name="Digital / UPI" 
                  stackId={chartMode === 'stacked' ? 'a' : undefined} 
                  fill="#0284C7" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Analytics Grid: Area Collections & Plan Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Area-Wise Collections Performance (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Service Area Collections Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total collection volume and cash percentage by residential sector
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {areaCollections.length} Sectors
            </span>
          </div>

          <div className="space-y-3">
            {areaCollections.map((item, idx) => {
              const maxTotal = areaCollections[0]?.total || 1;
              const barPercent = Math.min(100, Math.round((item.total / maxTotal) * 100));
              const cashPercent = item.total > 0 ? Math.round((item.cash / item.total) * 100) : 0;

              return (
                <div key={item.area} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {item.area}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono text-[11px]">
                        Cash: {cashPercent}% · Digital: {100 - cashPercent}%
                      </span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {settings.currencySymbol}{item.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Dual color progress bar for cash vs digital */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${(item.cash / item.total) * barPercent}%` }} 
                      className="bg-emerald-600 h-full"
                      title={`Cash: ${settings.currencySymbol}${item.cash}`}
                    />
                    <div 
                      style={{ width: `${(item.digital / item.total) * barPercent}%` }} 
                      className="bg-sky-500 h-full"
                      title={`Digital: ${settings.currencySymbol}${item.digital}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Broadband Plans Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-600" />
                Active Subscription Plans
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of subscriber tier speeds
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {planDistribution.map(p => {
              const percent = Math.round((p.count / customers.length) * 100);
              return (
                <div key={p.plan} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{p.plan}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{percent}% of userbase</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 font-mono font-bold text-slate-900 bg-slate-100 rounded-md">
                      {p.count} Subscribers
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Subscription Base:</span>
            <span className="font-bold text-slate-900 font-mono">{customers.length} Accounts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
