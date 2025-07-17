// frontend/src/pages/admin/smartlinks/SmartLinkListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../../services/api.service';

const SmartLinkListPage = () => {
  const navigate = useNavigate();
  
  // États
  const [smartlinks, setSmartlinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSmartlink, setSelectedSmartlink] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0,
    totalClicks: 0
  });

  // Charger les SmartLinks
  const loadSmartlinks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des SmartLinks...');
      
      const response = await apiService.smartlinks.getAll();
      console.log('✅ SmartLinks chargés:', response);
      
      const smartlinksData = response.data || response || [];
      setSmartlinks(smartlinksData);
      
      // Calculer les statistiques
      const totalViews = smartlinksData.reduce((sum, sl) => sum + (sl.totalViews || 0), 0);
      const totalClicks = smartlinksData.reduce((sum, sl) => sum + (sl.totalClicks || 0), 0);
      const published = smartlinksData.filter(sl => sl.status === 'published').length;
      const draft = smartlinksData.filter(sl => sl.status === 'draft').length;
      
      setStats({
        total: smartlinksData.length,
        published,
        draft,
        totalViews,
        totalClicks
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement SmartLinks:', error);
      toast.error('Erreur lors du chargement des SmartLinks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartlinks();
  }, []);

  // Filtrer les SmartLinks
  const filteredSmartlinks = smartlinks.filter(smartlink => {
    const matchesSearch = 
      smartlink.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smartlink.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || smartlink.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Gérer le menu contextuel
  const handleMenuOpen = (event, smartlink) => {
    setAnchorEl(event.currentTarget);
    setSelectedSmartlink(smartlink);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSmartlink(null);
  };

  // Actions
  const handleEdit = (smartlink) => {
    navigate(`/admin/smartlinks/edit/${smartlink._id}`);
    handleMenuClose();
  };

  const handleViewAnalytics = (smartlink) => {
    navigate(`/admin/smartlinks/${smartlink._id}/analytics`);
    handleMenuClose();
  };

  const handleViewPublic = (smartlink) => {
    if (smartlink.status === 'published') {
      window.open(smartlink.publicUrl, '_blank');
    } else {
      toast.warning('Ce SmartLink doit être publié pour être visible');
    }
    handleMenuClose();
  };

  const handleDelete = async (smartlink) => {
    setSelectedSmartlink(smartlink);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedSmartlink) return;
    
    try {
      setDeletingId(selectedSmartlink._id);
      await apiService.smartlinks.deleteById(selectedSmartlink._id);
      
      toast.success('SmartLink supprimé avec succès');
      loadSmartlinks();
      setDeleteDialogOpen(false);
      setSelectedSmartlink(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (smartlink) => {
    try {
      const newStatus = smartlink.status === 'published' ? 'draft' : 'published';
      
      if (newStatus === 'published') {
        await apiService.smartlinks.publish(smartlink._id);
        toast.success('SmartLink publié avec succès');
      } else {
        await apiService.smartlinks.unpublish(smartlink._id);
        toast.success('SmartLink dépublié avec succès');
      }
      
      loadSmartlinks();
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
    handleMenuClose();
  };

  // Composant Status Chip
  const StatusChip = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'published':
          return { label: 'Publié', color: 'success' };
        case 'draft':
          return { label: 'Brouillon', color: 'warning' };
        case 'archived':
          return { label: 'Archivé', color: 'default' };
        default:
          return { label: status, color: 'default' };
      }
    };

    const config = getStatusConfig(status);
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          SmartLinks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/smartlinks/create')}
          sx={{ px: 3 }}
        >
          Nouveau SmartLink
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total SmartLinks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {stats.published}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Publiés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {stats.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vues totales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {stats.totalClicks.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clics totaux
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 250 }}
        />
        
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Tous les statuts</MenuItem>
          <MenuItem value="published">Publié</MenuItem>
          <MenuItem value="draft">Brouillon</MenuItem>
          <MenuItem value="archived">Archivé</MenuItem>
        </TextField>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSmartlinks}
        >
          Actualiser
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SmartLink</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Vues</TableCell>
              <TableCell align="center">Clics</TableCell>
              <TableCell align="center">Taux</TableCell>
              <TableCell>Créé le</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSmartlinks.map((smartlink) => (
              <TableRow key={smartlink._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={smartlink.artwork}
                      alt={smartlink.title}
                      sx={{ width: 50, height: 50 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {smartlink.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {smartlink.artist}
                      </Typography>
                      {smartlink.subtitle && (
                        <Typography variant="caption" color="text.secondary">
                          {smartlink.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <StatusChip status={smartlink.status} />
                </TableCell>
                
                <TableCell align="center">
                  {(smartlink.totalViews || 0).toLocaleString()}
                </TableCell>
                
                <TableCell align="center">
                  {(smartlink.totalClicks || 0).toLocaleString()}
                </TableCell>
                
                <TableCell align="center">
                  {smartlink.conversionRate ? `${smartlink.conversionRate}%` : '0%'}
                </TableCell>
                
                <TableCell>
                  {new Date(smartlink.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, smartlink)}
                    size="small"
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Message si aucun résultat */}
      {filteredSmartlinks.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun SmartLink trouvé
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/smartlinks/create')}
            sx={{ mt: 2 }}
          >
            Créer votre premier SmartLink
          </Button>
        </Box>
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(selectedSmartlink)}>
          <EditIcon sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        
        <MenuItem onClick={() => handleViewAnalytics(selectedSmartlink)}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          Statistiques
        </MenuItem>
        
        <MenuItem onClick={() => handleViewPublic(selectedSmartlink)}>
          <LaunchIcon sx={{ mr: 1 }} />
          Voir public
        </MenuItem>
        
        <MenuItem onClick={() => handleToggleStatus(selectedSmartlink)}>
          <ViewIcon sx={{ mr: 1 }} />
          {selectedSmartlink?.status === 'published' ? 'Dépublier' : 'Publier'}
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleDelete(selectedSmartlink)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le SmartLink "{selectedSmartlink?.title}" ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible et supprimera également toutes les statistiques associées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deletingId === selectedSmartlink?._id}
          >
            {deletingId === selectedSmartlink?._id ? (
              <CircularProgress size={16} />
            ) : (
              'Supprimer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartLinkListPage;