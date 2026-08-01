import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { formatCurrency, formatDateShort } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const SalesProfitChart = ({ sales = [] }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Aggregate sales by date
  const chartDataMap = {};

  // Sort sales oldest to newest for chronological chart display
  const sortedSales = [...sales].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedSales.forEach(sale => {
    const label = formatDateShort(sale.date);
    if (!chartDataMap[label]) {
      chartDataMap[label] = { date: label, Revenue: 0, Profit: 0, Cash: 0, Loan: 0 };
    }
    const total = sale.totalPrice || 0;
    const profit = sale.profit || 0;
    chartDataMap[label].Revenue += total;
    chartDataMap[label].Profit += profit;

    if (sale.paymentStatus === 'loan') {
      chartDataMap[label].Loan += total;
    } else {
      chartDataMap[label].Cash += total;
    }
  });

  const chartData = Object.values(chartDataMap).slice(-7); // Last 7 active sales days

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-medium">
        {t('dashboard.noSalesChart')}
      </div>
    );
  }

  return (
    <div className="w-full h-72 pt-4 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#cbd5e1"} opacity={isDark ? 0.5 : 0.8} />
          <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
          <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#0b1329' : '#ffffff', 
              borderColor: isDark ? '#334155' : '#e2e8f0', 
              borderRadius: '12px',
              color: isDark ? '#fff' : '#0f172a',
              fontSize: '12px',
              boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}
            formatter={(val) => formatCurrency(val)}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name={`${t('dashboard.totalRevenue')} ($)`} />
          <Bar dataKey="Profit" fill="#60a5fa" radius={[4, 4, 0, 0]} name={`${t('dashboard.totalNetProfit')} ($)`} />
          <Bar dataKey="Loan" fill="#f43f5e" radius={[4, 4, 0, 0]} name={`${t('dashboard.daynLoanSales')} ($)`} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
