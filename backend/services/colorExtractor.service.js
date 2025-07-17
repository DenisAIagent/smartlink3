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