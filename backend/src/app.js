// backend/src/app.js

// Charger les variables d'environnement
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

// Importer les routes SmartLink
const smartlinkRoutes = require('../routes/smartlink.routes');
const smartlinkPublicRoutes = require('../routes/smartlink.public.routes');

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
      'http://localhost:3002'
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- 🔗 ROUTES SMARTLINKS PUBLIQUES (AVANT API) ---
// Ces routes doivent être AVANT les routes API pour intercepter les requêtes
app.use('/', smartlinkPublicRoutes);

// --- Monter les Routeurs SmartLink ---
app.use('/api/v1/smartlinks', smartlinkRoutes);

// --- Route principale API v1 ---
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'SmartLink API v1 est opérationnelle !',
    version: '1.0.0',
    endpoints: {
      smartlinks: '/api/v1/smartlinks',
      public: '/s/:slug or /:shortId'
    }
  });
});

// --- Route de test ---
app.get('/api', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'SmartLink API est opérationnelle !',
    note: 'Utilisez /api/v1 pour les nouvelles requêtes'
  });
});

// --- Middleware de Gestion d'Erreurs Global ---
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

  // Erreurs Mongoose
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Ressource non trouvée. L'identifiant fourni est invalide: ${err.value}`;
    error.statusCode = 404;
    error.message = message;
  }
  
  if (err.code === 11000) {
    let field = Object.keys(err.keyValue)[0];
    let value = err.keyValue[field];
    field = field.charAt(0).toUpperCase() + field.slice(1);
    const message = `Le champ '${field}' avec la valeur '${value}' existe déjà. Cette valeur doit être unique.`;
    error.statusCode = 400;
    error.message = message;
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Données invalides: ${messages.join('. ')}`;
    error.statusCode = 400;
    error.message = message;
  }
  
  if (err.name === 'JsonWebTokenError') {
    const message = 'Authentification échouée (token invalide). Veuillez vous reconnecter.';
    error.statusCode = 401;
    error.message = message;
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error.statusCode = 401;
    error.message = message;
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
      console.log(`🚀 SmartLink API démarré en mode ${process.env.NODE_ENV || 'development'} sur le port ${PORT}`);
      console.log(`📱 Public SmartLinks: http://localhost:${PORT}/s/:slug`);
      console.log(`🔧 Admin API: http://localhost:${PORT}/api/v1/smartlinks`);
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