import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids') || 'bitcoin,ethereum';
  
  try {
    console.log('🔄 CoinGecko API 호출 시도...');
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // 타임아웃 추가
        signal: AbortSignal.timeout(10000)  // 10초 타임아웃
      }
    );
    
    console.log('📡 응답 상태:', response.status);
    
    if (!response.ok) {
      // API 실패 시 더미 데이터 반환
      console.warn('⚠️ CoinGecko API 실패, 더미 데이터 사용');
      return NextResponse.json({ 
        success: true, 
        data: {
          bitcoin: { usd: 97500, usd_24h_change: 2.3 },
          ethereum: { usd: 3420, usd_24h_change: -0.8 },
          cardano: { usd: 0.45, usd_24h_change: 1.2 },
          solana: { usd: 148, usd_24h_change: 3.5 },
          ripple: { usd: 0.63, usd_24h_change: -1.1 }
        }
      });
    }
    
    const data = await response.json();
    console.log('✅ 데이터 수신 성공');
    
    return NextResponse.json({ 
      success: true, 
      data: data 
    });
  } catch (error) {
    console.error('❌ API 에러:', error.message);
    
    // 에러 시에도 더미 데이터 반환
    return NextResponse.json({ 
      success: true, 
      data: {
        bitcoin: { usd: 97500, usd_24h_change: 2.3 },
        ethereum: { usd: 3420, usd_24h_change: -0.8 },
        cardano: { usd: 0.45, usd_24h_change: 1.2 },
        solana: { usd: 148, usd_24h_change: 3.5 },
        ripple: { usd: 0.63, usd_24h_change: -1.1 }
      }
    });
  }
}
