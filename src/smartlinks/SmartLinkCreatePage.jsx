// frontend/src/pages/admin/smartlinks/SmartLinkCreatePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  ColorLens as ColorIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../../services/api.service';

const SmartLinkCreatePage = () => {
  const navigate = useNavigate();
  
  // États du formulaire
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Métadonnées de base
    title: '',
    artist: '',
    subtitle: '',
    artwork: '',
    releaseDate: '',
    genre: '',
    isrc: '',
    upc: '',
    
    // Plateformes
    platforms: [],
    
    // Configuration analytics
    analytics: {
      ga4: { enabled: true, measurementId: '' },
      gtm: { enabled: true, containerId: '' },
      metaPixel: { enabled: true, pixelId: '' },
      tiktokPixel: { enabled: false, pixelId: '' },
      googleAds: { enabled: false, conversionId: '' }
    },
    
    // Configuration SEO
    seo: {
      title: '',
      description: '',
      keywords: [],
      ogImage: '',
      ogType: 'music.song'
    },
    
    // Configuration design
    design: {
      template: 'music',
      colorScheme: {
        primary: '#1DB954',
        secondary: '#191414',
        background: '#FFFFFF',
        text: '#000000'
      },
      backgroundImage: '',
      backgroundBlur: 10,
      darkMode: false
    },
    
    // Gestion
    status: 'draft',
    isPublic: true
  });

  // État pour la recherche automatique
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // État pour la prévisualisation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [extractedColors, setExtractedColors] = useState(null);

  // Fonction pour obtenir les logos des plateformes
  const getPlatformLogo = (platform) => {
    const logos = {
      spotify: 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      apple_music: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Apple_Music_icon.svg/64px-Apple_Music_icon.svg.png',
      youtube: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/64px-YouTube_full-color_icon_%282017%29.svg.png',
      youtube_music: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Youtube_Music_icon.svg/64px-Youtube_Music_icon.svg.png',
      deezer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Deezer_logo.svg/64px-Deezer_logo.svg.png',
      tidal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Tidal_icon.svg/64px-Tidal_icon.svg.png',
      soundcloud: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Antu_soundcloud.svg/64px-Antu_soundcloud.svg.png',
      bandcamp: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Bandcamp-button-circle-whiteblue-512.png/64px-Bandcamp-button-circle-whiteblue-512.png',
      amazon_music: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Amazon_Music_logo.svg/64px-Amazon_Music_logo.svg.png',
      audiomack: 'https://via.placeholder.com/32x32/FF6600/FFFFFF?text=AM'
    };
    return logos[platform] || 'https://via.placeholder.com/32x32';
  };

  // Étapes du formulaire
  const steps = [
    {
      label: 'Recherche et métadonnées',
      description: 'Trouvez votre morceau et complétez les informations'
    },
    {
      label: 'Plateformes',
      description: 'Ajoutez les liens vers les plateformes de streaming'
    },
    {
      label: 'Design et personnalisation',
      description: 'Personnalisez l\'apparence de votre SmartLink'
    },
    {
      label: 'Analytics et SEO',
      description: 'Configurez le tracking et l\'optimisation'
    },
    {
      label: 'Prévisualisation et publication',
      description: 'Vérifiez et publiez votre SmartLink'
    }
  ];

  // Plateformes supportées
  const supportedPlatforms = [
    { id: 'spotify', name: 'Spotify', color: '#1DB954' },
    { id: 'apple_music', name: 'Apple Music', color: '#FA243C' },
    { id: 'youtube_music', name: 'YouTube Music', color: '#FF0000' },
    { id: 'youtube', name: 'YouTube', color: '#FF0000' },
    { id: 'deezer', name: 'Deezer', color: '#FF6600' },
    { id: 'tidal', name: 'Tidal', color: '#000000' },
    { id: 'soundcloud', name: 'SoundCloud', color: '#FF3300' },
    { id: 'bandcamp', name: 'Bandcamp', color: '#408294' },
    { id: 'amazon_music', name: 'Amazon Music', color: '#FF9900' }
  ];

  // Composant pour les logos de plateformes
  const PlatformLogo = ({ platform, size = 24 }) => {
    const logoUrl = getPlatformLogo(platform);
    const [imageError, setImageError] = useState(false);
    
    if (imageError) {
      // Fallback avec emoji
      const fallbackIcons = {
        spotify: '🎵',
        apple_music: '🍎',
        youtube: '📺',
        youtube_music: '🎥',
        deezer: '🎧',
        tidal: '🌊',
        soundcloud: '☁️',
        bandcamp: '🎪',
        amazon_music: '📦',
        audiomack: '🎵'
      };
      
      return (
        <span style={{ fontSize: size * 0.8 }}>
          {fallbackIcons[platform] || '🎵'}
        </span>
      );
    }
    
    return (
      <img
        src={logoUrl}
        alt={platform}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: '4px'
        }}
        onError={() => setImageError(true)}
      />
    );
  };

  // Fonction de recherche automatique via API Odesli
  const searchTrack = async (query) => {
    if (!query || query.length < 3) return;
    
    try {
      setSearchLoading(true);
      console.log('🔍 Recherche:', query);
      
      // Appel à l'API Odesli via notre backend
      const response = await apiService.smartlinks.searchTrack(query);
      
      if (response.success && response.data) {
        console.log('✅ Résultats API:', response.data);
        
        // Convertir les résultats en format attendu par le frontend
        const result = {
          id: Date.now().toString(),
          title: response.data.title || '',
          artist: response.data.artist || '',
          artwork: response.data.artwork || '',
          releaseDate: response.data.releaseDate || null,
          genre: response.data.genre || '',
          isrc: response.data.isrc || '',
          platforms: response.data.platforms || []
        };
        
        console.log('📋 Résultat formaté:', result);
        setSearchResults([result]);
        
        // Si un seul résultat, le sélectionner automatiquement
        if (result.title && result.artist) {
          console.log('🎯 Sélection automatique du résultat unique');
          selectSearchResult(result);
        } else {
          console.log('🔍 Ouverture dialogue recherche');
          setSearchDialogOpen(true);
        }
      } else {
        console.warn('⚠️ Aucun résultat trouvé');
        setSearchResults([]);
      }
      
      setSearchLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  // Sélectionner un résultat de recherche
  const selectSearchResult = (result) => {
    console.log('🎯 Sélection du résultat:', result);
    
    const newFormData = {
      ...formData,
      title: result.title,
      artist: result.artist,
      artwork: result.artwork,
      releaseDate: result.releaseDate,
      genre: result.genre,
      isrc: result.isrc,
      platforms: result.platforms,
      seo: {
        ...formData.seo,
        title: `${result.title} - ${result.artist}`,
        description: `Écoutez "${result.title}" de ${result.artist} sur toutes les plateformes de streaming`
      }
    };
    
    console.log('📝 Nouveau formData:', newFormData);
    setFormData(newFormData);
    
    // Extraire les couleurs de l'artwork
    extractColorsFromArtwork(result.artwork);
    
    setSearchDialogOpen(false);
    setActiveStep(1);
  };

  // Extraire les couleurs dominantes de l'artwork
  const extractColorsFromArtwork = async (artworkUrl) => {
    try {
      // Simuler l'extraction de couleurs
      // TODO: Implémenter Color Thief
      const mockColors = {
        primary: '#1DB954',
        secondary: '#191414',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#FF6B6B'
      };
      
      setExtractedColors(mockColors);
      setFormData(prev => ({
        ...prev,
        design: {
          ...prev.design,
          colorScheme: mockColors
        }
      }));
      
    } catch (error) {
      console.error('❌ Erreur extraction couleurs:', error);
    }
  };

  // Ajouter une plateforme manuellement
  const addPlatform = (platformId) => {
    const platform = supportedPlatforms.find(p => p.id === platformId);
    if (!platform) return;
    
    const newPlatform = {
      platform: platformId,
      url: '',
      isAvailable: true,
      priority: formData.platforms.length,
      country: 'GLOBAL'
    };
    
    setFormData(prev => ({
      ...prev,
      platforms: [...prev.platforms, newPlatform]
    }));
  };

  // Supprimer une plateforme
  const removePlatform = (index) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour une plateforme
  const updatePlatform = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((platform, i) => 
        i === index ? { ...platform, [field]: value } : platform
      )
    }));
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = [];
    
    if (!formData.title) errors.push('Le titre est requis');
    if (!formData.artist) errors.push('L\'artiste est requis');
    if (!formData.artwork) errors.push('L\'artwork est requis');
    if (formData.platforms.length === 0) errors.push('Au moins une plateforme est requise');
    
    // Valider les URLs des plateformes
    formData.platforms.forEach((platform, index) => {
      if (!platform.url) {
        errors.push(`L'URL de ${platform.platform} est requise`);
      }
    });
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    
    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      console.log('💾 Création SmartLink:', formData);
      
      // Nettoyer les données avant envoi
      const cleanFormData = {
        ...formData,
        releaseDate: formData.releaseDate || undefined,
        genre: formData.genre || undefined,
        isrc: formData.isrc || undefined,
        platforms: formData.platforms.map(p => ({
          ...p,
          priority: p.priority || 0
        }))
      };
      
      console.log('🧹 Données nettoyées:', cleanFormData);
      
      const response = await apiService.smartlinks.create(cleanFormData);
      console.log('✅ SmartLink créé:', response);
      
      toast.success('SmartLink créé avec succès !');
      navigate('/admin/smartlinks');
      
    } catch (error) {
      console.error('❌ Erreur création:', error);
      toast.error('Erreur lors de la création du SmartLink');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des étapes
  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Rendu du contenu de chaque étape
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Recherche automatique
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Entrez l'URL Spotify, Apple Music ou les détails de votre morceau
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="URL Spotify/Apple Music ou nom du morceau"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }}
              />
              <Button
                variant="contained"
                onClick={() => searchTrack(searchQuery)}
                disabled={searchLoading}
              >
                {searchLoading ? <CircularProgress size={20} /> : 'Rechercher'}
              </Button>
            </Box>
            
            {/* Formulaire manuel */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ou saisir manuellement
              </Typography>
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Titre du morceau"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Artiste"
                  value={formData.artist}
                  onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sous-titre (optionnel)"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  inputProps={{ maxLength: 40 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Genre"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL de l'artwork"
                  value={formData.artwork}
                  onChange={(e) => setFormData(prev => ({ ...prev, artwork: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de sortie"
                  type="date"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            {/* Prévisualisation artwork */}
            {formData.artwork && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Prévisualisation
                </Typography>
                <Card sx={{ maxWidth: 200, mx: 'auto' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={formData.artwork}
                    alt={formData.title}
                  />
                </Card>
              </Box>
            )}
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Plateformes de streaming
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ajoutez les liens vers les plateformes où votre morceau est disponible
            </Typography>
            
            {/* Plateformes actuelles */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              {formData.platforms.map((platform, index) => {
                const platformInfo = supportedPlatforms.find(p => p.id === platform.platform);
                return (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: platformInfo?.color }}>
                          <PlatformLogo platform={platform.platform} size={24} />
                        </Avatar>
                        <Typography variant="h6">
                          {platformInfo?.name}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton
                          onClick={() => removePlatform(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <TextField
                        fullWidth
                        label="URL de la plateforme"
                        value={platform.url}
                        onChange={(e) => updatePlatform(index, 'url', e.target.value)}
                        placeholder={`https://${platformInfo?.id}.com/...`}
                        required
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
            
            {/* Ajouter une plateforme */}
            <Typography variant="subtitle2" gutterBottom>
              Ajouter une plateforme
            </Typography>
            <Grid container spacing={1}>
              {supportedPlatforms.map((platform) => {
                const alreadyAdded = formData.platforms.some(p => p.platform === platform.id);
                return (
                  <Grid item key={platform.id}>
                    <Button
                      variant="outlined"
                      onClick={() => addPlatform(platform.id)}
                      disabled={alreadyAdded}
                      startIcon={<PlatformLogo platform={platform.id} size={20} />}
                      sx={{ 
                        borderColor: platform.color,
                        color: platform.color,
                        '&:hover': { borderColor: platform.color }
                      }}
                    >
                      {platform.name}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Design et personnalisation
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Couleurs</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Couleur principale"
                      type="color"
                      value={formData.design.colorScheme.primary}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: {
                          ...prev.design,
                          colorScheme: {
                            ...prev.design.colorScheme,
                            primary: e.target.value
                          }
                        }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Couleur secondaire"
                      type="color"
                      value={formData.design.colorScheme.secondary}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: {
                          ...prev.design,
                          colorScheme: {
                            ...prev.design.colorScheme,
                            secondary: e.target.value
                          }
                        }
                      }))}
                    />
                  </Grid>
                </Grid>
                
                {extractedColors && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Couleurs extraites automatiquement de l'artwork
                    </Typography>
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Template</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={formData.design.template}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      design: { ...prev.design, template: e.target.value }
                    }))}
                  >
                    <MenuItem value="music">Music</MenuItem>
                    <MenuItem value="landing">Landing Page</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                    <MenuItem value="podcast">Podcast</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Analytics et SEO
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Google Analytics</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.analytics.ga4.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          analytics: {
                            ...prev.analytics,
                            ga4: { ...prev.analytics.ga4, enabled: e.target.checked }
                          }
                        }))}
                      />
                    }
                    label="Activer Google Analytics 4"
                  />
                  
                  {formData.analytics.ga4.enabled && (
                    <TextField
                      fullWidth
                      label="Measurement ID (GA4)"
                      value={formData.analytics.ga4.measurementId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        analytics: {
                          ...prev.analytics,
                          ga4: { ...prev.analytics.ga4, measurementId: e.target.value }
                        }
                      }))}
                      placeholder="G-XXXXXXXXXX"
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Meta Pixel (Facebook)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.analytics.metaPixel.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          analytics: {
                            ...prev.analytics,
                            metaPixel: { ...prev.analytics.metaPixel, enabled: e.target.checked }
                          }
                        }))}
                      />
                    }
                    label="Activer Meta Pixel"
                  />
                  
                  {formData.analytics.metaPixel.enabled && (
                    <TextField
                      fullWidth
                      label="Pixel ID"
                      value={formData.analytics.metaPixel.pixelId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        analytics: {
                          ...prev.analytics,
                          metaPixel: { ...prev.analytics.metaPixel, pixelId: e.target.value }
                        }
                      }))}
                      placeholder="1234567890"
                    />
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>SEO</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Titre SEO"
                    value={formData.seo.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, title: e.target.value }
                    }))}
                    inputProps={{ maxLength: 60 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Description SEO"
                    multiline
                    rows={3}
                    value={formData.seo.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, description: e.target.value }
                    }))}
                    inputProps={{ maxLength: 160 }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
        
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Prévisualisation et publication
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Résumé
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Titre :</strong> {formData.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Artiste :</strong> {formData.artist}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Plateformes :</strong> {formData.platforms.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {formData.artwork && (
                      <Box sx={{ textAlign: 'center' }}>
                        <CardMedia
                          component="img"
                          height="100"
                          image={formData.artwork}
                          alt={formData.title}
                          sx={{ width: 100, mx: 'auto', borderRadius: 1 }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setPreviewOpen(true)}
                size="large"
              >
                Prévisualiser
              </Button>
              
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={20} /> : 'Créer le SmartLink'}
              </Button>
            </Stack>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/smartlinks')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Nouveau SmartLink
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2 }}>
                {renderStepContent(index)}
              </Paper>
              
              {/* Navigation */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {index > 0 && (
                  <Button onClick={handleBack}>
                    Précédent
                  </Button>
                )}
                {index < steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                      (index === 0 && (!formData.title || !formData.artist || !formData.artwork)) ||
                      (index === 1 && formData.platforms.length === 0)
                    }
                  >
                    Suivant
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Dialog de recherche */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Résultats de recherche</DialogTitle>
        <DialogContent>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {searchResults.map((result) => (
                <Grid item xs={12} md={6} key={result.id}>
                  <Card sx={{ cursor: 'pointer' }} onClick={() => selectSearchResult(result)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <CardMedia
                          component="img"
                          height="60"
                          image={result.artwork}
                          alt={result.title}
                          sx={{ width: 60, borderRadius: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {result.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {result.artist}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.platforms.length} plateformes
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de prévisualisation */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Prévisualisation SmartLink</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {formData.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {formData.artist}
            </Typography>
            {formData.artwork && (
              <CardMedia
                component="img"
                height="200"
                image={formData.artwork}
                alt={formData.title}
                sx={{ width: 200, mx: 'auto', borderRadius: 2, mb: 2 }}
              />
            )}
            <Stack spacing={1}>
              {formData.platforms.map((platform, index) => {
                const platformInfo = supportedPlatforms.find(p => p.id === platform.platform);
                return (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={<PlatformLogo platform={platform.platform} size={20} />}
                    sx={{ 
                      borderColor: platformInfo?.color,
                      color: platformInfo?.color 
                    }}
                  >
                    {platformInfo?.name}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartLinkCreatePage;