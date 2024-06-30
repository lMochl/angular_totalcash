const jwt = require('jsonwebtoken');
const jwtSecret = 'angular';

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ auth: false, message: 'No token provided' });
  }

  const bearerToken = token.slice(7);

  jwt.verify(bearerToken, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ auth: false, message: 'Failed to authenticate token' });
    }
    
    req.userId = decoded.id;
    next();
  });
}

module.exports = verifyToken;
