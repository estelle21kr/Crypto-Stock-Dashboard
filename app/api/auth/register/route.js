import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { email, name, password } = await request.json();
    
    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json({ 
        success: false, 
        error: 'All fields are required' 
      }, { status: 400 });
    }
    
    // 이메일 중복 확인
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already exists' 
      }, { status: 400 });
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const [result] = await pool.query(
      'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
      [email, name, hashedPassword]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
