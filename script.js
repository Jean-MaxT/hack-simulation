let selectedLang = 'fr'; // Langue par défaut
const textElement = document.getElementById("content"); // L'élément où le texte est tapé

/**
 * Récupère les informations sur l'appareil, l'OS et le navigateur.
 * Priorise les User-Agent Client Hints pour une meilleure précision, avec fallback sur UAParser.js.
 * @returns {Promise<{device: string, browser: string, os: string}>} Les informations de l'appareil.
 */
async function getDeviceInfo() {
    let device = "Appareil inconnu";
    let os = "Système inconnu";
    let browser = "Navigateur inconnu";

    // 1. Tenter d'utiliser les User-Agent Client Hints (API moderne et plus précise)
    if (navigator.userAgentData) {
        try {
            // Demander des valeurs "high-entropy" (plus détaillées) : version de l'OS et modèle de l'appareil
            const highEntropyValues = await navigator.userAgentData.getHighEntropyValues(['platformVersion', 'model']);

            if (highEntropyValues.platform) {
                os = `${highEntropyValues.platform} ${highEntropyValues.platformVersion || ""}`.trim();
            }
            if (highEntropyValues.model) {
                device = highEntropyValues.model; // Peut être un nom de code interne (ex: "K")
            }

            // Récupérer le nom du navigateur via Client Hints
            if (navigator.userAgentData.brands && navigator.userAgentData.brands.length > 0) {
                // Cherche le navigateur principal (pas "Chromium" si un autre est listé, sinon le premier)
                const mainBrand = navigator.userAgentData.brands.find(brand => !brand.brand.includes('Chromium')) || navigator.userAgentData.brands[0];
                browser = `${mainBrand.brand} ${mainBrand.version || ""}`.trim();
            } else if (navigator.userAgentData.ua) { // Fallback au UA string si 'brands' n'est pas dispo
                const parser = new UAParser();
                const result = parser.getResult();
                browser = result.browser.name || "Navigateur inconnu";
            }

            // Si au moins l'appareil ou l'OS a été détecté via Client Hints, on considère ça comme la source principale
            if (device !== "Appareil inconnu" || os !== "Système inconnu") {
                console.log("Infos appareil via Client Hints :", { device, os, browser });
                return { device, browser, os };
            }

        } catch (error) {
            console.warn("Erreur lors de la récupération des User-Agent Client Hints (tentative de fallback) :", error);
            // Continuer pour utiliser UAParser.js en cas d'erreur
        }
    }

    // 2. Fallback vers UAParser.js pour les navigateurs plus anciens ou si Client Hints a échoué
    const parser = new UAParser();
    const result = parser.getResult();

    // Détection de l'appareil
    if (result.device.vendor && result.device.model) {
        device = `${result.device.vendor} ${result.device.model}`;
    } else if (result.device.model) {
        device = result.device.model;
    } else if (result.os.name) {
        // Fallback si pas de modèle de périphérique spécifique, mais un OS (ex: "Appareil Android")
        const osName = result.os.name.toLowerCase();
        if (osName.includes("android")) device = "Appareil Android";
        else if (osName.includes("ios")) device = "iPhone";
        else if (osName.includes("windows")) device = "Appareil Windows";
        else if (osName.includes("mac os")) device = "Mac";
        else device = result.os.name;
    }

    // Détection du système d'exploitation
    os = result.os.name ? `${result.os.name} ${result.os.version || ""}`.trim() : "Système inconnu";

    // Détection du navigateur
    browser = result.browser.name || "Navigateur inconnu";

    console.log("Infos appareil via UAParser.js (fallback) :", { device, browser, os });
    return { device, browser, os };
}

/**
 * Simule la frappe de texte dans un élément HTML.
 * @param {string} textToType - Le texte à taper.
 * @param {function} callback - Fonction à appeler une fois le texte tapé.
 * @param {boolean} [clearBefore=true] - Si true, efface le contenu avant de taper.
 */
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
    if (cursor) cursor.style.display = 'inline-block'; // Affiche le curseur pendant la frappe

    const interval = setInterval(() => {
        textElement.innerHTML = initialContent + textToType.slice(0, index++);
        if (index > textToType.length) {
            clearInterval(interval);
            callback();
        }
    }, 30); // Vitesse de frappe
}

