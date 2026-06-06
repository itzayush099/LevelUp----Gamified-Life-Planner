export const FOOD_CATEGORIES = ['Protein', 'Carbs', 'Vegetables', 'Fruits', 'Dairy', 'Supplements', 'Snacks', 'Drinks', 'Indian', 'Custom'];
export const MEAL_SECTIONS = ['breakfast', 'lunch', 'dinner', 'snacks', 'pre_workout', 'post_workout'];
export const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks', pre_workout: 'Pre Workout', post_workout: 'Post Workout' };

export const DEFAULT_FOODS = [
  // PROTEIN
  { name: 'Chicken Breast (Cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Chicken Thigh (Cooked)', calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, sodium: 84, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Whole Egg (Large)', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, sugar: 0.2, sodium: 71, servingSize: 1, servingUnit: ' Egg', category: 'Protein' },
  { name: 'Egg White (Large)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0, sugar: 0.2, sodium: 55, servingSize: 1, servingUnit: ' Egg White', category: 'Protein' },
  { name: 'Salmon (Cooked)', calories: 206, protein: 22, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 60, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Tuna (Canned in Water)', calories: 86, protein: 19.4, carbs: 0, fat: 0.8, fiber: 0, sugar: 0, sodium: 247, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Paneer', calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, sugar: 0, sodium: 18, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Tofu (Firm)', calories: 144, protein: 15.8, carbs: 2.8, fat: 8.7, fiber: 2.3, sugar: 0, sodium: 14, servingSize: 100, servingUnit: 'g', category: 'Protein' },
  { name: 'Soya Chunks', calories: 345, protein: 52, carbs: 33, fat: 0.5, fiber: 13, sugar: 0, sodium: 10, servingSize: 100, servingUnit: 'g', category: 'Protein' },

  // CARBS
  { name: 'White Rice (Cooked)', calories: 195, protein: 4, carbs: 42, fat: 0.4, fiber: 0.6, sugar: 0.1, sodium: 1, servingSize: 1, servingUnit: ' Bowl', category: 'Carbs' },
  { name: 'Brown Rice (Cooked)', calories: 166, protein: 3.9, carbs: 34.5, fat: 1.3, fiber: 2.7, sugar: 0.6, sodium: 7, servingSize: 1, servingUnit: ' Bowl', category: 'Carbs' },
  { name: 'Oats (Dry)', calories: 194, protein: 8.4, carbs: 33.1, fat: 3.4, fiber: 5.3, sugar: 0, sodium: 1, servingSize: 50, servingUnit: 'g', category: 'Carbs' },
  { name: 'Whole Wheat Bread', calories: 75, protein: 3.5, carbs: 13.5, fat: 1.1, fiber: 1.9, sugar: 1.4, sodium: 130, servingSize: 1, servingUnit: ' Slice', category: 'Carbs' },
  { name: 'White Bread', calories: 66, protein: 2.1, carbs: 12.6, fat: 0.8, fiber: 0.6, sugar: 1.4, sodium: 135, servingSize: 1, servingUnit: ' Slice', category: 'Carbs' },
  { name: 'Sweet Potato (Cooked)', calories: 135, protein: 3, carbs: 31, fat: 0.1, fiber: 5, sugar: 9.7, sodium: 54, servingSize: 1, servingUnit: ' Potato', category: 'Carbs' },
  { name: 'Potato (Cooked)', calories: 130, protein: 2.8, carbs: 30, fat: 0.1, fiber: 2.7, sugar: 1.3, sodium: 7, servingSize: 1, servingUnit: ' Potato', category: 'Carbs' },
  { name: 'Pasta (Cooked)', calories: 237, protein: 8.7, carbs: 46.5, fat: 1.3, fiber: 2.7, sugar: 0.9, sodium: 1, servingSize: 1, servingUnit: ' Bowl', category: 'Carbs' },
  { name: 'Quinoa (Cooked)', calories: 180, protein: 6.6, carbs: 31.9, fat: 2.8, fiber: 4.2, sugar: 1.3, sodium: 10, servingSize: 1, servingUnit: ' Bowl', category: 'Carbs' },

  // FRUITS
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14.4, sodium: 1, servingSize: 1, servingUnit: ' Banana', category: 'Fruits' },
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2, servingSize: 1, servingUnit: ' Apple', category: 'Fruits' },
  { name: 'Orange', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, fiber: 3.1, sugar: 12.2, sodium: 0, servingSize: 1, servingUnit: ' Orange', category: 'Fruits' },
  { name: 'Mango', calories: 150, protein: 2, carbs: 37.5, fat: 1, fiber: 4, sugar: 34.2, sodium: 2, servingSize: 1, servingUnit: ' Mango', category: 'Fruits' },
  { name: 'Papaya', calories: 120, protein: 1.4, carbs: 30.2, fat: 0.8, fiber: 4.7, sugar: 21.8, sodium: 22, servingSize: 1, servingUnit: ' Bowl', category: 'Fruits' },
  { name: 'Watermelon', calories: 85, protein: 1.7, carbs: 21.5, fat: 0.6, fiber: 1.1, sugar: 17.5, sodium: 3, servingSize: 1, servingUnit: ' Slice', category: 'Fruits' },
  { name: 'Pineapple', calories: 82, protein: 0.8, carbs: 21.6, fat: 0.2, fiber: 2.3, sugar: 16.3, sodium: 2, servingSize: 1, servingUnit: ' Cup', category: 'Fruits' },
  { name: 'Grapes', calories: 104, protein: 1.1, carbs: 27.3, fat: 0.3, fiber: 1.4, sugar: 23.4, sodium: 3, servingSize: 1, servingUnit: ' Cup', category: 'Fruits' },

  // VEGETABLES
  { name: 'Broccoli', calories: 50, protein: 4.2, carbs: 9.9, fat: 0.6, fiber: 3.9, sugar: 2.5, sodium: 49, servingSize: 1, servingUnit: ' Bowl', category: 'Vegetables' },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, servingSize: 100, servingUnit: 'g', category: 'Vegetables' },
  { name: 'Cucumber', calories: 45, protein: 2.1, carbs: 10.8, fat: 0.3, fiber: 1.5, sugar: 5.1, sodium: 6, servingSize: 1, servingUnit: ' Cucumber', category: 'Vegetables' },
  { name: 'Tomato', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2, sodium: 6, servingSize: 1, servingUnit: ' Tomato', category: 'Vegetables' },
  { name: 'Onion', calories: 44, protein: 1.2, carbs: 10.2, fat: 0.1, fiber: 1.9, sugar: 4.6, sodium: 4, servingSize: 1, servingUnit: ' Onion', category: 'Vegetables' },
  { name: 'Carrot', calories: 25, protein: 0.5, carbs: 6, fat: 0.1, fiber: 1.7, sugar: 2.9, sodium: 42, servingSize: 1, servingUnit: ' Carrot', category: 'Vegetables' },
  { name: 'Capsicum (Bell Pepper)', calories: 24, protein: 1, carbs: 5.5, fat: 0.2, fiber: 2, sugar: 2.9, sodium: 4, servingSize: 1, servingUnit: ' Capsicum', category: 'Vegetables' },
  { name: 'Cauliflower', calories: 37, protein: 2.8, carbs: 7.5, fat: 0.4, fiber: 3, sugar: 2.8, sodium: 45, servingSize: 1, servingUnit: ' Bowl', category: 'Vegetables' },

  // INDIAN
  { name: 'Roti / Chapati', calories: 104, protein: 3.2, carbs: 22, fat: 0.5, fiber: 3, sugar: 0.5, sodium: 1, servingSize: 1, servingUnit: ' Roti', category: 'Indian' },
  { name: 'Aloo Paratha', calories: 260, protein: 5.6, carbs: 35, fat: 10, fiber: 4, sugar: 1, sodium: 250, servingSize: 1, servingUnit: ' Paratha', category: 'Indian' },
  { name: 'Dal (Cooked Lentils)', calories: 174, protein: 13.5, carbs: 30, fat: 0.6, fiber: 12, sugar: 1.5, sodium: 15, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Rajma (Kidney Beans)', calories: 190, protein: 13, carbs: 34.2, fat: 0.7, fiber: 9.6, sugar: 0.4, sodium: 3, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Chole (Chickpea Curry)', calories: 246, protein: 13.3, carbs: 41.1, fat: 3.9, fiber: 11.4, sugar: 7.2, sodium: 36, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Khichdi', calories: 163, protein: 5.2, carbs: 30, fat: 2.2, fiber: 3, sugar: 0, sodium: 22, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Idli', calories: 58, protein: 1.6, carbs: 12, fat: 0.1, fiber: 1.5, sugar: 0, sodium: 1, servingSize: 1, servingUnit: ' Idli', category: 'Indian' },
  { name: 'Dosa (Plain)', calories: 133, protein: 2.7, carbs: 21, fat: 3.7, fiber: 1.5, sugar: 0, sodium: 94, servingSize: 1, servingUnit: ' Dosa', category: 'Indian' },
  { name: 'Sambar', calories: 120, protein: 4.5, carbs: 16.5, fat: 3, fiber: 3, sugar: 3, sodium: 450, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Paneer Butter Masala', calories: 375, protein: 13.5, carbs: 15, fat: 28.5, fiber: 1.5, sugar: 3, sodium: 525, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Chicken Curry', calories: 270, protein: 22.5, carbs: 7.5, fat: 15, fiber: 1.5, sugar: 1.5, sodium: 450, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },
  { name: 'Chicken Biryani', calories: 240, protein: 15, carbs: 30, fat: 6, fiber: 1.5, sugar: 0, sodium: 375, servingSize: 1, servingUnit: ' Bowl', category: 'Indian' },

  // SNACKS
  { name: 'Peanut Butter', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 2, sugar: 3, sodium: 5, servingSize: 1, servingUnit: ' Tbsp', category: 'Snacks' },
  { name: 'Roasted Chana', calories: 184, protein: 9, carbs: 30, fat: 2.5, fiber: 7.5, sugar: 2.5, sodium: 5, servingSize: 50, servingUnit: 'g', category: 'Snacks' },
  { name: 'Makhana (Fox Nuts)', calories: 104, protein: 2.9, carbs: 23, fat: 0, fiber: 4.3, sugar: 0, sodium: 63, servingSize: 30, servingUnit: 'g', category: 'Snacks' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6.1, fat: 14.1, fiber: 3.5, sugar: 1.2, sodium: 0, servingSize: 28, servingUnit: 'g', category: 'Snacks' },
  { name: 'Cashews', calories: 157, protein: 5.1, carbs: 8.5, fat: 12.4, fiber: 0.9, sugar: 1.7, sodium: 3, servingSize: 28, servingUnit: 'g', category: 'Snacks' },
  { name: 'Walnuts', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9, sugar: 0.7, sodium: 0, servingSize: 28, servingUnit: 'g', category: 'Snacks' },
  { name: 'Protein Bar (Typical)', calories: 220, protein: 20, carbs: 23, fat: 7, fiber: 5, sugar: 2, sodium: 150, servingSize: 1, servingUnit: ' Bar', category: 'Snacks' },

  // DAIRY
  { name: 'Milk (Whole)', calories: 122, protein: 6.4, carbs: 9.6, fat: 6.6, fiber: 0, sugar: 10, sodium: 86, servingSize: 1, servingUnit: ' Glass', category: 'Dairy' },
  { name: 'Milk (Skimmed)', calories: 70, protein: 6.8, carbs: 10, fat: 0.2, fiber: 0, sugar: 10, sodium: 84, servingSize: 1, servingUnit: ' Glass', category: 'Dairy' },
  { name: 'Curd / Yogurt', calories: 147, protein: 15, carbs: 5.4, fat: 6.4, fiber: 0, sugar: 5.4, sodium: 54, servingSize: 1, servingUnit: ' Bowl', category: 'Dairy' },
  { name: 'Greek Yogurt (Plain)', calories: 88, protein: 15, carbs: 5.4, fat: 0.6, fiber: 0, sugar: 4.8, sodium: 54, servingSize: 1, servingUnit: ' Bowl', category: 'Dairy' },
  { name: 'Cheese (Cheddar)', calories: 113, protein: 7, carbs: 0.4, fat: 9.3, fiber: 0, sugar: 0.1, sodium: 174, servingSize: 1, servingUnit: ' Slice', category: 'Dairy' },
  { name: 'Buttermilk', calories: 80, protein: 6.6, carbs: 9.6, fat: 1.8, fiber: 0, sugar: 9.6, sodium: 210, servingSize: 1, servingUnit: ' Glass', category: 'Dairy' },

  // SUPPLEMENTS
  { name: 'Whey Protein Isolate', calories: 110, protein: 25, carbs: 1, fat: 0.5, fiber: 0, sugar: 0, sodium: 50, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },
  { name: 'Whey Protein Concentrate', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, sodium: 60, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },
  { name: 'Soy Protein Isolate', calories: 110, protein: 25, carbs: 1, fat: 0.5, fiber: 0, sugar: 0, sodium: 150, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },
  { name: 'Creatine Monohydrate', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, servingSize: 5, servingUnit: 'g', category: 'Supplements' },
  { name: 'Mass Gainer', calories: 380, protein: 25, carbs: 65, fat: 2, fiber: 2, sugar: 8, sodium: 120, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },
  { name: 'Casein Protein', calories: 115, protein: 24, carbs: 3, fat: 1, fiber: 0, sugar: 1, sodium: 180, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },
  { name: 'Electrolytes Powder', calories: 15, protein: 0, carbs: 4, fat: 0, fiber: 0, sugar: 0, sodium: 500, servingSize: 1, servingUnit: ' Scoop', category: 'Supplements' },

  // DRINKS
  { name: 'Tea (Plain with Milk)', calories: 40, protein: 1, carbs: 4, fat: 1.5, fiber: 0, sugar: 4, sodium: 15, servingSize: 1, servingUnit: ' Cup', category: 'Drinks' },
  { name: 'Coffee (Black)', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 2, servingSize: 1, servingUnit: ' Cup', category: 'Drinks' },
  { name: 'Green Tea', calories: 2, protein: 0.2, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, servingSize: 1, servingUnit: ' Cup', category: 'Drinks' },
  { name: 'Coconut Water', calories: 46, protein: 1.7, carbs: 8.9, fat: 0.5, fiber: 2.6, sugar: 6.2, sodium: 252, servingSize: 1, servingUnit: ' Glass', category: 'Drinks' }
];
