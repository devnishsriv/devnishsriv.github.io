// script.js
const bgMusic = document.getElementById("bgMusic");
const toggleBtn = document.getElementById("toggleBtn");
const instruction = document.getElementById("instruction");
let isPlaying = false;

// Enable button immediately for local audio
toggleBtn.disabled = false;
toggleBtn.textContent = "Unmute";

function updateButton() {
    toggleBtn.textContent = isPlaying ? "Mute" : "Unmute";
}

function updateCatVisibility() {
    const gifs = document.querySelectorAll(".dance-gif");
    gifs.forEach((gif) => {
        if (isPlaying) {
            gif.style.opacity = "1";
            gif.style.visibility = "visible";
        } else {
            gif.style.opacity = "0";
            gif.style.visibility = "hidden";
        }
    });
}

function playMusic() {
    if (bgMusic) {
        bgMusic
            .play()
            .then(() => {
                isPlaying = true;
                updateButton();
                updateCatVisibility();
            })
            .catch((err) => {
                console.log("Audio playback failed:", err);
            });
    }
}

function pauseMusic() {
    if (bgMusic) {
        bgMusic.pause();
        isPlaying = false;
        updateButton();
        updateCatVisibility();
    }
}

toggleBtn.addEventListener("click", () => {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
});

instruction.addEventListener("click", () => {
    if (!isPlaying) {
        playMusic();
    }
});

// Assets list with local paths
const assets = [
    "elgatitolover-elgatitoloves.webp", // Swapped to 1st position (above button)
    "cat-happy.webp",
    "cat-dancing-on-table-bums3it2isnglult.gif",
    "dj-cat-dancing-cool-music-hip-hop-jersey-p6e8k1frl2rpaz1w.gif",
    "voices-cat.webp", // Swapped to 5th position (below right)
];

function placeCatsCustom() {
    const container = document.getElementById("container");
    const btn = document.querySelector(".control-box");
    if (!btn) return;
    const btnRect = btn.getBoundingClientRect();

    // Find center of screen
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    const isMobile = viewWidth <= 600;

    // Set scaled up responsive sizes
    const catSize = isMobile ? Math.min(viewWidth * 0.32, 120) : 180;

    // Custom layout offsets from center [xOffset, yOffset]
    let offsets = [];
    if (isMobile) {
        // Tighter spacing for mobile, left/right cats placed above the top cat
        offsets = [
            [0, -(btnRect.height / 2 + catSize / 2 + 10)], // 1. Above (Middle)
            [-(btnRect.width / 2), btnRect.height / 2 + catSize / 2 + 10], // 2. Below Left
            [
                -(btnRect.width / 2 + 5),
                -(btnRect.height / 2 + catSize * 1.5 + 20),
            ], // 3. Left (shifted above the top cat)
            [btnRect.width / 2 + 5, -(btnRect.height / 2 + catSize * 1.5 + 20)], // 4. Right (shifted above the top cat)
            [btnRect.width / 2, btnRect.height / 2 + catSize / 2 + 10], // 5. Below Right
        ];
    } else {
        // Generous spacing for desktop
        offsets = [
            [0, -(btnRect.height / 2 + catSize / 2 + 30)], // 1. Above
            [-(btnRect.width / 2 + 20), btnRect.height / 2 + catSize / 2 + 35], // 2. Below Left
            [-(btnRect.width / 2 + catSize / 2 + 40), -40], // 3. Left (shifted up)
            [btnRect.width / 2 + catSize / 2 + 40, -40], // 4. Right (shifted up)
            [btnRect.width / 2 + 20, btnRect.height / 2 + catSize / 2 + 35], // 5. Below Right
        ];
    }

    // Clear any existing gifs if repositioned on resize
    const existingGifs = document.querySelectorAll(".dance-gif");
    existingGifs.forEach((gif) => gif.remove());

    assets.forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "dance-gif";

        // Scale up the bottom two cats (index 1: Below Left, index 4: Below Right) slightly more
        let currentCatSize = catSize;
        if (index === 1 || index === 4) {
            currentCatSize = catSize * 1.3;
        }

        img.style.width = `${currentCatSize}px`;
        img.style.height = `${currentCatSize}px`;
        img.style.objectFit = "contain";

        // Calculate position
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        let targetLeft = btnCenterX + offsets[index][0] - currentCatSize / 2;
        let targetTop = btnCenterY + offsets[index][1] - currentCatSize / 2;

        // Safety checks to prevent going outside screen edges
        targetLeft = Math.max(
            8,
            Math.min(targetLeft, viewWidth - currentCatSize - 8),
        );
        targetTop = Math.max(
            8,
            Math.min(targetTop, viewHeight - currentCatSize - 8),
        );

        img.style.left = `${targetLeft}px`;
        img.style.top = `${targetTop}px`;

        container.appendChild(img);
    });
}

// Position layout on load and on resize for dynamic responsiveness
window.addEventListener("load", () => {
    placeCatsCustom();
    updateCatVisibility();
});
window.addEventListener("resize", () => {
    placeCatsCustom();
    updateCatVisibility();
});
// Double check position placement after DOM loads to avoid incorrect bounding box
setTimeout(() => {
    placeCatsCustom();
    updateCatVisibility();
}, 500);
