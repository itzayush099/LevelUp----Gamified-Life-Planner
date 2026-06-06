// src/data/challengesData.js

export const CHALLENGES = [
  // ===================== EASY =====================
  { id: 'e1', title: 'Drink 3L Water', desc: 'Hydration goal achieved for the morning', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e2', title: 'Stretch 15 Minutes', desc: 'Complete a light mobility session', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e3', title: 'Log All Meals', desc: 'Ensure your nutrition planner is up to date', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e4', title: 'Review Weekly Goals', desc: 'Take 5 minutes to align your daily tasks', category: 'Study', difficulty: 'Easy', reward: 25 },
  { id: 'e5', title: 'Sleep 8 Hours', desc: 'Log a healthy recovery score', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e6', title: 'Walk 5,000 Steps', desc: 'Get outside and move around', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e7', title: 'Clear Desk', desc: 'Maintain a clean productivity environment', category: 'Study', difficulty: 'Easy', reward: 25 },
  { id: 'e8', title: 'Read 10 Pages', desc: 'Continuous learning and mental growth', category: 'Study', difficulty: 'Easy', reward: 25 },
  { id: 'e9', title: 'Drink 5L Water', desc: 'Maximum hydration challenge', category: 'Health', difficulty: 'Easy', reward: 25 },
  { id: 'e10', title: 'No Screen Before Bed', desc: 'Protect your circadian rhythm', category: 'Health', difficulty: 'Easy', reward: 25 },

  // ===================== MEDIUM =====================
  { id: 'm1', title: 'Hit Protein Goal', desc: 'Reach your daily protein macros', category: 'Health', difficulty: 'Medium', reward: 50 },
  { id: 'm2', title: 'Complete Workout', desc: 'Finish a scheduled gym session', category: 'Gym', difficulty: 'Medium', reward: 50 },
  { id: 'm3', title: 'Complete 5 Tasks', desc: 'Clear out your pending task list', category: 'Study', difficulty: 'Medium', reward: 50 },
  { id: 'm4', title: 'Walk 10,000 Steps', desc: 'Hit the gold standard for daily movement', category: 'Health', difficulty: 'Medium', reward: 50 },
  { id: 'm5', title: 'Zero Overdue Tasks', desc: 'End the day with no pending carry-overs', category: 'Study', difficulty: 'Medium', reward: 50 },
  { id: 'm6', title: 'No Junk Food', desc: 'Strict adherence to your meal plan', category: 'Health', difficulty: 'Medium', reward: 50 },
  { id: 'm7', title: 'Meditate 20 Minutes', desc: 'Focused mindfulness session', category: 'Health', difficulty: 'Medium', reward: 50 },
  { id: 'm8', title: 'Finish Deep Work Session', desc: 'At least 90 minutes of uninterrupted work', category: 'Study', difficulty: 'Medium', reward: 50 },
  { id: 'm9', title: 'Learn a New Skill', desc: 'Spend time on self-improvement', category: 'Study', difficulty: 'Medium', reward: 50 },
  { id: 'm10', title: 'Complete Mobility Session', desc: 'Extensive recovery and stretching', category: 'Health', difficulty: 'Medium', reward: 50 },

  // ===================== HARD =====================
  { id: 'h1', title: 'Complete 10 Tasks', desc: 'A legendary day of productivity', category: 'Study', difficulty: 'Hard', reward: 100 },
  { id: 'h2', title: 'Hit All Macro Goals', desc: 'Perfect nutrition adherence', category: 'Health', difficulty: 'Hard', reward: 100 },
  { id: 'h3', title: 'PR A Gym Lift', desc: 'Break a personal record in the gym', category: 'Gym', difficulty: 'Hard', reward: 100 },
  { id: 'h4', title: '12 Hours Fasting', desc: 'Intermittent fasting protocol', category: 'Health', difficulty: 'Hard', reward: 100 },
  { id: 'h5', title: 'Zero Screen Time Day', desc: 'Digital detox challenge', category: 'Health', difficulty: 'Hard', reward: 100 },
  { id: 'h6', title: 'Write 1000 Words', desc: 'Significant creative output', category: 'Study', difficulty: 'Hard', reward: 100 },
  { id: 'h7', title: 'Intense Cardio Session', desc: 'Push your VO2 Max limits', category: 'Gym', difficulty: 'Hard', reward: 100 },
];

/**
 * Deterministic PRNG based on Mulberry32
 */
const mulberry32 = (a) => {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};

/**
 * Generates deterministic daily challenges based on a date seed.
 * Requires: 3 Easy, 2 Medium, 1 Hard.
 */
export const getDailyChallenges = (dateStr) => {
  // Create a numeric seed from the date string (e.g. '2026-06-04' -> 20260604)
  const seed = parseInt(dateStr.replace(/-/g, ''), 10);
  const random = mulberry32(seed);

  // Group challenges by difficulty
  const easy = CHALLENGES.filter(c => c.difficulty === 'Easy');
  const medium = CHALLENGES.filter(c => c.difficulty === 'Medium');
  const hard = CHALLENGES.filter(c => c.difficulty === 'Hard');

  // Shuffle helper
  const shuffle = (array) => {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const selectedEasy = shuffle(easy).slice(0, 3);
  const selectedMedium = shuffle(medium).slice(0, 2);
  const selectedHard = shuffle(hard).slice(0, 1);

  return [...selectedEasy, ...selectedMedium, ...selectedHard];
};
