// Coffee Recipe Creator - JavaScript Functionality
class CoffeeRecipeApp {
    constructor() {
        this.recipes = this.loadRecipes();
        this.currentEditingId = null;
        this.isFormProMode = false;
        this.isRecipeProMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setCurrentDate();
        this.setFormMode(false); // Start in basic mode
        this.setRecipeMode(false); // Start in basic mode
        this.displayRecipes();
        this.calculateCoffeeToWaterRatio();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('recipeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Clear form button
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Export recipes
        document.getElementById('exportRecipes').addEventListener('click', () => {
            this.exportRecipes();
        });

        // Import recipes
        document.getElementById('importRecipes').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importRecipes(e);
        });

        // Auto-calculate coffee to water ratio
        document.getElementById('coffeeAmount').addEventListener('input', () => {
            this.calculateCoffeeToWaterRatio();
        });

        document.getElementById('waterAmount').addEventListener('input', () => {
            this.calculateCoffeeToWaterRatio();
        });

        // Brew method changes affect grind size recommendations
        document.getElementById('brewMethod').addEventListener('change', (e) => {
            this.updateGrindSizeRecommendation(e.target.value);
        });

        // Bean region changes show/hide India estate selection
        document.getElementById('beanRegion').addEventListener('change', (e) => {
            this.handleRegionChange(e.target.value);
        });

        // Form mode toggle buttons
        document.getElementById('basicModeBtn').addEventListener('click', () => {
            this.setFormMode(false);
        });

        document.getElementById('proModeBtn').addEventListener('click', () => {
            this.setFormMode(true);
        });

        // Recipe display mode toggle buttons
        document.getElementById('recipeBasicModeBtn').addEventListener('click', () => {
            this.setRecipeMode(false);
        });

        document.getElementById('recipeProModeBtn').addEventListener('click', () => {
            this.setRecipeMode(true);
        });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateCreated').value = today;
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

    setRecipeMode(isProMode) {
        this.isRecipeProMode = isProMode;
        const recipesContainer = document.querySelector('.recipes-container');
        const basicBtn = document.getElementById('recipeBasicModeBtn');
        const proBtn = document.getElementById('recipeProModeBtn');

        if (isProMode) {
            recipesContainer.classList.remove('basic-mode');
            recipesContainer.classList.add('pro-mode');
            basicBtn.classList.remove('active');
            proBtn.classList.add('active');
        } else {
            recipesContainer.classList.remove('pro-mode');
            recipesContainer.classList.add('basic-mode');
            proBtn.classList.remove('active');
            basicBtn.classList.add('active');
        }

        // Refresh recipe display
        this.displayRecipes();
    }

