// backend/routes/smartlink.public.routes.js
const express = require('express');
const router = express.Router();
const SmartLink = require('../models/SmartLink');
const asyncHandler = require('../middleware/asyncHandler');
const { generateSmartLinkHTML } = require('../utils/smartlinkGenerator');
const { trackView, trackClick } = require('../utils/analyticsTracker');

// === ROUTES PUBLIQUES ===

// @desc    Get SmartLink by slug (SSR)
// @route   GET /s/:slug
// @access  Public
router.get('/s/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const userIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userCountry = req.get('CF-IPCountry') || 'FR'; // Cloudflare header
  
  console.log(`🔗 Accès SmartLink slug: ${slug}`);
  console.log(`🌍 Country: ${userCountry}, IP: ${userIP}`);
  
  // Find SmartLink by slug
  const smartlink = await SmartLink.findBySlug(slug);
  
  if (!smartlink) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmartLink non trouvé - MDMC</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px;">
        <h1>SmartLink non trouvé</h1>
        <p>Ce lien n'existe pas ou a été supprimé.</p>
        <a href="https://mdmcmusicads.com" style="color: #1DB954;">← Retour à MDMC</a>
      </body>
      </html>
    `);
  }

  // Track view
  try {
    await trackView(smartlink._id, {
      userAgent,
      userIP,
      userCountry,
      referer: req.get('Referer') || '',
      timestamp: new Date()
    });
    
    // Increment view counter
    await smartlink.incrementViews();
  } catch (error) {
    console.error('❌ Erreur tracking view:', error);
  }

  // Detect if it's a bot/crawler
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);
  
  // Get platforms filtered by country
  const platforms = smartlink.getPlatformsByCountry(userCountry);
  
  // Generate HTML with SSR
  const html = generateSmartLinkHTML(smartlink, {
    userAgent,
    userCountry,
    platforms,
    isBot,
    baseUrl: req.protocol + '://' + req.get('host')
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.send(html);
}));

// @desc    Get SmartLink by shortId (SSR)
// @route   GET /:shortId
// @access  Public
router.get('/:shortId', asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  
  // Validate shortId format (8 characters alphanumeric)
  if (!/^[A-Z0-9]{8}$/.test(shortId)) {
    return res.status(404).send('Invalid short ID format');
  }
  
  const userAgent = req.get('User-Agent') || '';
  const userIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userCountry = req.get('CF-IPCountry') || 'FR';
  
  console.log(`🔗 Accès SmartLink shortId: ${shortId}`);
  
  // Find SmartLink by shortId
  const smartlink = await SmartLink.findByShortId(shortId);
  
  if (!smartlink) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmartLink non trouvé - MDMC</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px;">
        <h1>SmartLink non trouvé</h1>
        <p>Ce lien n'existe pas ou a été supprimé.</p>
        <a href="https://mdmcmusicads.com" style="color: #1DB954;">← Retour à MDMC</a>
      </body>
      </html>
    `);
  }

  // Track view
  try {
    await trackView(smartlink._id, {
      userAgent,
      userIP,
      userCountry,
      referer: req.get('Referer') || '',
      timestamp: new Date()
    });
    
    // Increment view counter
    await smartlink.incrementViews();
  } catch (error) {
    console.error('❌ Erreur tracking view:', error);
  }

  // Detect if it's a bot/crawler
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);
  
  // Get platforms filtered by country
  const platforms = smartlink.getPlatformsByCountry(userCountry);
  
  // Generate HTML with SSR
  const html = generateSmartLinkHTML(smartlink, {
    userAgent,
    userCountry,
    platforms,
    isBot,
    baseUrl: req.protocol + '://' + req.get('host')
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.send(html);
}));

// @desc    Track platform click
// @route   POST /api/v1/smartlinks/track/click
// @access  Public
router.post('/track/click', asyncHandler(async (req, res) => {
  const { smartlinkId, platform, position } = req.body;
  const userAgent = req.get('User-Agent') || '';
  const userIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userCountry = req.get('CF-IPCountry') || 'FR';
  
  console.log(`🎯 Click tracking: ${smartlinkId} -> ${platform}`);
  
  if (!smartlinkId || !platform) {
    return res.status(400).json({
      success: false,
      error: 'smartlinkId et platform sont requis'
    });
  }
  
  // Find SmartLink
  const smartlink = await SmartLink.findById(smartlinkId);
  
  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }
  
  try {
    // Track click
    await trackClick(smartlinkId, platform, {
      userAgent,
      userIP,
      userCountry,
      position: position || 0,
      timestamp: new Date()
    });
    
    // Increment click counter
    await smartlink.incrementClicks(platform);
    
    res.status(200).json({
      success: true,
      message: 'Click tracké avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur tracking click:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du tracking'
    });
  }
}));

// @desc    Get SmartLink data (API)
// @route   GET /api/v1/smartlinks/public/:slug
// @access  Public
router.get('/api/v1/smartlinks/public/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const userCountry = req.get('CF-IPCountry') || 'FR';
  
  const smartlink = await SmartLink.findBySlug(slug);
  
  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink non trouvé'
    });
  }
  
  // Get platforms filtered by country
  const platforms = smartlink.getPlatformsByCountry(userCountry);
  
  // Return public data only
  const publicData = {
    id: smartlink._id,
    title: smartlink.title,
    artist: smartlink.artist,
    subtitle: smartlink.subtitle,
    artwork: smartlink.artwork,
    releaseDate: smartlink.releaseDate,
    genre: smartlink.genre,
    platforms: platforms,
    design: smartlink.design,
    publicUrl: smartlink.publicUrl,
    shortUrl: smartlink.shortUrl,
    structuredData: smartlink.getStructuredData()
  };
  
  res.status(200).json({
    success: true,
    data: publicData
  });
}));

// @desc    Get SmartLink sitemap
// @route   GET /sitemap-smartlinks.xml
// @access  Public
router.get('/sitemap-smartlinks.xml', asyncHandler(async (req, res) => {
  const smartlinks = await SmartLink.find({
    status: 'published',
    isPublic: true
  }).select('slug updatedAt').sort({ updatedAt: -1 });
  
  const baseUrl = req.protocol + '://' + req.get('host');
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  smartlinks.forEach(smartlink => {
    xml += `
  <url>
    <loc>${baseUrl}/s/${smartlink.slug}</loc>
    <lastmod>${smartlink.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
  
  xml += `
</urlset>`;
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.send(xml);
}));

module.exports = router;