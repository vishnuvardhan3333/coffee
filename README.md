# ☕ Coffee Recipe Creator

A comprehensive web application for creating, managing, and organizing detailed coffee recipes with all the variables that matter for the perfect cup.

## 🌟 Features

### ☕ Bean Information
- **Bean Varieties**: Arabica, Robusta, SLN, SL95, SL90, Peaberry, Bourbon, Typica, Geisha, Caturra, Catuai, Pacamara
- **Bean Regions**: 40+ regions organized by continent (Africa, Central & South America, Asia & Pacific, Middle East)
- **Indian Coffee Estates**: 200+ specific estates across all 11 coffee-growing states including Karnataka (Coorg, Chikmagalur, Hassan), Kerala (Wayanad, Idukki, Palakkad), Tamil Nadu (Nilgiris, Shevaroys, Anamalai), Andhra Pradesh & Telangana, Odisha, Meghalaya, Assam, Nagaland, Manipur, Arunachal Pradesh, Mizoram, and Tripura
- **Processing Types**: Washed, Natural, Honey Process, Semi-washed, Wet Hulled, Anaerobic Fermentation, Carbonic Maceration, Extended Fermentation, Monsoon Malabar

### 🇮🇳 Comprehensive Indian Coffee Database
- **Karnataka**: Coorg/Kodagu (37 estates), Chikmagalur (26 estates), Hassan (15 estates)
- **Kerala**: Wayanad (14 estates), Idukki (11 estates), Palakkad (5 estates)
- **Tamil Nadu**: Nilgiris (18 estates), Shevaroys (6 estates), Anamalai (6 estates)
- **Andhra Pradesh & Telangana**: 15 estates including famous Araku Valley
- **Northeast States**: Assam (6 estates), Meghalaya (8 estates), Nagaland (6 estates), Manipur (5 estates), Arunachal Pradesh (5 estates), Mizoram (5 estates), Tripura (5 estates)
- **Odisha**: 8 estates including Koraput and Rayagada regions

### 👃 Professional Sensory Evaluation & Cupping
- **Aroma Analysis**: Detailed aroma note descriptions and olfactory assessment
- **Body Assessment**: Light, medium-light, medium, medium-full, full, heavy classifications
- **Acidity Profiling**: Bright, crisp, tart, citric, malic, phosphoric, mellow characteristics
- **Sweetness Scale**: Seven-point sweetness evaluation system
- **Balance Evaluation**: Six-point balance assessment from poor to outstanding
- **Aftertaste Documentation**: Detailed finish and lingering flavor analysis
- **Clean Cup Assessment**: Six-point cleanliness evaluation system
- **Uniformity Scoring**: Five-point consistency evaluation across cups
- **Official Cupping Scores**: 0-100 point scoring system (SCA standard: 80+ = Specialty Grade)
- **Multiple Protocols**: SCA Standard, Cup of Excellence, Q Grader Protocol, Brazilian Method, and more
- **Defect Tracking**: Documentation of off-flavors and negative attributes
- **Overall Impression**: Comprehensive assessment and professional notes

### 🔥 Roasting Profile
- **Roast Types**: Hot Air (Fluid Bed), Contact Heat (Drum), Infrared, Hybrid, Pan Roasting, Wood Fire
- **Roast Levels**: Light, Medium Light, Medium, Medium Dark, Dark, French, Italian
- **Crack Development**: Pre-First Crack through Post Second Crack with detailed timing options
- **Roast Parameters**: Total roast time and development time percentage

### 🍯 Brewing Parameters
- **Brew Methods**: Espresso, Pour Over, French Press, AeroPress, Cold Brew, Turkish, Moka Pot, Drip Coffee, Siphon
- **Precision Grind Measurement**: Grind size in microns (200-2000μm) with automatic recommendations based on brew method
- **Water Composition**: Soft, Medium Hard, Hard, Distilled, Filtered, Spring, Tap, Custom Mineral Content
- **TDS Control**: Total Dissolved Solids measurement in ppm (optimal range: 75-150 ppm)
- **Mineral Profile**: Individual mineral content tracking (Calcium, Magnesium, Potassium, Sodium) with SCA recommendations
- **Precise Measurements**: Coffee amount (grams), water amount (ml), water temperature (°C), brew time (minutes)
- **Automatic Ratio Calculation**: Real-time coffee-to-water ratio display

