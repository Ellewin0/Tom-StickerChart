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
// --- STEP 13: CREATE AND DOWNLOAD REWARD TOKEN ---
function downloadRewardToken(rewardTitle, cost, remainingPoints) {
const canvas = document.createElement("canvas");
const width = 1200;
const height = 800;

canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");

const issuedAt = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

ctx.fillStyle = "#f3f7ee";
ctx.fillRect(0, 0, width, height);

drawRoundedRect(ctx, 55, 55, width - 110, height - 110, 36, "#fffaf0");
drawRoundedRect(ctx, 95, 95, width - 190, height - 190, 28, "#ffffff");

ctx.textAlign = "center";

ctx.fillStyle = "#607d5f";
ctx.font = "900 26px Arial";
ctx.fillText("BANTER COMPLIANCE DIVISION", width / 2, 150);

ctx.fillStyle = "#243238";
ctx.font = "900 60px Arial";
ctx.fillText("REWARD TOKEN", width / 2, 230);

ctx.fillStyle = "#344044";
ctx.font = "900 38px Arial";
ctx.fillText("Tom's Sticker Chart", width / 2, 295);

ctx.fillStyle = "#6c5ce7";
ctx.font = "900 48px Arial";
wrapCenteredText(ctx, rewardTitle, width / 2, 390, 850, 56);

drawRoundedRect(ctx, 285, 485, 630, 72, 999, "#eadff8");

ctx.fillStyle = "#6c5ce7";
ctx.font = "900 30px Arial";
ctx.fillText("Redeemed for " + cost + " points", width / 2, 532);

ctx.fillStyle = "#66767a";
ctx.font = "700 24px Arial";
ctx.fillText("Remaining points after trade: " + remainingPoints, width / 2, 600);
ctx.fillText("Issued: " + issuedAt, width / 2, 640);

drawRoundedRect(ctx, 310, 680, 580, 56, 999, "#d8f3e5");

ctx.fillStyle = "#3f7d5f";
ctx.font = "900 23px Arial";
ctx.fillText("Car privileges pending Manager approval", width / 2, 716);

drawMiniCar(ctx, 430, 735);
drawMiniFlag(ctx, 565, 727);
drawBanhMiLabel(ctx, 665, 728);

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

function drawMiniCar(ctx, x, y) {
ctx.fillStyle = "#6c5ce7";
drawRoundedRect(ctx, x, y, 82, 30, 8, "#6c5ce7");

ctx.fillStyle = "#3578a6";
drawRoundedRect(ctx, x + 18, y - 20, 42, 24, 6, "#3578a6");

ctx.fillStyle = "#ffffff";
drawRoundedRect(ctx, x + 25, y - 15, 13, 12, 3, "#ffffff");
drawRoundedRect(ctx, x + 42, y - 15, 13, 12, 3, "#ffffff");

ctx.fillStyle = "#243238";
ctx.beginPath();
ctx.arc(x + 18, y + 31, 9, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(x + 64, y + 31, 9, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(x + 18, y + 31, 4, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(x + 64, y + 31, 4, 0, Math.PI * 2);
ctx.fill();

}

function drawMiniFlag(ctx, x, y) {
ctx.fillStyle = "#344044";
ctx.fillRect(x, y, 5, 58);

const square = 12;
const startX = x + 8;
const startY = y;

for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#243238" : "#ffffff";
        ctx.fillRect(startX + col * square, startY + row * square, square, square);
    }
}

ctx.strokeStyle = "#243238";
ctx.lineWidth = 2;
ctx.strokeRect(startX, startY, square * 5, square * 4);

}

function drawBanhMiLabel(ctx, x, y) {
drawRoundedRect(ctx, x, y, 150, 50, 999, "#fff1c7");

ctx.fillStyle = "#7a5200";
ctx.font = "900 20px Arial";
ctx.textAlign = "center";
ctx.fillText("banh mi", x + 75, y + 32);

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
