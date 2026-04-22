import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'daami-secret';

export const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '7d' });

export const verifyToken = (token) => {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
};

export const getTokenFromRequest = (request) => {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/daami_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
};

export const requireAuth = (request) => {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
};

export const requireAdmin = (request) => {
  const user = requireAuth(request);
  if (!user || user.role !== 'admin') return null;
  return user;
};
