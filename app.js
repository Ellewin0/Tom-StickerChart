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
const rewardCard = event.currentTarget.closest(".reward");
const rewardTitleElement = rewardCard ? rewardCard.querySelector("h3") : null;
const rewardTitle = rewardTitleElement ? rewardTitleElement.innerText : "Sticker Reward";

    if (localPointsState.totalPoints < cost) {
        alert("Tom does not have enough points for this reward yet.");
        return;
    }

    const confirmed = confirm("Trade " + cost + " points for: " + rewardTitle + "? A reward token will download after approval.");

    if (!confirmed) {
        return;
    }

    const remainingPoints = localPointsState.totalPoints - cost;

    pointsRef.update({
        totalPoints: remainingPoints
    }).then(function () {
        downloadRewardToken(rewardTitle, cost, remainingPoints);
    }).catch(function (error) {
        alert("The points could not be traded. Please check Firebase permissions.");
        console.error("Trade failed:", error);
    });
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

// --- STEP 13: CREATE AND DOWNLOAD REWARD TOKEN ---
function downloadRewardToken(rewardTitle, cost, remainingPoints) {
const canvas = document.createElement("canvas");
const width = 1200;
const height = 800;
const scale = window.devicePixelRatio || 1;

canvas.width = width * scale;
canvas.height = height * scale;

const ctx = canvas.getContext("2d");
ctx.scale(scale, scale);

const issuedAt = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

ctx.fillStyle = "#f3f7ee";
ctx.fillRect(0, 0, width, height);

drawRoundedRect(ctx, 55, 55, width - 110, height - 110, 34, "#fffaf0");
drawRoundedRect(ctx, 95, 95, width - 190, height - 190, 28, "#ffffff");

ctx.textAlign = "center";
ctx.fillStyle = "#607d5f";
ctx.font = "900 26px Arial";
ctx.fillText("BANTER COMPLIANCE DIVISION", width / 2, 150);

ctx.fillStyle = "#243238";
ctx.font = "900 64px Arial";
ctx.fillText("REWARD TOKEN", width / 2, 235);

ctx.font = "900 44px Arial";
ctx.fillText("Tom's Sticker Chart", width / 2, 305);

ctx.fillStyle = "#6c5ce7";
ctx.font = "900 50px Arial";
wrapCenteredText(ctx, rewardTitle, width / 2, 395, 900, 56);

ctx.fillStyle = "#344044";
ctx.font = "700 30px Arial";
ctx.fillText("Redeemed for " + cost + " points", width / 2, 520);

ctx.fillStyle = "#66767a";
ctx.font = "700 24px Arial";
ctx.fillText("Remaining points after trade: " + remainingPoints, width / 2, 570);
ctx.fillText("Issued: " + issuedAt, width / 2, 615);

drawRoundedRect(ctx, 330, 660, 540, 55, 999, "#d8f3e5");

ctx.fillStyle = "#3f7d5f";
ctx.font = "900 24px Arial";
ctx.fillText("Car privileges pending Manager approval", width / 2, 696);

ctx.font = "42px Arial";
ctx.fillText("🚗 🏁 🥖", width / 2, 760);

const fileName = "toms-sticker-chart-" + makeSafeFileName(rewardTitle) + "-token.png";
const link = document.createElement("a");

link.download = fileName;
link.href = canvas.toDataURL("image/png");
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

}

function drawRoundedRect(ctx, x, y, width, height, radius, color) {
ctx.beginPath();
ctx.moveTo(x + radius, y);
ctx.lineTo(x + width - radius, y);
ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
ctx.lineTo(x + width, y + height - radius);
ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
ctx.lineTo(x + radius, y + height);
ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
ctx.lineTo(x, y + radius);
ctx.quadraticCurveTo(x, y, x + radius, y);
ctx.closePath();
ctx.fillStyle = color;
ctx.fill();
}

function wrapCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
const words = text.split(" ");
let line = "";
let currentY = y;

for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[i] + " ";
        currentY = currentY + lineHeight;
    } else {
        line = testLine;
    }
}

ctx.fillText(line.trim(), x, currentY);

}

function makeSafeFileName(text) {
return text
.toLowerCase()
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");
}
