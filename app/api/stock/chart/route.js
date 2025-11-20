import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    // 일일 데이터 가져오기 (30일)
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`
    );
    
    const data = await response.json();
    
    if (!data['Time Series (Daily)']) {
      throw new Error('No data for this symbol');
    }
    
    // 데이터 포맷팅
    const timeSeries = data['Time Series (Daily)'];
    const formattedData = Object.entries(timeSeries)
      .slice(0, 30)  // 최근 30일만
      .reverse()     // 오래된 순서로 정렬
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        price: parseFloat(values['4. close']),
        timestamp: new Date(date).getTime()
      }));
    
    return NextResponse.json({ 
      success: true, 
      data: formattedData 
    });
  } catch (error) {
    console.error('❌ Stock Chart API Error:', error.message);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
