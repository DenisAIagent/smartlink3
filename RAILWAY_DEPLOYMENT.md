# 🚀 Déploiement Railway - SmartLink Platform

## Architecture de Déploiement

Le SmartLink Platform utilise une architecture **séparée** avec 2 déploiements Railway distincts :

### 🔧 Backend (API + SSR)
- **Rôle** : API REST + rendu HTML des SmartLinks publics
- **Technologie** : Node.js + Express + MongoDB
- **Railway Config** : `/railway.json` (racine)

### 🎨 Frontend (Interface Admin)  
- **Rôle** : Interface React pour créer/gérer les SmartLinks
- **Technologie** : React + Vite + Material-UI
- **Railway Config** : `/frontend/railway.json`

---

## 📋 Instructions de Déploiement

### 1. Déployer le Backend

```bash
# 1. Créer un nouveau projet Railway
railway new smartlink-backend

# 2. Se connecter au projet  
railway link

# 3. Configurer les variables d'environnement
railway env set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/smartlink"
railway env set JWT_SECRET="your-super-secret-jwt-key"
railway env set NODE_ENV="production"
railway env set PORT="3000"

# 4. Déployer depuis la racine
railway up
```

### 2. Déployer le Frontend

```bash
# 1. Aller dans le dossier frontend
cd frontend/

# 2. Créer un nouveau projet Railway
railway new smartlink-frontend

# 3. Se connecter au projet
railway link

# 4. Configurer les variables d'environnement
railway env set VITE_API_URL="https://your-backend-deployment.railway.app"
railway env set VITE_SMARTLINK_BASE_URL="https://your-backend-deployment.railway.app"
railway env set VITE_NODE_ENV="production"

# 5. Déployer depuis frontend/
railway up
```

---

## 🔧 Configuration Requise

### Variables Backend
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3000
```

### Variables Frontend  
```env
VITE_API_URL=https://your-backend-deployment.railway.app
VITE_SMARTLINK_BASE_URL=https://your-backend-deployment.railway.app
VITE_NODE_ENV=production
```

---

## 🌐 URLs d'Accès

### Backend
- **API** : `https://your-backend.railway.app/api/v1/smartlinks`
- **SmartLinks publics** : `https://your-backend.railway.app/s/{id}`
- **Health Check** : `https://your-backend.railway.app/api/v1/smartlinks`

### Frontend
- **Interface Admin** : `https://your-frontend.railway.app`
- **Création SmartLink** : `https://your-frontend.railway.app/create`
- **Liste SmartLinks** : `https://your-frontend.railway.app/list`

---

## ✅ Vérification Post-Déploiement

### 1. Tester le Backend
```bash
# Test API
curl https://your-backend.railway.app/api/v1/smartlinks

# Test création SmartLink  
curl -X POST https://your-backend.railway.app/api/v1/smartlinks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Song","artist":"Test Artist","platforms":{"spotify":"https://open.spotify.com/track/xxx"}}'
```

### 2. Tester le Frontend
- Ouvrir `https://your-frontend.railway.app`
- Vérifier la page de création de SmartLink
- Tester la création d'un nouveau SmartLink

### 3. Tester l'Intégration
- Créer un SmartLink via le frontend
- Vérifier que l'URL publique fonctionne : `https://your-backend.railway.app/s/{id}`
- Tester la redirection mobile/desktop

---

## 🚨 Dépannage

### Erreurs Backend Courantes
- **MONGO_URI** invalide → Vérifier la chaîne de connexion MongoDB
- **MODULE_NOT_FOUND** → Vérifier que tous les services existent dans `/backend/services/`
- **Port binding** → Railway définit automatiquement `$PORT`

### Erreurs Frontend Courantes  
- **VITE_API_URL** incorrect → Doit pointer vers le backend Railway
- **Build failed** → Vérifier les dépendances dans `frontend/package.json`
- **CORS errors** → Le backend autorise les requêtes cross-origin

---

## 📊 Monitoring

### Logs Backend
```bash
railway logs --service smartlink-backend
```

### Logs Frontend
```bash  
cd frontend/ && railway logs --service smartlink-frontend
```

### Métriques
- Railway fournit automatiquement CPU, RAM et bandwidth
- Utiliser les health checks configurés pour monitoring uptime