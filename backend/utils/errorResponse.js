// ===============================================================
// FICHIER 1: backend/utils/errorResponse.js
// ===============================================================

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    
    // Capturer la stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;

// ===============================================================
// FICHIER 2: backend/middleware/asyncHandler.js
// ===============================================================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// ===============================================================
// FICHIER 3: backend/utils/analyticsTracker.js
// ===============================================================

const SmartLink = require('../models/SmartLink');

/**
 * Track une vue de SmartLink
 */
const trackView = async (smartlinkId, viewData = {}) => {
  try {
    console.log(`📊 Tracking view: ${smartlinkId}`);
    
    // Incrémenter le compteur de vues
    await SmartLink.findByIdAndUpdate(
      smartlinkId,
      { 
        $inc: { totalViews: 1 },
        lastViewedAt: new Date()
      },
      { validateBeforeSave: false }
    );
    
    // TODO: Stocker les détails dans une collection Analytics séparée
    // await AnalyticsEvent.create({
    //   smartlinkId,
    //   eventType: 'view',
    //   userAgent: viewData.userAgent,
    //   userIP: viewData.userIP,
    //   userCountry: viewData.userCountry,
    //   referer: viewData.referer,
    //   timestamp: viewData.timestamp || new Date()
    // });
    
    console.log(`✅ View tracked successfully for SmartLink: ${smartlinkId}`);
    
  } catch (error) {
    console.error(`❌ Error tracking view for ${smartlinkId}:`, error);
    throw error;
  }
};

/**
 * Track un clic sur une plateforme
 */
const trackClick = async (smartlinkId, platform, clickData = {}) => {
  try {
    console.log(`🎯 Tracking click: ${smartlinkId} -> ${platform}`);
    
    // Incrémenter les compteurs
    const updateQuery = {
      $inc: { 
        totalClicks: 1,
        [`platformStats.${platform}`]: 1
      }
    };
    
    await SmartLink.findByIdAndUpdate(
      smartlinkId,
      updateQuery,
      { validateBeforeSave: false }
    );
    
    // Recalculer le taux de conversion
    const smartlink = await SmartLink.findById(smartlinkId);
    if (smartlink && smartlink.totalViews > 0) {
      const conversionRate = (smartlink.totalClicks / smartlink.totalViews) * 100;
      await SmartLink.findByIdAndUpdate(
        smartlinkId,
        { conversionRate: Math.round(conversionRate * 100) / 100 },
        { validateBeforeSave: false }
      );
    }
    
    // TODO: Stocker les détails dans une collection Analytics séparée
    // await AnalyticsEvent.create({
    //   smartlinkId,
    //   eventType: 'click',
    //   platform,
    //   userAgent: clickData.userAgent,
    //   userIP: clickData.userIP,
    //   userCountry: clickData.userCountry,
    //   position: clickData.position,
    //   timestamp: clickData.timestamp || new Date()
    // });
    
    console.log(`✅ Click tracked successfully: ${smartlinkId} -> ${platform}`);
    
  } catch (error) {
    console.error(`❌ Error tracking click for ${smartlinkId}:`, error);
    throw error;
  }
};

/**
 * Obtenir les analytics d'un SmartLink
 */
const getAnalytics = async (smartlinkId, period = '30d') => {
  try {
    const smartlink = await SmartLink.findById(smartlinkId);
    if (!smartlink) {
      throw new Error('SmartLink not found');
    }
    
    // Pour l'instant, retourner les données basiques du SmartLink
    // TODO: Implémenter les analytics détaillées depuis la collection Analytics
    
    return {
      smartlinkId,
      totalViews: smartlink.totalViews || 0,
      totalClicks: smartlink.totalClicks || 0,
      conversionRate: smartlink.conversionRate || 0,
      platformStats: smartlink.platformStats || {},
      lastViewedAt: smartlink.lastViewedAt,
      createdAt: smartlink.createdAt
    };
    
  } catch (error) {
    console.error(`❌ Error getting analytics for ${smartlinkId}:`, error);
    throw error;
  }
};

module.exports = {
  trackView,
  trackClick,
  getAnalytics
};

// ===============================================================
// FICHIER 4: backend/services/odesli.service.js (Basic)
// ===============================================================

const axios = require('axios');

