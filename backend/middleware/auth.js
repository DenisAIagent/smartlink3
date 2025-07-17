const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

// Middleware de protection des routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifier le header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Vérifier les cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Mode bypass pour développement
  const bypassAuth = process.env.NODE_ENV === 'development' || process.env.VITE_BYPASS_AUTH === 'true';
  
  if (token === 'dev-bypass-token' || bypassAuth) {
    console.log('🔓 Auth: Bypass activé pour développement/production');
    
    try {
      // Créer ou récupérer l'utilisateur de développement
      let devUser = await User.findOne({ email: 'denis@mdmcmusicads.com' });
      
      if (!devUser) {
        console.log('👤 Création utilisateur de développement...');
        devUser = await User.create({
          username: 'denis',
          email: 'denis@mdmcmusicads.com',
          role: 'admin',
          password: 'dev-password-123' // Mot de passe factice
        });
        console.log('👤 Utilisateur de développement créé:', devUser._id);
      } else {
        console.log('👤 Utilisateur de développement récupéré:', devUser._id);
      }

      console.log('🔍 req.user._id défini à:', devUser._id);
      req.user = devUser;
      return next();
    } catch (error) {
      console.error('❌ Erreur création utilisateur dev:', error);
      return next(new ErrorResponse('Erreur d\'authentification en mode développement', 500));
    }
  }

  // Vérifier si token existe
  if (!token) {
    return next(new ErrorResponse('Accès non autorisé, token manquant', 401));
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Token invalide', 401));
  }
});

// Middleware d'autorisation par rôle
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Rôle ${req.user.role} non autorisé`, 403));
    }
    next();
  };
};
