// backend/utils/smartlinkGenerator.js

/**
 * 🎯 GÉNÉRATEUR HTML STATIQUE AVEC ANALYTICS SERVER-SIDE
 * 
 * Cette fonction génère du HTML complet côté serveur avec :
 * - Scripts analytics injectés AVANT le rendu
 * - Métadonnées SEO dynamiques
 * - Structured Data (JSON-LD)
 * - Performance optimisée
 * - Support mobile/desktop
 */

const generateSmartLinkHTML = (smartlink, options = {}) => {
  const {
    userAgent = '',
    userCountry = 'FR',
    platforms = [],
    isBot = false,
    baseUrl = 'https://mdmc.link'
  } = options;

  // Données de base
  const {
    title,
    artist,
    subtitle,
    artwork,
    releaseDate,
    genre,
    design,
    analytics,
    seo
  } = smartlink;

  // Configuration couleurs
  const colors = design?.colorScheme || {
    primary: '#1DB954',
    secondary: '#191414',
    background: '#FFFFFF',
    text: '#000000'
  };

  // URLs
  const publicUrl = `${baseUrl}/s/${smartlink.slug}`;
  const shortUrl = `${baseUrl}/${smartlink.shortId}`;

  // Génération des scripts analytics (SERVER-SIDE)
  const analyticsScripts = generateAnalyticsScripts(smartlink, userCountry);

  // Génération des métadonnées SEO
  const metaTags = generateMetaTags(smartlink, publicUrl);

  // Génération du JSON-LD
  const structuredData = smartlink.getStructuredData();

  // Génération du CSS critique inline
  const criticalCSS = generateCriticalCSS(colors, design);

  // Génération des boutons plateformes
  const platformButtons = generatePlatformButtons(platforms, smartlink._id);

  // Génération du JavaScript de tracking
  const trackingScript = generateTrackingScript(smartlink, baseUrl, userCountry);

  // HTML COMPLET avec SSR (Structure similaire à l'exemple)
  const html = `<!DOCTYPE html>
<html lang="fr" class="native-lazy-loading">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  
  <!-- 📊 ANALYTICS SCRIPTS (SERVER-SIDE INJECTION) -->
  ${analyticsScripts}
  
  <!-- 🎨 META TAGS SEO -->
  ${metaTags}
  
  <!-- 📱 CRITICAL CSS INLINE -->
  <style>
    ${criticalCSS}
  </style>
  
  <!-- 🔍 STRUCTURED DATA -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <!-- 🚀 PRECONNECT OPTIMIZATIONS -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://open.spotify.com">
  <link rel="preconnect" href="https://music.apple.com">
  
  <!-- 📱 PWA MANIFEST -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="${colors.primary}">
  
  <!-- 🎯 FAVICON -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
</head>
<body class="smartlink-page">
  <div id="root">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    
    <main id="main-content">
      <!-- Simulator popup (optional) -->
      <div class="simulator-popup" role="dialog" aria-modal="true" aria-labelledby="simulator-title" style="display: none;"></div>
      
      <!-- SmartLink Clean Container -->
      <div class="smartlink-clean">
        <!-- Background Artwork -->
        <div class="background-artwork loaded" style="background-image: url('${artwork}');"></div>
        
        <!-- Main Card -->
        <div class="main-card">
          <!-- Album Cover Container -->
          <div class="album-cover-container">
            <img src="${artwork}" alt="${title} - ${artist}" class="album-cover" loading="eager">
            
            <!-- Play Overlay Button -->
            <div class="play-overlay-btn">
              <div class="play-triangle"></div>
            </div>
          </div>
          
          <!-- Track Information -->
          <h1 class="album-title">${title}</h1>
          <p class="artist-name">${artist}</p>
          <div class="subtitle">Choose music service</div>
          
          <!-- Platform List -->
          <div class="platform-list">
            ${platformButtons}
          </div>
        </div>
      </div>
    </main>
    
    <!-- Toast Notifications -->
    <div class="Toastify"></div>
  </div>
  
  <!-- Script de redirection pour HashRouter et SEO -->
  <script>
    ${trackingScript}
  </script>
  
  <!-- 🎯 ANALYTICS EVENTS -->
  <script>
    // Page View Event (GA4)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: '${title} - ${artist}',
        page_location: '${publicUrl}',
        content_group1: 'SmartLink',
        content_group2: '${artist}',
        custom_parameter_1: '${smartlink._id}'
      });
    }
    
    // Page View Event (GTM)
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        event: 'smartlink_view',
        smartlink_id: '${smartlink._id}',
        artist_name: '${artist}',
        track_title: '${title}',
        user_country: '${userCountry}',
        device_type: window.innerWidth > 768 ? 'desktop' : 'mobile'
      });
    }
    
    // Page View Event (Meta Pixel)
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', {
        content_type: 'music',
        content_ids: ['${smartlink._id}'],
        content_name: '${title}',
        content_category: 'SmartLink',
        value: 1.0,
        currency: 'EUR'
      });
    }
  </script>
  
  <!-- 📊 ANALYTICS NOSCRIPT -->
  <noscript>
    <img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${analytics.metaPixel?.pixelId}&ev=PageView&noscript=1"/>
  </noscript>
  
</body>
</html>`;

  return html;
};