/**
 * Fait disparaître en fondu l'élément texte principal.
 * @param {function} callback - Fonction à appeler une fois le fondu terminé.
 */
function fadeOutText(callback) {
    textElement.style.transition = "opacity 0.6s ease-out";
    textElement.style.opacity = 0;
    setTimeout(() => {
        const cursor = document.querySelector('.cursor');
        if (cursor) cursor.style.display = 'none'; // Cache le curseur après le fondu
        textElement.innerHTML = ""; // Vide le contenu
        textElement.style.transition = ""; // Réinitialise la transition
        textElement.style.opacity = 1; // Remet l'opacité à 1 pour la prochaine frappe
        callback();
    }, 600); // Durée du fondu
}

/**
 * Fait disparaître en fondu un élément par son ID.
 * @param {string} elementId - L'ID de l'élément à faire disparaître.
 * @param {function} callback - Fonction à appeler une fois le fondu terminé.
 */
function fadeOutElement(elementId, callback) {
    const element = document.getElementById(elementId);
    if (!element) {
        callback(); // Si l'élément n'existe pas, passe à la suite
        return;
    }
    element.style.transition = "opacity 0.6s ease-out";
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.display = "none"; // Cache l'élément après le fondu
        element.style.transition = ""; // Réinitialise la transition
        element.style.opacity = 1; // Remet l'opacité à 1
        callback();
    }, 600); // Durée du fondu
}

/**
 * Affiche des lignes de texte séquentiellement, en effaçant la précédente.
 * @param {string[]} lines - Tableau de chaînes de caractères à afficher.
 */
async function showLinesSequentially(lines) {
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => {
            typeText(lines[i], async () => {
                await new Promise(readDelay => setTimeout(readDelay, 1500)); // Temps de lecture
                if (i < lines.length - 1) {
                    fadeOutText(resolve); // Disparaît en fondu si ce n'est pas la dernière ligne
                } else {
                    resolve(); // Termine après la dernière ligne sans fondu
                }
            });
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai après le fondu
        }
    }
}

/**
 * Affiche plusieurs lignes de texte qui restent affichées avant un fondu final.
 * @param {string[]} lines - Tableau de chaînes de caractères à afficher.
 */
async function typeMultiLines(lines) {
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => {
            // Pour la première ligne, on efface. Pour les suivantes, on ajoute.
            typeText(lines[i], resolve, i === 0);
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre la frappe des lignes
            textElement.innerHTML += '<br>'; // Ajoute un retour à la ligne
        }
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Délai après la frappe de la dernière ligne
}

/**
 * Gère la séquence principale de l'animation.
 */
