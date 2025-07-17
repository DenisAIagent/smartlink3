// backend/routes/smartlink.routes.js
const express = require('express');
const router = express.Router();
const SmartLink = require('../models/SmartLink');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const odesliService = require('../services/odesli.service');
const colorExtractorService = require('../services/colorExtractor.service');

// === ROUTES PRIVÉES (Admin) ===

// @desc    Get all SmartLinks for authenticated user
// @route   GET /api/v1/smartlinks
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    artist,
    title,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter query
  const filter = { owner: req.user._id };
  
  if (status) filter.status = status;
  if (artist) filter.artist = { $regex: artist, $options: 'i' };
  if (title) filter.title = { $regex: title, $options: 'i' };

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const smartlinks = await SmartLink.find(filter)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await SmartLink.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: smartlinks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get single SmartLink by ID
// @route   GET /api/v1/smartlinks/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const smartlink = await SmartLink.findById(req.params.id);

  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }

  // Check ownership - robust handling
  let ownerIdToCompare;
  if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
    ownerIdToCompare = smartlink.owner._id;
  } else if (smartlink.owner) {
    ownerIdToCompare = smartlink.owner;
  } else {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  if (ownerIdToCompare.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  res.status(200).json({
    success: true,
    data: smartlink
  });
}));

// @desc    Create new SmartLink
// @route   POST /api/v1/smartlinks
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  console.log('📝 Création SmartLink:', JSON.stringify(req.body, null, 2));
  console.log('👤 User:', req.user);

  // Add owner to req.body
  req.body.owner = req.user._id;
  console.log('🔗 Owner assigné:', req.body.owner);

  // Default analytics config
  if (!req.body.analytics) {
    req.body.analytics = {
      ga4: { enabled: true },
      gtm: { enabled: true },
      metaPixel: { enabled: true }
    };
  }

  // Default design config
  if (!req.body.design) {
    req.body.design = {
      template: 'music',
      colorScheme: {
        primary: '#1DB954',
        secondary: '#191414',
        background: '#FFFFFF',
        text: '#000000'
      }
    };
  }

  // Default SEO config
  if (!req.body.seo) {
    req.body.seo = {
      title: `${req.body.title} - ${req.body.artist}`,
      description: `Écoutez "${req.body.title}" de ${req.body.artist} sur toutes les plateformes de streaming`,
      ogType: 'music.song',
      twitterCard: 'summary_large_image'
    };
  }

  try {
    const smartlink = await SmartLink.create(req.body);
    console.log('✅ SmartLink créé avec succès:', smartlink._id);
    console.log('🔍 Owner sauvegardé:', smartlink.owner);

    res.status(201).json({
      success: true,
      data: smartlink
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du SmartLink:', error);
    console.error('❌ Détails de l\'erreur:', error.message);
    if (error.errors) {
      console.error('❌ Erreurs de validation:', error.errors);
    }
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création du SmartLink',
      details: error.errors || null
    });
  }
}));

// @desc    Update SmartLink
// @route   PUT /api/v1/smartlinks/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res) => {
  let smartlink = await SmartLink.findById(req.params.id);

  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }

  // Check ownership - robust handling
  let ownerIdToCompare;
  if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
    ownerIdToCompare = smartlink.owner._id;
  } else if (smartlink.owner) {
    ownerIdToCompare = smartlink.owner;
  } else {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  if (ownerIdToCompare.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  // Update fields
  smartlink = await SmartLink.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: smartlink
  });
}));

// @desc    Delete SmartLink
// @route   DELETE /api/v1/smartlinks/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const smartlink = await SmartLink.findById(req.params.id);

  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }

  // Check ownership - robust handling
  let ownerIdToCompare;
  if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
    ownerIdToCompare = smartlink.owner._id;
  } else if (smartlink.owner) {
    ownerIdToCompare = smartlink.owner;
  } else {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  if (ownerIdToCompare.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  await smartlink.deleteOne();

  res.status(200).json({
    success: true,
    message: 'SmartLink supprimé avec succès'
  });
}));

// @desc    Publish SmartLink
// @route   PUT /api/v1/smartlinks/:id/publish
// @access  Private
router.put('/:id/publish', protect, asyncHandler(async (req, res) => {
  try {
    const smartlink = await SmartLink.findById(req.params.id);
    
    if (!smartlink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }

    console.log('🔍 Debug publish - SmartLink trouvé:', !!smartlink);
    console.log('🔍 Debug publish - SmartLink owner:', smartlink.owner);
    console.log('🔍 Debug publish - User ID:', req.user._id);

    // ===============================================================
    // SOLUTION ROBUSTE : Comparaison ObjectId universelle
    // ===============================================================
    
    let ownerIdToCompare;
    
    // Cas 1: Owner populé (objet avec _id, username, email)
    if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
      ownerIdToCompare = smartlink.owner._id;
      console.log('✅ Owner populé détecté, utilisation de _id');
    }
    // Cas 2: Owner direct (ObjectId simple)
    else if (smartlink.owner) {
      ownerIdToCompare = smartlink.owner;
      console.log('✅ Owner ObjectId direct détecté');
    }
    // Cas 3: Pas d'owner
    else {
      console.log('❌ Aucun owner trouvé sur le SmartLink');
      return res.status(403).json({
        success: false,
        error: 'SmartLink sans propriétaire'
      });
    }

    // Comparaison sécurisée avec .toString()
    const ownerString = ownerIdToCompare.toString();
    const userString = req.user._id.toString();
    
    console.log('🔍 Owner ID (string):', ownerString);
    console.log('🔍 User ID (string):', userString);
    console.log('🔍 IDs égaux?', ownerString === userString);

    // Vérification finale
    if (ownerString !== userString) {
      console.log('❌ Ownership check failed - IDs différents');
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé - vous n\'êtes pas le propriétaire'
      });
    }

    console.log('✅ Ownership check réussi, publication en cours...');

    // Publication du SmartLink
    smartlink.status = 'published';
    smartlink.publishedAt = new Date();
    await smartlink.save();

    console.log('✅ SmartLink publié avec succès');

    res.json({
      success: true,
      data: smartlink,
      message: 'SmartLink publié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la publication:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la publication'
    });
  }
}));

