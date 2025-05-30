let selectedLang = 'fr';
const textElement = document.getElementById("content");

async function getDeviceInfo() {
    let device = "Appareil inconnu";
    let os = "Système inconnu";
    let browser = "Navigateur inconnu";
    let ipAddress = "N/A"; // Valeurs non encore utilisées
    let batteryStatus = "N/A"; // Valeurs non encore utilisées

    const parser = new UAParser();
    const result = parser.getResult();

    // Gestion de la marque ou du nom générique de l'appareil
    if (result.device.vendor) {
        const lowerVendor = result.device.vendor.toLowerCase();
        if (lowerVendor.includes("apple")) {
            device = "iPhone";
        } else if (lowerVendor.includes("samsung")) {
            device = "Samsung";
        } else if (lowerVendor.includes("google")) {
            device = "Google Pixel";
        } else if (lowerVendor.includes("huawei")) {
            device = "Huawei";
        } else if (lowerVendor.includes("xiaomi") || lowerVendor.includes("redmi")) {
            device = "Xiaomi";
        } else if (lowerVendor.includes("oneplus")) {
            device = "OnePlus";
        } else if (lowerVendor.includes("oppo")) {
            device = "Oppo";
        } else if (lowerVendor.includes("vivo")) {
            device = "Vivo";
        } else if (lowerVendor.includes("lg")) {
            device = "LG";
        } else if (lowerVendor.includes("motorola")) {
            device = "Motorola";
        } else if (lowerVendor.includes("sony")) {
            device = "Sony Xperia";
        } else if (lowerVendor.includes("htc")) {
            device = "HTC";
        } else if (lowerVendor.includes("nokia")) {
            device = "Nokia";
        }
        else {
            device = result.device.vendor;
        }
    } else if (result.os.name) {
        const osName = result.os.name.toLowerCase();
        if (osName.includes("android")) {
            device = "Appareil Android";
        } else if (osName.includes("ios")) {
            device = "iPhone";
        } else if (osName.includes("windows")) {
            device = "Appareil Windows";
        } else if (osName.includes("mac os")) {
            device = "Mac";
        } else {
            device = result.os.name;
        }
    }

    // Détection du système d'exploitation
    os = result.os.name ? `${result.os.name} ${result.os.version || ""}`.trim() : "Système inconnu";

    // Détection du navigateur
    browser = result.browser.name || "Navigateur inconnu";

    // Retourne les informations détectées (sans networkType)
    console.log("Infos appareil via UAParser.js (marque/générique) :", { device, browser, os, ipAddress, batteryStatus });
    return { device, browser, os, ipAddress, batteryStatus };
}

function typeText(textToType, callback, clearBefore = true) {
    let index = 0;
    let initialContent = "";
    if (!clearBefore) {
        initialContent = textElement.innerHTML;
    } else {
        textElement.innerHTML = "";
    }

    textElement.style.opacity = 1;

    const cursor = document.querySelector('.cursor');
    if (cursor) cursor.style.display = 'inline-block';

    const interval = setInterval(() => {
        textElement.innerHTML = initialContent + textToType.slice(0, index++);
        if (index > textToType.length) {
            clearInterval(interval);
            callback();
        }
    }, 30);
}

function fadeOutText(callback) {
    textElement.style.transition = "opacity 0.6s ease-out";
    textElement.style.opacity = 0;
    setTimeout(() => {
        const cursor = document.querySelector('.cursor');
        if (cursor) cursor.style.display = 'none';
        textElement.innerHTML = "";
        textElement.style.transition = "";
        textElement.style.opacity = 1;
        callback();
    }, 600);
}

function fadeOutElement(elementId, callback) {
    const element = document.getElementById(elementId);
    if (!element) {
        callback();
        return;
    }
    element.style.transition = "opacity 0.6s ease-out";
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.display = "none";
        element.style.transition = "";
        element.style.opacity = 1;
        callback();
    }, 600);
}

async function showLinesSequentially(lines) {
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => {
            typeText(lines[i], async () => {
                await new Promise(readDelay => setTimeout(readDelay, 1500));
                if (i < lines.length - 1) {
                    fadeOutText(resolve);
                } else {
                    resolve();
                }
            });
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

async function typeMultiLines(lines) {
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => {
            typeText(lines[i], resolve, i === 0);
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            textElement.innerHTML += '<br>';
        }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
}

async function showAnimation() {
    // Les variables ipAddress et batteryStatus sont toujours retournées mais non affichées pour l'instant.
    const { device, browser, os, ipAddress, batteryStatus } = await getDeviceInfo();

    const initialPhrases = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", "Voilà ce qu’on a trouvé :"]
        : ["Denk je dat je beschermd bent?", "Dit hebben we gevonden:"];

    const deviceInfoPhrases = selectedLang === 'fr'
        ? [`Appareil : ${device}`, `Système : ${os}`, `Mapsur : ${browser}`]
        : [`Apparaat: ${device}`, `Systeem: ${os}`, `Browser: ${browser}`];

    const introAfterPhrases = selectedLang === 'fr'
        ? ["Un hacker mettrait 30 secondes à faire pire.", "C’est pour ça qu’on a créé le Digital Service Pack."]
        : ["Een hacker zou erger doen in 30 seconden.", "Daarom hebben we de Digital Service Pack ontwikkeld."];

    await showLinesSequentially(initialPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500));

    await typeMultiLines(deviceInfoPhrases);
    await new Promise(resolve => fadeOutText(resolve));

    const selfieDisplayed = await takeSelfie();

    if (selfieDisplayed) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await new Promise(resolve => fadeOutElement("selfieContainer", resolve));
    } else {
        document.getElementById("selfieContainer").style.display = "none";
    }

    document.getElementById("text").style.display = "block";
    textElement.innerHTML = "";

    await showLinesSequentially(introAfterPhrases);
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

    const selfieContainer = document.getElementById("selfieContainer");
    selfieContainer.style.display = "none";
    selfieContainer.style.opacity = 1;

    generateMatrixEffect();
    await showAnimation();
}

async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    try {
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
        `;
        container.style.display = "flex";
        container.style.opacity = 1;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        await video.play();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop());

        const imgData = canvas.toDataURL("image/png");

        const message = selectedLang === 'fr' ? "Et voilà à quoi tu ressembles :" : "Zo zie je eruit:";
        container.innerHTML = `
            <p class="selfie-message">${message}</p>
            <img src="${imgData}" alt="Selfie" class="selfie-image">
        `;

        const selfieImage = container.querySelector('.selfie-image');
        if (selfieImage) {
            void selfieImage.offsetWidth;
        }

        selfieTaken = true;

    } catch (err) {
        console.warn("Accès caméra refusé ou erreur :", err);
        container.innerHTML = "";
        container.style.display = "none";
    }
    return selfieTaken;
}

setupLanguageButtons();