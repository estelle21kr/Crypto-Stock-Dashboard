// ============================================
// 클라이언트 컴포넌트 선언
// Next.js 13+ App Router에서 브라우저 기능(useState, useEffect 등)을 사용하려면 필수
// ============================================
'use client';

// ============================================
// React 훅 및 컴포넌트 import
// ============================================
import { useEffect, useState } from 'react';
import CryptoChart from '@/components/CryptoChart';  // 차트 컴포넌트
import { useRouter } from 'next/navigation';

// ============================================
// TypeScript 인터페이스 정의
// 데이터 구조를 명확히 정의하여 타입 안정성 확보
// ============================================

// 개별 암호화폐 데이터 구조
interface CryptoData {
  usd: number;
  usd_24h_change?: number;      // 암호화폐용 (optional)
  changePercent?: number;        // 주식용 (optional)
  change?: number;               // 주식 변동 금액 (optional)
  name?: string;                 // 주식 이름 (optional)
}

// 여러 암호화폐를 담는 객체 구조
// 예: { bitcoin: { usd: 98000, usd_24h_change: 2.5 }, ethereum: {...} }
interface CryptoResponse {
  [key: string]: CryptoData;  // 키(코인명)로 CryptoData 접근
}

// 포트폴리오 항목 구조 (MySQL portfolios 테이블과 동일)
interface Portfolio {
  id: number;                 // 고유 ID
  symbol: string;             // 코인 심볼 (예: bitcoin)
  coin_name: string;          // 표시 이름 (예: Bitcoin)
  quantity: number;           // 보유 수량
  purchase_price: number;     // 매입 가격
  added_at: string;           // 추가 날짜
  type?: string;              // 코인 타입 (crypto 또는 stock)
}


