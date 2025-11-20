'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  date: string;
  price: number;
  timestamp: number;
}

interface CryptoChartProps {
  coinId: string;
  coinName: string;
}

export default function CryptoChart({ coinId, coinName }: CryptoChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  useEffect(() => {
    fetchChartData();
  }, [coinId, days]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crypto/chart?id=${coinId}&days=${days}`);
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
      }
    } catch (err) {
      console.error('차트 데이터 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">{coinName} 가격 추이</h3>
        
        {/* 기간 선택 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => setDays('7')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              days === '7' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7일
          </button>
          <button
            onClick={() => setDays('30')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              days === '30' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30일
          </button>
          <button
            onClick={() => setDays('90')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              days === '90' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            90일
          </button>
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#888"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#888"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '가격']}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
