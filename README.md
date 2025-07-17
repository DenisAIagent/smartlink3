# SmartLink Platform

A comprehensive SmartLink platform for music distribution with Server-Side Rendering (SSR), analytics tracking, and a complete admin interface.

## 🚀 Features

### Core Functionality
- **SmartLink Creation**: Create smart links that redirect users to their preferred music platform
- **Server-Side Rendering (SSR)**: Optimized HTML generation for better SEO and performance
- **Platform Detection**: Automatic detection and prioritization of music platforms
- **Analytics Integration**: GA4, GTM, Meta Pixel, TikTok Pixel support
- **Custom Design**: Customizable color schemes and layouts

### Technical Features
- **RESTful API**: Complete CRUD operations for SmartLinks
- **User Authentication**: JWT-based authentication with dev bypass mode
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Support for artwork uploads
- **URL Shortening**: Automatic generation of short URLs
- **SEO Optimization**: Complete meta tags, structured data, and sitemap generation

## 📁 Project Structure

```
smartlink3/
├── backend/
│   ├── src/
│   │   └── app.js              # Main Express application
│   ├── models/
│   │   └── SmartLink.js        # SmartLink database model
│   ├── routes/
│   │   ├── smartlink.routes.js # Admin API routes
│   │   └── smartlink.public.routes.js # Public SSR routes
│   ├── utils/
│   │   └── smartlinkGenerator.js # HTML generation utility
│   └── controllers/
│       └── smartLinkController.js # SmartLink business logic
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React application
│   │   └── smartlinks/         # SmartLink admin components
│   └── .env                    # Environment configuration
└── README.md
```

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables:
```
MONGO_URI=mongodb://localhost:27017/smartlink
NODE_ENV=development
PORT=5001
JWT_SECRET=your-jwt-secret
```

5. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
VITE_API_URL=http://localhost:5001/api/v1
VITE_BYPASS_AUTH=true
```

4. Start the frontend development server:
```bash
npm run dev
```

## 🎯 Usage

### Creating SmartLinks

1. Access the admin interface at `http://localhost:3000/#/admin/smartlinks`
2. Click "Create New SmartLink"
3. Fill in the track information:
   - Title and Artist
   - Artwork URL
   - Platform URLs (Spotify, Apple Music, etc.)
4. Configure analytics (optional)
5. Publish the SmartLink

### Accessing SmartLinks

SmartLinks are accessible via:
- **Long URL**: `http://localhost:5001/s/{slug}`
- **Short URL**: `http://localhost:5001/{shortId}`

Example: `http://localhost:5001/s/artist-track-title`

## 🔧 API Endpoints

### Admin API (Authenticated)
- `GET /api/v1/smartlinks` - List all SmartLinks
- `POST /api/v1/smartlinks` - Create new SmartLink
- `PUT /api/v1/smartlinks/:id` - Update SmartLink
- `DELETE /api/v1/smartlinks/:id` - Delete SmartLink
- `POST /api/v1/smartlinks/:id/publish` - Publish SmartLink

### Public API
- `GET /s/:slug` - Access SmartLink by slug (SSR)
- `GET /:shortId` - Access SmartLink by short ID (SSR)
- `POST /track/click` - Track platform clicks
- `GET /api/v1/smartlinks/public/:slug` - Get SmartLink data (JSON)

## 📊 Analytics

The platform supports multiple analytics providers:

- **Google Analytics 4**: Page views and conversion tracking
- **Google Tag Manager**: Custom event tracking
- **Meta Pixel**: Facebook/Instagram advertising pixels
- **TikTok Pixel**: TikTok advertising tracking

Analytics are injected server-side for optimal performance and accuracy.

## 🎨 Customization

SmartLinks support custom design options:
- Color schemes (primary, secondary, background, text)
- Background images and blur effects
- Dark mode support
- Custom CSS injection

## 🔐 Authentication

The platform includes JWT-based authentication with:
- Admin user management
- Development bypass mode
- Role-based access control
- Session management

## 📱 Mobile Optimization

All SmartLinks are fully responsive and optimized for:
- Mobile devices
- Tablet displays
- Desktop browsers
- Social media previews

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Fork or clone this repository**

2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select the `smartlink3` repository

3. **Set Environment Variables**:
   ```
   MONGO_URI=your-mongodb-connection-string
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5001
   ```

4. **Deploy**:
   - Railway will automatically detect the Node.js app
   - The `railway.json` configuration will handle the build and start commands
   - Your SmartLink platform will be live at `https://your-app.railway.app`

### Other Deployment Options

**Backend Deployment**:
- Railway (recommended)
- Heroku
- Vercel
- AWS
- Google Cloud

**Frontend Deployment**:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Firebase Hosting

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secure random string for JWT tokens
- `NODE_ENV`: Set to "production" for deployment
- Analytics IDs (optional)

## 🛠️ Development

### Key Files Modified

1. **Backend URL Generation** (`backend/models/SmartLink.js`):
   - Fixed `publicUrl` and `shortUrl` virtual fields to point to backend port (5001)
   - Corrected route patterns to match actual backend routes

2. **SmartLink Generator** (`backend/utils/smartlinkGenerator.js`):
   - Added missing `userCountry` parameter
   - Fixed JavaScript variable references
   - Updated tracking script generation

3. **Frontend Configuration** (`frontend/.env`):
   - Updated API URL to point to localhost backend
   - Configured development environment variables

## 🐛 Troubleshooting

### Common Issues

1. **SmartLinks redirect to homepage**:
   - Ensure backend is running on port 5001
   - Check that URLs point to backend, not frontend

2. **Analytics not tracking**:
   - Verify analytics IDs are configured correctly
   - Check browser developer tools for JavaScript errors

3. **Database connection issues**:
   - Ensure MongoDB is running
   - Check MONGO_URI environment variable

## 📄 License

This project is proprietary software for MDMC Music Ads.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

For support, contact: denis@mdmcmusicads.com