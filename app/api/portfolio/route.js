import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 포트폴리오 조회
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 1; // 임시로 userId=1 사용

  try {
    const [portfolios] = await pool.query(
      'SELECT * FROM portfolios WHERE user_id = ? ORDER BY added_at DESC',
      [userId]
    );

    return NextResponse.json({ 
      success: true, 
      data: portfolios 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST: 포트폴리오에 항목 추가 (암호화폐 또는 주식)
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = 1, symbol, coinName, quantity, purchasePrice, type = 'crypto' } = body;

    const [result] = await pool.query(
      'INSERT INTO portfolios (user_id, symbol, coin_name, type, quantity, purchase_price) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, symbol, coinName, type, quantity, purchasePrice]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Added to portfolio',
      id: result.insertId
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT: 포트폴리오 항목 수정
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, symbol, coinName, quantity, purchasePrice, type } = body;

    await pool.query(
      'UPDATE portfolios SET symbol = ?, coin_name = ?, quantity = ?, purchase_price = ?, type = ? WHERE id = ?',
      [symbol, coinName, quantity, purchasePrice, type, id]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Portfolio updated successfully' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}



// DELETE: 포트폴리오에서 코인 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await pool.query('DELETE FROM portfolios WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Removed from portfolio' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}