// === FONCTIONS UTILITAIRES ===

/**
 * Génère les scripts analytics côté serveur
 */
const generateAnalyticsScripts = (smartlink, userCountry) => {
  const scripts = [];
  const { analytics } = smartlink;
  
  // Google Analytics 4
  if (analytics?.ga4?.enabled && analytics?.ga4?.measurementId) {
    scripts.push(`
      <!-- Google Analytics 4 -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${analytics.ga4.measurementId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analytics.ga4.measurementId}', {
          page_title: '${smartlink.title} - ${smartlink.artist}',
          custom_map: { 'smartlink_id': 'custom_parameter_1' },
          user_properties: {
            'country': '${userCountry}'
          }
        });
      </script>
    `);
  }
  
  // Google Tag Manager
  if (analytics?.gtm?.enabled && analytics?.gtm?.containerId) {
    scripts.push(`
      <!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${analytics.gtm.containerId}');</script>
    `);
  }
  
  // Meta Pixel
  if (analytics?.metaPixel?.enabled && analytics?.metaPixel?.pixelId) {
    scripts.push(`
      <!-- Meta Pixel -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${analytics.metaPixel.pixelId}');
        fbq('track', 'PageView');
      </script>
    `);
  }
  
  // TikTok Pixel
  if (analytics?.tiktokPixel?.enabled && analytics?.tiktokPixel?.pixelId) {
    scripts.push(`
      <!-- TikTok Pixel -->
      <script>
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${analytics.tiktokPixel.pixelId}');
          ttq.page();
        }(window, document, 'ttq');
      </script>
    `);
  }
  
  return scripts.join('\n');
};

/**
 * Génère les métadonnées SEO
 */
const generateMetaTags = (smartlink, publicUrl) => {
  const { title, artist, subtitle, artwork, seo } = smartlink;
  
  const metaTitle = seo?.title || `${title} - ${artist}`;
  const metaDescription = seo?.description || `Écoutez "${title}" de ${artist} sur toutes les plateformes de streaming`;
  
  return `
    <title>${metaTitle}</title>
    <meta name="description" content="${metaDescription}">
    <meta name="keywords" content="${artist}, ${title}, streaming, music, ${subtitle || ''}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="${publicUrl}">
    <meta property="og:title" content="${metaTitle}">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:image" content="${artwork}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="1200">
    <meta property="og:site_name" content="MDMC Music Ads">
    <meta property="music:musician" content="${artist}">
    <meta property="music:song" content="${title}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${publicUrl}">
    <meta name="twitter:title" content="${metaTitle}">
    <meta name="twitter:description" content="${metaDescription}">
    <meta name="twitter:image" content="${artwork}">
    <meta name="twitter:creator" content="@MDMCMusicAds">
    
    <!-- Additional Meta -->
    <meta name="author" content="${artist}">
    <meta name="category" content="Music">
    <meta name="classification" content="Music">
    <link rel="canonical" href="${publicUrl}">
  `;
};

/**
 * Génère le CSS critique inline
 */
