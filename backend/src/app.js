// backend/src/app.js

// Charger les variables d'environnement
if (process.env.NODE_ENV !== 'production') {
  // Si .env est à la racine du projet (un niveau au-dessus de src)
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  // Si .env est dans le même dossier que package.json (racine du backend)
  // require('dotenv').config(); // Cela suppose que le CWD est la racine du backend
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path'); // Utile pour construire des chemins

// Importer la classe ErrorResponse et le gestionnaire d'erreurs global
// CORRIGÉ: Chemin pour remonter du dossier 'src' vers 'utils'
const ErrorResponse = require('../utils/errorResponse');
// CORRIGÉ: Chemin pour remonter du dossier 'src' vers 'middleware' (si vous avez un errorHandler séparé)
// const errorHandler = require('../middleware/errorHandler');

// --- Importer vos fichiers de routes ---
// CORRIGÉ: Chemins pour remonter du dossier 'src' vers 'routes'
const authRoutes = require('../routes/auth.routes');
const artistRoutes = require('../routes/artists.routes');
const smartlinkRoutes = require('../routes/smartlink.routes');
const smartlinkPublicRoutes = require('../routes/smartlink.public.routes');
const uploadRoutes = require('../routes/uploadRoutes');
const wordpressRoutes = require('../routes/wordpress.routes');
const analyticsRoutes = require('../routes/analytics');

// Ajoutez d'autres routeurs ici selon votre projet
// const userRoutes = require('../routes/user.routes.js');

const app = express();

// --- Connexion à la base de données MongoDB ---
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('ERREUR: La variable d\'environnement MONGO_URI n\'est pas définie.');
      process.exit(1);
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// --- Middlewares ---
// Configuration CORS complète pour développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
} else {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://192.168.1.236:3000',
      'http://192.168.1.236:3001',
      'http://192.168.1.236:3002'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }));
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- 🔗 ROUTES SMARTLINKS PUBLIQUES (AVANT API) ---
// Ces routes doivent être AVANT les routes API pour intercepter les requêtes
app.use('/', smartlinkPublicRoutes);

// --- Monter les Routeurs ---
// ✅ CORRECTION: Toutes les routes maintenant sur /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/artists', artistRoutes);
app.use('/api/v1/smartlinks', smartlinkRoutes);
app.use('/api/v1/wordpress', wordpressRoutes);
app.use('/api/wordpress', wordpressRoutes); // ⭐ Ajoutez cette ligne
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use("/api/v1/reviews", require("../routes/reviews.routes"));
app.use("/api/simulator", require("../routes/simulator.routes"));

// ✅ CORRECTION: Route principale API v1
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API MDMC Music Ads v1 est opérationnelle !',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      artists: '/api/v1/artists',
      smartlinks: '/api/v1/smartlinks',
      upload: '/api/v1/upload',
      wordpress: '/api/v1/wordpress',
      reviews: '/api/v1/reviews'
    }
  });
});

// ✅ CORRECTION: Maintenir compatibilité ancienne route
app.get('/api', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API MDMC Music Ads est opérationnelle !',
    note: 'Utilisez /api/v1 pour les nouvelles requêtes'
  });
});

// --- Middleware de Gestion d'Erreurs Global ---
// (Logique du errorHandler comme fournie précédemment, utilisant ErrorResponse)
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('--- GESTIONNAIRE D\'ERREURS GLOBAL ---');
  console.error('Message:', err.message);
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.error('Erreur Complète:', err);
      if(err.stack) console.error('Stack:', err.stack);
  }
  console.error('------------------------------------');

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Ressource non trouvée. L'identifiant fourni est invalide: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  if (err.code === 11000) {
    let field = Object.keys(err.keyValue)[0];
    let value = err.keyValue[field];
    field = field.charAt(0).toUpperCase() + field.slice(1);
    const message = `Le champ '${field}' avec la valeur '${value}' existe déjà. Cette valeur doit être unique.`;
    error = new ErrorResponse(message, 400);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Données invalides: ${messages.join('. ')}`;
    error = new ErrorResponse(message, 400);
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Authentification échouée (token invalide). Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur Interne du Serveur'
  });
});

// --- Démarrage du Serveur ---
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5001;
  const server = app.listen(
    PORT,
    () => {
      console.log(`Serveur démarré en mode ${process.env.NODE_ENV || 'inconnu (probablement development)'} sur le port ${PORT}`);
    }
  );
  
  return server;
};

// Start the server
startServer().then(serverInstance => {
  // Store server instance for error handling
  process.on('unhandledRejection', (err, promise) => {
    console.error(`ERREUR (Unhandled Rejection): ${err.message || err}`);
    serverInstance.close(() => process.exit(1));
  });
  
  process.on('uncaughtException', (err) => {
    console.error(`ERREUR (Uncaught Exception): ${err.message || err}`);
    serverInstance.close(() => process.exit(1));
  });
}).catch(err => {
  console.error('Erreur lors du démarrage du serveur:', err);
  process.exit(1);
});

module.exports = app;
