// API Configuration - Now handled by api.js
// Remove Supabase client - all operations go through secure backend

class WhatYourRecipeApp {
    constructor() {
        this.currentUser = null;
        this.currentEditingId = null;
        this.isFormProMode = false;
        this.isViewProMode = false;
        this.feedPage = 0;
        this.feedLimit = 10;
        this.currentView = 'feed';
        this.trendingDays = 7; // Default to weekly trending
        this.tagsTimeframe = 1; // Default to daily tags
        
        this.init();
    }

    async init() {
        // Check API health
        await this.checkAPIHealth();
        
        // Check authentication
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 2000);
    }

    async checkAPIHealth() {
        try {
            const health = await api.healthCheck();
            console.log(`✅ Backend API is healthy`);
            console.log(`📍 Environment: ${health.environment || 'unknown'}`);
            console.log(`🕐 Server Time: ${health.timestamp}`);
            
            // Show environment indicator in development
            if (health.environment === 'development') {
                this.showNotification('Running in Development Mode', 'info');
            }
        } catch (error) {
            console.error('❌ Backend API is not available:', error);
            this.showNotification('Backend server is not available. Please try again later.', 'error');
        }
    }

    async checkAuth() {
        // Check if user has stored token
        const token = localStorage.getItem('access_token');
        
        if (token) {
            try {
                // Verify token by getting user profile
                const userData = await api.getUserProfile();
                this.currentUser = userData;
                
                // Ensure clean state for existing session
                this.resetUserSession();
                
                this.showMainApp();
                return;
            } catch (error) {
                // Token is invalid, remove it
                localStorage.removeItem('access_token');
                api.setToken(null);
            }
        }
        
        // No valid token, show auth
        this.showAuth();
    }

    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            const profile = await api.getUserProfile();
            this.currentUser = { ...this.currentUser, ...profile };
            this.updateUserInterface();
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    updateUserInterface() {
        if (!this.currentUser) return;
        
        const userAvatar = document.getElementById('userAvatar');
        
        if (this.currentUser.avatar_url) {
            userAvatar.innerHTML = `<img src="${this.currentUser.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const initials = this.currentUser.full_name?.charAt(0).toUpperCase() || this.currentUser.username?.charAt(0).toUpperCase() || 'U';
            userAvatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    showAuth() {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        this.loadFeed();
        this.loadRecommendedUsers();
        this.loadActivityFeed();
        this.loadTrendingTags();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('resendConfirmation').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendConfirmation();
        });

        // Header
        document.getElementById('createRecipeBtn').addEventListener('click', () => {
            this.showCreateRecipePage();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // User menu
        document.getElementById('userAvatar').addEventListener('click', () => {
            this.toggleUserDropdown();
        });

        document.getElementById('logout').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('viewProfile').addEventListener('click', () => {
            this.showUserProfile(this.currentUser.id);
        });

        document.getElementById('myRecipes').addEventListener('click', () => {
            this.showMyRecipes();
        });

        document.getElementById('settings').addEventListener('click', () => {
            this.showSettings();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });

        // Trending filter buttons
        document.querySelectorAll('.trending-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTrendingDays(parseInt(btn.dataset.trendingDays));
            });
        });

        // Tags time filter buttons
        document.querySelectorAll('.time-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTagsTimeframe(parseInt(btn.dataset.days));
            });
        });

        // View toggles
        document.getElementById('basicViewToggle').addEventListener('click', () => {
            this.setViewMode(false);
        });

        document.getElementById('proViewToggle').addEventListener('click', () => {
            this.setViewMode(true);
        });

        // Recipe form - these are no longer needed as we use page-based navigation
        // document.getElementById('closeCreateModal') and cancelRecipe buttons are replaced with back buttons

        document.getElementById('recipeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecipeSubmit();
        });

        // Form mode toggle
        document.getElementById('basicModeBtn').addEventListener('click', () => {
            this.setFormMode(false);
        });

        document.getElementById('proModeBtn').addEventListener('click', () => {
            this.setFormMode(true);
        });

        // Recipe privacy toggle
        document.getElementById('recipePrivacy').addEventListener('change', (e) => {
            this.updatePrivacyLabel(e.target.checked);
        });

        // Bean region change for India estates
        document.getElementById('beanRegion').addEventListener('change', (e) => {
            this.handleRegionChange(e.target.value);
        });

        // Coffee/water ratio calculation
        document.getElementById('coffeeAmount').addEventListener('input', () => {
            this.calculateCoffeeToWaterRatio();
        });

        document.getElementById('waterAmount').addEventListener('input', () => {
            this.calculateCoffeeToWaterRatio();
        });

        // Brew method auto-suggestions
        document.getElementById('brewMethod').addEventListener('change', (e) => {
            this.updateGrindSizeRecommendation(e.target.value);
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Load more
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreRecipes();
        });

        // Profile editing
        document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditProfile();
        });

        document.getElementById('avatarUpload').addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Set current date
        this.setCurrentDate();
    }

    showSignupForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }

    showLoginForm() {
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await api.login({
                email,
                password
            });

            this.currentUser = response.user;
            
            // Ensure clean state for new user session
            this.resetUserSession();
            
            this.showMainApp();
            this.showNotification('Welcome back!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleSignup() {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const fullName = document.getElementById('signupFullName').value;

        if (!username || !email || !password || !fullName) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        try {
            const response = await api.signup({
                email,
                password,
                username,
                full_name: fullName
            });

            this.showNotification('Please check your email and click the confirmation link to complete registration.', 'info');
            this.showLoginForm();

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleLogout() {
        try {
            await api.logout();
            
            // Complete state reset for security
            this.currentUser = null;
            this.currentEditingId = null;
            this.feedPage = 0;
            this.currentView = 'feed';
            this.currentHashtag = null;
            
            // Clear all cached content
            const feedContent = document.getElementById('feedContent');
            if (feedContent) feedContent.innerHTML = '';
            
            const popularTags = document.getElementById('popularTags');
            if (popularTags) popularTags.innerHTML = '';
            
            const recommendedUsers = document.getElementById('recommendedUsers');
            if (recommendedUsers) recommendedUsers.innerHTML = '';
            
            const activityFeed = document.getElementById('activityFeed');
            if (activityFeed) activityFeed.innerHTML = '';
            
            // Reset navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector('[data-view="feed"]').classList.add('active');
            
            // Hide trending filter
            const trendingFilter = document.getElementById('trendingFilterSection');
            if (trendingFilter) trendingFilter.style.display = 'none';
            
            // Close all modals
            this.closeAllModals();
            
            this.showAuth();
            this.showNotification('Logged out successfully', 'info');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if backend call fails
            this.currentUser = null;
            localStorage.removeItem('access_token');
            api.setToken(null);
            this.showAuth();
            this.showNotification('Logged out (session cleared)', 'info');
        }
    }

    resetUserSession() {
        // Reset all view states for clean user session
        this.currentEditingId = null;
        this.feedPage = 0;
        this.currentView = 'feed';
        this.currentHashtag = null;
        this.trendingDays = 7;
        this.tagsTimeframe = 1;
        
        // Clear any existing content
        const feedContent = document.getElementById('feedContent');
        if (feedContent) feedContent.innerHTML = '';
        
        // Reset navigation to home
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-view="feed"]').classList.add('active');
        
        // Close all modals
        this.closeAllModals();
    }

    async handleResendConfirmation() {
        const email = document.getElementById('loginEmail').value;
        
        if (!email) {
            this.showNotification('Please enter your email address first', 'warning');
            return;
        }

        try {
            await api.resendConfirmation(email);
            this.showNotification('Confirmation email sent! Please check your inbox.', 'success');
        } catch (error) {
            this.showNotification('Error sending confirmation email: ' + error.message, 'error');
        }
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    }

    switchView(view) {
        this.currentView = view;
        this.feedPage = 0;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide trending filter section
        const trendingFilter = document.getElementById('trendingFilterSection');
        if (view === 'trending') {
            trendingFilter.style.display = 'block';
        } else {
            trendingFilter.style.display = 'none';
        }

        // Load content based on view
        this.loadFeed();
    }

    setTrendingDays(days) {
        this.trendingDays = days;
        
        // Update button states
        document.querySelectorAll('.trending-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-trending-days="${days}"]`).classList.add('active');
        
        // Reload feed if currently on trending view
        if (this.currentView === 'trending') {
            this.feedPage = 0;
            this.loadFeed();
        }
    }

    setTagsTimeframe(days) {
        this.tagsTimeframe = days;
        
        // Update button states
        document.querySelectorAll('.time-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-days="${days}"]`).classList.add('active');
        
        // Reload trending tags
        this.loadTrendingTags();
    }

    setViewMode(isProMode) {
        this.isViewProMode = isProMode;
        
        const basicBtn = document.getElementById('basicViewToggle');
        const proBtn = document.getElementById('proViewToggle');

        if (isProMode) {
            basicBtn.classList.remove('active');
            proBtn.classList.add('active');
        } else {
            proBtn.classList.remove('active');
            basicBtn.classList.add('active');
        }

        // Update all recipe cards with new view mode
        const feedContent = document.getElementById('feedContent');
        const recipeCards = feedContent.querySelectorAll('.recipe-card');
        
        recipeCards.forEach(card => {
            const detailsContainer = card.querySelector('.recipe-details');
            if (detailsContainer) {
                // Re-render the recipe details with new view mode
                const recipeId = card.dataset.recipeId;
                // Find the recipe data and update the details
                this.updateRecipeCardDetails(card, isProMode);
            }
        });
    }

    updateRecipeCardDetails(card, isProMode) {
        const detailsContainer = card.querySelector('.recipe-details');
        if (!detailsContainer) return;

        // Get recipe data from the card's dataset
        const recipeData = JSON.parse(card.dataset.recipeData || '{}');
        
        // Update the details with appropriate view mode
        detailsContainer.innerHTML = isProMode 
            ? this.createProRecipeDetails(recipeData)
            : this.createBasicRecipeDetails(recipeData);
    }

    setFormMode(isProMode) {
        this.isFormProMode = isProMode;
        const form = document.getElementById('recipeForm');
        const basicBtn = document.getElementById('basicModeBtn');
        const proBtn = document.getElementById('proModeBtn');

        if (isProMode) {
            form.classList.remove('basic-mode');
            form.classList.add('pro-mode');
            basicBtn.classList.remove('active');
            proBtn.classList.add('active');
        } else {
            form.classList.remove('pro-mode');
            form.classList.add('basic-mode');
            proBtn.classList.remove('active');
            basicBtn.classList.add('active');
        }
    }

    updatePrivacyLabel(isPublic) {
        const label = document.querySelector('.toggle-label');
        if (isPublic) {
            label.innerHTML = '<i class="fas fa-globe"></i> Public Recipe';
        } else {
            label.innerHTML = '<i class="fas fa-lock"></i> Private Recipe';
        }
    }

    async loadFeed() {
        const feedContent = document.getElementById('feedContent');
        
        if (this.feedPage === 0) {
            feedContent.innerHTML = '<div class="loading-placeholder">Loading recipes...</div>';
        }

        try {
            const recipes = await api.getRecipes(
                this.feedPage + 1, // API uses 1-based pagination
                this.feedLimit,
                this.currentView,
                this.trendingDays
            );

            if (this.feedPage === 0) {
                feedContent.innerHTML = '';
            }

            if (recipes && recipes.length > 0) {
                recipes.forEach(recipe => {
                    feedContent.appendChild(this.createRecipeCard(recipe));
                });
            } else if (this.feedPage === 0) {
                feedContent.innerHTML = this.getEmptyFeedMessage();
            }

            // Show/hide load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (recipes && recipes.length === this.feedLimit) {
                loadMoreBtn.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'none';
            }

        } catch (error) {
            console.error('Error loading feed:', error);
            feedContent.innerHTML = '<div class="error-message">Error loading recipes. Please try again.</div>';
        }
    }

    loadMoreRecipes() {
        this.feedPage++;
        this.loadFeed();
    }

    getEmptyFeedMessage() {
        switch (this.currentView) {
            case 'following':
                return `
                    <div class="empty-feed">
                        <i class="fas fa-users"></i>
                        <h3>No recipes from people you follow</h3>
                        <p>Follow some coffee enthusiasts to see their recipes here!</p>
                    </div>
                `;
            case 'saved':
                return `
                    <div class="empty-feed">
                        <i class="fas fa-bookmark"></i>
                        <h3>No saved recipes</h3>
                        <p>Save recipes you love to see them here!</p>
                    </div>
                `;
            case 'trending':
                return `
                    <div class="empty-feed">
                        <i class="fas fa-fire"></i>
                        <h3>No trending recipes</h3>
                        <p>Be the first to create a trending recipe!</p>
                    </div>
                `;
            default:
                return `
                    <div class="empty-feed">
                        <i class="fas fa-coffee"></i>
                        <h3>Welcome to What'sYourRecipe!</h3>
                        <p>No recipes yet. Be the first to share your perfect coffee moment!</p>
                    </div>
                `;
        }
    }

    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.dataset.recipeId = recipe.id;
        card.dataset.recipeData = JSON.stringify(recipe);
        
        // Debug: Log recipe ID to verify it's correct
        console.log('Creating recipe card with ID:', recipe.id);
        
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const getRatingStars = (rating) => {
            if (!rating) return '';
            const numRating = parseInt(rating);
            const stars = '⭐'.repeat(Math.min(numRating, 10));
            return `${stars} (${rating}/10)`;
        };

        // Calculate vote counts
        const upvotes = recipe.recipe_votes?.filter(v => v.vote_type === 'up').length || 0;
        const downvotes = recipe.recipe_votes?.filter(v => v.vote_type === 'down').length || 0;
        const userVote = recipe.recipe_votes?.find(v => v.user_id === this.currentUser?.id)?.vote_type;

        card.innerHTML = `
            <div class="recipe-card-header">
                <div class="recipe-author" onclick="app.showUserProfile('${recipe.user_id}')">
                    <div class="avatar">
                        ${recipe.profiles?.avatar_url 
                            ? `<img src="${recipe.profiles.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                            : (recipe.profiles?.username?.charAt(0)?.toUpperCase() || recipe.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U')
                        }
                    </div>
                    <div class="info">
                        <div class="name">${recipe.profiles?.username || recipe.profiles?.full_name || 'Anonymous Chef'}</div>
                        <div class="time">${formatDate(recipe.created_at)}</div>
                    </div>
                </div>
                <div class="recipe-privacy">
                    <i class="fas fa-${recipe.is_public ? 'globe' : 'lock'}"></i>
                    ${recipe.is_public ? 'Public' : 'Private'}
                </div>
            </div>

            <div class="recipe-card-content">
                <h3 class="recipe-title" onclick="app.showRecipeDetail('${recipe.id}')">${recipe.recipe_name}</h3>
                <p class="recipe-description">${recipe.description}</p>
                
                ${recipe.rating ? `<div class="recipe-rating">${getRatingStars(recipe.rating)}</div>` : ''}
                
                <div class="recipe-details">
                    ${this.createRecipeCardDetails(recipe)}
                </div>
            </div>

            <div class="recipe-card-actions">
                <div class="recipe-actions-left">
                    <button class="action-btn ${userVote === 'up' ? 'voted' : ''}" onclick="app.voteRecipe('${recipe.id}', 'up')">
                        <i class="fas fa-arrow-up"></i>
                        <span>${upvotes}</span>
                    </button>
                    <button class="action-btn ${userVote === 'down' ? 'downvoted' : ''}" onclick="app.voteRecipe('${recipe.id}', 'down')">
                        <i class="fas fa-arrow-down"></i>
                        <span>${downvotes}</span>
                    </button>
                    <button class="action-btn" onclick="app.shareRecipe('${recipe.id}')">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </button>
                </div>
                <div class="recipe-actions-right">
                    <button class="recipe-btn" onclick="app.saveRecipe('${recipe.id}')">
                        <i class="fas fa-bookmark"></i>
                        Save
                    </button>
                    <button class="recipe-btn primary" onclick="app.showRecipeDetail('${recipe.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    ${recipe.user_id === this.currentUser?.id ? `
                        <button class="recipe-btn" onclick="app.editRecipe('${recipe.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        return card;
    }

    createRecipeCardDetails(recipe) {
        if (this.isViewProMode) {
            return this.createProRecipeDetails(recipe);
        } else {
            return this.createBasicRecipeDetails(recipe);
        }
    }

    createBasicRecipeDetails(recipe) {
        const formatFieldName = (fieldName) => {
            return fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        };

        return `
            ${(recipe.bean_variety || recipe.bean_region) ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Bean</div>
                <div class="recipe-detail-value">
                    ${recipe.bean_variety ? formatFieldName(recipe.bean_variety) : ''}${recipe.bean_variety && recipe.bean_region ? ' from ' : ''}${recipe.bean_region ? formatFieldName(recipe.bean_region) : ''}
                </div>
            </div>
            ` : ''}
            ${recipe.roast_level ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Roast</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.roast_level)}</div>
            </div>
            ` : ''}
            ${recipe.brew_method ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Brew Method</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.brew_method)}</div>
            </div>
            ` : ''}
            ${(recipe.coffee_amount && recipe.water_amount) ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Recipe</div>
                <div class="recipe-detail-value">${recipe.coffee_amount}g : ${recipe.water_amount}ml</div>
            </div>
            ` : ''}
            ${recipe.milk_preference ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Milk</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.milk_preference)}</div>
            </div>
            ` : ''}
        `;
    }

    createProRecipeDetails(recipe) {
        const formatFieldName = (fieldName) => {
            return fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        };

        return `
            ${(recipe.bean_variety || recipe.bean_region) ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Bean</div>
                <div class="recipe-detail-value">
                    ${recipe.bean_variety ? formatFieldName(recipe.bean_variety) : ''}${recipe.bean_variety && recipe.bean_region ? ' from ' : ''}${recipe.bean_region ? formatFieldName(recipe.bean_region) : ''}${recipe.india_estate ? ` (${formatFieldName(recipe.india_estate)})` : ''}
                </div>
            </div>
            ` : ''}
            ${recipe.processing_type ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Processing</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.processing_type)}</div>
            </div>
            ` : ''}
            ${(recipe.roast_level || recipe.roast_type) ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Roast</div>
                <div class="recipe-detail-value">
                    ${recipe.roast_level ? formatFieldName(recipe.roast_level) : ''}${recipe.roast_level && recipe.roast_type ? ' (' : ''}${recipe.roast_type ? formatFieldName(recipe.roast_type) : ''}${recipe.roast_level && recipe.roast_type ? ')' : ''}
                </div>
            </div>
            ` : ''}
            ${recipe.brew_method ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Brew Method</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.brew_method)}</div>
            </div>
            ` : ''}
            ${recipe.grind_microns ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Grind Size</div>
                <div class="recipe-detail-value">${recipe.grind_microns}μm</div>
            </div>
            ` : ''}
            ${recipe.water_composition ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Water</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.water_composition)}</div>
            </div>
            ` : ''}
            ${recipe.tds ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">TDS</div>
                <div class="recipe-detail-value">${recipe.tds} ppm</div>
            </div>
            ` : ''}
            ${(recipe.coffee_amount && recipe.water_amount) ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Recipe</div>
                <div class="recipe-detail-value">${recipe.coffee_amount}g : ${recipe.water_amount}ml</div>
            </div>
            ` : ''}
            ${recipe.water_temp ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Water Temp</div>
                <div class="recipe-detail-value">${recipe.water_temp}°C</div>
            </div>
            ` : ''}
            ${recipe.brew_time ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Brew Time</div>
                <div class="recipe-detail-value">${recipe.brew_time} min</div>
            </div>
            ` : ''}
            ${recipe.milk_preference ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Milk</div>
                <div class="recipe-detail-value">${formatFieldName(recipe.milk_preference)}</div>
            </div>
            ` : ''}
            ${recipe.cupping_score ? `
            <div class="recipe-detail">
                <div class="recipe-detail-label">Cupping Score</div>
                <div class="recipe-detail-value">${recipe.cupping_score}/100</div>
            </div>
            ` : ''}
        `;
    }

    async voteRecipe(recipeId, voteType) {
        if (!this.currentUser) {
            this.showNotification('Please log in to vote', 'warning');
            return;
        }

        try {
            await api.castVote(recipeId, voteType);

            // Refresh the feed to show updated vote counts
            this.feedPage = 0;
            this.loadFeed();

        } catch (error) {
            console.error('Error voting:', error);
            this.showNotification('Error voting on recipe', 'error');
        }
    }

    async shareRecipe(recipeId) {
        const url = `${window.location.origin}?recipe=${recipeId}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this coffee recipe!',
                    url: url
                });
            } catch (error) {
                // Fallback to clipboard
                this.copyToClipboard(url);
            }
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Recipe link copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Could not copy link', 'error');
        });
    }

    async saveRecipe(recipeId) {
        if (!this.currentUser) {
            this.showNotification('Please log in to save recipes', 'warning');
            return;
        }

        try {
            const response = await api.saveRecipe(recipeId);
            this.showNotification(response.message, 'success');
            
            // Update the save button state
            const saveBtn = document.querySelector(`[onclick="app.saveRecipe('${recipeId}')"]`);
            if (saveBtn) {
                if (response.action === 'saved') {
                    saveBtn.innerHTML = '<i class="fas fa-bookmark-solid"></i> Saved';
                    saveBtn.classList.add('saved');
                } else {
                    saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
                    saveBtn.classList.remove('saved');
                }
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showNotification('Error saving recipe', 'error');
        }
    }

    showCreateRecipePage() {
        const feedContent = document.getElementById('feedContent');
        this.currentEditingId = null;
        
        feedContent.innerHTML = `
            <div class="create-recipe-page-extended">
                <div class="create-recipe-header-fixed">
                    <button class="back-btn" onclick="app.goBack()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <h1><i class="fas fa-plus-circle"></i> Create New Recipe</h1>
                
                    <div class="header-controls">
                    <div class="recipe-privacy-toggle">
                        <label class="privacy-toggle">
                            <input type="checkbox" id="recipePrivacy" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">
                                <i class="fas fa-globe"></i> Public Recipe
                            </span>
                        </label>
                    </div>

                    <div class="form-mode-toggle">
                        <button type="button" id="basicModeBtn" class="mode-btn active">
                            <i class="fas fa-coffee"></i> Basic Mode
                        </button>
                        <button type="button" id="proModeBtn" class="mode-btn">
                            <i class="fas fa-cogs"></i> Professional Mode
                        </button>
                        </div>
                    </div>
                    </div>
                    
                <div class="create-recipe-form-container">
                    <form id="recipeForm" class="recipe-form-extended">
                        ${this.getRecipeFormHTML()}
                        
                        <div class="form-actions-fixed">
                            <button type="button" class="btn btn-secondary" onclick="app.goBack()">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <span id="submitBtnText">Create Recipe</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Initialize form
        this.setCurrentDate();
        this.setFormMode(false);
        this.setupFormEventListeners();
    }

    getRecipeFormHTML() {
        return `
            <div class="form-section">
                <h2><i class="fas fa-tag"></i> Recipe Details</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="recipeName">Recipe Name *</label>
                        <input type="text" id="recipeName" name="recipeName" required placeholder="My Perfect Morning Brew">
                    </div>
                    <div class="form-group">
                        <label for="rating">Rating (1-10) *</label>
                        <input type="number" id="rating" name="rating" min="1" max="10" step="0.5" required placeholder="8.5">
                    </div>
                </div>
                <div class="form-group">
                    <label for="description">Description *</label>
                    <textarea id="description" name="description" required placeholder="Describe your recipe and what makes it special..." rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="dateCreated">Date Created *</label>
                    <input type="date" id="dateCreated" name="dateCreated" required>
                </div>
            </div>

            <div class="form-section">
                <h2><i class="fas fa-seedling"></i> Bean Information</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="beanVariety">Bean Variety</label>
                        <select id="beanVariety" name="beanVariety">
                            <option value="">Select variety</option>
                            <option value="arabica">Arabica</option>
                            <option value="robusta">Robusta</option>
                            <option value="liberica">Liberica</option>
                            <option value="excelsa">Excelsa</option>
                            <option value="bourbon">Bourbon</option>
                            <option value="typica">Typica</option>
                            <option value="caturra">Caturra</option>
                            <option value="catuai">Catuai</option>
                            <option value="mundo-novo">Mundo Novo</option>
                            <option value="pacamara">Pacamara</option>
                            <option value="maragogype">Maragogype</option>
                            <option value="geisha">Geisha/Gesha</option>
                            <option value="sv-315">SL-28/SL-34</option>
                            <option value="java">Java</option>
                            <option value="kona">Kona</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="beanRegion">Bean Region</label>
                        <select id="beanRegion" name="beanRegion">
                            <option value="">Select region</option>
                            <option value="brazil">Brazil</option>
                            <option value="colombia">Colombia</option>
                            <option value="ethiopia">Ethiopia</option>
                            <option value="guatemala">Guatemala</option>
                            <option value="costa-rica">Costa Rica</option>
                            <option value="honduras">Honduras</option>
                            <option value="nicaragua">Nicaragua</option>
                            <option value="panama">Panama</option>
                            <option value="jamaica">Jamaica</option>
                            <option value="hawaii">Hawaii</option>
                            <option value="yemen">Yemen</option>
                            <option value="kenya">Kenya</option>
                            <option value="tanzania">Tanzania</option>
                            <option value="rwanda">Rwanda</option>
                            <option value="burundi">Burundi</option>
                            <option value="uganda">Uganda</option>
                            <option value="india">India</option>
                            <option value="indonesia">Indonesia</option>
                            <option value="vietnam">Vietnam</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="roastLevel">Roast Level</label>
                        <select id="roastLevel" name="roastLevel">
                            <option value="">Select roast</option>
                            <option value="light">Light Roast</option>
                            <option value="medium-light">Medium-Light Roast</option>
                            <option value="medium">Medium Roast</option>
                            <option value="medium-dark">Medium-Dark Roast</option>
                            <option value="dark">Dark Roast</option>
                            <option value="french">French Roast</option>
                            <option value="italian">Italian Roast</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="processingMethod">Processing Method</label>
                        <select id="processingMethod" name="processingMethod">
                            <option value="">Select method</option>
                            <option value="washed">Washed (Wet Process)</option>
                            <option value="natural">Natural (Dry Process)</option>
                            <option value="honey">Honey Process</option>
                            <option value="semi-washed">Semi-Washed</option>
                            <option value="wet-hulled">Wet-Hulled</option>
                            <option value="carbonic-maceration">Carbonic Maceration</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-section brewing-section">
                <h2><i class="fas fa-fire"></i> Brewing Method</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="brewingMethod">Method *</label>
                        <select id="brewingMethod" name="brewingMethod" required>
                            <option value="">Select method</option>
                            <option value="espresso">Espresso</option>
                            <option value="drip">Drip Coffee</option>
                            <option value="french-press">French Press</option>
                            <option value="pour-over">Pour Over</option>
                            <option value="aeropress">AeroPress</option>
                            <option value="cold-brew">Cold Brew</option>
                            <option value="turkish">Turkish Coffee</option>
                            <option value="moka-pot">Moka Pot</option>
                            <option value="chemex">Chemex</option>
                            <option value="v60">V60</option>
                            <option value="kalita-wave">Kalita Wave</option>
                            <option value="siphon">Siphon</option>
                            <option value="percolator">Percolator</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="grindSize">Grind Size</label>
                        <select id="grindSize" name="grindSize">
                            <option value="">Select grind</option>
                            <option value="extra-coarse">Extra Coarse</option>
                            <option value="coarse">Coarse</option>
                            <option value="medium-coarse">Medium-Coarse</option>
                            <option value="medium">Medium</option>
                            <option value="medium-fine">Medium-Fine</option>
                            <option value="fine">Fine</option>
                            <option value="extra-fine">Extra Fine</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-section pro-only">
                <h2><i class="fas fa-flask"></i> Professional Parameters</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="coffeeWeight">Coffee Weight (g)</label>
                        <input type="number" id="coffeeWeight" name="coffeeWeight" step="0.1" placeholder="18.0">
                    </div>
                    <div class="form-group">
                        <label for="waterWeight">Water Weight (g)</label>
                        <input type="number" id="waterWeight" name="waterWeight" step="1" placeholder="300">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="waterTemp">Water Temperature (°C)</label>
                        <input type="number" id="waterTemp" name="waterTemp" step="1" placeholder="93">
                    </div>
                    <div class="form-group">
                        <label for="brewTime">Brew Time (seconds)</label>
                        <input type="number" id="brewTime" name="brewTime" step="1" placeholder="240">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tds">TDS (%)</label>
                        <input type="number" id="tds" name="tds" step="0.01" placeholder="1.35">
                    </div>
                    <div class="form-group">
                        <label for="extraction">Extraction (%)</label>
                        <input type="number" id="extraction" name="extraction" step="0.1" placeholder="20.0">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2><i class="fas fa-sticky-note"></i> Additional Notes</h2>
                <div class="form-group">
                    <label for="notes">Brewing Notes</label>
                    <textarea id="notes" name="notes" placeholder="Any special techniques, observations, or tips..." rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label for="tastingNotes">Tasting Notes</label>
                    <textarea id="tastingNotes" name="tastingNotes" placeholder="Flavor profile, aroma, body, acidity..." rows="3"></textarea>
                </div>
            </div>
        `;
    }

    setupFormEventListeners() {
        // Form submission
        document.getElementById('recipeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecipeSubmit();
        });

        // Form mode toggle
        const basicModeBtn = document.getElementById('basicModeBtn');
        const proModeBtn = document.getElementById('proModeBtn');
        
        if (basicModeBtn) {
            basicModeBtn.addEventListener('click', () => {
                this.setFormMode(false);
            });
        }
        
        if (proModeBtn) {
            proModeBtn.addEventListener('click', () => {
                this.setFormMode(true);
            });
        }
    }

    clearForm() {
        const form = document.getElementById('recipeForm');
        if (form) {
            form.reset();
        }
        this.currentEditingId = null;
        this.setCurrentDate();
        
        // Reset privacy toggle
        const privacyToggle = document.getElementById('recipePrivacy');
        if (privacyToggle) {
            privacyToggle.checked = true;
        }
        this.updatePrivacyLabel(true);
        
        // Clear ratio display
        const ratioDisplay = document.getElementById('ratioDisplay');
        if (ratioDisplay) {
            ratioDisplay.innerHTML = '<span>Ratio: 1:16.7</span>';
        }

        // Hide India estate group
        const indiaEstateGroup = document.getElementById('indiaEstateGroup');
        if (indiaEstateGroup) {
            indiaEstateGroup.style.display = 'none';
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateCreated').value = today;
    }

    async handleRecipeSubmit() {
        const formData = new FormData(document.getElementById('recipeForm'));
        
        // Helper function to convert empty strings to null for numeric fields
        const getNumericValue = (fieldName) => {
            const value = formData.get(fieldName);
            return value && value.trim() !== '' ? parseFloat(value) : null;
        };
        
        const getIntegerValue = (fieldName) => {
            const value = formData.get(fieldName);
            return value && value.trim() !== '' ? parseInt(value) : null;
        };
        
        const getStringValue = (fieldName) => {
            const value = formData.get(fieldName);
            return value && value.trim() !== '' ? value.trim() : null;
        };
        
        const recipe = {
            // Required fields
            recipe_name: formData.get('recipeName'),
            description: formData.get('description'),
            rating: getNumericValue('rating'),
            date_created: getStringValue('dateCreated'),
            
            // Bean information
            bean_variety: getStringValue('beanVariety'),
            bean_region: getStringValue('beanRegion'),
            india_estate: getStringValue('indiaEstate'),
            processing_type: getStringValue('processingType'),
            
            // Roasting profile
            roast_type: getStringValue('roastType'),
            roast_level: getStringValue('roastLevel'),
            crack_time: getStringValue('crackTime'),
            roast_time: getNumericValue('roastTime'),
            development_time: getNumericValue('developmentTime'),
            
            // Brewing parameters
            brew_method: getStringValue('brewMethod'),
            grind_microns: getIntegerValue('grindMicrons'),
            water_composition: getStringValue('waterComposition'),
            tds: getNumericValue('tds'),
            calcium: getNumericValue('calcium'),
            magnesium: getNumericValue('magnesium'),
            potassium: getNumericValue('potassium'),
            sodium: getNumericValue('sodium'),
            coffee_amount: getNumericValue('coffeeAmount'),
            water_amount: getNumericValue('waterAmount'),
            water_temp: getIntegerValue('waterTemp'),
            brew_time: getNumericValue('brewTime'),
            
            // Serving preferences
            milk_preference: getStringValue('milkPreference'),
            serving_temp: getStringValue('servingTemp'),
            sweetener: getStringValue('sweetener'),
            sweetener_quantity: getNumericValue('sweetenerQuantity'),
            serving_size: getNumericValue('servingSize'),
            
            // Sensory & evaluation
            aroma_notes: getStringValue('aromaNotes'),
            body: getStringValue('body'),
            acidity_type: getStringValue('acidityType'),
            sweetness: getStringValue('sweetness'),
            balance: getStringValue('balance'),
            aftertaste: getStringValue('aftertaste'),
            clean_cup: getStringValue('cleanCup'),
            uniformity: getStringValue('uniformity'),
            cupping_score: getNumericValue('cuppingScore'),
            cupping_method: getStringValue('cuppingMethod'),
            defects: getStringValue('defects'),
            overall_impression: getStringValue('overallImpression'),
            
            // Additional notes
            brewing_notes: getStringValue('brewingNotes'),
            
            // Privacy
            is_public: document.getElementById('recipePrivacy').checked
        };

        // Validate required fields
        if (!this.validateRecipe(recipe)) {
            return;
        }

        try {
            if (this.currentEditingId) {
                // Update existing recipe - TODO: Implement update API endpoint
                this.showNotification('Recipe update feature coming soon!', 'info');
                return;
            } else {
                // Create new recipe
                await api.createRecipe(recipe);
                this.showNotification('Recipe created successfully!', 'success');
            }

            this.goBack();

        } catch (error) {
            console.error('Error saving recipe:', error);
            
            // Show specific validation errors if available
            if (error.message.includes('422') || error.message.includes('validation')) {
                this.showNotification('Please check your form data. Some fields may be invalid or missing.', 'error');
                console.error('Validation error details:', error);
            } else {
            this.showNotification('Error saving recipe. Please try again.', 'error');
            }
        }
    }

    validateRecipe(recipe) {
        const requiredFields = ['recipe_name', 'description', 'rating', 'date_created'];

        for (const field of requiredFields) {
            if (!recipe[field] || recipe[field].toString().trim() === '') {
                this.showNotification(`Please fill in the ${field.replace(/_/g, ' ')} field.`, 'error');
                return false;
            }
        }

        return true;
    }

    handleRegionChange(region) {
        const indiaEstateGroup = document.getElementById('indiaEstateGroup');
        const indiaEstateSelect = document.getElementById('indiaEstate');

        if (region === 'india') {
            indiaEstateGroup.style.display = 'block';
            indiaEstateGroup.style.animation = 'slideIn 0.3s ease-out';
            this.populateIndiaEstates();
        } else {
            indiaEstateGroup.style.display = 'none';
            indiaEstateSelect.value = '';
        }
    }

    populateIndiaEstates() {
        const indiaEstateSelect = document.getElementById('indiaEstate');
        
        const estates = [
            // Karnataka
            'Baba Budan Giri Estate', 'Balehonnur Estate', 'Kerehaklu Estate',
            // Kerala
            'Wayanad Estate', 'Nelliampathi Estate', 'Munnar Estate',
            // Tamil Nadu
            'Kotagiri Estate', 'Coonoor Estate', 'Yercaud Estate'
        ];

        indiaEstateSelect.innerHTML = '<option value="">Select estate</option>';
        estates.forEach(estate => {
            const option = document.createElement('option');
            option.value = estate.toLowerCase().replace(/\s+/g, '-');
            option.textContent = estate;
            indiaEstateSelect.appendChild(option);
        });
    }

    calculateCoffeeToWaterRatio() {
        const coffeeAmount = parseFloat(document.getElementById('coffeeAmount').value) || 0;
        const waterAmount = parseFloat(document.getElementById('waterAmount').value) || 0;
        
        const ratioDisplay = document.getElementById('ratioDisplay');
        
        if (coffeeAmount > 0 && waterAmount > 0) {
            const ratio = (waterAmount / coffeeAmount).toFixed(1);
            ratioDisplay.innerHTML = `<span>Ratio: 1:${ratio}</span>`;
        } else {
            ratioDisplay.innerHTML = '<span>Ratio: 1:16.7</span>';
        }
    }

    updateGrindSizeRecommendation(brewMethod) {
        const grindMicronsInput = document.getElementById('grindMicrons');
        const recommendations = {
            'espresso': { size: 'fine', microns: 350 },
            'pour-over': { size: 'medium-fine', microns: 700 },
            'french-press': { size: 'coarse', microns: 1200 },
            'aeropress': { size: 'medium-fine', microns: 650 },
            'cold-brew': { size: 'coarse', microns: 1300 },
            'turkish': { size: 'extra-fine', microns: 300 },
            'moka-pot': { size: 'fine', microns: 500 },
            'drip-coffee': { size: 'medium', microns: 800 },
            'siphon': { size: 'medium', microns: 750 }
        };

        if (recommendations[brewMethod]) {
            grindMicronsInput.value = recommendations[brewMethod].microns;
            this.showNotification(`Recommended: ${recommendations[brewMethod].size.replace('-', ' ')} grind (${recommendations[brewMethod].microns}μm)`, 'info');
        }
    }

    async loadRecommendedUsers() {
        if (!this.currentUser) return;

        try {
            const recommendations = await api.getRecommendedUsers();
        const recommendedUsers = document.getElementById('recommendedUsers');
            
            if (recommendations && recommendations.length > 0) {
                recommendedUsers.innerHTML = recommendations.map(user => `
                    <div class="recommended-user" onclick="app.showUserProfile('${user.id}')">
                        <div class="avatar">
                            ${user.avatar_url 
                                ? `<img src="${user.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                                : (user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U')
                            }
                        </div>
                <div class="info">
                            <div class="name">${user.full_name || user.username}</div>
                            <div class="username">@${user.username}</div>
                </div>
                        <button class="follow-btn" onclick="event.stopPropagation(); app.quickFollow('${user.id}', this)">
                            <i class="fas fa-user-plus"></i>
                        </button>
            </div>
                `).join('');
            } else {
                recommendedUsers.innerHTML = `
                    <div class="no-recommendations">
                        <p>No recommendations yet. Start following users and voting on recipes to see personalized suggestions!</p>
                </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recommended users:', error);
            document.getElementById('recommendedUsers').innerHTML = `
                <div class="recommendation-error">
                    <p>Unable to load recommendations</p>
            </div>
        `;
        }
    }

    async quickFollow(userId, button) {
        try {
            const response = await api.followUser(userId);
            if (response.following) {
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('followed');
                this.showNotification('User followed!', 'success');
                
                // Remove from recommendations after following
                setTimeout(() => {
                    button.closest('.recommended-user').remove();
                }, 1000);
            }
        } catch (error) {
            console.error('Error following user:', error);
            this.showNotification('Error following user', 'error');
        }
    }

    async loadActivityFeed() {
        if (!this.currentUser) return;

        try {
            const activities = await api.getActivityFeed();
        const activityFeed = document.getElementById('activityFeed');
            
            if (activities && activities.length > 0) {
                activityFeed.innerHTML = activities.map(activity => {
                    const timeAgo = this.formatTimeAgo(activity.created_at);
                    
                    switch (activity.activity_type) {
                        case 'like':
                            return `
            <div class="activity-item">
                                    <div class="icon heart"><i class="fas fa-heart"></i></div>
                                    <div class="content">
                                        <strong>${activity.user_profile?.username || activity.user_profile?.full_name}</strong> 
                                        liked your recipe 
                                        <strong>${activity.recipe?.recipe_name}</strong>
                                        <div class="activity-time">${timeAgo}</div>
            </div>
                                </div>
                            `;
                        case 'follow':
                            return `
            <div class="activity-item">
                                    <div class="icon follow"><i class="fas fa-user-plus"></i></div>
                                    <div class="content">
                                        <strong>${activity.user_profile?.username || activity.user_profile?.full_name}</strong> 
                                        started following you
                                        <div class="activity-time">${timeAgo}</div>
                                    </div>
                                </div>
                            `;
                        case 'create_recipe':
                            return `
                                <div class="activity-item">
                                    <div class="icon recipe"><i class="fas fa-coffee"></i></div>
                                    <div class="content">
                                        <strong>${activity.user_profile?.username || activity.user_profile?.full_name}</strong> 
                                        created a new recipe: 
                                        <strong>${activity.content}</strong>
                                        <div class="activity-time">${timeAgo}</div>
                                    </div>
                                </div>
                            `;
                        default:
                            return `
                                <div class="activity-item">
                                    <div class="icon"><i class="fas fa-bell"></i></div>
                                    <div class="content">
                                        <strong>${activity.user_profile?.username || activity.user_profile?.full_name}</strong> 
                                        ${activity.content || 'had some activity'}
                                        <div class="activity-time">${timeAgo}</div>
                                    </div>
            </div>
        `;
                    }
                }).join('');
            } else {
                activityFeed.innerHTML = `
                    <div class="no-activity">
                        <i class="fas fa-bell-slash"></i>
                        <p>No recent activity</p>
                        <small>Follow users and interact with recipes to see activity here!</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading activity feed:', error);
            document.getElementById('activityFeed').innerHTML = `
                <div class="activity-error">
                    <p>Unable to load activity feed</p>
                </div>
            `;
        }
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    async loadTrendingTags() {
        try {
            const hashtags = await api.getTrendingHashtags(10, this.tagsTimeframe);
            const container = document.getElementById('popularTags');
            
            if (hashtags && hashtags.length > 0) {
                container.innerHTML = hashtags.map(hashtag => `
                    <span class="tag" onclick="app.filterByHashtag('${hashtag.tag}')">
                        #${hashtag.tag}
                        <span class="tag-count">${hashtag.recent_usage_count || hashtag.usage_count}</span>
                    </span>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="no-tags">
                        <p>No trending tags yet</p>
                        <small>Create recipes with #hashtags to see them here!</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading trending tags:', error);
            document.getElementById('popularTags').innerHTML = `
                <div class="tags-error">
                    <p>Unable to load trending tags</p>
                </div>
            `;
        }
    }

    async filterByHashtag(hashtag) {
        try {
            // Update the main feed to show hashtag filtered recipes
            this.currentView = 'hashtag';
            this.currentHashtag = hashtag;
            this.feedPage = 0;
            
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Hide trending filter
            document.getElementById('trendingFilterSection').style.display = 'none';
            
            const feedContent = document.getElementById('feedContent');
            feedContent.innerHTML = `
                <div class="hashtag-header">
                    <h2><i class="fas fa-hashtag"></i> ${hashtag}</h2>
                    <div class="hashtag-sort">
                        <button class="sort-btn active" onclick="app.sortHashtagResults('recent')">Recent</button>
                        <button class="sort-btn" onclick="app.sortHashtagResults('popular')">Popular</button>
                        <button class="sort-btn" onclick="app.sortHashtagResults('trending')">Trending</button>
                        <button class="sort-btn" onclick="app.sortHashtagResults('rating')">Top Rated</button>
                    </div>
                </div>
                <div id="hashtagResults">
                    <div class="loading-placeholder">Loading recipes...</div>
                </div>
            `;
            
            // Load hashtag recipes
            await this.loadHashtagRecipes('recent');
            
        } catch (error) {
            console.error('Error filtering by hashtag:', error);
            this.showNotification('Error loading hashtag recipes', 'error');
        }
    }

    async loadHashtagRecipes(sortBy = 'recent') {
        try {
            const recipes = await api.getRecipesByHashtag(this.currentHashtag, sortBy);
            const container = document.getElementById('hashtagResults');
            
            if (recipes && recipes.length > 0) {
                container.innerHTML = '';
                recipes.forEach(recipe => {
                    container.appendChild(this.createRecipeCard(recipe));
                });
            } else {
                container.innerHTML = `
                    <div class="empty-hashtag">
                        <i class="fas fa-hashtag"></i>
                        <h3>No recipes found for #${this.currentHashtag}</h3>
                        <p>Be the first to create a recipe with this hashtag!</p>
                        <button class="btn btn-primary" onclick="app.showCreateRecipePage()">
                            Create Recipe
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading hashtag recipes:', error);
            document.getElementById('hashtagResults').innerHTML = `
                <div class="error-message">Error loading recipes for this hashtag.</div>
            `;
        }
    }

    async sortHashtagResults(sortBy) {
        // Update button states
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Reload with new sort
        await this.loadHashtagRecipes(sortBy);
    }

    async handleSearch(query) {
        if (query.trim().length < 2) {
            this.hideSearchDropdown();
            return;
        }

        try {
            const [recipes, users] = await Promise.all([
                api.searchRecipes(query, 5),
                api.searchUsers(query, 5)
            ]);

            this.showSearchDropdown(recipes || [], users || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchDropdown(recipes, users) {
        const dropdown = document.getElementById('searchDropdown');

        let html = '';

        // Users section
        if (users.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <i class="fas fa-users"></i> Users
                    </div>
                        ${users.map(user => `
                        <div class="search-dropdown-item" onclick="app.showUserProfile('${user.id}'); app.hideSearchDropdown(); document.getElementById('searchInput').value = '';">
                            <div class="search-item-avatar">
                                    ${user.avatar_url 
                                        ? `<img src="${user.avatar_url}" alt="Avatar">`
                                    : `<span>${user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}</span>`
                                    }
                                </div>
                            <div class="search-item-info">
                                <div class="search-item-name">${user.full_name || user.username}</div>
                                <div class="search-item-username">@${user.username}</div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            `;
        }

        // Recipes section
        if (recipes.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <i class="fas fa-coffee"></i> Recipes
                    </div>
                        ${recipes.map(recipe => `
                        <div class="search-dropdown-item" onclick="app.showRecipeDetail('${recipe.id}'); app.hideSearchDropdown(); document.getElementById('searchInput').value = '';">
                            <div class="search-item-icon">
                                <i class="fas fa-coffee"></i>
                            </div>
                            <div class="search-item-info">
                                <div class="search-item-name">${recipe.recipe_name}</div>
                                <div class="search-item-meta">
                                    ⭐ ${recipe.rating || 'N/A'} • by ${recipe.profiles?.username || recipe.profiles?.full_name || 'Anonymous'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            `;
        }

        if (users.length === 0 && recipes.length === 0) {
            html = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <span>No results found</span>
                </div>
            `;
        }

        dropdown.innerHTML = html;
        dropdown.classList.add('show');
    }

    hideSearchDropdown() {
        const dropdown = document.getElementById('searchDropdown');
        dropdown.classList.remove('show');
    }

    async showUserProfile(userId) {
        try {
            // Set view to profile mode
            this.currentView = 'profile';
            this.currentProfileId = userId;
            
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Hide trending filter
            const trendingFilter = document.getElementById('trendingFilterSection');
            if (trendingFilter) trendingFilter.style.display = 'none';

            const [userProfile, userStats] = await Promise.all([
                api.getUserById(userId),
                api.getUserStats(userId)
            ]);

            const feedContent = document.getElementById('feedContent');
            feedContent.innerHTML = '<div class="loading-placeholder">Loading profile...</div>';

            // Check if current user is viewing their own profile
            const isOwnProfile = userId === this.currentUser?.id;
            
            // Get follow status if not own profile
            let followStatus = { following: false };
            if (!isOwnProfile) {
                followStatus = await api.getFollowStatus(userId);
            }

            feedContent.innerHTML = `
                <div class="profile-page">
                    <div class="profile-header">
                        <button class="back-btn" onclick="app.goBack()">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <div class="profile-main">
                            <div class="profile-avatar-large">
                                ${userProfile.avatar_url 
                                    ? `<img src="${userProfile.avatar_url}" alt="Avatar">`
                                    : `<div class="avatar-placeholder">${userProfile.full_name?.charAt(0)?.toUpperCase() || userProfile.username?.charAt(0)?.toUpperCase() || 'U'}</div>`
                                }
                            </div>
                            <div class="profile-info">
                                <h1>${userProfile.full_name || userProfile.username}</h1>
                                <p class="username">@${userProfile.username}</p>
                                ${userProfile.bio ? `<p class="bio">${userProfile.bio}</p>` : ''}
                                <div class="profile-stats">
                                    <div class="stat">
                                        <strong>${userStats.recipes_count}</strong>
                                        <span>Recipes</span>
                                    </div>
                                    <div class="stat">
                                        <strong>${userStats.followers_count}</strong>
                                        <span>Followers</span>
                                    </div>
                                    <div class="stat">
                                        <strong>${userStats.following_count}</strong>
                                        <span>Following</span>
                                    </div>
                                </div>
                                <div class="profile-actions">
                                    ${!isOwnProfile ? `
                                        <button class="btn ${followStatus.following ? 'btn-secondary' : 'btn-primary'}" 
                                                onclick="app.toggleFollow('${userId}', this)">
                                            <i class="fas fa-user-${followStatus.following ? 'minus' : 'plus'}"></i>
                                            ${followStatus.following ? 'Unfollow' : 'Follow'}
                                        </button>
                                    ` : `
                                        <button class="btn btn-primary" onclick="app.showCreateRecipePage()">
                                            <i class="fas fa-plus"></i> Create Recipe
                                        </button>
                                        <button class="btn btn-secondary" onclick="app.showSettings()">
                                            <i class="fas fa-cog"></i> Edit Profile
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-content">
                        <div class="profile-section">
                            <h2><i class="fas fa-coffee"></i> Recipes</h2>
                            <div id="userRecipes" class="profile-recipes-grid">
                                <div class="loading-placeholder">Loading recipes...</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Load user's recipes
            this.loadProfileRecipes(userId);

        } catch (error) {
            console.error('Error loading user profile:', error);
            const feedContent = document.getElementById('feedContent');
            feedContent.innerHTML = `
                <div class="error-page">
                    <button class="back-btn" onclick="app.goBack()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Error Loading Profile</h2>
                        <p>Could not load user profile. Please try again.</p>
                        <button class="btn btn-primary" onclick="app.goBack()">
                            Go Back
                        </button>
                    </div>
                </div>
            `;
        }
    }

    goBack() {
        // Return to previous view or default to home feed
        this.currentView = 'feed';
        this.currentProfileId = null;
        this.feedPage = 0;
        
        // Reset navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-view="feed"]').classList.add('active');
        
        this.loadFeed();
    }

    async loadProfileRecipes(userId) {
        try {
            const recipes = await api.getUserRecipes(userId);
            const container = document.getElementById('userRecipes');
            
            if (recipes && recipes.length > 0) {
                container.innerHTML = '';
                recipes.forEach(recipe => {
                    container.appendChild(this.createRecipeCard(recipe));
                });
            } else {
                container.innerHTML = `
                    <div class="no-recipes">
                        <i class="fas fa-coffee"></i>
                        <p>No recipes yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading profile recipes:', error);
            document.getElementById('userRecipes').innerHTML = `
                <div class="error-message">Error loading recipes</div>
            `;
        }
    }

    async loadUserRecipes(userId) {
        try {
            const recipes = await api.getUserRecipes(userId);
            const container = document.getElementById('userRecipes');
            
            if (recipes && recipes.length > 0) {
                container.innerHTML = recipes.slice(0, 6).map(recipe => `
                    <div class="mini-recipe-card" onclick="app.showRecipeDetail('${recipe.id}')">
                        <h4>${recipe.recipe_name}</h4>
                        <p>${recipe.description.substring(0, 100)}...</p>
                        <div class="mini-recipe-meta">
                            <span>⭐ ${recipe.rating || 'N/A'}</span>
                            <span>${new Date(recipe.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No recipes yet.</p>';
            }
        } catch (error) {
            console.error('Error loading user recipes:', error);
            document.getElementById('userRecipes').innerHTML = '<p>Error loading recipes.</p>';
        }
    }

    async toggleFollow(userId, button) {
        try {
            const response = await api.followUser(userId);
            button.textContent = response.following ? 'Unfollow' : 'Follow';
            button.className = response.following ? 'btn btn-secondary' : 'btn btn-primary';
            this.showNotification(response.message, 'success');
        } catch (error) {
            console.error('Error toggling follow:', error);
            this.showNotification('Error updating follow status', 'error');
        }
    }

    showMyRecipes() {
        // Close user dropdown
        this.toggleUserDropdown();
        
        // Set current view to my recipes
        this.currentView = 'my-recipes';
        this.feedPage = 0;
        
        // Update navigation to show we're in a special view
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Hide trending filter
        const trendingFilter = document.getElementById('trendingFilterSection');
        if (trendingFilter) trendingFilter.style.display = 'none';
        
        this.loadMyRecipesFeed();
    }

    async loadMyRecipesFeed() {
        const feedContent = document.getElementById('feedContent');
        feedContent.innerHTML = `
            <div class="my-recipes-header">
                <h2><i class="fas fa-book"></i> My Recipes</h2>
                <p>All the coffee recipes you've created</p>
            </div>
            <div class="loading-placeholder">Loading your recipes...</div>
        `;

        try {
            const recipes = await api.getUserRecipes(this.currentUser.id);
            
                    if (recipes && recipes.length > 0) {
            // Show header with button when user has recipes
            const headerWithButton = `
                <div class="my-recipes-header">
                    <h2><i class="fas fa-book"></i> My Recipes</h2>
                    <p>All the coffee recipes you've created</p>
                    <button class="btn btn-primary" onclick="app.showCreateRecipePage()">
                        <i class="fas fa-plus"></i> Create New Recipe
                    </button>
                </div>
            `;
            feedContent.innerHTML = headerWithButton;
            recipes.forEach(recipe => {
                feedContent.appendChild(this.createRecipeCard(recipe));
            });
        } else {
            // Show header without button + empty state with button when no recipes
            const headerWithoutButton = `
                <div class="my-recipes-header">
                    <h2><i class="fas fa-book"></i> My Recipes</h2>
                    <p>All the coffee recipes you've created</p>
                </div>
            `;
            feedContent.innerHTML = headerWithoutButton + `
                <div class="empty-feed">
                    <i class="fas fa-coffee"></i>
                    <h3>No recipes yet</h3>
                    <p>You haven't created any recipes yet. Start sharing your coffee expertise!</p>
                    <button class="btn btn-primary" onclick="app.showCreateRecipePage()">
                        <i class="fas fa-plus"></i> Create Your First Recipe
                    </button>
                </div>
            `;
        }
        } catch (error) {
            console.error('Error loading my recipes:', error);
            feedContent.innerHTML = `
                <div class="my-recipes-header">
                    <h2><i class="fas fa-book"></i> My Recipes</h2>
                    <p>All the coffee recipes you've created</p>
                </div>
                <div class="error-message">Error loading your recipes. Please try again.</div>
            `;
        }
    }

    showSettings() {
        // Close user dropdown
        this.toggleUserDropdown();
        
        if (!this.currentUser) return;
        
        const modal = document.getElementById('editProfileModal');
        
        // Populate current user data
        document.getElementById('editFullName').value = this.currentUser.full_name || '';
        document.getElementById('editUsername').value = this.currentUser.username || '';
        document.getElementById('editBio').value = this.currentUser.bio || '';
        
        // Show current avatar
        const avatarPreview = document.getElementById('avatarPreview');
        if (this.currentUser.avatar_url) {
            avatarPreview.innerHTML = `<img src="${this.currentUser.avatar_url}" alt="Current Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const initials = this.currentUser.full_name?.charAt(0).toUpperCase() || this.currentUser.username?.charAt(0).toUpperCase() || 'U';
            avatarPreview.innerHTML = `<span>${initials}</span>`;
        }
        
        modal.classList.add('show');
    }

    async showRecipeDetail(recipeId) {
        console.log('Opening recipe detail for ID:', recipeId);
        
        if (!recipeId) {
            console.error('Recipe ID is missing');
            this.showNotification('Error: Recipe ID is missing', 'error');
            return;
        }
        
        const modal = document.getElementById('recipeDetailModal');
        const content = document.getElementById('recipeDetailContent');
        
        if (!modal) {
            console.error('Recipe detail modal not found');
            this.showNotification('Error: Modal not found', 'error');
            return;
        }
        
        if (!content) {
            console.error('Recipe detail content not found');
            this.showNotification('Error: Content container not found', 'error');
            return;
        }
        
        try {
            console.log('Fetching recipe data...');
            const recipe = await api.getRecipe(recipeId);
            console.log('Recipe data received:', recipe);
            
                        const formatDate = (dateString) => {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            const getRatingStars = (rating) => {
                if (!rating) return '';
                const numRating = parseInt(rating);
                const stars = '⭐'.repeat(Math.min(numRating, 10));
                return `${stars} (${rating}/10)`;
            };

            const formatFieldName = (fieldName) => {
                return fieldName
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
            };

            content.innerHTML = `
                <div class="recipe-detail-header">
                    <div class="recipe-author">
                        <div class="avatar">
                            ${recipe.profiles?.avatar_url 
                                ? `<img src="${recipe.profiles.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                                : (recipe.profiles?.username?.charAt(0)?.toUpperCase() || recipe.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U')
                            }
                        </div>
                        <div class="info">
                            <div class="name">${recipe.profiles?.username || recipe.profiles?.full_name || 'Anonymous Chef'}</div>
                            <div class="time">${formatDate(recipe.created_at)}</div>
                        </div>
                    </div>
                    <div class="recipe-privacy">
                        <i class="fas fa-${recipe.is_public ? 'globe' : 'lock'}"></i>
                        ${recipe.is_public ? 'Public' : 'Private'}
                    </div>
                </div>

                <div class="recipe-detail-content">
                    <h1 class="recipe-title">${recipe.recipe_name}</h1>
                    <p class="recipe-description">${recipe.description}</p>
                    
                    ${recipe.rating ? `<div class="recipe-rating-large">${getRatingStars(recipe.rating)}</div>` : ''}
                    
                    <div class="recipe-details-grid">
                        ${recipe.bean_variety || recipe.bean_region ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-seedling"></i> Bean</div>
                            <div class="value">
                                ${recipe.bean_variety ? formatFieldName(recipe.bean_variety) : ''}${recipe.bean_variety && recipe.bean_region ? ' from ' : ''}${recipe.bean_region ? formatFieldName(recipe.bean_region) : ''}${recipe.india_estate ? ` (${formatFieldName(recipe.india_estate)})` : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${recipe.processing_type ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-cogs"></i> Processing</div>
                            <div class="value">${formatFieldName(recipe.processing_type)}</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.roast_level ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-fire"></i> Roast Level</div>
                            <div class="value">${formatFieldName(recipe.roast_level)}</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.brew_method ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-coffee"></i> Brew Method</div>
                            <div class="value">${formatFieldName(recipe.brew_method)}</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.grind_microns ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-cog"></i> Grind Size</div>
                            <div class="value">${recipe.grind_microns}μm</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.coffee_amount && recipe.water_amount ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-balance-scale"></i> Ratio</div>
                            <div class="value">${recipe.coffee_amount}g : ${recipe.water_amount}ml</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.water_temp ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-thermometer-half"></i> Water Temp</div>
                            <div class="value">${recipe.water_temp}°C</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.brew_time ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-clock"></i> Brew Time</div>
                            <div class="value">${recipe.brew_time} min</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.tds ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-flask"></i> TDS</div>
                            <div class="value">${recipe.tds} ppm</div>
                        </div>
                        ` : ''}
                        
                        ${recipe.cupping_score ? `
                        <div class="recipe-detail-item">
                            <div class="label"><i class="fas fa-star"></i> Cupping Score</div>
                            <div class="value">${recipe.cupping_score}/100</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${recipe.brewing_notes ? `
                    <div class="recipe-notes">
                        <h3><i class="fas fa-sticky-note"></i> Brewing Notes</h3>
                        <p>${recipe.brewing_notes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            modal.classList.add('show');
            
        } catch (error) {
            console.error('Error loading recipe detail:', error);
            console.error('Recipe ID:', recipeId);
            console.error('Error details:', error.message);
            
            // Try to get cached recipe data from the card as fallback
            console.log('Trying to use cached recipe data...');
            const recipeCard = document.querySelector(`[data-recipe-id="${recipeId}"]`);
            if (recipeCard && recipeCard.dataset.recipeData) {
                try {
                    const cachedRecipe = JSON.parse(recipeCard.dataset.recipeData);
                    console.log('Using cached recipe data:', cachedRecipe);
                    
                    // Use same display logic but with cached data  
                    const formatDate = (dateString) => {
                        return new Date(dateString).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric'
                        });
                    };

                    const getRatingStars = (rating) => {
                        if (!rating) return '';
                        const numRating = parseInt(rating);
                        const stars = '⭐'.repeat(Math.min(numRating, 10));
                        return `${stars} (${rating}/10)`;
                    };

                    const formatFieldName = (fieldName) => {
                        return fieldName
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();
                    };

                    content.innerHTML = `
                        <div class="recipe-detail-header">
                            <div class="recipe-author">
                                <div class="avatar">
                                    ${cachedRecipe.profiles?.avatar_url 
                                        ? `<img src="${cachedRecipe.profiles.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                                        : (cachedRecipe.profiles?.username?.charAt(0)?.toUpperCase() || cachedRecipe.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U')
                                    }
                                </div>
                                <div class="info">
                                    <div class="name">${cachedRecipe.profiles?.username || cachedRecipe.profiles?.full_name || 'Anonymous Chef'}</div>
                                    <div class="time">${formatDate(cachedRecipe.created_at)}</div>
                                </div>
                            </div>
                            <div class="recipe-privacy">
                                <i class="fas fa-${cachedRecipe.is_public ? 'globe' : 'lock'}"></i>
                                ${cachedRecipe.is_public ? 'Public' : 'Private'}
                            </div>
                        </div>
                        <div class="recipe-detail-content">
                            <h1 class="recipe-title">${cachedRecipe.recipe_name}</h1>
                            <p class="recipe-description">${cachedRecipe.description}</p>
                            ${cachedRecipe.rating ? `<div class="recipe-rating-large">${getRatingStars(cachedRecipe.rating)}</div>` : ''}
                            <div class="recipe-details-grid">
                                ${cachedRecipe.bean_variety || cachedRecipe.bean_region ? `
                                <div class="recipe-detail-item">
                                    <div class="label"><i class="fas fa-seedling"></i> Bean</div>
                                    <div class="value">
                                        ${cachedRecipe.bean_variety ? formatFieldName(cachedRecipe.bean_variety) : ''}${cachedRecipe.bean_variety && cachedRecipe.bean_region ? ' from ' : ''}${cachedRecipe.bean_region ? formatFieldName(cachedRecipe.bean_region) : ''}${cachedRecipe.india_estate ? ` (${formatFieldName(cachedRecipe.india_estate)})` : ''}
                                    </div>
                                </div>
                                ` : ''}
                                ${cachedRecipe.brew_method ? `
                                <div class="recipe-detail-item">
                                    <div class="label"><i class="fas fa-coffee"></i> Brew Method</div>
                                    <div class="value">${formatFieldName(cachedRecipe.brew_method)}</div>
                                </div>
                                ` : ''}
                                ${cachedRecipe.coffee_amount && cachedRecipe.water_amount ? `
                                <div class="recipe-detail-item">
                                    <div class="label"><i class="fas fa-balance-scale"></i> Ratio</div>
                                    <div class="value">${cachedRecipe.coffee_amount}g : ${cachedRecipe.water_amount}ml</div>
                                </div>
                                ` : ''}
                            </div>
                            ${cachedRecipe.brewing_notes ? `
                            <div class="recipe-notes">
                                <h3><i class="fas fa-sticky-note"></i> Brewing Notes</h3>
                                <p>${cachedRecipe.brewing_notes}</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                    modal.classList.add('show');
                    this.showNotification('Showing cached recipe data (server unavailable)', 'warning');
                    return;
                } catch (parseError) {
                    console.error('Error parsing cached recipe data:', parseError);
                }
            }
            
            if (error.message.includes('404')) {
                this.showNotification('Recipe not found. It may have been deleted.', 'error');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                this.showNotification('Network error. Please check your connection.', 'error');
            } else {
                this.showNotification('Error loading recipe details: ' + error.message, 'error');
            }
        }
    }

    async editRecipe(recipeId) {
        try {
            const recipe = await api.getRecipe(recipeId);

            this.currentEditingId = recipeId;
            this.showCreateRecipePage();
            this.populateForm(recipe);
            document.getElementById('submitBtnText').textContent = 'Update Recipe';

        } catch (error) {
            console.error('Error loading recipe for edit:', error);
            this.showNotification('Error loading recipe', 'error');
        }
    }

    populateForm(recipe) {
        Object.keys(recipe).forEach(key => {
            const element = document.getElementById(this.camelCase(key));
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = recipe[key];
                } else {
                    element.value = recipe[key] || '';
                }
            }
        });
        
        // Handle special cases
        if (recipe.bean_region === 'india') {
            this.handleRegionChange('india');
        }

        if (recipe.is_public !== undefined) {
            document.getElementById('recipePrivacy').checked = recipe.is_public;
            this.updatePrivacyLabel(recipe.is_public);
        }
    }

    camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Close user dropdown
        document.getElementById('userDropdown').classList.remove('show');
    }

    async handleEditProfile() {
        const fullName = document.getElementById('editFullName').value;
        const username = document.getElementById('editUsername').value;
        const bio = document.getElementById('editBio').value;

        if (!fullName.trim() || !username.trim()) {
            this.showNotification('Name and username are required', 'warning');
            return;
        }

        try {
            const updateData = {
                full_name: fullName.trim(),
                username: username.trim(),
                bio: bio.trim()
            };

            const updatedUser = await api.updateProfile(updateData);
            
            // Update current user data
            this.currentUser = { ...this.currentUser, ...updatedUser };
            
            // Update UI
            this.updateUserInterface();
            
            // Close modal
            document.getElementById('editProfileModal').classList.remove('show');
            
            this.showNotification('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Error updating profile. Please try again.', 'error');
        }
    }

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'warning');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size must be less than 5MB', 'warning');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarPreview = document.getElementById('avatarPreview');
            avatarPreview.innerHTML = `<img src="${e.target.result}" alt="New Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);

        // Upload avatar
        this.uploadAvatar(file);
    }

    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await api.uploadAvatar(formData);
            
            // Update current user avatar
            this.currentUser.avatar_url = response.avatar_url;
            
            // Update UI
            this.updateUserInterface();
            
            this.showNotification('Avatar updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showNotification('Error uploading avatar. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <i class="fas fa-${icons[type]}"></i>
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WhatYourRecipeApp();
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.remove('show');
    }
    
    // Close search dropdown when clicking outside
    if (!e.target.closest('.search-container')) {
        window.app?.hideSearchDropdown();
    }
});

// Force reload if there's a version mismatch (cache busting)
if (!window.appVersion) {
    window.appVersion = '1.2.0';
    console.log('🔄 App Version:', window.appVersion);
} 
document.head.appendChild(styleSheet); 