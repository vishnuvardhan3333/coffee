# ☕ What'sYourRecipe - Coffee Recipe Social Network

A **secure** social media platform for coffee enthusiasts to share, discover, and connect over perfect coffee recipes. Built with modern web architecture and production-ready security.

## 🔐 **Secure Architecture**

```
📁 frontend/ (GitHub Pages)    🔗 API Calls    📁 backend/ (Cloud Hosting)    🔗 Supabase Database
├─ index.html                  ├─ REST API     ├─ main.py (FastAPI)            ├─ User profiles  
├─ styles.css                  ├─ JWT auth     ├─ Authentication               ├─ Recipes
├─ script.js                   ├─ CORS         ├─ Recipe management            ├─ Votes & follows
└─ api.js                      └─ HTTPS        └─ Social features              └─ Activity feed
```

### 🛡️ **Security Features:**
- **✅ Zero exposed credentials** - All sensitive data secured in backend
- **✅ Folder isolation** - Frontend and backend completely separated
- **✅ Production-ready** - CORS, rate limiting, input validation
- **✅ JWT authentication** - Secure token-based user sessions

## 📁 **Project Structure**

```
coffee/
├── 🌐 frontend/              # Public files (GitHub Pages)
│   ├── index.html            # Main application
│   ├── styles.css            # Styling
│   ├── script.js             # UI logic
│   ├── api.js                # Secure API client
│   └── README.md             # Frontend documentation
├── 🔒 backend/               # Private server (Cloud hosting)
│   ├── main.py               # FastAPI server
│   ├── requirements.txt      # Python dependencies
│   ├── env.example           # Environment variables template
│   ├── Dockerfile            # Container configuration
│   └── render.yaml           # Deployment configuration
├── 🗄️ database_setup.sql     # Database schema & security
├── 📖 DEPLOYMENT.md          # Complete deployment guide
└── 🚀 .github/workflows/     # CI/CD (frontend deployment)
```

## 🚀 **Quick Start**

### 📖 **Full Deployment Guide**
👉 **See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step deployment instructions**

### ⚡ **Local Development**
```bash
# 1. Backend (Terminal 1)
cd backend
pip install -r requirements.txt
cp env.example .env  # Add your Supabase service key
uvicorn main:app --reload

# 2. Frontend (Terminal 2)  
cd frontend
# Update API_BASE_URL in api.js to: http://localhost:8000
python -m http.server 3000

# 3. Visit: http://localhost:3000
```

### 🌐 **Production Deployment**
1. **Frontend**: Deploys automatically to GitHub Pages from `frontend/` folder
2. **Backend**: Deploy to Render/Railway/Heroku with environment variables
3. **Database**: Supabase (already configured with security policies)

## ✨ **Features**

### 🔐 **User System**
- Secure signup/login with email confirmation
- User profiles with avatars and bios
- Follow/unfollow other coffee enthusiasts

### ☕ **Recipe Management**
- **Basic Mode**: Simple recipe creation for beginners
- **Professional Mode**: Advanced variables for experts
- **Privacy Controls**: Public or private recipe sharing
- **Comprehensive Data**: 40+ recipe variables supported

### 📱 **Social Features**
- **Recipe Feed**: Discover community recipes
- **Voting System**: Upvote/downvote recipes
- **Search**: Find users and recipes instantly
- **Activity Feed**: Track social interactions

## 🏗️ **Technology Stack**

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (GitHub Pages)
- **Backend**: Python FastAPI with async/await (Cloud hosting)
- **Database**: PostgreSQL with Row Level Security (Supabase)
- **Authentication**: JWT tokens with Supabase Auth
- **Security**: CORS protection, input validation, environment variables
- **Deployment**: GitHub Actions + Cloud hosting

## 📊 **API Documentation**

Once deployed, interactive API documentation available at:
```
https://your-backend-url.com/docs
```

## 🔒 **Security Highlights**

- **🔐 No exposed secrets**: All credentials in backend environment variables
- **🏢 Folder isolation**: Frontend and backend completely separated
- **🛡️ CORS protection**: Configurable allowed origins
- **✅ Input validation**: Pydantic models for all API endpoints
- **🔑 JWT authentication**: Secure token-based sessions
- **🔒 Database security**: Row Level Security policies
- **📡 HTTPS encryption**: End-to-end secure communication

## 📋 **Development Workflow**

1. **Frontend developers**: Work in `frontend/` folder
2. **Backend developers**: Work in `backend/` folder  
3. **Database changes**: Update `database_setup.sql`
4. **Deployment**: Automatic via GitHub Actions + cloud hosting

## 🔄 **Roadmap**

### ✅ **Phase 1 - Complete**
- [x] Secure architecture with folder separation
- [x] User authentication and profiles
- [x] Recipe creation and management
- [x] Social features (voting, following)
- [x] Production deployment setup

### 🚧 **Phase 2 - Planned**
- [ ] Recipe comments and discussions  
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Recipe collections and playlists

## 🤝 **Contributing**

1. **Frontend changes**: Work in `frontend/` folder
2. **Backend changes**: Work in `backend/` folder
3. **Security**: Follow the deployment guide for secure practices
4. **Testing**: Test both frontend and backend components

## 📞 **Support**

- **Deployment Issues**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Frontend**: Check `frontend/README.md`
- **Backend**: Review `backend/main.py` and API docs
- **Database**: Reference `database_setup.sql`

---

**🎉 Ready for production deployment!** Your secure What'sYourRecipe platform awaits! ☕ 