    createRecipeDetails(recipe, isProMode, formatFieldName) {
        if (isProMode) {
            // Professional mode - show all available details
            return `
                ${(recipe.beanVariety || recipe.beanRegion) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Bean</div>
                    <div class="recipe-detail-value">
                        ${recipe.beanVariety ? formatFieldName(recipe.beanVariety) : ''}${recipe.beanVariety && recipe.beanRegion ? ' from ' : ''}${recipe.beanRegion ? formatFieldName(recipe.beanRegion) : ''}${recipe.indiaEstate ? ` (${formatFieldName(recipe.indiaEstate)})` : ''}
                    </div>
                </div>
                ` : ''}
                ${recipe.processingType ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Processing</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.processingType)}</div>
                </div>
                ` : ''}
                ${(recipe.roastLevel || recipe.roastType) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Roast</div>
                    <div class="recipe-detail-value">
                        ${recipe.roastLevel ? formatFieldName(recipe.roastLevel) : ''}${recipe.roastLevel && recipe.roastType ? ' (' : ''}${recipe.roastType ? formatFieldName(recipe.roastType) : ''}${recipe.roastLevel && recipe.roastType ? ')' : ''}
                    </div>
                </div>
                ` : ''}
                ${(recipe.crackTime) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Crack Development</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.crackTime)}</div>
                </div>
                ` : ''}
                ${(recipe.roastTime || recipe.developmentTime) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Roast Timing</div>
                    <div class="recipe-detail-value">
                        ${recipe.roastTime ? `${recipe.roastTime} min` : ''}${recipe.roastTime && recipe.developmentTime ? ', ' : ''}${recipe.developmentTime ? `${recipe.developmentTime}% dev` : ''}
                    </div>
                </div>
                ` : ''}
                ${recipe.brewMethod ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Brew Method</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.brewMethod)}</div>
                </div>
                ` : ''}
                ${recipe.grindMicrons ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Grind Size</div>
                    <div class="recipe-detail-value">${recipe.grindMicrons}μm</div>
                </div>
                ` : ''}
                ${recipe.waterComposition ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Water</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.waterComposition)}</div>
                </div>
                ` : ''}
                ${recipe.tds ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">TDS</div>
                    <div class="recipe-detail-value">${recipe.tds} ppm</div>
                </div>
                ` : ''}
                ${(recipe.calcium || recipe.magnesium || recipe.potassium || recipe.sodium) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Minerals (mg/L)</div>
                    <div class="recipe-detail-value">
                        ${recipe.calcium ? `Ca: ${recipe.calcium}` : ''}${recipe.calcium && (recipe.magnesium || recipe.potassium || recipe.sodium) ? ', ' : ''}
                        ${recipe.magnesium ? `Mg: ${recipe.magnesium}` : ''}${recipe.magnesium && (recipe.potassium || recipe.sodium) ? ', ' : ''}
                        ${recipe.potassium ? `K: ${recipe.potassium}` : ''}${recipe.potassium && recipe.sodium ? ', ' : ''}
                        ${recipe.sodium ? `Na: ${recipe.sodium}` : ''}
                    </div>
                </div>
                ` : ''}
                ${(recipe.coffeeAmount && recipe.waterAmount) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Recipe</div>
                    <div class="recipe-detail-value">${recipe.coffeeAmount}g : ${recipe.waterAmount}ml</div>
                </div>
                ` : ''}
                ${(recipe.coffeeAmount && recipe.waterAmount) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Ratio</div>
                    <div class="recipe-detail-value">${recipe.ratio || `1:${(recipe.waterAmount / recipe.coffeeAmount).toFixed(1)}`}</div>
                </div>
                ` : ''}
                ${recipe.waterTemp ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Water Temp</div>
                    <div class="recipe-detail-value">${recipe.waterTemp}°C</div>
                </div>
                ` : ''}
                ${recipe.brewTime ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Brew Time</div>
                    <div class="recipe-detail-value">${recipe.brewTime} min</div>
                </div>
                ` : ''}
                ${recipe.milkPreference ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Milk</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.milkPreference)}</div>
                </div>
                ` : ''}
                ${recipe.sweetener && recipe.sweetener !== '' ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Sweetener</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.sweetener)}${recipe.sweetenerQuantity ? ` (${recipe.sweetenerQuantity}g)` : ''}</div>
                </div>
                ` : ''}
                ${recipe.servingTemp ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Serving Temp</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.servingTemp)}</div>
                </div>
                ` : ''}
                ${recipe.servingSize ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Serving Size</div>
                    <div class="recipe-detail-value">${recipe.servingSize} ml</div>
                </div>
                ` : ''}
                ${recipe.body ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Body</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.body)}</div>
                </div>
                ` : ''}
                ${recipe.acidityType ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Acidity</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.acidityType)}</div>
                </div>
                ` : ''}
                ${recipe.cuppingScore ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Cupping Score</div>
                    <div class="recipe-detail-value">${recipe.cuppingScore}/100</div>
                </div>
                ` : ''}
                ${recipe.balance ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Balance</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.balance)}</div>
                </div>
                ` : ''}
            `;
        } else {
            // Basic mode - show only essential details
            return `
                ${(recipe.beanVariety || recipe.beanRegion) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Bean</div>
                    <div class="recipe-detail-value">
                        ${recipe.beanVariety ? formatFieldName(recipe.beanVariety) : ''}${recipe.beanVariety && recipe.beanRegion ? ' from ' : ''}${recipe.beanRegion ? formatFieldName(recipe.beanRegion) : ''}
                    </div>
                </div>
                ` : ''}
                ${recipe.roastLevel ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Roast</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.roastLevel)}</div>
                </div>
                ` : ''}
                ${recipe.brewMethod ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Brew Method</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.brewMethod)}</div>
                </div>
                ` : ''}
                ${(recipe.coffeeAmount && recipe.waterAmount) ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Recipe</div>
                    <div class="recipe-detail-value">${recipe.coffeeAmount}g : ${recipe.waterAmount}ml</div>
                </div>
                ` : ''}
                ${recipe.milkPreference ? `
                <div class="recipe-detail">
                    <div class="recipe-detail-label">Milk</div>
                    <div class="recipe-detail-value">${formatFieldName(recipe.milkPreference)}</div>
                </div>
                ` : ''}
            `;
        }
    }

    calculateCoffeeToWaterRatio() {
        const coffeeAmount = parseFloat(document.getElementById('coffeeAmount').value);
        const waterAmount = parseFloat(document.getElementById('waterAmount').value);

        if (coffeeAmount && waterAmount) {
            const ratio = (waterAmount / coffeeAmount).toFixed(1);
            const ratioDisplay = document.getElementById('ratioDisplay');
            
            if (!ratioDisplay) {
                // Create ratio display element
                const coffeeGroup = document.getElementById('coffeeAmount').closest('.form-group');
                const ratioElement = document.createElement('div');
                ratioElement.id = 'ratioDisplay';
                ratioElement.className = 'ratio-display';
                ratioElement.innerHTML = `<small>Ratio: 1:${ratio}</small>`;
                coffeeGroup.appendChild(ratioElement);
            } else {
                ratioDisplay.innerHTML = `<small>Ratio: 1:${ratio}</small>`;
            }
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
            this.showTemporaryMessage(`Recommended: ${recommendations[brewMethod].size.replace('-', ' ')} grind (${recommendations[brewMethod].microns}μm)`, 'info');
        }
    }

    handleRegionChange(region) {
        const indiaEstateGroup = document.getElementById('indiaEstateGroup');
        const indiaEstateSelect = document.getElementById('indiaEstate');
        
        if (region === 'india') {
            indiaEstateGroup.style.display = 'block';
            indiaEstateGroup.style.animation = 'slideIn 0.3s ease-out';
        } else {
            indiaEstateGroup.style.display = 'none';
            indiaEstateSelect.value = ''; // Clear selection when hiding
        }
    }

    handleFormSubmit() {
        const formData = new FormData(document.getElementById('recipeForm'));
        const recipe = this.createRecipeObject(formData);

        if (this.validateRecipe(recipe)) {
            if (this.currentEditingId) {
                this.updateRecipe(this.currentEditingId, recipe);
                this.currentEditingId = null;
            } else {
                this.addRecipe(recipe);
            }
            
            this.saveRecipes();
            this.displayRecipes();
            this.clearForm();
            this.showTemporaryMessage('Recipe saved successfully!', 'success');
        }
    }

    createRecipeObject(formData) {
        const recipe = {
            id: this.currentEditingId || Date.now().toString(),
            recipeName: formData.get('recipeName'),
            description: formData.get('description'),
            beanVariety: formData.get('beanVariety'),
            beanRegion: formData.get('beanRegion'),
            indiaEstate: formData.get('indiaEstate'),
            processingType: formData.get('processingType'),
            roastType: formData.get('roastType'),
            roastLevel: formData.get('roastLevel'),
            crackTime: formData.get('crackTime'),
            roastTime: formData.get('roastTime'),
            developmentTime: formData.get('developmentTime'),
            brewMethod: formData.get('brewMethod'),
            grindMicrons: formData.get('grindMicrons'),
            waterComposition: formData.get('waterComposition'),
            tds: formData.get('tds'),
            calcium: formData.get('calcium'),
            magnesium: formData.get('magnesium'),
            potassium: formData.get('potassium'),
            sodium: formData.get('sodium'),
            coffeeAmount: formData.get('coffeeAmount'),
            waterAmount: formData.get('waterAmount'),
            waterTemp: formData.get('waterTemp'),
            brewTime: formData.get('brewTime'),
            milkPreference: formData.get('milkPreference'),
            servingTemp: formData.get('servingTemp'),
            sweetener: formData.get('sweetener'),
            sweetenerQuantity: formData.get('sweetenerQuantity'),
            servingSize: formData.get('servingSize'),
            aromaNotes: formData.get('aromaNotes'),
            body: formData.get('body'),
            acidityType: formData.get('acidityType'),
            sweetness: formData.get('sweetness'),
            balance: formData.get('balance'),
            aftertaste: formData.get('aftertaste'),
            cleanCup: formData.get('cleanCup'),
            uniformity: formData.get('uniformity'),
            cuppingScore: formData.get('cuppingScore'),
            cuppingMethod: formData.get('cuppingMethod'),
            defects: formData.get('defects'),
            overallImpression: formData.get('overallImpression'),
            brewingNotes: formData.get('brewingNotes'),
            rating: formData.get('rating'),
            dateCreated: formData.get('dateCreated'),
            createdAt: new Date().toISOString()
        };

        // Calculate coffee to water ratio
        if (recipe.coffeeAmount && recipe.waterAmount) {
            recipe.ratio = `1:${(recipe.waterAmount / recipe.coffeeAmount).toFixed(1)}`;
        }

        return recipe;
    }

    validateRecipe(recipe) {
        const requiredFields = ['recipeName', 'description', 'aftertaste', 'rating', 'dateCreated'];

        for (const field of requiredFields) {
            if (!recipe[field] || recipe[field].toString().trim() === '') {
                this.showTemporaryMessage(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, 'error');
                return false;
            }
        }

        return true;
    }

    addRecipe(recipe) {
        this.recipes.unshift(recipe);
    }

    updateRecipe(id, updatedRecipe) {
        const index = this.recipes.findIndex(recipe => recipe.id === id);
        if (index !== -1) {
            this.recipes[index] = { ...updatedRecipe, id };
        }
    }

    deleteRecipe(id) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== id);
            this.saveRecipes();
            this.displayRecipes();
            this.showTemporaryMessage('Recipe deleted successfully!', 'success');
        }
    }

    editRecipe(id) {
        const recipe = this.recipes.find(recipe => recipe.id === id);
        if (recipe) {
            this.populateForm(recipe);
            this.currentEditingId = id;
            document.getElementById('recipeForm').scrollIntoView({ behavior: 'smooth' });
            this.showTemporaryMessage('Recipe loaded for editing', 'info');
        }
    }

    duplicateRecipe(id) {
        const recipe = this.recipes.find(recipe => recipe.id === id);
        if (recipe) {
            const duplicatedRecipe = {
                ...recipe,
                id: Date.now().toString(),
                recipeName: `${recipe.recipeName} (Copy)`,
                createdAt: new Date().toISOString(),
                dateCreated: new Date().toISOString().split('T')[0]
            };
            this.addRecipe(duplicatedRecipe);
            this.saveRecipes();
            this.displayRecipes();
            this.showTemporaryMessage('Recipe duplicated successfully!', 'success');
        }
    }

    viewRecipeDetails(id) {
        const recipe = this.recipes.find(recipe => recipe.id === id);
        if (recipe) {
            this.showRecipeModal(recipe);
        }
    }

    showRecipeModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const modalTitle = document.getElementById('modalRecipeTitle');
        const modalContent = document.getElementById('modalRecipeContent');

        modalTitle.textContent = recipe.recipeName;
        modalContent.innerHTML = this.createDetailedRecipeView(recipe, false); // Start with basic mode
        modal.style.display = 'block';

        // Add mode toggle to modal if not already present
        const modalHeader = modal.querySelector('.modal-header');
        let modeToggle = modalHeader.querySelector('.recipe-mode-toggle');
        if (!modeToggle) {
            modeToggle = document.createElement('div');
            modeToggle.className = 'recipe-mode-toggle';
            modeToggle.style.marginLeft = 'auto';
            modeToggle.innerHTML = `
                <button type="button" class="recipe-mode-btn active" data-mode="basic">
                    <i class="fas fa-coffee"></i> Basic
                </button>
                <button type="button" class="recipe-mode-btn" data-mode="pro">
                    <i class="fas fa-cogs"></i> Pro
                </button>
            `;
            modalHeader.appendChild(modeToggle);

            // Add event listener for modal mode toggle
            modeToggle.addEventListener('click', (e) => {
                if (e.target.closest('.recipe-mode-btn')) {
                    const btn = e.target.closest('.recipe-mode-btn');
                    const isProMode = btn.dataset.mode === 'pro';
                    
                    // Update button states
                    modeToggle.querySelectorAll('.recipe-mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update modal content
                    modalContent.innerHTML = this.createDetailedRecipeView(recipe, isProMode);
                }
            });
        } else {
            // Reset to basic mode if toggle already exists
            modeToggle.querySelectorAll('.recipe-mode-btn').forEach(b => b.classList.remove('active'));
            modeToggle.querySelector('[data-mode="basic"]').classList.add('active');
        }

        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeRecipeModal();
            }
        };

        // Close modal with ESC key
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.closeRecipeModal();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    closeRecipeModal() {
        const modal = document.getElementById('recipeModal');
        modal.style.display = 'none';
        
        // Remove any active event listeners
        modal.onclick = null;
    }

    createDetailedRecipeView(recipe, isProMode = false) {
        const formatFieldName = (fieldName) => {
            return fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const getRatingStars = (rating) => {
            if (!rating) return '<span class="modal-detail-empty">Not rated</span>';
            const numRating = parseInt(rating);
            const stars = '⭐'.repeat(Math.min(numRating, 10));
            return `<span class="modal-rating">${stars} ${rating}/10</span>`;
        };

        if (isProMode) {
            return this.createProModalView(recipe, formatFieldName, formatDate, getRatingStars);
        } else {
            return this.createBasicModalView(recipe, formatFieldName, formatDate, getRatingStars);
        }
    }

    createBasicModalView(recipe, formatFieldName, formatDate, getRatingStars) {
        return `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-info-circle"></i> Recipe Overview
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Description</div>
                        <div class="modal-detail-value">${recipe.description || '<span class="modal-detail-empty">No description</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Rating</div>
                        <div class="modal-detail-value">${getRatingStars(recipe.rating)}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Date Created</div>
                        <div class="modal-detail-value">${formatDate(recipe.dateCreated)}</div>
                    </div>
                </div>
            </div>

            ${(recipe.beanVariety || recipe.beanRegion) ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-seedling"></i> Bean Information
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Bean</div>
                        <div class="modal-detail-value">
                            ${recipe.beanVariety ? formatFieldName(recipe.beanVariety) : ''}${recipe.beanVariety && recipe.beanRegion ? ' from ' : ''}${recipe.beanRegion ? formatFieldName(recipe.beanRegion) : ''}
                        </div>
                    </div>
                    ${recipe.roastLevel ? `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Roast Level</div>
                        <div class="modal-detail-value">${formatFieldName(recipe.roastLevel)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${(recipe.brewMethod || recipe.coffeeAmount) ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-coffee"></i> Brewing
                </div>
                <div class="modal-detail-grid">
                    ${recipe.brewMethod ? `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Brew Method</div>
                        <div class="modal-detail-value">${formatFieldName(recipe.brewMethod)}</div>
                    </div>
                    ` : ''}
                    ${(recipe.coffeeAmount && recipe.waterAmount) ? `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Recipe</div>
                        <div class="modal-detail-value">${recipe.coffeeAmount}g coffee : ${recipe.waterAmount}ml water</div>
                    </div>
                    ` : ''}
                    ${recipe.milkPreference ? `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Milk</div>
                        <div class="modal-detail-value">${formatFieldName(recipe.milkPreference)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${recipe.aromaNotes && recipe.aromaNotes.trim() !== '' ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-nose"></i> Tasting Notes
                </div>
                <div class="modal-notes">
                    <p>${recipe.aromaNotes}</p>
                </div>
            </div>
            ` : ''}

            ${recipe.brewingNotes && recipe.brewingNotes.trim() !== '' ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-star"></i> Brewing Notes
                </div>
                <div class="modal-notes">
                    <p>${recipe.brewingNotes}</p>
                </div>
            </div>
            ` : ''}
        `;
    }

    createProModalView(recipe, formatFieldName, formatDate, getRatingStars) {
        return `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-info-circle"></i> Basic Information
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Description</div>
                        <div class="modal-detail-value">${recipe.description || '<span class="modal-detail-empty">No description</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Rating</div>
                        <div class="modal-detail-value">${getRatingStars(recipe.rating)}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Date Created</div>
                        <div class="modal-detail-value">${formatDate(recipe.dateCreated)}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-seedling"></i> Bean Information
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Bean Variety</div>
                        <div class="modal-detail-value">${recipe.beanVariety ? formatFieldName(recipe.beanVariety) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Bean Region</div>
                        <div class="modal-detail-value">${recipe.beanRegion ? formatFieldName(recipe.beanRegion) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    ${recipe.indiaEstate ? `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Indian Estate</div>
                        <div class="modal-detail-value">${formatFieldName(recipe.indiaEstate)}</div>
                    </div>
                    ` : ''}
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Processing Type</div>
                        <div class="modal-detail-value">${recipe.processingType ? formatFieldName(recipe.processingType) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
            </div>



            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-fire"></i> Roasting Profile
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Roast Type</div>
                        <div class="modal-detail-value">${recipe.roastType ? formatFieldName(recipe.roastType) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Roast Level</div>
                        <div class="modal-detail-value">${recipe.roastLevel ? formatFieldName(recipe.roastLevel) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Crack Development</div>
                        <div class="modal-detail-value">${recipe.crackTime ? formatFieldName(recipe.crackTime) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Roast Time</div>
                        <div class="modal-detail-value">${recipe.roastTime ? `${recipe.roastTime} minutes` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Development Time</div>
                        <div class="modal-detail-value">${recipe.developmentTime ? `${recipe.developmentTime}%` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-tint"></i> Brewing Parameters
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Brew Method</div>
                        <div class="modal-detail-value">${recipe.brewMethod ? formatFieldName(recipe.brewMethod) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Grind Size (Microns)</div>
                        <div class="modal-detail-value">${recipe.grindMicrons ? `${recipe.grindMicrons}μm` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Coffee Amount</div>
                        <div class="modal-detail-value">${recipe.coffeeAmount ? `${recipe.coffeeAmount}g` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Water Amount</div>
                        <div class="modal-detail-value">${recipe.waterAmount ? `${recipe.waterAmount}ml` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Coffee to Water Ratio</div>
                        <div class="modal-detail-value">${(recipe.coffeeAmount && recipe.waterAmount) ? `1:${(recipe.waterAmount / recipe.coffeeAmount).toFixed(1)}` : '<span class="modal-detail-empty">Not calculable</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Water Temperature</div>
                        <div class="modal-detail-value">${recipe.waterTemp ? `${recipe.waterTemp}°C` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Brew Time</div>
                        <div class="modal-detail-value">${recipe.brewTime ? `${recipe.brewTime} minutes` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-flask"></i> Water Chemistry
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Water Composition</div>
                        <div class="modal-detail-value">${recipe.waterComposition ? formatFieldName(recipe.waterComposition) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">TDS (Total Dissolved Solids)</div>
                        <div class="modal-detail-value">${recipe.tds ? `${recipe.tds} ppm` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Calcium (Ca²⁺)</div>
                        <div class="modal-detail-value">${recipe.calcium ? `${recipe.calcium} mg/L` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Magnesium (Mg²⁺)</div>
                        <div class="modal-detail-value">${recipe.magnesium ? `${recipe.magnesium} mg/L` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Potassium (K⁺)</div>
                        <div class="modal-detail-value">${recipe.potassium ? `${recipe.potassium} mg/L` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Sodium (Na⁺)</div>
                        <div class="modal-detail-value">${recipe.sodium ? `${recipe.sodium} mg/L` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-glass-whiskey"></i> Serving Preferences
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Milk Preference</div>
                        <div class="modal-detail-value">${recipe.milkPreference ? formatFieldName(recipe.milkPreference) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Serving Temperature</div>
                        <div class="modal-detail-value">${recipe.servingTemp ? formatFieldName(recipe.servingTemp) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Sweetener</div>
                        <div class="modal-detail-value">${recipe.sweetener ? formatFieldName(recipe.sweetener) : '<span class="modal-detail-empty">None</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Sweetener Quantity</div>
                        <div class="modal-detail-value">${recipe.sweetenerQuantity ? `${recipe.sweetenerQuantity}g` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Serving Size</div>
                        <div class="modal-detail-value">${recipe.servingSize ? `${recipe.servingSize}ml` : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-nose"></i> Sensory Evaluation & Cupping
                </div>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Aroma Notes</div>
                        <div class="modal-detail-value">${recipe.aromaNotes && recipe.aromaNotes.trim() !== '' ? recipe.aromaNotes : '<span class="modal-detail-empty">Not described</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Body</div>
                        <div class="modal-detail-value">${recipe.body ? formatFieldName(recipe.body) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Acidity Type</div>
                        <div class="modal-detail-value">${recipe.acidityType ? formatFieldName(recipe.acidityType) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Sweetness</div>
                        <div class="modal-detail-value">${recipe.sweetness ? formatFieldName(recipe.sweetness) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Balance</div>
                        <div class="modal-detail-value">${recipe.balance ? formatFieldName(recipe.balance) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Clean Cup</div>
                        <div class="modal-detail-value">${recipe.cleanCup ? formatFieldName(recipe.cleanCup) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Uniformity</div>
                        <div class="modal-detail-value">${recipe.uniformity ? formatFieldName(recipe.uniformity) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Cupping Score</div>
                        <div class="modal-detail-value">${recipe.cuppingScore ? `${recipe.cuppingScore}/100` : '<span class="modal-detail-empty">Not scored</span>'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">Cupping Method</div>
                        <div class="modal-detail-value">${recipe.cuppingMethod ? formatFieldName(recipe.cuppingMethod) : '<span class="modal-detail-empty">Not specified</span>'}</div>
                    </div>
                </div>
                ${recipe.aftertaste && recipe.aftertaste.trim() !== '' ? `
                <div class="modal-notes" style="margin-top: 15px;">
                    <h4>Aftertaste/Finish</h4>
                    <p>${recipe.aftertaste}</p>
                </div>
                ` : ''}
                ${recipe.defects && recipe.defects.trim() !== '' ? `
                <div class="modal-notes" style="margin-top: 15px;">
                    <h4>Defects & Off-flavors</h4>
                    <p>${recipe.defects}</p>
                </div>
                ` : ''}
                ${recipe.overallImpression && recipe.overallImpression.trim() !== '' ? `
                <div class="modal-notes" style="margin-top: 15px;">
                    <h4>Overall Impression</h4>
                    <p>${recipe.overallImpression}</p>
                </div>
                ` : ''}
            </div>

            ${recipe.brewingNotes && recipe.brewingNotes.trim() !== '' ? `
            <div class="modal-section">
                <div class="modal-section-title">
                    <i class="fas fa-star"></i> Additional Notes
                </div>
                <div class="modal-notes">
                    <h4>Brewing Notes & Tips</h4>
                    <p>${recipe.brewingNotes}</p>
                </div>
            </div>
            ` : ''}
        `;
    }

    populateForm(recipe) {
        Object.keys(recipe).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = recipe[key];
            }
        });
        
        // Handle India estate visibility
        if (recipe.beanRegion === 'india') {
            this.handleRegionChange('india');
        }
    }

    clearForm() {
        document.getElementById('recipeForm').reset();
        this.currentEditingId = null;
        this.setCurrentDate();
        
        // Clear ratio display
        const ratioDisplay = document.getElementById('ratioDisplay');
        if (ratioDisplay) {
            ratioDisplay.remove();
        }
        
        // Hide India estate group
        const indiaEstateGroup = document.getElementById('indiaEstateGroup');
        if (indiaEstateGroup) {
            indiaEstateGroup.style.display = 'none';
        }
    }

    displayRecipes() {
        const recipesList = document.getElementById('recipesList');
        
        if (this.recipes.length === 0) {
            recipesList.innerHTML = `
                <div class="no-recipes">
                    <i class="fas fa-coffee"></i>
                    <p>No recipes created yet. Start by creating your first coffee recipe!</p>
                </div>
            `;
            return;
        }

        recipesList.innerHTML = this.recipes.map(recipe => this.createRecipeCard(recipe, this.isRecipeProMode)).join('');
    }

    createRecipeCard(recipe, isProMode = false) {
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const formatFieldName = (fieldName) => {
            return fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        };

        const getRatingStars = (rating) => {
            if (!rating) return '';
            const numRating = parseInt(rating);
            const stars = '⭐'.repeat(Math.min(numRating, 10));
            return `<div class="recipe-rating">${stars} (${rating}/10)</div>`;
        };

        return `
            <div class="recipe-card">
                <div class="recipe-header">
                    <div>
                        <h3 class="recipe-title">${recipe.recipeName}</h3>
                        <div class="recipe-date">Created: ${formatDate(recipe.dateCreated)}</div>
                        ${getRatingStars(recipe.rating)}
                    </div>
                    <div class="recipe-actions">
                        <button class="btn btn-outline btn-small" onclick="app.viewRecipeDetails('${recipe.id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="btn btn-outline btn-small" onclick="app.editRecipe('${recipe.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="app.duplicateRecipe('${recipe.id}')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="btn btn-outline btn-small" onclick="app.deleteRecipe('${recipe.id}')" style="color: var(--error); border-color: var(--error);">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                
                ${recipe.description ? `<p style="margin-bottom: 15px; color: var(--text-light);">${recipe.description}</p>` : ''}
                
                <div class="recipe-details">
                    ${this.createRecipeDetails(recipe, isProMode, formatFieldName)}
                </div>

                ${recipe.brewingNotes && recipe.brewingNotes.trim() !== '' ? `
                    <div class="recipe-notes">
                        <h4>Brewing Notes</h4>
                        <p>${recipe.brewingNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    saveRecipes() {
        localStorage.setItem('coffeeRecipes', JSON.stringify(this.recipes));
    }

    loadRecipes() {
        const stored = localStorage.getItem('coffeeRecipes');
        return stored ? JSON.parse(stored) : [];
    }

    exportRecipes() {
        if (this.recipes.length === 0) {
            this.showTemporaryMessage('No recipes to export!', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.recipes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `coffee-recipes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showTemporaryMessage('Recipes exported successfully!', 'success');
    }

    importRecipes(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedRecipes = JSON.parse(e.target.result);
                
                if (Array.isArray(importedRecipes)) {
                    if (confirm(`Import ${importedRecipes.length} recipes? This will add to your existing recipes.`)) {
                        importedRecipes.forEach(recipe => {
                            recipe.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                            this.recipes.unshift(recipe);
                        });
                        
                        this.saveRecipes();
                        this.displayRecipes();
                        this.showTemporaryMessage(`Successfully imported ${importedRecipes.length} recipes!`, 'success');
                    }
                } else {
                    this.showTemporaryMessage('Invalid file format. Please select a valid JSON file.', 'error');
                }
            } catch (error) {
                this.showTemporaryMessage('Error reading file. Please ensure it\'s a valid JSON file.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    showTemporaryMessage(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'info' ? 'success' : type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        const form = document.getElementById('recipeForm');
        form.insertBefore(alert, form.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 4000);
    }

    // Search and filter functionality
    searchRecipes(searchTerm) {
        const filteredRecipes = this.recipes.filter(recipe => {
            const searchableText = `
                ${recipe.recipeName} 
                ${recipe.description} 
                ${recipe.beanVariety} 
                ${recipe.beanRegion} 
                ${recipe.indiaEstate || ''}
                ${recipe.processingType}
                ${recipe.roastType}
                ${recipe.roastLevel}
                ${recipe.brewMethod} 
                ${recipe.waterComposition || ''}
                ${recipe.tds || ''}
                ${recipe.calcium || ''}
                ${recipe.magnesium || ''}
                ${recipe.potassium || ''}
                ${recipe.sodium || ''}
                ${recipe.milkPreference}
                ${recipe.sweetener || ''}
                ${recipe.aromaNotes || ''}
                ${recipe.body || ''}
                ${recipe.acidityType || ''}
                ${recipe.sweetness || ''}
                ${recipe.balance || ''}
                ${recipe.aftertaste || ''}
                ${recipe.cleanCup || ''}
                ${recipe.uniformity || ''}
                ${recipe.cuppingMethod || ''}
                ${recipe.defects || ''}
                ${recipe.overallImpression || ''}
                ${recipe.brewingNotes}
            `.toLowerCase();
            
            return searchableText.includes(searchTerm.toLowerCase());
        });
        
        return filteredRecipes;
    }

    // Get recipe statistics
    getRecipeStats() {
        if (this.recipes.length === 0) return null;

        const stats = {
            totalRecipes: this.recipes.length,
            avgRating: 0,
            mostUsedBean: '',
            mostUsedBrewMethod: '',
            avgCoffeeAmount: 0,
            avgWaterTemp: 0
        };

        // Calculate averages
        const ratings = this.recipes.filter(r => r.rating).map(r => parseInt(r.rating));
        if (ratings.length > 0) {
            stats.avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        }

        const coffeeAmounts = this.recipes.filter(r => r.coffeeAmount).map(r => parseFloat(r.coffeeAmount));
        if (coffeeAmounts.length > 0) {
            stats.avgCoffeeAmount = (coffeeAmounts.reduce((a, b) => a + b, 0) / coffeeAmounts.length).toFixed(1);
        }

        const waterTemps = this.recipes.filter(r => r.waterTemp).map(r => parseFloat(r.waterTemp));
        if (waterTemps.length > 0) {
            stats.avgWaterTemp = (waterTemps.reduce((a, b) => a + b, 0) / waterTemps.length).toFixed(1);
        }

        // Find most common values
        const beanCounts = {};
        const brewMethodCounts = {};

        this.recipes.forEach(recipe => {
            beanCounts[recipe.beanVariety] = (beanCounts[recipe.beanVariety] || 0) + 1;
            brewMethodCounts[recipe.brewMethod] = (brewMethodCounts[recipe.brewMethod] || 0) + 1;
        });

        stats.mostUsedBean = Object.keys(beanCounts).reduce((a, b) => beanCounts[a] > beanCounts[b] ? a : b, '');
        stats.mostUsedBrewMethod = Object.keys(brewMethodCounts).reduce((a, b) => brewMethodCounts[a] > brewMethodCounts[b] ? a : b, '');

        return stats;
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CoffeeRecipeApp();
});

// Add some helper styles for the ratio display and alerts
const additionalStyles = `
    .ratio-display {
        margin-top: 5px;
        color: var(--text-light);
        font-style: italic;
    }
    
    .alert {
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 