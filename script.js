let selectedLang = 'fr';

const textElement = document.getElementById("content");

function getDeviceInfo() {
    const parser = new UAParser();
    const result = parser.getResult();

    let device = "Appareil inconnu";
    if (result.device.vendor && result.device.model) {
        device = `${result.device.vendor} ${result.device.model}`;
    } else if (result.device.model) {
        device = result.device.model;
    } else if (result.os.name) {
        if (result.os.name.toLowerCase().includes("android")) {
            device = "Appareil Android";
        } else if (result.os.name.toLowerCase().includes("ios")) {
            device = "iPhone";
        } else if (result.os.name.toLowerCase().includes("windows")) {
            device = "Appareil Windows";
        } else if (result.os.name.toLowerCase().includes("mac os")) {
            device = "Mac";
        } else {
            device = `${result.os.name}`;
        }
    }

    const os = result.os.name ? `${result.os.name} ${result.os.version || ""}`.trim() : "Système inconnu";
    const browser = result.browser.name || "Navigateur inconnu";

    return { device, browser, os };
}

function typeText(text, callback) {
    let index = 0;
    textElement.style.opacity = 1;
    textElement.textContent = "";
    const interval = setInterval(() => {
        textElement.textContent = text.slice(0, index);
        index++;
        if (index > text.length) {
            clearInterval(interval);
            callback();
        }
    }, 30);
}

function fadeOutText(callback) {
    textElement.style.transition = "opacity 0.5s ease";
    textElement.style.opacity = 0;
    setTimeout(() => {
        textElement.textContent = "";
        textElement.style.transition = "";
        textElement.style.opacity = 1;
        callback();
    }, 500);
}

async function showAnimation() {
    const { device, browser, os } = getDeviceInfo();

    const selfieText = selectedLang === 'fr'
        ? "Et voilà à quoi tu ressembles."
        : "En zo zie je eruit.";

    const introLines = selectedLang === 'fr'
        ? [
            "Tu penses être protégé ? Voilà ce qu’on a trouvé :",
            `Appareil : ${device}`,
            `Système : ${os}`,
            `Navigateur : ${browser}`,
            selfieText
        ]
        : [
            "Denk je dat je beschermd bent? Dit hebben we gevonden:",
            `Apparaat: ${device}`,
            `Systeem: ${os}`,
            `Browser: ${browser}`,
            selfieText
        ];

    const afterSelfieLines = selectedLang === 'fr'
        ? [
            "Un hacker mettrait 30 secondes à faire pire.",
            "C’est pour ça qu’on a créé le Digital Service Pack."
        ]
        : [
            "Een hacker zou erger doen in 30 seconden.",
            "Daarom hebben we de Digital Service Pack ontwikkeld."
        ];

    function showIntro(index) {
        if (index >= introLines.length) {
            takeSelfie().then(() => {
                setTimeout(() => {
                    showAfterSelfie(0);
                }, 1500);
            });
            return;
        }

        typeText(introLines[index], () => {
            setTimeout(() => {
                showIntro(index + 1);
            }, 1000);
        });
    }

    function showAfterSelfie(index) {
        if (index >= afterSelfieLines.length) {
            setTimeout(() => {
                fadeOutText(() => {
                    showCard();
                });
            }, 1000);
            return;
        }

        typeText(afterSelfieLines[index], () => {
            setTimeout(() => {
                showAfterSelfie(index + 1);
            }, 1000);
        });
    }

    showIntro(0);
}

function showCard() {
    const textDiv = document.getElementById("text");
    const cardDiv = document.getElementById("rewardCard");

    textDiv.style.display = "none";
    cardDiv.style.display = "flex";

    setTimeout(() => {
        cardDiv.classList.add("show");
    }, 100);

    const cardText = document.getElementById("card-text");
    cardText.textContent = selectedLang === 'fr'
        ? "Clique ici et présente cette carte à un vendeur"
        : "Klik hier en toon deze kaart aan een verkoper";

    const cardInner = document.getElementById("cardInner");
    cardInner.addEventListener("click", () => {
        cardInner.classList.toggle("flipped");

        document.querySelector('.logo-no-glitch').style.display = 'block';
        document.querySelector('.logo-glitch').style.display = 'none';
    });
}

function setupLanguageButtons() {
    document.getElementById("btn-fr").addEventListener("click", () => {
        selectedLang = 'fr';
        startAnimation();
    });

    document.getElementById("btn-nl").addEventListener("click", () => {
        selectedLang = 'nl';
        startAnimation();
    });
}

function generateMatrixEffect() {
    const matrixContainer = document.getElementById("matrix-container");
    matrixContainer.innerHTML = "";

    const characters = "01";
    const totalChars = 150;

    for (let i = 0; i < totalChars; i++) {
        const span = document.createElement("span");
        span.classList.add("matrix-number");
        span.textContent = characters[Math.floor(Math.random() * characters.length)];
        span.style.left = `${Math.random() * 100}%`;
        span.style.top = `${Math.random() * 100}%`;
        span.style.animationDelay = `${Math.random() * 2}s`;
        span.style.animationDuration = `${Math.random() * 3 + 1}s`;
        matrixContainer.appendChild(span);
    }
}

function startAnimation() {
    document.getElementById("language-selection").style.display = "none";
    document.getElementById("text").style.display = "block";
    document.getElementById("rewardCard").style.display = "none";
    document.getElementById("rewardCard").classList.remove("show");
    document.getElementById("cardInner").classList.remove("flipped");
    document.getElementById("selfieContainer").innerHTML = "";
    textElement.innerHTML = "";

    generateMatrixEffect();
    showAnimation();
}

// 📸 Selfie
async function takeSelfie() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        await new Promise(resolve => video.onloadedmetadata = resolve);

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        stream.getTracks().forEach(track => track.stop());

        const imgData = canvas.toDataURL("image/png");
        document.getElementById("selfieContainer").innerHTML = `<img src="${imgData}" alt="Selfie" style="max-width: 100%; border-radius: 10px; margin-top: 20px;">`;

    } catch (err) {
        console.warn("Accès caméra refusé ou erreur :", err);
    }
}

// Initialisation
setupLanguageButtons();