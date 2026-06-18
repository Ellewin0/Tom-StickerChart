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
const pointsRef = database.ref("tomPoints");

const POINT_MODIFIERS = {
    gold: 10,
    red: -10
};

const currentPointsDisplay = document.getElementById("currentPoints");
const goldCountDisplay = document.getElementById("goldCount");
const redCountDisplay = document.getElementById("redCount");
const visualStarChart = document.getElementById("visualStarChart");

const addGoldButton = document.getElementById("addGold");
const addRedButton = document.getElementById("addRed");
const refreshButton = document.getElementById("refreshBtn");
const masterResetButton = document.getElementById("masterResetBtn");

let localPointsState = {
    totalPoints: 0,
    goldStars: 0,
    redStars: 0
};

pointsRef.on("value", (snapshot) => {
    const data = snapshot.val();

    if (data) {
        localPointsState = {
            totalPoints: data.totalPoints || 0,
            goldStars: data.goldStars || 0,
            redStars: data.redStars || 0
        };

        updateUI(localPointsState);
    } else {
        pointsRef.set(localPointsState);
    }
});

addGoldButton.addEventListener("click", () => {
    modifyPoints("gold");
});

addRedButton.addEventListener("click", () => {
    modifyPoints("red");
});

refreshButton.addEventListener("click", () => {
    location.reload();
});

masterResetButton.addEventListener("click", () => {
    const firstConfirm = confirm(
        "Master Reset: this will clear Tom's points, gold stars, red stars, and formal compliance history. Continue?"
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
        "Final confirmation: should the chart return to zero?"
    );

    if (!secondConfirm) return;

    pointsRef.set({
        totalPoints: 0,
        goldStars: 0,
        redStars: 0
    }).then(() => {
        location.reload();
    }).catch((error) => {
        alert("The chart could not be reset. Please check Firebase permissions.");
        console.error("Master reset failed:", error);
    });
});

document.querySelectorAll(".trade-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
        const cost = parseInt(event.currentTarget.dataset.cost, 10);

        if (localPointsState.totalPoints >= cost) {
            const confirmed = confirm(
                `Do you want to cash in ${cost} points for this reward? Manager approval still applies.`
            );

            if (confirmed) {
                pointsRef.update({
                    totalPoints: localPointsState.totalPoints - cost
                }).catch((error) => {
                    alert("The points could not be traded. Please check Firebase permissions.");
                    console.error("Trade failed:", error);
                });
            }
        }
    });
});

function modifyPoints(type) {
    const change = POINT_MODIFIERS[type];

    const newState = {
        totalPoints: localPointsState.totalPoints + change,
        goldStars: localPointsState.goldStars + (type === "gold" ? 1 : 0),
        redStars: localPointsState.redStars + (type === "red" ? 1 : 0)
    };

    pointsRef.update(newState).catch((error) => {
        alert("The chart could not be updated. Please check Firebase permissions.");
        console.error("Point update failed:", error);
    });
}

function updateUI(state) {
    currentPointsDisplay.innerText = state.totalPoints;
    goldCountDisplay.innerText = state.goldStars;
    redCountDisplay.innerText = state.redStars;

    updateVisualStars(state);
    updateRewardTiers(state.totalPoints);
}

function updateVisualStars(state) {
    visualStarChart.innerHTML = "";

    if (state.goldStars === 0 && state.redStars === 0) {
        visualStarChart.innerHTML = '<p class="empty-bank">No stars yet. The chart awaits judgement.</p>';
        return;
    }

    for (let i = 0; i < state.goldStars; i++) {
        const star = document.createElement("i");
        star.className = "fas fa-star";
        star.style.color = "var(--gold)";
        star.setAttribute("aria-label", "Gold star");
        visualStarChart.appendChild(star);
    }

    for (let i = 0; i < state.redStars; i++) {
        const redStar = document.createElement("i");
        redStar.className = "fas fa-circle-exclamation";
        redStar.style.color = "var(--red-star)";
        redStar.setAttribute("aria-label", "Red star");
        visualStarChart.appendChild(redStar);
    }
}

function updateRewardTiers(totalPoints) {
    const tiers = [
        {
            required: 50,
            className: "tier-50"
        },
        {
            required: 100,
            className: "tier-100"
        },
        {
            required: 200,
            className: "tier-200"
        }
    ];

    tiers.forEach((tier) => {
        const rewardElement = document.querySelector(`.reward.${tier.className}`);

        if (!rewardElement) return;

        if (totalPoints >= tier.required) {
            rewardElement.classList.remove("locked");
            rewardElement.classList.add("unlocked");
        } else {
            rewardElement.classList.remove("unlocked");
            rewardElement.classList.add("locked");
        }
    });
}
```
