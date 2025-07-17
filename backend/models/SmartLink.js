// backend/models/SmartLink.js
const mongoose = require('mongoose');

const PlatformLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: [
      'spotify', 'apple_music', 'youtube_music', 'youtube', 'deezer', 
      'tidal', 'soundcloud', 'bandcamp', 'amazon_music', 'qobuz',
      'audiomack', 'beatport', 'itunes', 'pandora', 'napster'
    ]
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // 0 = plus haute priorité
  },
  affiliateUrl: {
    type: String,
    trim: true
  },
  country: {
    type: String, // ISO 3166-1 alpha-2 (FR, US, etc.)
    default: 'GLOBAL'
  }
}, { _id: false });

const AnalyticsConfigSchema = new mongoose.Schema({
  // Google Analytics 4
  ga4: {
    measurementId: String,
    enabled: { type: Boolean, default: true }
  },
  
  // Google Tag Manager
  gtm: {
    containerId: String,
    enabled: { type: Boolean, default: true }
  },
  
  // Meta Pixel (Facebook)
  metaPixel: {
    pixelId: String,
    enabled: { type: Boolean, default: true }
  },
  
  // TikTok Pixel
  tiktokPixel: {
    pixelId: String,
    enabled: { type: Boolean, default: false }
  },
  
  // Google Ads
  googleAds: {
    conversionId: String,
    enabled: { type: Boolean, default: false }
  },
  
  // Custom Analytics
  customScripts: [{
    name: String,
    script: String,
    position: { type: String, enum: ['head', 'body'], default: 'head' }
  }]
}, { _id: false });

const SEOMetaSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 60
  },
  description: {
    type: String,
    maxlength: 160
  },
  keywords: [String],
  ogImage: String,
  ogType: {
    type: String,
    default: 'music.song'
  },
  twitterCard: {
    type: String,
    default: 'summary_large_image'
  },
  structuredData: {
    type: mongoose.Schema.Types.Mixed // JSON-LD
  }
}, { _id: false });

