// frontend/src/pages/admin/smartlinks/SmartLinkAnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchAppIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

import apiService from '../../../services/api.service';

const SmartLinkAnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [smartlink, setSmartlink] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données du SmartLink et ses analytics
      const [smartlinkResponse, analyticsResponse] = await Promise.all([
        apiService.smartlinks.getById(id),
        apiService.smartlinks.getAnalytics(id)
      ]);

      if (smartlinkResponse.success && analyticsResponse.success) {
        setSmartlink(smartlinkResponse.data);
        setAnalytics(analyticsResponse.data);
      } else {
        setError('Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return 'Publié';
      case 'draft':
        return 'Brouillon';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/smartlinks')}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/smartlinks')}
          sx={{ mr: 2 }}
        >
          Retour
        </Button>
        <AnalyticsIcon sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1">
          Analytics SmartLink
        </Typography>
      </Box>

      {/* SmartLink Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                {smartlink?.title} - {smartlink?.artist}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {smartlink?.shortId} • Créé le {new Date(smartlink?.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Chip
              label={getStatusLabel(smartlink?.status)}
              color={getStatusColor(smartlink?.status)}
              size="small"
            />
          </Box>
          
          {smartlink?.status === 'published' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublicIcon fontSize="small" />
              <Typography variant="body2">
                URL publique: {smartlink?.publicUrl}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  {formatNumber(analytics?.totalViews || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total des vues
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TouchAppIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  {formatNumber(analytics?.totalClicks || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total des clics
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  {analytics?.conversionRate?.toFixed(1) || 0}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Taux de conversion
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlayArrowIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">
                  {analytics?.platforms?.length || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Plateformes actives
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance par plateforme */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance par plateforme
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {analytics?.platforms?.map((platform, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {platform.platform.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {platform.clicks} clics ({platform.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={platform.percentage}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Répartition géographique
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pays</TableCell>
                      <TableCell align="right">Vues</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.geography?.map((country, index) => (
                      <TableRow key={index}>
                        <TableCell>{country.country}</TableCell>
                        <TableCell align="right">{formatNumber(country.views)}</TableCell>
                        <TableCell align="right">
                          {((country.views / analytics.totalViews) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Détails des plateformes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Plateformes configurées
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plateforme</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Priorité</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {smartlink?.platforms?.map((platform, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {platform.platform.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {platform.url}
                      </Typography>
                    </TableCell>
                    <TableCell>{platform.priority}</TableCell>
                    <TableCell>
                      <Chip
                        label={platform.isAvailable ? 'Disponible' : 'Indisponible'}
                        color={platform.isAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SmartLinkAnalyticsPage;