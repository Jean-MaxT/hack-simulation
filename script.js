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
        const osName = result.os.name.toLowerCase();
        if (osName.includes("android")) device = "Appareil Android";
        else if (osName.includes("ios")) device = "iPhone";
        else if (osName.includes("windows")) device = "Appareil Windows";
        else if (osName.includes("mac os")) device = "Mac";
        else device = result.os.name;
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
        textElement.textContent = text.slice(0, index++);
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
        textElement.style.transition = ""; // Réinitialise la transition pour éviter les interférences
        textElement.style.opacity = 1; // Remet l'opacité à 1 pour la prochaine saisie
        callback();
    }, 500);
}

async function showAnimation() {
    const { device, browser, os } = getDeviceInfo();

    const introBefore = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", `Voilà ce qu’on a trouvé :`, `Appareil : ${device}`, `Système : ${os}`, `Mapsur : ${browser}`]
        : ["Denk je dat je beschermd bent?", `Dit hebben we gevonden:`, `Apparaat: ${device}`, `Systeem: ${os}`, `Browser: ${result.browser.name}`];

    const introAfter = selectedLang === 'fr'
        ? ["Un hacker mettrait 30 secondes à faire pire.", "C’est pour ça qu’on a créé le Digital Service Pack."]
        : ["Een hacker zou erger doen in 30 seconden.", "Daarom hebben we de Digital Service Pack ontwikkeld."];

    async function showLinesSequentially(lines) {
        for (let i = 0; i < lines.length; i++) {
            await new Promise(resolve => {
                typeText(lines[i], async () => { // Ajout de 'async' ici
                    // Délai pour lire la phrase avant qu'elle ne commence à disparaître
                    await new Promise(readDelay => setTimeout(readDelay, 900)); // Temps de lecture : 1.5 secondes (ajuste si besoin)

                    if (i < lines.length - 1) {
                        fadeOutText(resolve);
                    } else {
                        resolve();
                    }
                });
            });
            // Petit délai après le fondu pour un écran "vide" avant la prochaine saisie
            if (i < lines.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    // Affiche la première séquence de lignes
    await showLinesSequentially(introBefore);

    // Fade out le dernier texte de introBefore avant de prendre le selfie
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai après le fondu

    await takeSelfie();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Délai après le selfie
    document.getElementById("selfieContainer").style.display = "none";
    document.getElementById("text").style.display = "block";
    textElement.textContent = "";

    // Affiche la deuxième séquence de lignes
    await showLinesSequentially(introAfter);

    // Fade out le dernier texte de introAfter avant de montrer la carte
    await new Promise(resolve => setTimeout(() => fadeOutText(showCard), 1000));
}

function showCard() {
    const textDiv = document.getElementById("text");
    const cardDiv = document.getElementById("rewardCard");

    textDiv.style.display = "none";
    cardDiv.style.display = "flex";

    setTimeout(() => cardDiv.classList.add("show"), 100);

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
    document.getElementById("btn-fr").addEventListener("click", async () => {
        selectedLang = 'fr';
        await startAnimationWithSelfie();
    });

    document.getElementById("btn-nl").addEventListener("click", async () => {
        selectedLang = 'nl';
        await startAnimationWithSelfie();
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

async function startAnimationWithSelfie() {
    document.getElementById("language-selection").style.display = "none";
    document.getElementById("text").style.display = "block";
    document.getElementById("rewardCard").style.display = "none";
    document.getElementById("rewardCard").classList.remove("show");
    document.getElementById("cardInner").classList.remove("flipped");
    textElement.innerHTML = "";

    document.getElementById("selfieContainer").innerHTML = "";
    document.getElementById("selfieContainer").style.display = "none";

    generateMatrixEffect();
    showAnimation();
}

async function takeSelfie() {
    try {
        const container = document.getElementById("selfieContainer");
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            min-height: 250px;
            text-align: center;
        `;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        await video.play();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        stream.getTracks().forEach(track => track.stop());

        const imgData = canvas.toDataURL("image/png");
        const message = selectedLang === 'fr' ? "Et voilà à quoi tu ressembles :" : "Zo zie je eruit:";

        container.innerHTML = `
            <p class="fade-text" style="font-size: 1.5em; margin-bottom: 20px;">${message}</p>
            <img src="${imgData}" alt="Selfie" class="fade-img">
        `;

        requestAnimationFrame(() => {
            container.querySelector(".fade-img").style.opacity = "1";
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
        console.warn("Erreur accès caméra :", err);
    }
}

// Lancer les boutons au chargement
setupLanguageButtons();