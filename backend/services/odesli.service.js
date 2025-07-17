// backend/services/odesli.service.js
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