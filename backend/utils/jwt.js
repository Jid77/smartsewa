const jwt = require('jsonwebtoken');

const create = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
};

const verify = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (err) {
    return null; 
  }
};

module.exports = { create, verify };