async function showAnimation() {
    const { device, browser, os } = await getDeviceInfo(); // Récupère les infos de l'appareil

    const initialPhrases = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", "Voilà ce qu’on a trouvé :"]
        : ["Denk je dat je beschermd bent?", "Dit hebben we gevonden:"];

    const deviceInfoPhrases = selectedLang === 'fr'
        ? [`Appareil : ${device}`, `Système : ${os}`, `Mapsur : ${browser}`]
        : [`Apparaat: ${device}`, `Systeem: ${os}`, `Browser: ${browser}`];

    const introAfterPhrases = selectedLang === 'fr'
        ? ["Un hacker mettrait 30 secondes à faire pire.", "C’est pour ça qu’on a créé le Digital Service Pack."]
        : ["Een hacker zou erger doen in 30 seconden.", "Daarom hebben we de Digital Service Pack ontwikkeld."];

    // Étape 1: Affichage des phrases initiales
    await showLinesSequentially(initialPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai après le fondu

    // Étape 2: Affichage des infos appareil
    await typeMultiLines(deviceInfoPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    // Ancien délai de 500ms supprimé ici pour plus de fluidité

    // Étape 3: Prise et affichage du selfie
    const selfieDisplayed = await takeSelfie();

    if (selfieDisplayed) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Durée d'affichage du selfie
        await new Promise(resolve => fadeOutElement("selfieContainer", resolve)); // Fondu du conteneur du selfie
    } else {
        document.getElementById("selfieContainer").style.display = "none"; // S'assurer que le conteneur est caché
    }

    document.getElementById("text").style.display = "block"; // Réaffiche le div du texte
    textElement.innerHTML = ""; // Vide le texte pour la séquence suivante

    // Étape 4: Affichage des phrases après le selfie
    await showLinesSequentially(introAfterPhrases);
    await new Promise(resolve => setTimeout(() => fadeOutText(showCard), 1000)); // Fondu et affichage de la carte
}

/**
 * Affiche la carte de récompense à la fin de l'animation.
 */
function showCard() {
    const textDiv = document.getElementById("text");
    const cardDiv = document.getElementById("rewardCard");

    textDiv.style.display = "none"; // Cache le texte
    cardDiv.style.display = "flex"; // Affiche la carte

    setTimeout(() => cardDiv.classList.add("show"), 100); // Anime l'apparition de la carte

    const cardText = document.getElementById("card-text");
    cardText.textContent = selectedLang === 'fr'
        ? "Clique ici et présente cette carte à un vendeur"
        : "Klik hier en toon deze kaart aan een verkoper";

    const cardInner = document.getElementById("cardInner");
    cardInner.addEventListener("click", () => {
        cardInner.classList.toggle("flipped"); // Retourne la carte
        document.querySelector('.logo-no-glitch').style.display = 'block'; // Affiche le logo non-glitch
        document.querySelector('.logo-glitch').style.display = 'none'; // Cache le logo glitch
    });
}

/**
 * Configure les écouteurs d'événements pour les boutons de sélection de langue.
 */
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

/**
 * Génère l'effet visuel "Matrix" en arrière-plan.
 */
function generateMatrixEffect() {
    const matrixContainer = document.getElementById("matrix-container");
    matrixContainer.innerHTML = ""; // Vide le conteneur existant

    const characters = "01"; // Les caractères à afficher
    const totalChars = 150; // Nombre total de caractères pour l'effet

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

/**
 * Démarre l'animation principale après la sélection de la langue.
 */
async function startAnimationWithSelfie() {
    document.getElementById("language-selection").style.display = "none";
    document.getElementById("text").style.display = "block";
    document.getElementById("rewardCard").style.display = "none";
    document.getElementById("rewardCard").classList.remove("show");
    document.getElementById("cardInner").classList.remove("flipped");
    textElement.innerHTML = "";

    const selfieContainer = document.getElementById("selfieContainer");
    selfieContainer.style.display = "none";
    selfieContainer.style.opacity = 1; // Réinitialise l'opacité pour de futures apparitions

    generateMatrixEffect(); // Lance l'effet matrix
    await showAnimation(); // Démarre la séquence d'animation (avec await car elle est async)
}

/**
 * Tente de prendre un selfie via la caméra de l'appareil.
 * @returns {Promise<boolean>} True si le selfie a été pris et affiché, false sinon.
 */
async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    try {
        // Styles CSS pour positionner le conteneur en plein écran (essentiel)
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
        container.style.display = "flex"; // S'assurer que le conteneur est visible
        container.style.opacity = 1;

        // Demander l'accès à la caméra
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // Important pour la lecture sur mobile
        await video.play();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Laisse le temps à la vidéo de démarrer

        // Dessiner l'image de la vidéo sur un canvas
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop()); // Arrêter le flux de la caméra

        const imgData = canvas.toDataURL("image/png"); // Convertir l'image en Data URL

        const message = selectedLang === 'fr' ? "Et voilà à quoi tu ressembles :" : "Zo zie je eruit:";
        // Injecter le message et l'image dans le conteneur avec les classes CSS
        container.innerHTML = `
            <p class="selfie-message">${message}</p>
            <img src="${imgData}" alt="Selfie" class="selfie-image">
        `;

        // Forcer le re-render pour que l'animation CSS (.selfie-image) se déclenche
        const selfieImage = container.querySelector('.selfie-image');
        if (selfieImage) {
            void selfieImage.offsetWidth;
        }

        selfieTaken = true; // Indique que le selfie a été pris avec succès

    } catch (err) {
        console.warn("Accès caméra refusé ou erreur :", err);
        container.innerHTML = ""; // Vide le conteneur
        container.style.display = "none"; // Cache le conteneur
        // selfieTaken reste false
    }
    return selfieTaken; // Retourne l'état du succès
}

// Initialise les écouteurs de boutons au chargement de la page
setupLanguageButtons();