// @desc    Unpublish SmartLink
// @route   PUT /api/v1/smartlinks/:id/unpublish
// @access  Private
router.put('/:id/unpublish', protect, asyncHandler(async (req, res) => {
  const smartlink = await SmartLink.findById(req.params.id);

  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }

  // Check ownership - robust handling
  let ownerIdToCompare;
  if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
    ownerIdToCompare = smartlink.owner._id;
  } else if (smartlink.owner) {
    ownerIdToCompare = smartlink.owner;
  } else {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  if (ownerIdToCompare.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  smartlink.status = 'draft';
  await smartlink.save();

  res.status(200).json({
    success: true,
    data: smartlink,
    message: 'SmartLink dépublié avec succès'
  });
}));

// @desc    Get SmartLink analytics
// @route   GET /api/v1/smartlinks/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, asyncHandler(async (req, res) => {
  const smartlink = await SmartLink.findById(req.params.id);

  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }

  // Check ownership - robust handling
  let ownerIdToCompare;
  if (smartlink.owner && typeof smartlink.owner === 'object' && smartlink.owner._id) {
    ownerIdToCompare = smartlink.owner._id;
  } else if (smartlink.owner) {
    ownerIdToCompare = smartlink.owner;
  } else {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  if (ownerIdToCompare.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    });
  }

  // TODO: Implement real analytics aggregation
  const analytics = {
    smartlinkId: smartlink._id,
    totalViews: smartlink.totalViews,
    totalClicks: smartlink.totalClicks,
    conversionRate: smartlink.conversionRate,
    platforms: smartlink.platforms.map(p => ({
      platform: p.platform,
      clicks: Math.floor(Math.random() * 100), // TODO: Real data
      percentage: Math.floor(Math.random() * 30)
    })),
    geography: [
      { country: 'FR', views: Math.floor(Math.random() * 1000) },
      { country: 'US', views: Math.floor(Math.random() * 800) },
      { country: 'UK', views: Math.floor(Math.random() * 600) }
    ],
    timeline: [] // TODO: Daily/weekly analytics
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// === ROUTES D'INTÉGRATION EXTERNE ===

// @desc    Search track using Odesli API
// @route   POST /api/v1/smartlinks/search
// @access  Private
router.post('/search', protect, asyncHandler(async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query est requis'
    });
  }
  
  try {
    console.log('🔍 Recherche track:', query);
    
    // Détecter si c'est une URL ou un texte
    const isUrl = query.startsWith('http');
    
    let result;
    if (isUrl) {
      result = await odesliService.searchByUrl(query);
    } else {
      // Pour une recherche textuelle, on peut essayer de construire une URL Spotify
      // ou utiliser une autre API de recherche
      throw new Error('Recherche textuelle non implémentée');
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la recherche'
    });
  }
}));

// @desc    Fetch platform links using Odesli API
// @route   POST /api/v1/smartlinks/fetch-platform-links
// @access  Private
router.post('/fetch-platform-links', protect, asyncHandler(async (req, res) => {
  const { sourceUrl } = req.body;
  
  if (!sourceUrl) {
    return res.status(400).json({
      success: false,
      error: 'sourceUrl est requis'
    });
  }
  
  try {
    console.log('🔗 Récupération liens plateformes:', sourceUrl);
    
    const result = await odesliService.searchByUrl(sourceUrl);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération liens:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des liens'
    });
  }
}));

// @desc    Extract colors from image
// @route   POST /api/v1/smartlinks/extract-colors
// @access  Private
router.post('/extract-colors', protect, asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      error: 'imageUrl est requis'
    });
  }
  
  try {
    console.log('🎨 Extraction couleurs:', imageUrl);
    
    const colors = await colorExtractorService.extractColorsFromUrl(imageUrl);
    
    res.status(200).json({
      success: true,
      data: colors
    });
    
  } catch (error) {
    console.error('❌ Erreur extraction couleurs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'extraction des couleurs'
    });
  }
}));

// @desc    Validate platform URL
// @route   POST /api/v1/smartlinks/validate-url
// @access  Private
router.post('/validate-url', protect, asyncHandler(async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'url est requis'
    });
  }
  
  try {
    console.log('✅ Validation URL:', url);
    
    const validation = odesliService.validatePlatformUrl(url);
    
    res.status(200).json({
      success: true,
      data: validation
    });
    
  } catch (error) {
    console.error('❌ Erreur validation URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la validation'
    });
  }
}));

module.exports = router;