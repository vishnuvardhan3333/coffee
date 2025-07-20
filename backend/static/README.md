# 🌐 Frontend - What'sYourRecipe

The **secure frontend** for the What'sYourRecipe coffee recipe social network. This folder contains only public files that are safely deployed to GitHub Pages.

## 📁 **This Frontend Folder Contains:**
- ✅ `index.html` - Main application interface
- ✅ `styles.css` - All styling and responsive design
- ✅ `script.js` - UI logic and user interactions
- ✅ `api.js` - Secure API client for backend communication
- ✅ No sensitive data or credentials (all secured in backend)

## 🔐 **NEW: Secure Architecture**
- **✅ No exposed credentials** - All sensitive data secured in backend environment variables
- **✅ Separate frontend/backend** - Frontend on GitHub Pages, backend on cloud hosting
- **✅ API-based communication** - RESTful API with JWT authentication
- **✅ Production-ready** - CORS protection, rate limiting, input validation included

## 🌟 Features

### 🔐 **User Authentication**
- Secure signup and login with email/password
- User profiles with avatars and bios
- Session management with automatic login

### 📱 **Social Media Features**
- **Recipe Feed**: Discover recipes from the community
- **User Profiles**: Follow your favorite coffee creators
- **Voting System**: Upvote and downvote recipes
- **Privacy Controls**: Public or private recipe sharing
- **Search**: Find users and recipes instantly
- **Activity Feed**: Track likes, follows, and new recipes

### ☕ **Comprehensive Recipe System**
- **41+ Variables**: Track every aspect of your coffee-making process
- **Dual View Modes**: Basic mode for beginners, Professional mode for experts
- **Smart Recommendations**: Auto-suggestions based on brew methods
- **Rating System**: 10-point scale for precise evaluation

### 🌍 **Coffee Data**
- **25+ Coffee Regions**: From Ethiopia to Hawaii
- **200+ Indian Estates**: Comprehensive estate database
- **Processing Methods**: Washed, Natural, Honey, Anaerobic, and more
- **Professional Cupping**: SCA-standard sensory evaluation
- **Water Chemistry**: TDS, mineral content, and composition tracking

## 🚀 Quick Start

### Prerequisites
- Web browser with JavaScript enabled
- Supabase account (free tier available)

### Setup Instructions

1. **Clone or Download**
   ```bash
   git clone <repository-url>
   cd coffee-recipe-social
   ```

