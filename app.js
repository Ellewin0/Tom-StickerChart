// app.js - Banter Compliance Division
// THE SP25 ACCESS CHART (OMK EDITION)

// --- STEP 1: FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyATw1DuMrVzrKeb8Ebj3iVxQf-eafgG2bk",
    authDomain: "tom-sticker-chart.firebaseapp.com",
    databaseURL: "https://tom-sticker-chart-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tom-sticker-chart",
    storageBucket: "tom-sticker-chart.firebasestorage.app",
    messagingSenderId: "639564337276",
    appId: "1:639564337276:web:d8bee0a7206ecefdd7b9f9"
};
// ---------------------------------

// --- STEP 2: APP LOGIC ---

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const pointsRef = database.ref('tomPoints');

// Rules Definitions
const POINT_MODIFIERS = {
    gold: 10,
    red: -10
};

// UI Elements
const currentPointsDisplay = document.getElementById('currentPoints');
const goldCountDisplay = document.getElementById('goldCount');
const redCountDisplay = document.getElementById('redCount');
const addGoldBtn = document.getElementById('addGold');
const addRedBtn = document.getElementById('addRed');
const rewardsList = document.getElementById('rewardsList');

// System State
let localPointsState = {
    totalPoints: 0,
    goldStars: 0,
    redStars: 0
};

// --- INITIAL LOAD ---

// Local fetch and fallback if needed
const cachedPoints = JSON.parse(localStorage.getItem('tomSystemState'));
if (cachedPoints) {
    localPointsState = cachedPoints;
    updateUI(localPointsState);
}

// 1. Sync Data (Listeners - Updates instantly when You or Tom edits)
pointsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        localPointsState = data;
        updateUI(localPointsState);
        localStorage.setItem('tomSystemState', JSON.stringify(localPointsState));
    } else {
        // First-time setup, seed the DB
        pointsRef.set(localPointsState);
    }
});

// --- INTERACTIONS (Actions) ---

// Award Gold Star
addGoldBtn.addEventListener('click', () => {
    modifyPoints('gold');
});

// Assign Red Star
addRedBtn.addEventListener('click', () => {
    modifyPoints('red');
});

// Helper: Modify Points System
function modifyPoints(type) {
    const change = POINT_MODIFIERS[type];
    const newState = {
        totalPoints: localPointsState.totalPoints + change,
        goldStars: localPointsState.goldStars + (type === 'gold' ? 1 : 0),
        redStars: localPointsState.redStars + (type === 'red' ? 1 : 0)
    };
    
    // Save to Firebase (updates local UI automatically via listener)
    pointsRef.update(newState);
}

// Helper: Update UI
function updateUI(state) {
    // 1. Core Points
    currentPointsDisplay.innerText = state.totalPoints;
    
    // 2. Stars
    goldCountDisplay.innerText = state.goldStars;
    redCountDisplay.innerText = state.redStars;

    // 3. Rewards Progress (Dynamic Styling)
    updateRewardsTier(state.totalPoints);
}

// Helper: Dynamically Unlock/Lock Reward Tiers
function updateRewardsTier(points) {
    // Defines tiers [Points required, CSS class name]
    const tiers = [
        [50, 'tier-50'],
        [100, 'tier-100'],
        [200, 'tier-200']
    ];

    tiers.forEach(([required, className]) => {
        const rewardElement = document.querySelector(`.reward.${className}`);
        if (rewardElement) {
            if (points >= required) {
                rewardElement.classList.remove('locked');
                rewardElement.classList.add('unlocked');
            } else {
                rewardElement.classList.remove('unlocked');
                rewardElement.classList.add('locked');
            }
        }
    });
}
