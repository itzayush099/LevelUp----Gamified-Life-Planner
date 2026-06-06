<div align="center">
  
# LevelUp: Gamified Life Planner 🚀

A comprehensive, all-in-one productivity and lifestyle tracking application built to gamify your daily routines. LevelUp transforms your tasks, workouts, and nutrition into a unified RPG-like experience, helping you build consistency and achieve your goals.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://life-planner-v19.vercel.app)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)

</div>

---

## 📸 Screenshots

> **Dashboard Screenshot** (Coming Soon)
> 
> **Task Planner Screenshot** (Coming Soon)
> 
> **Gym Planner Screenshot** (Coming Soon)
> 
> **Meal Planner Screenshot** (Coming Soon)

---

## ✨ Features

### 📅 Task Planner
* **Timeline View:** Drag-and-drop chronological visualization of your daily schedule.
* **Smart Templates:** Includes quick templates and specialized study templates (e.g., Pomodoro blocks).
* **Recurring Tasks:** Set up daily, weekly, or custom interval habits.
* **Priority Management:** Color-coded priority levels to focus on what matters most.
* **Task Streaks:** Visual indicators for consecutive days a habit is completed.

### 🏋️‍♂️ Gym Planner
* **Workout Logging:** Track exercises, sets, reps, and weights easily.
* **Readiness Score:** A proprietary algorithm calculating daily readiness based on sleep, energy, stress, and soreness.
* **Progressive Overload Charts:** Visual graphs tracking Personal Records (PRs) and weight progression over time.
* **Predefined Splits:** Select from popular routines (Push/Pull/Legs, Upper/Lower, Bro Split).
* **Equipment & Muscle Filters:** Sort your exercise library efficiently.

### 🥗 Meal Planner
* **Daily Macro Logging:** Detailed tracking of calories, protein, carbs, and fats.
* **Hydration Tracker:** Visual daily water intake milestones.
* **Supplement Manager:** Log daily vitamins and supplements consistently.
* **Body Transformation:** Track body weight and physical measurements alongside nutrition.
* **Food Library:** Custom database to save frequently eaten meals.

### 📈 Analytics & Gamification
* **XP System:** Earn experience points for completing tasks, workouts, and hitting macro goals.
* **Level Progression:** RPG-style leveling up as you accumulate XP.
* **Category Stats:** Visual breakdown of time spent on work, health, study, and leisure.
* **Streak Tracking:** Keep the momentum going with cross-module streak counters.
* **Challenge Board:** Take on special active challenges for bonus XP.

### 🔐 Authentication
* **Secure Login:** Handled securely via Firebase Auth.
* **Account Recovery:** Built-in "Forgot Password" flow.
* **Persistent Sessions:** Stay logged in securely across page reloads.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 18
* **Build Tool:** Vite 5
* **Styling:** Tailwind CSS
* **Backend / Database:** Firebase & Firestore
* **Authentication:** Firebase Auth
* **Charts & Data Visualization:** Recharts
* **Drag and Drop:** @dnd-kit/core
* **Icons:** Lucide React

---

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── analytics/       # Data visualization panels
│   ├── auth/            # Login, Signup, Password reset
│   ├── dashboard/       # Main overview widgets (XP, Streaks)
│   ├── gym/             # Gym Planner module
│   ├── layout/          # Sidebar, Header, Navigation
│   ├── meals/           # Nutrition, Hydration, Supplements
│   └── tasks/           # Timeline, Task Cards, Filters
├── constants/           # Shared static configurations
├── data/                # Mock data / Initial state schemas
├── hooks/               # Custom React hooks (useAnalytics, useTasks, etc.)
├── services/            # Firebase API interactions
├── styles/              # Global Tailwind CSS files
└── utils/               # Helper functions (Levels, Timers, Recurrence)
```

---

## 🚀 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/itzayush099/LevelUp----Gamified-Life-Planner.git
   cd LevelUp----Gamified-Life-Planner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and fill in your Firebase credentials (see below).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file. These connect the app to your own Firebase instance. 

> **Warning:** Never commit your actual `.env` file to version control.

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## ☁️ Deployment

This project is deployed using **Vercel**. 

Because this is a Single Page Application (SPA) built with Vite, routing relies on a `vercel.json` file in the root directory to rewrite all traffic to `index.html`. This ensures direct links to modules (like `/dashboard` or `/tasks`) do not return 404 errors on page refresh.

* **Live URL:** [https://life-planner-v19.vercel.app](https://life-planner-v19.vercel.app)

---

## 🗺️ Roadmap

Future updates planned for LevelUp:
- [ ] **AI Assistant:** Smart scheduling suggestions based on historical completion rates.
- [ ] **Life Dashboard:** High-level quarterly and yearly goal mapping.
- [ ] **Habit System:** A dedicated sub-module for micro-habits.
- [ ] **Sleep Tracking:** Direct integration with fitness wearables.
- [ ] **Voice Commands:** Add tasks and log meals hands-free.

---

## 👤 Author

**Ayush**
- GitHub: [@itzayush099](https://github.com/itzayush099)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
