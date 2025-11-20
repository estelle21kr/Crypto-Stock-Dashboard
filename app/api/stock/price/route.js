import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols') || 'AAPL,GOOGL,MSFT';
  
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    // 심볼들을 배열로 변환
    const symbolArray = symbols.split(',').map(s => s.trim());
    
    // 각 심볼에 대해 데이터 가져오기
    const stockData = {};
    
    for (const symbol of symbolArray) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data['Global Quote']) {
          const quote = data['Global Quote'];
          stockData[symbol] = {
            usd: parseFloat(quote['05. price']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
            name: symbol
          };
        }
        
        // Alpha Vantage는 분당 5 calls 제한이 있어서 약간의 딜레이 필요
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: stockData 
    });
  } catch (error) {
    console.error('❌ Stock API Error:', error.message);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