const ODESLI_API_BASE = 'https://api.song.link/v1-alpha.1';

/**
 * Service pour interagir avec l'API Odesli/SongLink
 */
const odesliService = {
  
  /**
   * Rechercher des liens de plateformes par URL
   */
  async searchByUrl(url, userCountry = 'FR') {
    try {
      console.log(`🔍 Odesli: Recherche pour ${url}`);
      
      const response = await axios.get(`${ODESLI_API_BASE}/links`, {
        params: {
          url: url,
          userCountry: userCountry,
          songIfSingle: true
        },
        timeout: 10000
      });
      
      const data = response.data;
      
      if (!data.linksByPlatform || Object.keys(data.linksByPlatform).length === 0) {
        throw new Error('Aucun lien trouvé pour cette URL');
      }
      
      // Extraire les métadonnées
      const entity = Object.values(data.entitiesByUniqueId)[0];
      
      const result = {
        title: entity?.title || '',
        artist: entity?.artistName || '',
        album: entity?.albumName || '',
        artwork: entity?.thumbnailUrl || '',
        isrc: entity?.isrc || '',
        type: entity?.type || 'song',
        duration: entity?.durationInMillis || null,
        releaseDate: entity?.releaseDate || null,
        
        // Liens par plateforme formatés
        linksByPlatform: this.formatPlatformLinks(data.linksByPlatform),
        
        // Données brutes pour debug
        pageUrl: data.pageUrl,
        entityId: entity?.id,
        apiProvider: data.apiProvider || 'odesli'
      };
      
      console.log(`✅ Odesli: ${Object.keys(result.linksByPlatform).length} plateformes trouvées`);
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ Erreur Odesli:', error.message);
      
      if (error.response?.status === 404) {
        return { success: false, error: 'Contenu non trouvé sur les plateformes' };
      }
      
      if (error.response?.status === 429) {
        return { success: false, error: 'Limite de taux atteinte, réessayez plus tard' };
      }
      
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Formater les liens de plateformes
   */
  formatPlatformLinks(linksByPlatform) {
    const platformMapping = {
      'spotify': 'spotify',
      'appleMusic': 'apple_music',
      'youtubeMusic': 'youtube_music',
      'youtube': 'youtube',
      'deezer': 'deezer',
      'tidal': 'tidal',
      'soundcloud': 'soundcloud',
      'bandcamp': 'bandcamp',
      'amazonMusic': 'amazon_music',
      'audiomack': 'audiomack'
    };
    
    const formatted = {};
    
    Object.entries(linksByPlatform).forEach(([platform, linkData]) => {
      const mappedPlatform = platformMapping[platform] || platform;
      
      formatted[mappedPlatform] = {
        platform: mappedPlatform,
        url: linkData.url,
        isAvailable: true,
        priority: 0,
        country: 'GLOBAL'
      };
    });
    
    return formatted;
  },
  
  /**
   * Valider une URL de plateforme
   */
  validatePlatformUrl(url) {
    const platformPatterns = {
      spotify: /^https:\/\/open\.spotify\.com\/(track|album|playlist)/,
      apple_music: /^https:\/\/music\.apple\.com/,
      youtube: /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=/,
      youtube_music: /^https:\/\/music\.youtube\.com/,
      deezer: /^https:\/\/(?:www\.)?deezer\.com/,
      tidal: /^https:\/\/(?:www\.)?tidal\.com/,
      soundcloud: /^https:\/\/(?:www\.)?soundcloud\.com/
    };
    
    for (const [platform, pattern] of Object.entries(platformPatterns)) {
      if (pattern.test(url)) {
        return {
          isValid: true,
          platform: platform,
          detectedPlatform: platform
        };
      }
    }
    
    return {
      isValid: false,
      platform: null,
      error: 'URL de plateforme non reconnue'
    };
  },
  
  /**
   * Valider le format d'entrée (URL ou texte)
   */
  validateInput(input) {
    if (input.startsWith('http')) {
      const validation = this.validatePlatformUrl(input);
      return {
        type: validation.isValid ? 'platform_url' : 'invalid_url',
        platform: validation.platform,
        isValid: validation.isValid
      };
    }
    
    // Pour les recherches textuelles (pas encore implémentées)
    return {
      type: 'text_search',
      isValid: input.length >= 3
    };
  }
};

module.exports = odesliService;

// ===============================================================
// FICHIER 5: backend/services/colorExtractor.service.js (Basic)
// ===============================================================

/**
 * Service pour extraire les couleurs dominantes des images
 * Version basique - peut être améliorée avec une vraie lib comme ColorThief
 */
const colorExtractorService = {
  
  /**
   * Extraire couleurs depuis une URL d'image
   */
  async extractColorsFromUrl(imageUrl) {
    try {
      console.log(`🎨 Extraction couleurs: ${imageUrl}`);
      
      // Pour l'instant, retourner des couleurs par défaut basées sur des palettes harmonieuses
      // TODO: Implémenter ColorThief ou une autre lib d'extraction
      
      const defaultPalettes = [
        {
          primary: '#1DB954',
          secondary: '#191414', 
          background: '#FFFFFF',
          text: '#000000',
          accent: '#1ED760'
        },
        {
          primary: '#FF6B6B',
          secondary: '#4ECDC4',
          background: '#F7F7F7',
          text: '#2C3E50',
          accent: '#FFE66D'
        },
        {
          primary: '#667EEA',
          secondary: '#764BA2',
          background: '#F8F9FA',
          text: '#343A40',
          accent: '#F093FB'
        }
      ];
      
      // Sélectionner une palette basée sur l'URL (pour la cohérence)
      const hash = imageUrl.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const palette = defaultPalettes[Math.abs(hash) % defaultPalettes.length];
      
      console.log(`✅ Couleurs extraites:`, palette);
      
      return {
        success: true,
        data: {
          dominantColors: [palette.primary, palette.secondary, palette.accent],
          colorScheme: palette,
          extractionMethod: 'hash_based_default'
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur extraction couleurs:', error);
      
      return {
        success: false,
        error: error.message,
        data: {
          colorScheme: {
            primary: '#1DB954',
            secondary: '#191414',
            background: '#FFFFFF',
            text: '#000000'
          }
        }
      };
    }
  },
  
  /**
   * Générer un schéma de couleurs harmonieux
   */
  generateColorScheme(dominantColors) {
    const primary = dominantColors[0] || '#1DB954';
    
    return {
      primary: primary,
      secondary: this.darken(primary, 20),
      background: '#FFFFFF',
      text: '#000000',
      accent: this.lighten(primary, 15)
    };
  },
  
  /**
   * Assombrir une couleur
   */
  darken(color, percent) {
    // Implémentation basique
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },
  
  /**
   * Éclaircir une couleur
   */
  lighten(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },
  
  /**
   * Obtenir couleurs par défaut pour une plateforme
   */
  getPlatformColors(platform) {
    const platformColors = {
      spotify: '#1DB954',
      apple_music: '#FA243C',
      youtube: '#FF0000',
      youtube_music: '#FF0000',
      deezer: '#FF6600',
      tidal: '#000000',
      soundcloud: '#FF3300',
      bandcamp: '#408294',
      amazon_music: '#FF9900',
      audiomack: '#FF6600'
    };
    
    return platformColors[platform] || '#1DB954';
  }
};

module.exports = colorExtractorService;

// ===============================================================
// INSTRUCTIONS DE DÉPLOIEMENT
// ===============================================================

/*
ÉTAPES POUR FIXER LE CRASH :

1. Créer ces 5 fichiers dans votre projet local :
   - backend/utils/errorResponse.js
   - backend/middleware/asyncHandler.js  
   - backend/utils/analyticsTracker.js
   - backend/services/odesli.service.js
   - backend/services/colorExtractor.service.js

2. Commit et push sur Railway :
   git add .
   git commit -m "Fix: Add missing utility files for Railway deployment"
   git push

3. Railway va automatiquement redéployer

VÉRIFICATIONS POST-DÉPLOIEMENT :
- Logs Railway ne montrent plus d'erreurs MODULE_NOT_FOUND
- API /api/v1 répond avec un healthcheck
- SmartLinks peuvent être créés via l'interface
- Analytics tracking fonctionne

NOTES :
- Ces implémentations sont fonctionnelles mais basiques
- Odesli nécessite une vraie clé API pour la production
- ColorThief peut être ajouté plus tard pour une vraie extraction
- AnalyticsTracker peut être enrichi avec une DB dédiée
*/
