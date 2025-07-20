# What'sYourRecipe - Deployment Guide

A secure coffee recipe social media platform with separate frontend and backend architecture.

## 🏗️ Architecture Overview

```
frontend/ (GitHub Pages) → API Calls → backend/ (Python FastAPI) → Supabase Database
```

### 📁 **Secure Project Structure:**
```
coffee/
├── frontend/                 # 🌐 Public files (GitHub Pages)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── api.js
│   └── README.md
├── backend/                  # 🔒 Private server files (Cloud hosting)
│   ├── main.py
│   ├── requirements.txt
│   ├── env.example
│   ├── Dockerfile
│   └── render.yaml
├── database_setup.sql        # 🗄️ Database schema
├── DEPLOYMENT.md            # 📖 Deployment guide
└── .github/workflows/       # 🚀 CI/CD (deploys frontend/ only)
```

### Security Features:
- ✅ **No exposed credentials** - All sensitive data in backend environment variables
- ✅ **CORS protection** - Configurable allowed origins
- ✅ **JWT authentication** - Secure token-based auth
- ✅ **API rate limiting** - Built into FastAPI
- ✅ **Input validation** - Pydantic models for all endpoints

## 🚀 Frontend Deployment (GitHub Pages)

### Prerequisites:
1. GitHub account
2. Repository with the frontend code

### Steps:

1. **Enable GitHub Pages:**
   - Go to your repository → Settings → Pages
   - Source: "GitHub Actions" (recommended) or "Deploy from a branch"
   - If using branch: Branch: `main`, Folder: `/frontend`
   - **Security**: Only `frontend/` folder is deployed - backend files stay private!

2. **Update API URL:**
   ```javascript
   // In frontend/api.js, update:
   const API_BASE_URL = 'https://your-backend-url.com';
   ```

3. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy secure frontend"
   git push origin main
   ```

4. **Access your site:**
   - URL: `https://yourusername.github.io/repository-name`

## 🔧 Backend Deployment (Render/Railway/Heroku)

### Option A: Render (Recommended)

1. **Create Render account:** https://render.com

2. **Connect GitHub repository**

3. **Create Web Service:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables:**
   ```
   SUPABASE_URL=https://kaydtzseywecnwjrzjxe.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   FRONTEND_URLS=https://yourusername.github.io
   PORT=10000
   ```

5. **Get Service Key from Supabase:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - This key has elevated permissions for backend operations

### Option B: Railway

1. **Create Railway account:** https://railway.app

2. **Deploy from GitHub:**
   ```bash
   railway login
   railway link
   railway up
   ```

3. **Set environment variables in Railway dashboard**

### Option C: Heroku

1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set SUPABASE_URL=https://kaydtzseywecnwjrzjxe.supabase.co
   heroku config:set SUPABASE_SERVICE_KEY=your_service_key
   heroku config:set FRONTEND_URLS=https://yourusername.github.io
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔐 Security Configuration

### 1. Supabase Service Key
```bash
# Get from Supabase Dashboard → Settings → API
# Use "service_role" key, NOT "anon" key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 2. CORS Configuration
```python
# In main.py, update allowed origins:
allow_origins=os.getenv("FRONTEND_URLS", "https://yourusername.github.io").split(",")
```

### 3. Environment Variables Template
```bash
# Required variables for backend
SUPABASE_URL=https://kaydtzseywecnwjrzjxe.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
FRONTEND_URLS=https://yourusername.github.io,http://localhost:3000
PORT=8000
DEBUG=false
```

## 📝 Local Development

### Backend:
```bash
cd backend
pip install -r requirements.txt
cp env.example .env
# Edit .env with your credentials
uvicorn main:app --reload
```

### Frontend:
```bash
# Update API_BASE_URL in frontend/api.js to:
const API_BASE_URL = 'http://localhost:8000';

# Serve frontend from frontend/ folder:
cd frontend
python -m http.server 3000
# OR
npx serve .
# OR open frontend/index.html in browser
```

## 🧪 Testing the Deployment

1. **Backend Health Check:**
   ```
   GET https://your-backend-url.com/health
   ```

2. **Authentication Test:**
   ```javascript
   // In browser console:
   fetch('https://your-backend-url.com/auth/signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'test@example.com',
       password: 'password123',
       username: 'testuser',
       full_name: 'Test User'
     })
   })
   ```

3. **CORS Test:**
   - Open frontend URL (GitHub Pages deploys from `frontend/` folder only)
   - Try signing up/logging in  
   - Check browser console for CORS errors
   - **Verify**: Backend files are NOT accessible via frontend URL (security check)

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Update `FRONTEND_URLS` in backend environment variables
   - Include your GitHub Pages URL: `https://username.github.io`

2. **401 Authentication Errors:**
   - Check `SUPABASE_SERVICE_KEY` is the service key, not anon key
   - Verify Supabase URL is correct

3. **Backend Not Starting:**
   - Check all required environment variables are set
   - Verify `requirements.txt` includes all dependencies

4. **Database Connection Issues:**
   - Confirm Supabase credentials
   - Check database_setup.sql was executed
   - Verify RLS policies are active

## 📊 API Documentation

Once deployed, visit:
```
https://your-backend-url.com/docs
```

This provides interactive API documentation with all endpoints.

## 🔒 Production Security Checklist

- [ ] **Folder isolation**: Only `frontend/` deployed to GitHub Pages
- [ ] **Backend privacy**: `backend/` folder never exposed publicly
- [ ] Frontend uses HTTPS (GitHub Pages provides this)
- [ ] Backend uses HTTPS (Render/Railway provide this)
- [ ] Service key stored securely in backend environment variables
- [ ] CORS properly configured with frontend URL only
- [ ] Supabase RLS policies active
- [ ] No sensitive data in frontend code
- [ ] API rate limiting enabled
- [ ] Database backups configured
- [ ] **Verify**: Backend files not accessible via frontend URL

## 🚀 Next Steps

1. **Custom Domain:** Configure custom domain for both frontend and backend
2. **CDN:** Add CloudFlare for better performance
3. **Monitoring:** Set up monitoring and logging
4. **SSL:** Ensure end-to-end SSL/TLS
5. **Scaling:** Configure auto-scaling for backend

Your secure What'sYourRecipe app is now ready for production! 🎉 