const DesignConfigSchema = new mongoose.Schema({
  template: {
    type: String,
    enum: ['music', 'landing', 'event', 'podcast'],
    default: 'music'
  },
  colorScheme: {
    primary: { type: String, default: '#1DB954' },
    secondary: { type: String, default: '#191414' },
    background: { type: String, default: '#FFFFFF' },
    text: { type: String, default: '#000000' },
    accent: String
  },
  backgroundImage: String,
  backgroundBlur: {
    type: Number,
    default: 10 // pixels
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  customCSS: String
}, { _id: false });

const SmartLinkSchema = new mongoose.Schema({
  // === Métadonnées principales ===
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  artist: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  subtitle: {
    type: String,
    trim: true,
    maxlength: 40
  },
  
  artwork: {
    type: String,
    required: true,
    trim: true
  },
  
  releaseDate: {
    type: Date
  },
  
  genre: {
    type: String,
    trim: true
  },
  
  // === Identifiants ===
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/
  },
  
  shortId: {
    type: String,
    unique: true,
    length: 8 // Format: ABC123XY
  },
  
  isrc: {
    type: String,
    trim: true,
    uppercase: true,
    match: /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/
  },
  
  upc: {
    type: String,
    trim: true,
    match: /^[0-9]{12}$/
  },
  
  // === Plateformes ===
  platforms: [PlatformLinkSchema],
  
  // === Configuration ===
  analytics: AnalyticsConfigSchema,
  seo: SEOMetaSchema,
  design: DesignConfigSchema,
  
  // === Gestion ===
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'disabled'],
    default: 'draft'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // === Tracking ===
  totalViews: {
    type: Number,
    default: 0
  },
  
  totalClicks: {
    type: Number,
    default: 0
  },
  
  conversionRate: {
    type: Number,
    default: 0
  },
  
  // === Timestamps ===
  publishedAt: {
    type: Date
  },
  
  expiresAt: {
    type: Date
  },
  
  lastViewedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === INDEX OPTIMISÉS ===
SmartLinkSchema.index({ slug: 1 });
SmartLinkSchema.index({ shortId: 1 });
SmartLinkSchema.index({ owner: 1, status: 1 });
SmartLinkSchema.index({ artist: 1, title: 1 });
SmartLinkSchema.index({ isrc: 1 });
SmartLinkSchema.index({ publishedAt: -1 });
SmartLinkSchema.index({ status: 1, isPublic: 1 });

// === MIDDLEWARE ===
SmartLinkSchema.pre('save', async function(next) {
  // Générer le slug si c'est un nouveau document
  if (this.isNew && !this.slug) {
    let baseSlug = SmartLinkSchema.statics.generateSlug(this.artist, this.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Vérifier l'unicité du slug
    while (await this.constructor.findOne({ slug: slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Générer le shortId si c'est un nouveau document
  if (this.isNew && !this.shortId) {
    let shortId;
    do {
      shortId = SmartLinkSchema.statics.generateShortId();
    } while (await this.constructor.findOne({ shortId: shortId }));
    
    this.shortId = shortId;
  }
  
  next();
});

// === VIRTUAL FIELDS ===
SmartLinkSchema.virtual('publicUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001' 
    : 'https://mdmc.link';
  return `${baseUrl}/s/${this.slug}`;
});

SmartLinkSchema.virtual('shortUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001' 
    : 'https://mdmc.link';
  return `${baseUrl}/${this.shortId}`;
});

SmartLinkSchema.virtual('adminUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://mdmcmusicads.com';
  return `${baseUrl}/#/admin/smartlinks/edit/${this._id}`;
});

SmartLinkSchema.virtual('analyticsUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://mdmcmusicads.com';
  return `${baseUrl}/#/admin/smartlinks/analytics/${this._id}`;
});

// === MÉTHODES STATIQUES ===
SmartLinkSchema.statics.generateShortId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

SmartLinkSchema.statics.generateSlug = function(artist, title) {
  const slug = `${artist}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '-')         // Remplacer espaces par tirets
    .replace(/-+/g, '-')          // Supprimer tirets multiples
    .replace(/^-|-$/g, '');       // Supprimer tirets début/fin
  
  return slug;
};

SmartLinkSchema.statics.findBySlug = function(slug) {
  return this.findOne({ 
    slug: slug, 
    status: 'published', 
    isPublic: true 
  });
};

SmartLinkSchema.statics.findByShortId = function(shortId) {
  return this.findOne({ 
    shortId: shortId, 
    status: 'published', 
    isPublic: true 
  });
};

// === MÉTHODES D'INSTANCE ===
SmartLinkSchema.methods.incrementViews = function() {
  this.totalViews++;
  this.lastViewedAt = new Date();
  return this.save();
};

SmartLinkSchema.methods.incrementClicks = function(platform) {
  this.totalClicks++;
  this.conversionRate = (this.totalClicks / this.totalViews) * 100;
  return this.save();
};

SmartLinkSchema.methods.getPlatformsByCountry = function(country = 'GLOBAL') {
  return this.platforms
    .filter(p => p.country === country || p.country === 'GLOBAL')
    .sort((a, b) => a.priority - b.priority);
};

SmartLinkSchema.methods.getAnalyticsScript = function() {
  const scripts = [];
  
  // Google Analytics 4
  if (this.analytics.ga4?.enabled && this.analytics.ga4?.measurementId) {
    scripts.push({
      type: 'ga4',
      script: `
        <script async src="https://www.googletagmanager.com/gtag/js?id=${this.analytics.ga4.measurementId}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${this.analytics.ga4.measurementId}', {
            page_title: '${this.title} - ${this.artist}',
            custom_map: { 'smartlink_id': 'custom_parameter_1' }
          });
        </script>
      `
    });
  }
  
  // Google Tag Manager
  if (this.analytics.gtm?.enabled && this.analytics.gtm?.containerId) {
    scripts.push({
      type: 'gtm',
      script: `
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${this.analytics.gtm.containerId}');</script>
      `
    });
  }
  
  // Meta Pixel
  if (this.analytics.metaPixel?.enabled && this.analytics.metaPixel?.pixelId) {
    scripts.push({
      type: 'meta',
      script: `
        <script>
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${this.analytics.metaPixel.pixelId}');
          fbq('track', 'PageView');
        </script>
      `
    });
  }
  
  return scripts;
};

SmartLinkSchema.methods.getStructuredData = function() {
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": this.title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": this.artist
    },
    "image": this.artwork,
    "datePublished": this.releaseDate,
    "genre": this.genre,
    "isrc": this.isrc,
    "url": this.publicUrl,
    "potentialAction": {
      "@type": "ListenAction",
      "target": this.platforms.map(p => ({
        "@type": "EntryPoint",
        "urlTemplate": p.url,
        "name": p.platform
      }))
    }
  };
};

// === MIDDLEWARE ===
SmartLinkSchema.pre('save', async function(next) {
  // Générer slug si nouveau document
  if (this.isNew) {
    if (!this.slug) {
      this.slug = this.constructor.generateSlug(this.artist, this.title);
    }
    
    if (!this.shortId) {
      // Générer shortId unique
      let shortId;
      let isUnique = false;
      
      while (!isUnique) {
        shortId = this.constructor.generateShortId();
        const existing = await this.constructor.findOne({ shortId });
        if (!existing) {
          isUnique = true;
        }
      }
      
      this.shortId = shortId;
    }
  }
  
  // Mettre à jour publishedAt si passage en published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

SmartLinkSchema.pre('find', function() {
  this.populate('owner', 'username email');
});

SmartLinkSchema.pre('findOne', function() {
  this.populate('owner', 'username email');
});

module.exports = mongoose.model('SmartLink', SmartLinkSchema);