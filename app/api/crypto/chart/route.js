import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'bitcoin';
  const days = searchParams.get('days') || '7';
  
  try {
    // CoinGecko 차트 데이터 API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // 데이터 포맷팅 (Recharts에 맞게)
    const formattedData = data.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      price: price,
      timestamp: timestamp
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: formattedData 
    });
  } catch (error) {
    console.error('❌ Chart API Error:', error.message);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
