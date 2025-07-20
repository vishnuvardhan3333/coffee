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
            await api.healthCheck();
            console.log('Backend API is healthy');
        } catch (error) {
            console.error('Backend API is not available:', error);
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
            this.showCreateRecipeModal();
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

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });

        // View toggles
        document.getElementById('basicViewToggle').addEventListener('click', () => {
            this.setViewMode(false);
        });

        document.getElementById('proViewToggle').addEventListener('click', () => {
            this.setViewMode(true);
        });

        // Recipe form
        document.getElementById('closeCreateModal').addEventListener('click', () => {
            this.hideCreateRecipeModal();
        });

        document.getElementById('cancelRecipe').addEventListener('click', () => {
            this.hideCreateRecipeModal();
        });

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
            this.currentUser = null;
            this.showAuth();
            this.showNotification('Logged out successfully', 'info');
        } catch (error) {
            this.showNotification('Error logging out', 'error');
        }
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

        // Load content based on view
        this.loadFeed();
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

        // Refresh feed with new view mode
        this.loadFeed();
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
                this.currentView
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
        const upvotes = recipe.votes?.filter(v => v.vote_type === 'up').length || 0;
        const downvotes = recipe.votes?.filter(v => v.vote_type === 'down').length || 0;
        const userVote = recipe.votes?.find(v => v.user_id === this.currentUser?.id)?.vote_type;

        card.innerHTML = `
            <div class="recipe-card-header">
                <div class="recipe-author" onclick="app.showUserProfile('${recipe.user_id}')">
                    <div class="avatar">
                        ${recipe.profiles?.avatar_url 
                            ? `<img src="${recipe.profiles.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                            : (recipe.profiles?.full_name?.charAt(0) || 'U')
                        }
                    </div>
                    <div class="info">
                        <div class="name">${recipe.profiles?.full_name || 'Unknown User'}</div>
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

        // Implementation for saving recipes
        this.showNotification('Recipe saved!', 'success');
    }

    showCreateRecipeModal() {
        document.getElementById('createRecipeModal').classList.add('show');
        this.currentEditingId = null;
        this.clearForm();
        this.setFormMode(false);
        document.getElementById('submitBtnText').textContent = 'Create Recipe';
    }

    hideCreateRecipeModal() {
        document.getElementById('createRecipeModal').classList.remove('show');
        this.clearForm();
    }

    clearForm() {
        document.getElementById('recipeForm').reset();
        this.currentEditingId = null;
        this.setCurrentDate();
        
        // Reset privacy toggle
        document.getElementById('recipePrivacy').checked = true;
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
        
        const recipe = {
            recipe_name: formData.get('recipeName'),
            description: formData.get('description'),
            rating: formData.get('rating'),
            date_created: formData.get('dateCreated'),
            bean_variety: formData.get('beanVariety'),
            bean_region: formData.get('beanRegion'),
            india_estate: formData.get('indiaEstate'),
            processing_type: formData.get('processingType'),
            roast_type: formData.get('roastType'),
            roast_level: formData.get('roastLevel'),
            crack_time: formData.get('crackTime'),
            roast_time: formData.get('roastTime'),
            development_time: formData.get('developmentTime'),
            brew_method: formData.get('brewMethod'),
            grind_microns: formData.get('grindMicrons'),
            water_composition: formData.get('waterComposition'),
            tds: formData.get('tds'),
            calcium: formData.get('calcium'),
            magnesium: formData.get('magnesium'),
            potassium: formData.get('potassium'),
            sodium: formData.get('sodium'),
            coffee_amount: formData.get('coffeeAmount'),
            water_amount: formData.get('waterAmount'),
            water_temp: formData.get('waterTemp'),
            brew_time: formData.get('brewTime'),
            milk_preference: formData.get('milkPreference'),
            serving_temp: formData.get('servingTemp'),
            sweetener: formData.get('sweetener'),
            sweetener_quantity: formData.get('sweetenerQuantity'),
            serving_size: formData.get('servingSize'),
            aroma_notes: formData.get('aromaNotes'),
            body: formData.get('body'),
            acidity_type: formData.get('acidityType'),
            sweetness: formData.get('sweetness'),
            balance: formData.get('balance'),
            aftertaste: formData.get('aftertaste'),
            clean_cup: formData.get('cleanCup'),
            uniformity: formData.get('uniformity'),
            cupping_score: formData.get('cuppingScore'),
            cupping_method: formData.get('cuppingMethod'),
            defects: formData.get('defects'),
            overall_impression: formData.get('overallImpression'),
            brewing_notes: formData.get('brewingNotes'),
            is_public: document.getElementById('recipePrivacy').checked,
            user_id: this.currentUser.id
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

            this.hideCreateRecipeModal();
            this.feedPage = 0;
            this.loadFeed();

        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showNotification('Error saving recipe. Please try again.', 'error');
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
        // For now, just show some placeholder users
        const recommendedUsers = document.getElementById('recommendedUsers');
        recommendedUsers.innerHTML = `
            <div class="recommended-user">
                <div class="avatar">CB</div>
                <div class="info">
                    <div class="name">Coffee Barista</div>
                    <div class="username">@coffeebarista</div>
                </div>
            </div>
            <div class="recommended-user">
                <div class="avatar">JD</div>
                <div class="info">
                    <div class="name">Java Developer</div>
                    <div class="username">@javadev</div>
                </div>
            </div>
        `;
    }

    async loadActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        activityFeed.innerHTML = `
            <div class="activity-item">
                <div class="icon"><i class="fas fa-heart"></i></div>
                <div class="content">Someone liked your espresso recipe</div>
            </div>
            <div class="activity-item">
                <div class="icon"><i class="fas fa-user-plus"></i></div>
                <div class="content">CoffeeExpert started following you</div>
            </div>
        `;
    }

    async handleSearch(query) {
        if (query.trim().length < 2) return;

        try {
            const [recipes, users] = await Promise.all([
                api.searchRecipes(query, 5),
                api.searchUsers(query, 5)
            ]);

            this.showSearchResults(recipes || [], users || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(recipes, users) {
        // Implementation for showing search results in a dropdown or modal
        console.log('Search results:', { recipes, users });
    }

    showUserProfile(userId) {
        // Implementation for showing user profile modal
        console.log('Show user profile:', userId);
    }

    showRecipeDetail(recipeId) {
        // Implementation for showing recipe detail modal
        console.log('Show recipe detail:', recipeId);
    }

    async editRecipe(recipeId) {
        try {
            const recipe = await api.getRecipe(recipeId);

            this.currentEditingId = recipeId;
            this.populateForm(recipe);
            this.showCreateRecipeModal();
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
}); 
document.head.appendChild(styleSheet); 