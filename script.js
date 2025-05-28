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

        // Centrage plein écran garanti SANS fond opaque
        container.style.cssText = `
            position: fixed; /* Positionne le conteneur par rapport à la fenêtre */
            top: 0;
            left: 0;
            width: 100vw; /* Prend toute la largeur de la fenêtre */
            height: 100vh; /* Prend toute la hauteur de la fenêtre */
            /* background-color: rgba(0, 0, 0, 0.85); <-- C'est cette ligne qui est supprimée ! */
            display: flex; /* Utilise Flexbox pour centrer le contenu */
            flex-direction: column; /* Organise les éléments en colonne */
            align-items: center; /* Centre horizontalement les éléments enfants (texte et image) */
            justify-content: center; /* Centre verticalement les éléments enfants */
            color: white; /* Couleur du texte */
            z-index: 9999; /* Assure que le conteneur est au-dessus de tout */
            text-align: center; /* Centre le texte à l'intérieur du paragraphe */
        `;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // Fix pour iOS
        await video.play();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Laisse le temps à la caméra de s'activer

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop()); // Arrête le flux de la caméra

        const imgData = canvas.toDataURL("image/png"); // Récupère l'image en base64

        const message = selectedLang === 'fr' ? "Et voilà à quoi tu ressembles :" : "Zo zie je eruit:";
        container.innerHTML = `
            <p class="fade-text" style="font-size: 1.5em; margin-bottom: 20px;">${message}</p>
            <img src="${imgData}" alt="Selfie" class="fade-img" style="
                max-width: 250px;
                width: 80%; /* Rend l'image responsive dans sa max-width */
                height: auto; /* Maintient le ratio d'aspect */
                border-radius: 16px; /* Coins arrondis (comme précédemment) */
                /* Les styles de cadre moderne que nous avions ajoutés */
                border: 2px solid rgba(0, 200, 255, 0.6); /* Bordure fine et lumineuse */
                box-shadow: 0 0 15px rgba(0, 200, 255, 0.7), /* Lueur interne */
                            0 0 30px rgba(0, 200, 255, 0.4), /* Lueur moyenne */
                            0 0 60px rgba(0, 200, 255, 0.1); /* Lueur externe douce */
                background-color: #1a1a1a; /* Fond sombre derrière l'image */
                padding: 3px; /* Petite marge entre la bordure et l'image */
                display: block; /* S'assure que l'image est un bloc pour le centrage auto si besoin */
                margin: 0 auto; /* Centre l'image si elle est plus petite que son conteneur */
            ">
        `;

        // L'animation de fade-in est gérée par la classe fade-img et le CSS
        // requestAnimationFrame(() => {
        //     container.querySelector(".fade-img").style.opacity = "1";
        // });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Durée d'affichage du selfie
    } catch (err) {
        console.warn("Accès caméra refusé ou erreur :", err);
    }
}

// Lancer les boutons au chargement
setupLanguageButtons();