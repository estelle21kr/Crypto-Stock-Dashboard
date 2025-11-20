import jwt from 'jsonwebtoken';

// JWT 비밀 키 (환경 변수에서 가져오기)
const JWT_SECRET = process.env.JWT_SECRET || 'your-key-change-this';

// 토큰 생성
export function generateToken(userId, email) {
  return jwt.sign(
    { 
      userId, 
      email 
    },
    JWT_SECRET,
    { 
      expiresIn: '7d'  // 7일 유효
    }
  );
}

// 토큰 검증
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