2. **Set Up Supabase Database**
   - Go to [Supabase](https://supabase.com) and create a new project
   - Copy the contents of `database_setup.sql`
   - Run the SQL in your Supabase SQL Editor
   - This will create all necessary tables, security policies, and sample data

3. **Configure Authentication** 
   - In your Supabase dashboard, go to Authentication > Settings
   - Configure email templates if desired
   - Enable email confirmations (optional)

4. **Update Configuration** (Already configured for your project)
   ```javascript
   const supabaseUrl = 'https://kaydtzseywecnwjrzjxe.supabase.co'
   const supabaseKey = 'your-anon-key' // Already set up
   ```

5. **Launch the App**
   - Open `index.html` in your web browser
   - Or serve with a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### First Time Setup
1. **Create Account**: Click "Create Account" and fill in your details
2. **Explore Feed**: Browse existing recipes from the community  
3. **Create Recipe**: Click "Create Recipe" to share your first coffee creation
4. **Connect**: Follow other users and build your coffee network

## 📖 How to Use

### Creating Recipes

1. **Choose Mode**: Start with Basic Mode for essential fields, switch to Professional Mode for advanced parameters
2. **Recipe Details**: Add name, description, and rating (required)
3. **Bean Information**: Specify variety, region, and processing details
4. **Roasting Profile**: Document roast levels, timing, and development
5. **Brewing Parameters**: Record method, grind size, water chemistry, and ratios
6. **Serving Preferences**: Note milk, temperature, and serving details
7. **Sensory Evaluation**: Professional cupping notes and scoring
8. **Privacy**: Choose public (visible to all) or private (personal only)

### Social Features

- **Feed Views**: Toggle between Basic and Professional display modes
- **Navigation**: Home Feed, Trending, Following, Saved recipes
- **Voting**: Upvote great recipes, downvote poor ones
- **Following**: Build your network of coffee creators
- **Search**: Find users by name or recipes by keywords
- **Sharing**: Share recipe links via social media or messaging

### Recipe Variables (41+ Fields)

#### Bean & Processing (9 variables)
- Bean variety, region, Indian estate (when applicable), processing type, roast type, roast level, crack timing, roast time, development time

#### Brewing & Water (12 variables)
- Brew method, grind size (microns), water composition, TDS, calcium, magnesium, potassium, sodium, coffee amount, water amount, water temperature, brew time

#### Serving (5 variables)
- Milk preference, serving temperature, sweetener, sweetener quantity, serving size

#### Sensory Evaluation & Cupping (12 variables)
- Aroma notes, body, acidity type, sweetness, balance, aftertaste, clean cup, uniformity, cupping score, cupping method, defects, overall impression

#### Additional (3 variables)
- Brewing notes, rating (1-10), date created

**Total: 41+ customizable variables for the perfect coffee recipe!**

## 🎯 Perfect For

- **Home Baristas**: Document and share your coffee experiments
- **Coffee Shops**: Build community around your signature drinks
- **Coffee Roasters**: Showcase roast profiles and brewing guides
- **Coffee Enthusiasts**: Discover new recipes and techniques
- **Learning**: Progressive complexity from beginner to expert

## 💡 Tips for Best Results

1. **Start Simple**: Use Basic Mode until you're comfortable, then explore Professional features
2. **Be Social**: Follow users whose taste aligns with yours
3. **Vote Thoughtfully**: Help the community by rating recipes you try
4. **Share Generously**: Public recipes help everyone improve
5. **Use Professional Cupping**: Take advantage of the complete sensory evaluation section
6. **Track Water Quality**: Water chemistry significantly affects taste
7. **Document Everything**: The more data, the better you can replicate great results

## 🏗️ Technical Details

### 🔐 Secure Architecture
```
Frontend (GitHub Pages) → API Calls → Backend (FastAPI) → Supabase Database
```

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (GitHub Pages)
- **Backend**: Python FastAPI with async/await (Render/Railway/Heroku)
- **API**: RESTful endpoints with automatic OpenAPI documentation
- **Authentication**: JWT tokens with Supabase Auth
- **Database**: PostgreSQL with Row Level Security (Supabase)
- **Security**: CORS protection, input validation, no exposed credentials

### Database Schema
- **profiles**: User information and social data
- **recipes**: Comprehensive recipe storage with 40+ fields
- **recipe_votes**: Upvote/downvote tracking
- **follows**: User relationship management
- **saved_recipes**: Personal recipe collections
- **activities**: Social activity feed
- **recipe_comments**: Community engagement

### 🔒 Security Features
- **No exposed credentials** - All sensitive data in backend environment variables
- **JWT authentication** - Secure token-based user sessions
- **CORS protection** - Configurable allowed origins
- **Input validation** - Pydantic models for all API endpoints
- **Rate limiting** - Built-in FastAPI rate limiting
- **Row Level Security** - Database-level access control
- **HTTPS encryption** - End-to-end secure communication
- **Service key isolation** - Backend uses elevated Supabase permissions

## 🚀 Quick Setup

### 📖 Full Deployment Guide
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### ⚡ Local Development

**🔧 Backend Setup** (from project root):
```bash
cd backend
pip install -r requirements.txt
cp env.example .env  # Add your Supabase service key
uvicorn main:app --reload
```

**🌐 Frontend Setup** (from project root):
```bash
cd frontend
# Update API_BASE_URL in api.js to: http://localhost:8000
python -m http.server 3000
# Visit: http://localhost:3000
```

**📁 Project Structure:**
```
coffee/
├── frontend/     ← You are here (public files)
├── backend/      ← Private server files  
└── database_setup.sql
```

### 🌐 Production Deployment

**✅ This frontend folder is automatically deployed to GitHub Pages!**

1. **GitHub Pages Setup:**
   - Repository Settings → Pages
   - Source: "Deploy from a branch"  
   - Branch: `main`, Folder: `/frontend`
   - **Result**: Only this folder gets deployed (backend stays private!)

2. **Update API URL for Production:**
   ```javascript
   // In api.js, change:
   const API_BASE_URL = 'https://your-backend-url.com';
   ```

3. **Complete Deployment Guide:**
   - See `../DEPLOYMENT.md` for full instructions
   - Backend deploys separately to Render/Railway/Heroku

## 🔄 Development Roadmap

### Phase 1 ✅ (Completed)
- [x] Social media platform architecture
- [x] User authentication and profiles
- [x] Recipe creation and management
- [x] Voting and social features
- [x] Basic/Professional mode toggle
- [x] Comprehensive recipe variables

### Phase 2 🚧 (In Progress)
- [ ] Recipe comments and discussions
- [ ] Advanced search and filtering
- [ ] Recipe collections and categorization
- [ ] User notifications
- [ ] Mobile app optimization

### Phase 3 🔮 (Future)
- [ ] Recipe recommendations AI
- [ ] Coffee shop integration
- [ ] Roasting profile analytics
- [ ] Video recipe tutorials
- [ ] Global coffee events calendar

## 🤝 Contributing

We welcome contributions from the coffee community! Whether you're a developer, barista, or coffee enthusiast, there are ways to help:

- **Developers**: Submit pull requests for new features or bug fixes
- **Coffee Experts**: Suggest new variables, improve cupping standards
- **Designers**: Enhance UI/UX for better user experience
- **Content**: Add more coffee regions, estates, or processing methods

## 📄 License

This project is open source and available under the MIT License.

## ☕ Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Community**: Join our coffee community discussions
- **Documentation**: Check the wiki for detailed guides

---

**Happy Brewing! ☕** 

*"Perfect coffee is not just about the beans, it's about the community that shares the passion."* 