const generateCriticalCSS = (colors, design) => {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body.smartlink-page {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.background};
      color: ${colors.text};
      line-height: 1.6;
      overflow-x: hidden;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: ${colors.primary};
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
    }
    
    .skip-link:focus {
      top: 6px;
    }
    
    #main-content {
      min-height: 100vh;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .smartlink-clean {
      position: relative;
      width: 100%;
      max-width: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .background-artwork.loaded {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      filter: blur(${design?.backgroundBlur || 10}px);
      opacity: 0.3;
      z-index: -1;
    }
    
    .main-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    
    .album-cover-container {
      position: relative;
      width: 200px;
      height: 200px;
      margin: 0 auto 30px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .album-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .play-overlay-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      opacity: 0;
    }
    
    .album-cover-container:hover .play-overlay-btn {
      opacity: 1;
    }
    
    .play-triangle {
      width: 0;
      height: 0;
      border-left: 12px solid ${colors.primary};
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      margin-left: 3px;
    }
    
    .album-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      color: ${colors.text};
    }
    
    .artist-name {
      font-size: 18px;
      font-weight: 400;
      color: ${colors.secondary};
      margin-bottom: 16px;
    }
    
    .subtitle {
      font-size: 14px;
      color: ${colors.secondary};
      margin-bottom: 20px;
      text-transform: uppercase;
      font-weight: 500;
    }
    
    .platform-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .platform-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 20px;
      background: ${colors.primary};
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
    
    .platform-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
    
    .simulator-popup {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: none;
    }
    
    .Toastify {
      z-index: 9999;
    }
    
    @media (max-width: 480px) {
      .main-card {
        padding: 30px 20px;
        margin: 10px;
      }
      
      .album-cover-container {
        width: 160px;
        height: 160px;
      }
      
      .album-title {
        font-size: 20px;
      }
      
      .artist-name {
        font-size: 16px;
      }
    }
  `;
};

/**
 * Génère les boutons de plateformes
 */
const generatePlatformButtons = (platforms, smartlinkId) => {
  const platformIcons = {
    spotify: '🎵',
    apple_music: '🍎',
    youtube_music: '🎥',
    youtube: '📺',
    deezer: '🎧',
    tidal: '🌊',
    soundcloud: '☁️',
    bandcamp: '🎪',
    amazon_music: '📦',
    audiomack: '🎤'
  };
  
  const platformNames = {
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    youtube_music: 'YouTube Music',
    youtube: 'YouTube',
    deezer: 'Deezer',
    tidal: 'Tidal',
    soundcloud: 'SoundCloud',
    bandcamp: 'Bandcamp',
    amazon_music: 'Amazon Music',
    audiomack: 'Audiomack'
  };
  
  const platformColors = {
    spotify: '#1DB954',
    apple_music: '#FA243C',
    youtube_music: '#FF0000',
    youtube: '#FF0000',
    deezer: '#FF6600',
    tidal: '#000000',
    soundcloud: '#FF3300',
    bandcamp: '#408294',
    amazon_music: '#FF9900',
    audiomack: '#FF6600'
  };
  
  return platforms.map((platform, index) => {
    const icon = platformIcons[platform.platform] || '🎵';
    const name = platformNames[platform.platform] || platform.platform;
    const color = platformColors[platform.platform] || '#1DB954';
    
    return `
      <button class="platform-button" 
              style="background-color: ${color};"
              onclick="trackAndRedirect('${smartlinkId}', '${platform.platform}', ${index}, '${platform.url}')">
        <span class="platform-icon">${icon}</span>
        <span class="platform-name">${name}</span>
      </button>
    `;
  }).join('');
};

/**
 * Génère le script de tracking JavaScript
 */
const generateTrackingScript = (smartlink, baseUrl, userCountry = 'FR') => {
  return `
    // 🎯 TRACKING FUNCTIONS
    
    let clickTracked = false;
    
    async function trackAndRedirect(smartlinkId, platform, position, url) {
      // Prevent double tracking
      if (clickTracked) return;
      clickTracked = true;
      
      // Visual feedback on click
      const clickedButton = event.target.closest('.platform-button');
      if (clickedButton) {
        clickedButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
          clickedButton.style.transform = '';
        }, 150);
      }
      
      try {
        // Track click (non-blocking)
        fetch('${baseUrl}/track/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            smartlinkId: '${smartlink._id}',
            platform: platform,
            position: position
          })
        }).catch(err => console.warn('Track error:', err));
        
        // Analytics events
        if (typeof gtag !== 'undefined') {
          gtag('event', 'select_content', {
            content_type: 'music_platform',
            item_id: platform,
            smartlink_id: '${smartlink._id}',
            value: 1.0,
            currency: 'EUR'
          });
        }
        
        if (typeof dataLayer !== 'undefined') {
          dataLayer.push({
            event: 'smartlink_conversion',
            platform: platform,
            smartlink_id: '${smartlink._id}',
            value: 1.0,
            user_country: '${userCountry || 'FR'}'
          });
        }
        
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Purchase', {
            value: 1.0,
            currency: 'EUR',
            content_type: 'music_platform',
            content_ids: ['${smartlink._id}'],
            content_name: platform
          });
        }
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = url;
        }, 300);
        
      } catch (error) {
        console.error('Tracking error:', error);
        // Redirect anyway
        window.location.href = url;
      }
    }
    
    // 📱 SHARE FUNCTION
    async function shareSmartLink() {
      const shareData = {
        title: '${smartlink.title} - ${smartlink.artist}',
        text: 'Écoutez "${smartlink.title}" de ${smartlink.artist}',
        url: window.location.href
      };
      
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(window.location.href);
          alert('Lien copié dans le presse-papiers !');
        }
      } catch (err) {
        console.warn('Share error:', err);
      }
    }
    
    // 🎨 INITIALIZE
    document.addEventListener('DOMContentLoaded', function() {
      // Add background artwork animation
      const backgroundArtwork = document.querySelector('.background-artwork');
      if (backgroundArtwork) {
        setTimeout(() => {
          backgroundArtwork.classList.add('loaded');
        }, 100);
      }
      
      // Add play button functionality
      const playButton = document.querySelector('.play-overlay-btn');
      if (playButton) {
        playButton.addEventListener('click', function() {
          const firstPlatform = document.querySelector('.platform-button');
          if (firstPlatform) {
            firstPlatform.click();
          }
        });
      }
      
      // Initialize toast notifications
      if (typeof Toastify !== 'undefined') {
        // Toastify setup
        console.log('Toastify available');
      }
    });
    
    // 📊 PERFORMANCE TRACKING
    window.addEventListener('load', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'timing_complete', {
          name: 'smartlink_load',
          value: Math.round(performance.now())
        });
      }
    });
  `;
};

module.exports = {
  generateSmartLinkHTML,
  generateAnalyticsScripts,
  generateMetaTags,
  generateCriticalCSS,
  generatePlatformButtons,
  generateTrackingScript
};