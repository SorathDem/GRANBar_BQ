// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const functions = require('firebase-functions');
const User = require('../models/User');

async function auth(req, res, next) {
  const bearer = req.headers.authorization;
  if(!bearer) return res.status(401).send('No token');
  const token = bearer.split(' ')[1];
  try {
    const data = jwt.verify(token, functions.config().jwt.secret);
    req.user = await User.findById(data.id);
    next();
  } catch (e) { res.status(401).send('Token inválido'); }
}

function requireRole(role) {
  return (req, res, next) => {
    if(req.user && req.user.role === role) return next();
    return res.status(403).send('No autorizado');
  }
}

module.exports = { auth, requireRole };