### 🥛 Serving Preferences
- **Milk Options**: Black, Whole Milk, 2%, Skim, Oat Milk, Almond Milk, Soy Milk, Coconut Milk, Heavy Cream, Half and Half
- **Drinking Temperatures**: Hot (65-70°C), Warm (55-60°C), Room Temperature, Cold (5-10°C), Iced (0-5°C)
- **Sweeteners**: Sugar, Brown Sugar, Honey, Maple Syrup, Stevia, Agave, Artificial Sweetener
- **Sweetener Quantity**: Precise measurement in grams
- **Serving Size**: Customizable serving size in ml

### 📝 Recipe Management
- **Detailed Notes**: Tasting notes and brewing tips
- **10-Point Rating System**: Rate and track your favorite recipes with precision
- **Professional Sensory Evaluation**: Complete cupping form with aroma, body, acidity, balance, and more
- **SCA-Standard Cupping**: Official scoring system with cupping scores (0-100) and multiple protocols
- **Comprehensive Details View**: Modal popup showing complete recipe information with all fields, even empty ones
- **Smart Recipe Cards**: Condensed view showing only filled fields for clean interface
- **Recipe Organization**: View all recipes in an organized, searchable format
- **Export/Import**: Save recipes as JSON files for backup or sharing

### 🎨 Modern Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Coffee-themed color scheme with smooth animations
- **Intuitive Forms**: Organized sections with clear labels and helpful hints
- **Real-time Feedback**: Instant validation and helpful suggestions

## 🚀 Getting Started

1. **Open the App**: Simply open `index.html` in any modern web browser
2. **Create Your First Recipe**: Fill out the comprehensive form with your coffee details
3. **Save and Manage**: Your recipes are automatically saved to your browser's local storage
4. **Export/Import**: Share recipes with others or backup your collection

## 📱 How to Use

### Creating a Recipe

1. **Recipe Details**: Give your recipe a name and description (required)
2. **Bean Information**: Optionally select your bean variety, region (with estate details for India), and processing type
3. **Roasting Profile**: Optionally choose roast type, level, and crack development details
4. **Brewing Parameters**: Optionally set your brew method, grind size, measurements, and water chemistry details
5. **Serving Preferences**: Optionally choose milk type, temperature, and serving details
6. **Sensory Evaluation**: Optionally complete professional cupping assessment with aroma, body, acidity, and scoring
7. **Additional Notes**: Optionally add brewing tips and rate your recipe (required)
8. **Save**: Click "Create Recipe" to save your masterpiece

**Note**: Only recipe name, description, rating, and date are required - all other fields are optional, allowing you to create recipes with as much or as little detail as you want.

### Managing Recipes

- **View Details**: Click the "Details" button to see a comprehensive view of all recipe information in a modal popup
- **Edit**: Click the "Edit" button on any recipe card to modify it
- **Copy**: Duplicate a recipe to create variations
- **Delete**: Remove recipes you no longer want
- **Export**: Download all your recipes as a JSON file
- **Import**: Load recipes from a JSON file

### Smart Features

- **Auto-Recommendations**: Grind size and micron suggestions based on brew method
- **Comprehensive Indian Estate Database**: When India is selected, shows 200+ detailed estate options from all 11 coffee-growing states, organized by region
- **Precision Measurements**: Grind size in microns with helpful reference ranges
- **Advanced Water Chemistry**: TDS control and complete mineral profile tracking (Ca²⁺, Mg²⁺, K⁺, Na⁺)
- **SCA Guidelines**: Built-in recommendations following Specialty Coffee Association standards
- **Global Coverage**: 40+ countries organized by continent for easy selection
- **Water Quality Tracking**: Comprehensive water composition options for brew optimization
- **Ratio Calculator**: Automatic coffee-to-water ratio calculation
- **Enhanced Rating System**: 10-point precision rating scale for detailed evaluation
- **Flexible Form Validation**: Only requires essential fields (recipe name, description, tasting notes, rating, date) - all other fields are optional
- **Responsive Layout**: Adapts to your screen size for optimal experience

