// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    // Bypass en développement
    const bypassAuth = process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true';
    
    if (bypassAuth) {
      // Créer ou récupérer l'utilisateur de développement
      let devUser = await User.findOne({ email: 'denis@mdmcmusicads.com' });
      if (!devUser) {
        devUser = await User.create({
          username: 'denis',
          email: 'denis@mdmcmusicads.com',
          role: 'admin',
          password: 'dev-password-123'
        });
      }
      
      req.user = devUser;
      console.log('🔓 BYPASS_AUTH activé - Utilisateur dev:', devUser.email);
      return next();
    }

    // Récupérer le token depuis l'en-tête Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Accès refusé. Aucun token fourni.'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide. Utilisateur non trouvé.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur auth middleware:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide.'
    });
  }
};

// Middleware pour vérifier le rôle admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }
};

module.exports = { auth, adminOnly };