// ============================================
// 메인 컴포넌트
// ============================================
export default function Home() {
  
  const router = useRouter();
  // ============================================
  // 로그인 상태 관리
  // ============================================
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    // 로그인 체크
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // 로그인 안 됨 → 로그인 페이지로
      router.push('/login');
      return;
    }
    
    setCurrentUser(JSON.parse(user));
  }, [router]);

  // ============================================
  // 상태(State) 관리
  // useState: 컴포넌트의 데이터를 저장하고 변경 시 자동으로 화면 업데이트
  // ============================================
  
  // 암호화폐 실시간 가격 데이터
  const [cryptoData, setCryptoData] = useState<CryptoResponse | null>(null);
  const [stockData, setStockData] = useState<CryptoResponse | null>(null);  // 추가

  // 사용자 포트폴리오 목록 (MySQL에서 가져온 데이터)
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  
  // 로딩 상태 (true: 로딩 중, false: 완료)
  const [loading, setLoading] = useState(true);
  
  // 에러 메시지 저장
  const [error, setError] = useState<string | null>(null);
  
  // 코인 추가 폼 표시 여부
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 새로 추가할 코인 정보 (폼 입력값)
  const [newCoin, setNewCoin] = useState({
    symbol: '',          // 코인 심볼
    coinName: '',        // 표시 이름
    quantity: '',        // 수량
    purchasePrice: '',    // 매입 가격
    type: 'crypto'       // 코인 타입 (crypto 또는 stock)
  });
  
  // 차트 모달 관련 상태
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);      // 선택된 코인 ID
  const [selectedCoinName, setSelectedCoinName] = useState<string>('');       // 선택된 코인 이름


  // ============================================
  // 수정 기능 관련 상태 추가
  // ============================================
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Portfolio | null>(null);
  const [editCoin, setEditCoin] = useState({
    symbol: '',
    coinName: '',
    quantity: '',
    purchasePrice: '',
    type: 'crypto'
  });


  // ============================================
  // useEffect: 컴포넌트 마운트 시 실행
  // 페이지가 처음 로드될 때 한 번만 실행되는 코드
  // ============================================
  useEffect(() => {
    // 초기 데이터 로딩
    fetchCryptoData();      // 암호화폐 가격 가져오기
    fetchPortfolio();       // 포트폴리오 가져오기
    fetchStockData(); 

    // 30초마다 자동으로 암호화폐 가격 업데이트
  const interval = setInterval(() => {
        fetchCryptoData();
        fetchStockData();    // 추가
      }, 120000); // 2분마다 업데이트

    // 컴포넌트 언마운트 시 interval 정리 (메모리 누수 방지)
    return () => clearInterval(interval);
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  // ============================================
  // 함수: 암호화폐 가격 데이터 가져오기
  // /api/crypto/price API 호출
  // ============================================
  const fetchCryptoData = async () => {
    try {
      // API 호출 (5개 코인)
      const response = await fetch('/api/crypto/price?ids=bitcoin,ethereum,cardano,solana,ripple');
      const result = await response.json();
      
      // 성공 시 데이터 저장
      if (result.success) {
        setCryptoData(result.data);
        setError(null);
      }
    } catch (err) {
      // 실패 시 에러 메시지 표시
      setError('네트워크 오류');
    } finally {
      // 성공/실패 관계없이 로딩 종료
      setLoading(false);
    }
  };

  // ============================================
  // 함수: 주식 가격 데이터 가져오기
  // ============================================
  const fetchStockData = async () => {
    try {
      // 인기 미국 주식 5개
      const response = await fetch('/api/stock/price?symbols=AAPL,GOOGL,MSFT,TSLA,AMZN');
      const result = await response.json();
      
      if (result.success) {
        setStockData(result.data);
      }
    } catch (err) {
      console.error('주식 데이터 로딩 실패:', err);
    }
  };

        {/* ============================================
            전체 주식 시세 섹션 (stockData가 있을 때만 표시)
        ============================================ */}
        {stockData && Object.keys(stockData).length > 0 && (
          <>
            <div className="mb-4 mt-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 미국 주식 시세</h2>
              <p className="text-sm text-gray-500">💡 포트폴리오에 추가할 수 있습니다</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(stockData).map(([symbol, data]) => {
                const isPositive = (data.changePercent || 0) >= 0;
                
                return (
                  <div 
                    key={symbol} 
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {symbol}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">심볼: {symbol}</p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                        주식
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">현재 가격</p>
                      <p className="text-4xl font-bold text-gray-900">
                        ${data.usd?.toLocaleString()}
                      </p>
                    </div>

                      <div className={`flex items-center p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className="text-2xl mr-2">
                        {isPositive ? '📈' : '📉'}
                      </span>
                      <div>
                        <p className="text-xs text-gray-600">변동</p>
                        <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{(data.changePercent || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>


                    <button
                      onClick={() => {
                        setSelectedCoin(symbol);
                        setSelectedCoinName(symbol);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      📊 차트 보기
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}


  // ============================================
  // 함수: 포트폴리오 데이터 가져오기
  // /api/portfolio API 호출 (MySQL SELECT)
  // ============================================
  const fetchPortfolio = async () => {
    try {
      // userId=1인 사용자의 포트폴리오 조회
      const response = await fetch('/api/portfolio?userId=1');
      const result = await response.json();
      
      // 성공 시 포트폴리오 목록 저장
      if (result.success) {
        setPortfolio(result.data);
      }
    } catch (err) {
      console.error('포트폴리오 로딩 실패:', err);
    }
  };

  // ============================================
  // 함수: 포트폴리오에 코인 추가
  // 폼 제출 시 실행 (MySQL INSERT)
  // ============================================
  const addToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          symbol: newCoin.symbol.toUpperCase(),  // 주식은 대문자
          coinName: newCoin.coinName,
          quantity: parseFloat(newCoin.quantity),
          purchasePrice: parseFloat(newCoin.purchasePrice),
          type: newCoin.type  // 추가
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 포트폴리오에 추가되었습니다!');
        setShowAddForm(false);
        setNewCoin({ symbol: '', coinName: '', quantity: '', purchasePrice: '', type: 'crypto' });
        fetchPortfolio();
      }
    } catch (err) {
      alert('❌ 추가 실패');
    }
  };


  // ============================================
  // 함수: 포트폴리오에서 코인 삭제
  // 삭제 버튼 클릭 시 실행 (MySQL DELETE)
  // ============================================
  const removeFromPortfolio = async (id: number) => {
    // 사용자 확인
    if (!confirm('포트폴리오에서 삭제하시겠습니까?')) return;
    
    try {
      // DELETE 요청
      const response = await fetch(`/api/portfolio?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      // 성공 시
      if (result.success) {
        alert('✅ 삭제되었습니다!');
        fetchPortfolio();  // 포트폴리오 다시 불러오기
      }
    } catch (err) {
      alert('❌ 삭제 실패');
    }
  };

    // ============================================
  // 함수: 수정 모달 열기
  // 선택한 항목의 데이터를 editCoin에 채우기
  // ============================================
  const openEditForm = (item: Portfolio) => {
    setEditingItem(item);
    setEditCoin({
      symbol: item.symbol,
      coinName: item.coin_name,
      quantity: item.quantity.toString(),
      purchasePrice: item.purchase_price.toString(),
      type: item.type || 'crypto'
    });
    setShowEditForm(true);
  };

  // ============================================
  // 함수: 포트폴리오 항목 수정
  // PUT 요청으로 MySQL UPDATE
  // ============================================
  const updatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;
    
    try {
      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          symbol: editCoin.symbol.toLowerCase(),
          coinName: editCoin.coinName,
          quantity: parseFloat(editCoin.quantity),
          purchasePrice: parseFloat(editCoin.purchasePrice),
          type: editCoin.type
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 수정되었습니다!');
        setShowEditForm(false);
        setEditingItem(null);
        setEditCoin({ symbol: '', coinName: '', quantity: '', purchasePrice: '', type: 'crypto' });
        fetchPortfolio();  // 포트폴리오 다시 불러오기
      }
    } catch (err) {
      alert('❌ 수정 실패');
    }
  };



  // ============================================
  // 함수: 수익/손실 계산
  // 포트폴리오 항목의 현재 수익률 계산
  // ============================================
  const calculateProfit = (portfolio: Portfolio) => {
  
    // 암호화폐와 주식 모두 처리
    const allData = { ...cryptoData, ...stockData };
    
    // 현재 가격 가져오기 (실시간 데이터에서)
    const currentPrice = allData?.[portfolio.symbol]?.usd || 0;
    
    // 수익 및 수익률 계산
    const profit = (currentPrice - portfolio.purchase_price) * portfolio.quantity;
    
    // 수익률 계산
    const profitPercent = ((currentPrice - portfolio.purchase_price) / portfolio.purchase_price) * 100;
    
    return { profit, profitPercent, currentPrice };
  };
    // ============================================
  // 함수: 포트폴리오 전체 요약 정보 계산
  // 총 투자금액, 현재 평가액, 총 수익/손실 계산
  // ============================================
  const calculatePortfolioSummary = () => {
    let totalInvestment = 0;      // 총 투자금액
    let totalCurrentValue = 0;    // 총 현재 평가액
    let bestProfit = { coin: '', percent: -Infinity };  // 최고 수익 코인
    let worstProfit = { coin: '', percent: Infinity };  // 최대 손실 코인

    portfolio.forEach((item) => {
      // 투자금액 = 매입가 × 수량
      const investment = item.purchase_price * item.quantity;
      totalInvestment += investment;

      // 현재 평가액 = 현재가 × 수량
      const currentPrice = cryptoData?.[item.symbol]?.usd || item.purchase_price;
      const currentValue = currentPrice * item.quantity;
      totalCurrentValue += currentValue;

      // 수익률 계산
      const profitPercent = ((currentPrice - item.purchase_price) / item.purchase_price) * 100;

      // 최고 수익 코인 추적
      if (profitPercent > bestProfit.percent) {
        bestProfit = { coin: item.coin_name, percent: profitPercent };
      }

      // 최대 손실 코인 추적
      if (profitPercent < worstProfit.percent) {
        worstProfit = { coin: item.coin_name, percent: profitPercent };
      }
    });

    // 총 수익/손실
    const totalProfit = totalCurrentValue - totalInvestment;
    const totalProfitPercent = totalInvestment === 0 ? 0 : (totalProfit / totalInvestment) * 100;

    return {
      totalInvestment,
      totalCurrentValue,
      totalProfit,
      totalProfitPercent,
      bestProfit: bestProfit.coin ? bestProfit : null,
      worstProfit: worstProfit.coin ? worstProfit : null
    };
  };


  // ============================================
  // 조건부 렌더링: 로딩 중일 때
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* 회전하는 로딩 스피너 */}
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">암호화폐 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // 메인 UI 렌더링
  // ============================================
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ============================================
            헤더 섹션
        ============================================ */}
          <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-2">
                💰 암호화폐 대시보드
              </h1>
              <p className="text-gray-600">실시간 암호화폐 시세 및 포트폴리오 관리</p>
              <p className="text-sm text-gray-400 mt-2">
                마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
              </p>
            </div>
            
            {/* 사용자 정보 및 로그아웃 */}
            {currentUser && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  👤 {currentUser.name}
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
                >
                  🚪 로그아웃
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================
            내 포트폴리오 섹션
        ============================================ */}
        <div className="mb-8">
          {/* 제목 및 추가 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-800">📈 내 포트폴리오</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}  // 폼 토글
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              {showAddForm ? '❌ 취소' : '➕ 코인 추가'}
            </button>
          </div>


        {/* ============================================
            포트폴리오 요약 대시보드 (포트폴리오가 있을 때만 표시)
        ============================================ */}
        {portfolio.length > 0 && (
          (() => {
            const summary = calculatePortfolioSummary();
            const isProfit = summary.totalProfit >= 0;

            return (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 카드 1: 총 투자금액 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-700">총 투자금액</p>
                    <span className="text-2xl">💵</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    ${summary.totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* 카드 2: 현재 평가액 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-purple-700">현재 평가액</p>
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    ${summary.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* 카드 3: 총 수익/손실 */}
                <div className={`bg-gradient-to-br ${isProfit ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} p-6 rounded-xl shadow-lg border-2`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-semibold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                      총 수익/손실
                    </p>
                    <span className="text-2xl">{isProfit ? '🎉' : '😢'}</span>
                  </div>
                  <p className={`text-3xl font-bold ${isProfit ? 'text-green-900' : 'text-red-900'}`}>
                    {isProfit ? '+' : ''}{summary.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} $
                  </p>
                  <p className={`text-sm font-semibold mt-2 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    ({isProfit ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%)
                  </p>
                </div>

                {/* 카드 4: 통계 정보 */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-lg border-2 border-amber-200">
                  <p className="text-sm font-semibold text-amber-700 mb-3">📊 통계</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-amber-600">최고 수익</p>
                      <p className="text-lg font-bold text-green-600">
                        {summary.bestProfit ? `${summary.bestProfit.coin} (+${summary.bestProfit.percent.toFixed(2)}%)` : '데이터 없음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">최대 손실</p>
                      <p className="text-lg font-bold text-red-600">
                        {summary.worstProfit ? `${summary.worstProfit.coin} (${summary.worstProfit.percent.toFixed(2)}%)` : '데이터 없음'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}


          {/* ============================================
              코인 추가 폼 (showAddForm이 true일 때만 표시)
          ============================================ */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-700">새 코인 추가하기</h3>
              
              {/* 폼 제출 시 addToPortfolio 함수 실행 */}
              <form onSubmit={addToPortfolio}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 새로운 필드: 타입 선택 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ 타입 선택
                    </label>
                    <select
                      value={newCoin.type || 'crypto'}
                      onChange={(e) => setNewCoin({...newCoin, type: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="crypto">🪙 암호화폐</option>
                      <option value="stock">📈 주식</option>
                    </select>
                  </div>

                  {/* 입력 필드 2: 표시 이름 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ 표시 이름 (자유입력)
                    </label>
                    <input
                      type="text"
                      placeholder="비트코인, Bitcoin 등"
                      value={newCoin.coinName}
                      onChange={(e) => setNewCoin({...newCoin, coinName: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 화면에 보여질 이름</p>
                  </div>

                  {/* 입력 필드 3: 보유 수량 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💎 보유 수량 (개)
                    </label>
                    <input
                      type="number"
                      step="0.0001"      // 소수점 4자리까지
                      min="0"            // 최소값 0
                      placeholder="0.5"
                      value={newCoin.quantity}
                      onChange={(e) => setNewCoin({...newCoin, quantity: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 내가 가지고 있는 개수</p>
                  </div>

                  {/* 입력 필드 4: 매입 가격 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💵 매입 가격 (달러)
                    </label>
                    <input
                      type="number"
                      step="0.01"        // 소수점 2자리까지
                      placeholder="90000"
                      value={newCoin.purchasePrice}
                      onChange={(e) => setNewCoin({...newCoin, purchasePrice: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 샀을 때 가격 (달러 기준)</p>
                  </div>
                </div>
                
                {/* 제출 버튼 */}
                <button
                  type="submit"
                  className="mt-6 w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-lg"
                >
                  ✅ 포트폴리오에 추가하기
                </button>
              </form>
            </div>
          )}

          {/* ============================================
              포트폴리오 목록 표시
              portfolio 배열에 데이터가 있으면 목록 표시, 없으면 안내 메시지
          ============================================ */}
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {/* portfolio 배열의 각 항목을 map으로 순회하며 카드 생성 */}
              {portfolio.map((item) => {
                // 수익/손실 계산
                const { profit, profitPercent, currentPrice } = calculateProfit(item);
                const isProfit = profit >= 0;  // 수익인지 손실인지 판단
                
                return (
                  <div key={item.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    {/* 6열 그리드: 코인명, 수량, 매입가, 현재가, 수익/손실, 삭제버튼 */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                      
                      {/* 1. 코인 정보 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">코인</p>
                        <h3 className="text-xl font-bold capitalize">{item.coin_name}</h3>
                        <p className="text-xs text-gray-400">{item.symbol}</p>
                      </div>
                      
                      {/* 2. 보유 수량 */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">보유 수량</p>
                        <p className="text-lg font-semibold">
                          {item.quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4
                          })} 개
                        </p>
                      </div>
                      
                      {/* 3. 매입 가격 */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">매입 가격</p>
                        <p className="text-lg font-semibold">${item.purchase_price.toLocaleString()}</p>
                      </div>
                      
                      {/* 4. 현재 가격 (실시간) */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">현재 가격</p>
                        <p className="text-lg font-semibold text-blue-600">${currentPrice.toLocaleString()}</p>
                      </div>
                      
                      {/* 5. 수익/손실 */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">수익/손실</p>
                        <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{profit.toFixed(2)} $
                        </p>
                        <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          ({isProfit ? '+' : ''}{profitPercent.toFixed(2)}%)
                        </p>
                      </div>
                      
                      {/* 6. 수정/삭제 버튼 */}
                      <div className="text-center flex flex-col gap-2">
                        {/* 수정 버튼 추가 */}
                        <button
                          onClick={() => openEditForm(item)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                        >
                          ✏️ 수정
                        </button>
                        
                        <button
                          onClick={() => removeFromPortfolio(item.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 포트폴리오가 비어있을 때 표시
            <div className="bg-white p-12 rounded-xl shadow-lg text-center">
              <p className="text-xl text-gray-400 mb-2">아직 포트폴리오가 비어있습니다</p>
              <p className="text-gray-500">위의 "➕ 코인 추가" 버튼을 눌러 시작하세요!</p>
            </div>
          )}
        </div>

        {/* ============================================
            전체 암호화폐 시세 섹션
        ============================================ */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">🌐 전체 암호화폐 시세</h2>
          <p className="text-sm text-gray-500">💡 코인 추가할 때 아래 이름을 복사하세요</p>
        </div>

        {/* 3열 그리드로 암호화폐 카드 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* cryptoData 객체를 [key, value] 배열로 변환하여 순회 */}
          {Object.entries(cryptoData || {}).map(([coin, data]) => {
            const isPositive = (data.usd_24h_change || 0) > 0;  // 상승/하락 판단
            
            return (
              <div 
                key={coin} 
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200"
              >
                {/* 코인 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold capitalize text-gray-800">
                      {coin}  {/* 코인 이름 */}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">심볼: {coin}</p>
                  </div>
                  {/* 코인 약자 배지 */}
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    {coin.slice(0, 3).toUpperCase()}
                  </span>
                </div>

                {/* 현재 가격 */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">현재 가격</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ${data.usd?.toLocaleString()}  {/* 천 단위 콤마 */}
                  </p>
                </div>

                {/* 24시간 변동률 */}
                <div className={`flex items-center p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className="text-2xl mr-2">
                    {isPositive ? '📈' : '📉'}  {/* 상승/하락 이모지 */}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600">24시간 변동</p>
                    <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'}{Math.abs(data.usd_24h_change || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
                
                {/* 차트 보기 버튼 */}
                <button
                  onClick={() => {
                    setSelectedCoin(coin);           // 선택된 코인 설정
                    setSelectedCoinName(coin);       // 차트 제목용
                  }}
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                >
                  📊 차트 보기
                </button>
              </div>
            );
          })}
        </div>

        {/* ============================================
            데이터 새로고침 버튼
        ============================================ */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              fetchCryptoData();    // 암호화폐 가격 다시 불러오기
              fetchPortfolio();     // 포트폴리오 다시 불러오기
              fetchStockData();     // 주식 가격 다시 불러오기
            }}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg font-bold text-lg"
          >
            🔄 데이터 새로고침
          </button>
        </div>

                {/* ============================================
            수정 모달 (showEditForm이 true일 때 표시)
        ============================================ */}
        {showEditForm && editingItem && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditForm(false)}
          >
            <div 
              className="bg-white rounded-xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  ✏️ 포트폴리오 수정
                </h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  ❌ 취소
                </button>
              </div>
              
              {/* 수정 폼 */}
              <form onSubmit={updatePortfolio}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* 타입 선택 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ 타입 선택
                    </label>
                    <select
                      value={editCoin.type}
                      onChange={(e) => setEditCoin({...editCoin, type: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="crypto">🪙 암호화폐</option>
                      <option value="stock">📈 주식</option>
                    </select>
                  </div>

                  {/* 심볼 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📌 코인/주식 심볼
                    </label>
                    <input
                      type="text"
                      value={editCoin.symbol}
                      onChange={(e) => setEditCoin({...editCoin, symbol: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* 표시 이름 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ 표시 이름
                    </label>
                    <input
                      type="text"
                      value={editCoin.coinName}
                      onChange={(e) => setEditCoin({...editCoin, coinName: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* 보유 수량 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💎 보유 수량
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editCoin.quantity}
                      onChange={(e) => setEditCoin({...editCoin, quantity: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* 매입 가격 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💵 매입 가격 (달러)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editCoin.purchasePrice}
                      onChange={(e) => setEditCoin({...editCoin, purchasePrice: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                
                {/* 저장 버튼 */}
                <button
                  type="submit"
                  className="mt-6 w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-lg"
                >
                  💾 수정 저장
                </button>
              </form>
            </div>
          </div>
        )}
        

        
        {/* ============================================
            차트 모달 (selectedCoin이 있을 때만 표시)
            모달: 화면 중앙에 팝업처럼 띄우는 UI
        ============================================ */}
        {selectedCoin && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCoin(null)}  // 배경 클릭 시 닫기
          >
            {/* 모달 내용 (클릭 시 닫히지 않도록 이벤트 전파 중단) */}
            <div 
              className="bg-white rounded-xl p-6 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                  {selectedCoinName} 차트
                </h2>
                <button
                  onClick={() => setSelectedCoin(null)}  // 닫기 버튼
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  ❌ 닫기
                </button>
              </div>
              
              {/* 차트 컴포넌트 렌더링 */}
              <CryptoChart coinId={selectedCoin} coinName={selectedCoinName} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
