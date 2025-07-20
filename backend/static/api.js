// API Configuration - Auto-detect environment
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' || 
                          window.location.hostname === '0.0.0.0';

const API_BASE_URL = isLocalDevelopment 
    ? 'http://localhost:8000'  // Local development
    : 'https://coffee-m9ux.onrender.com'; // Production deployment

console.log(`Environment: ${isLocalDevelopment ? 'Local Development' : 'Production'}`);
console.log(`API Base URL: ${API_BASE_URL}`);

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    // Helper method to make authenticated requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                
                // For validation errors, provide more detail
                if (response.status === 422 && errorData.detail) {
                    console.error('Validation error details:', errorData);
                    const errorMessage = Array.isArray(errorData.detail) 
                        ? errorData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join('; ')
                        : errorData.detail;
                    throw new Error(`Validation Error: ${errorMessage}`);
                }
                
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            // Handle empty responses
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    // Authentication endpoints
    async signup(userData) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response;
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } finally {
            this.setToken(null);
        }
    }

    async resendConfirmation(email) {
        return await this.request('/auth/resend-confirmation', {
            method: 'POST',
            body: JSON.stringify(email),
        });
    }

    // User endpoints
    async getUserProfile() {
        return await this.request('/users/profile');
    }

    async getUserById(userId) {
        return await this.request(`/users/${userId}`);
    }

    async searchUsers(query, limit = 10) {
        return await this.request(`/users/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    // Recipe endpoints
    async createRecipe(recipeData) {
        return await this.request('/recipes', {
            method: 'POST',
            body: JSON.stringify(recipeData),
        });
    }

    async getRecipes(page = 1, limit = 10, view = 'feed') {
        return await this.request(`/recipes?page=${page}&limit=${limit}&view=${view}`);
    }

    async getRecipe(recipeId) {
        return await this.request(`/recipes/${recipeId}`);
    }

    async searchRecipes(query, limit = 10) {
        return await this.request(`/recipes/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    // Voting endpoints
    async castVote(recipeId, voteType) {
        return await this.request('/votes', {
            method: 'POST',
            body: JSON.stringify({
                recipe_id: recipeId,
                vote_type: voteType,
            }),
        });
    }

    // Follow endpoints
    async followUser(userId) {
        return await this.request(`/follow/${userId}`, {
            method: 'POST',
        });
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Create global API instance
const api = new APIClient();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, api };
} 