## 🛠️ Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks required
- **Local Storage**: All data saved in your browser
- **Responsive Grid**: CSS Grid and Flexbox for layout
- **Modern Styling**: CSS custom properties and smooth transitions
- **Cross-browser Compatible**: Works in all modern browsers

## 📊 Recipe Variables Included

### Bean & Processing (9 variables)
- Bean variety, region, Indian estate (when applicable), processing type, roast type, roast level, crack timing, roast time, development time

### Brewing & Water (12 variables)
- Brew method, grind size (microns), water composition, TDS, calcium, magnesium, potassium, sodium, coffee amount, water amount, water temperature, brew time

### Serving (5 variables)
- Milk preference, serving temperature, sweetener, sweetener quantity, serving size

### Sensory Evaluation & Cupping (12 variables)
- Aroma notes, body, acidity type, sweetness, balance, aftertaste, clean cup, uniformity, cupping score, cupping method, defects, overall impression

### Additional (3 variables)
- Brewing notes, rating (1-10), date created

**Total: 41+ customizable variables for the perfect coffee recipe!**

## 🎯 Perfect For

- **Coffee Enthusiasts**: Track and perfect your brewing techniques with scientific precision
- **Home Roasters**: Document roasting profiles and results with detailed measurements
- **Cafes & Baristas**: Standardize and share brewing recipes with complete water profiles
- **Coffee Educators**: Teaching brewing parameters, water chemistry, and their effects
- **Q Graders & Cupping Professionals**: SCA-standard cupping forms with professional scoring systems
- **Coffee Competitions**: Complete documentation for cupping competitions and evaluations
- **Specialty Coffee Industry**: Professional-grade sensory evaluation and quality assessment
- **Indian Coffee Specialists**: Comprehensive database of 200+ estates across all coffee-growing states
- **Water Chemistry Analysis**: Professional-level mineral content tracking and TDS optimization
- **Coffee Importers & Exporters**: Complete traceability and origin documentation
- **Recipe Sharing**: Export and share your perfect recipes with complete technical specifications

## 💡 Tips for Best Results

1. **Start Simple**: With most fields optional, you can start with just basic info and add details over time
2. **Be Detailed When Possible**: The more information you record, the better you can replicate great results
3. **Rate Everything**: Use the 10-point rating system to identify your favorites with precision
4. **Use Professional Cupping**: Take advantage of the complete sensory evaluation section for professional assessment, including detailed aroma notes
5. **SCA Scoring Reference**: 80+ cupping score = Specialty Grade, 85+ = Premium, 90+ = Exceptional
6. **Water Chemistry Matters**: Track TDS and mineral content when possible - water quality significantly affects taste
7. **Follow SCA Guidelines**: Use the recommended mineral ranges for optimal extraction
8. **Indian Coffee Estates**: Take advantage of the comprehensive 200+ estate database for precise origin tracking
9. **Experiment**: Try the "Copy" feature to create variations of successful recipes
10. **Track Water Source**: Different water sources can dramatically change the same recipe
11. **Progressive Detail**: Start with simple recipes and gradually add more technical details as you learn
12. **Backup**: Regularly export your recipes to avoid losing your hard work

## 🔄 Future Enhancements

The app is designed to be easily extensible. Potential future features could include:
- Estate databases for other major coffee-producing countries (Colombia, Ethiopia, etc.)
- Recipe sharing community
- Photo attachments
- Brewing timers
- Recipe recommendations
- Advanced filtering and search
- GPS coordinates for estate locations
- Harvest season tracking

---

**Enjoy creating your perfect coffee recipes! ☕** 