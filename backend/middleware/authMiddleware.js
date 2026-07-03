import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if authorization header is present and starts with Bearer
  if (
    req.headers.authorization &&
    (req.headers.authorization.startsWith('Bearer') || req.headers.authorization.startsWith('Bearer '))
  ) {
    try {
      // Get token from header (split by space)
      token = req.headers.authorization.split(' ')[1] || req.headers.authorization;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

      // Get user from the token and attach to request
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  } else {
    // Check if token was passed directly without bearer prefix
    token = req.headers.authorization;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        req.user = await User.findById(decoded.id);
        if (req.user) {
          return next();
        }
      } catch (err) {}
    }
    
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};
export default protect;
