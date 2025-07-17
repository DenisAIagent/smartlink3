// backend/middleware/asyncHandler.js

/**
 * Middleware pour gérer les erreurs async/await
 * Évite d'avoir à utiliser try/catch dans chaque route
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;