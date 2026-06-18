// app.js - Banter Compliance Division
// Tom's Sticker Chart

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

// --- STEP 2: INITIALISE FIREBASE ---
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const pointsRef = database.ref("tomPoints");

// --- STEP 3: POINT SETTINGS ---
const POINT_MODIFIERS = {
gold: 10,
red: -10
};

// --- STEP 4: HTML ELEMENTS ---
const currentPointsDisplay = document.getElementById("currentPoints");
const goldCountDisplay = document.getElementById("goldCount");
const redCountDisplay = document.getElementById("redCount");
const visualStarChart = document.getElementById("visualStarChart");

const addGoldButton = document.getElementById("addGold");
const addRedButton = document.getElementById("addRed");
const masterResetButton = document.getElementById("masterResetBtn");
const adminResetPanel = document.getElementById("adminResetPanel");
const adminRevealTrigger = document.getElementById("adminRevealTrigger");

// --- STEP 5: LOCAL STATE ---
let localPointsState = {
totalPoints: 0,
goldStars: 0,
redStars: 0
};

let adminClickCount = 0;

// --- STEP 6: LOAD AND SYNC POINTS FROM FIREBASE ---
pointsRef.on("value", function (snapshot) {
const data = snapshot.val();

if (data) {
    localPointsState = {
        totalPoints: Number(data.totalPoints) || 0,
        goldStars: Number(data.goldStars) || 0,
        redStars: Number(data.redStars) || 0
    };
} else {
    pointsRef.set(localPointsState);
}

updateUI(localPointsState);

}, function (error) {
console.error("Firebase read failed:", error);
alert("The chart could not load from Firebase. Check your database rules.");
});

// --- STEP 7: BUTTON ACTIONS ---
addGoldButton.addEventListener("click", function () {
modifyPoints("gold");
});

addRedButton.addEventListener("click", function () {
modifyPoints("red");
});

adminRevealTrigger.addEventListener("click", function () {
adminClickCount = adminClickCount + 1;

if (adminClickCount >= 5) {
    adminResetPanel.classList.add("visible");
}

});

masterResetButton.addEventListener("click", function () {
const firstConfirm = confirm("Clear All Points: this will reset Tom's points, gold stars, and red stars to zero. Continue?");

if (!firstConfirm) {
    return;
}

const secondConfirm = confirm("Final confirmation: should the chart return to zero?");

if (!secondConfirm) {
    return;
}

pointsRef.set({
    totalPoints: 0,
    goldStars: 0,
    redStars: 0
}).then(function () {
    adminResetPanel.classList.remove("visible");
    adminClickCount = 0;
}).catch(function (error) {
    alert("The chart could not be reset. Please check Firebase permissions.");
    console.error("Clear all points failed:", error);
});

});

// --- STEP 8: TRADE REWARD BUTTONS ---
document.querySelectorAll(".trade-btn").forEach(function (btn) {
btn.addEventListener("click", function (event) {
const cost = parseInt(event.currentTarget.dataset.cost, 10);

    if (localPointsState.totalPoints >= cost) {
        const confirmed = confirm("Do you want to cash in " + cost + " points for this reward? Manager approval still applies.");

        if (confirmed) {
            pointsRef.update({
                totalPoints: localPointsState.totalPoints - cost
            }).catch(function (error) {
                alert("The points could not be traded. Please check Firebase permissions.");
                console.error("Trade failed:", error);
            });
        }
    }
});

});

// --- STEP 9: MODIFY POINTS ---
function modifyPoints(type) {
const change = POINT_MODIFIERS[type];

const newState = {
    totalPoints: localPointsState.totalPoints + change,
    goldStars: localPointsState.goldStars + (type === "gold" ? 1 : 0),
    redStars: localPointsState.redStars + (type === "red" ? 1 : 0)
};

pointsRef.update(newState).catch(function (error) {
    alert("The chart could not be updated. Please check Firebase permissions.");
    console.error("Point update failed:", error);
});

}

// --- STEP 10: UPDATE SCREEN ---
function updateUI(state) {
currentPointsDisplay.innerText = state.totalPoints;
goldCountDisplay.innerText = state.goldStars;
redCountDisplay.innerText = state.redStars;

updateVisualStars(state);
updateRewardTiers(state.totalPoints);

}

// --- STEP 11: DRAW VISUAL STARS ---
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
    redStar.className = "fas fa-star";
    redStar.style.color = "var(--red-star)";
    redStar.setAttribute("aria-label", "Red star");
    visualStarChart.appendChild(redStar);
}

}

// --- STEP 12: UPDATE REWARD TIERS ---
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

tiers.forEach(function (tier) {
    const rewardElement = document.querySelector(".reward." + tier.className);

    if (!rewardElement) {
        return;
    }

    if (totalPoints >= tier.required) {
        rewardElement.classList.remove("locked");
        rewardElement.classList.add("unlocked");
    } else {
        rewardElement.classList.remove("unlocked");
        rewardElement.classList.add("locked");
    }
});

}
