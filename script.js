let selectedLang = 'fr';
let currentStream = null; // Pour garder une référence au flux de la caméra
let typingInterval = null; // Pour garder une référence à l'intervalle de dactylographie

const textElement = document.getElementById("content"); // C'est le <span> à l'intérieur de #text
const textContainer = document.getElementById("text"); // C'est la <div> #text
const languageSelection = document.getElementById('language-selection'); // Ajout pour un accès facile
const selfieContainer = document.getElementById("selfieContainer"); // Ajout pour un accès facile

// Crée les divs si elles n'existent pas déjà (elles devraient exister dans le HTML maintenant)
let choiceSelection = document.getElementById('choice-selection');
if (!choiceSelection) {
    choiceSelection = document.createElement('div');
    choiceSelection.id = 'choice-selection';
    document.body.appendChild(choiceSelection);
}

let choiceResult = document.getElementById('choice-result');
if (!choiceResult) {
    choiceResult = document.createElement('div');
    choiceResult.id = 'choice-result';
    choiceResult.innerHTML = '<span id="choice-result-symbol"></span><span id="choice-result-message"></span>';
    document.body.appendChild(choiceResult);
}


async function getDeviceInfo() {
    let device = "Appareil inconnu";
    let os = "Système inconnu";
    let browser = "Navigateur inconnu";

    if (navigator.userAgentData) {
        try {
            const highEntropyValues = await navigator.userAgentData.getHighEntropyValues(['platformVersion', 'model']);
            if (highEntropyValues.platform) {
                os = `${highEntropyValues.platform} ${highEntropyValues.platformVersion || ""}`.trim();
            }
            if (highEntropyValues.model) {
                device = highEntropyValues.model;
            }
            if (navigator.userAgentData.brands && navigator.userAgentData.brands.length > 0) {
                const mainBrand = navigator.userAgentData.brands.find(brand => !brand.brand.includes('Chromium')) || navigator.userAgentData.brands[0];
                browser = `${mainBrand.brand} ${mainBrand.version || ""}`.trim();
            } else if (navigator.userAgentData.ua) {
                // Fallback for older UAs or if brands isn't fully supported
                const parser = new UAParser();
                const result = parser.getResult();
                browser = result.browser.name || "Navigateur inconnu";
            }
            if (device !== "Appareil inconnu" || os !== "Système inconnu") {
                console.log("Infos appareil via Client Hints :", { device, os, browser });
                return { device, browser, os };
            }
        } catch (error) {
            console.warn("Erreur lors de la récupération des User-Agent Client Hints (tentative de fallback) :", error);
        }
    }

    // Fallback to UAParser.js if Client Hints fail or are not available
    const parser = new UAParser();
    const result = parser.getResult();

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

    os = result.os.name ? `${result.os.name} ${result.os.version || ""}`.trim() : "Système inconnu";
    browser = result.browser.name || "Navigateur inconnu";

    console.log("Infos appareil via UAParser.js (fallback) :", { device, browser, os });
    return { device, browser, os };
}

function typeText(textToType, callback, clearBefore = true) {
    if (typingInterval) { // Clear any existing typing interval
        clearInterval(typingInterval);
    }

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

    typingInterval = setInterval(() => {
        textElement.innerHTML = initialContent + textToType.slice(0, index++);
        if (index > textToType.length) {
            clearInterval(typingInterval);
            typingInterval = null; // Reset interval reference
            callback();
        }
    }, 30);
}

function fadeOutText(callback) {
    if (typingInterval) { // Stop typing animation if ongoing
        clearInterval(typingInterval);
        typingInterval = null;
        textElement.innerHTML = textElement.textContent; // Ensure full text is visible before fading
    }

    textElement.style.transition = "opacity 0.6s ease-out";
    textElement.style.opacity = 0;
    setTimeout(() => {
        const cursor = document.querySelector('.cursor');
        if (cursor) cursor.style.display = 'none';
        textElement.innerHTML = "";
        textElement.style.transition = "";
        textElement.style.opacity = 1; // Remettre l'opacité à 1 pour la prochaine utilisation
        callback();
    }, 600);
}

function fadeOutElement(element, callback) {
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

// Fonction pour afficher les choix
async function showChoices() {
    console.log("showChoices: Démarrage");
    fadeOutElement(textContainer, () => {
        console.log("showChoices: textContainer masqué.");
        // Nettoyer d'abord pour éviter les doubles écouteurs si la fonction est appelée plusieurs fois sans rechargement
        const oldBtnIgnore = choiceSelection.querySelector('#btn-ignore');
        const oldBtnProtect = choiceSelection.querySelector('#btn-protect');
        if (oldBtnIgnore) oldBtnIgnore.removeEventListener('click', handleIgnore);
        if (oldBtnProtect) oldBtnProtect.removeEventListener('click', handleProtect);

        // Ordre inversé des boutons
        choiceSelection.innerHTML = `
            <p class="choice-prompt">${selectedLang === 'fr' ? "Maintenant que tu sais ça…" : "Nu je dit weet…"}</p>
            <button id="btn-protect">${selectedLang === 'fr' ? "Protéger mes données avec le DSP" : "Bescherm mijn gegevens met de DSP"}</button>
            <button id="btn-ignore">${selectedLang === 'fr' ? "Ignorer et espérer que ça n’arrive jamais" : "Negeer en hoop dat het nooit gebeurt"}</button>
        `;

        const btnIgnore = choiceSelection.querySelector('#btn-ignore');
        const btnProtect = choiceSelection.querySelector('#btn-protect');

        btnIgnore.addEventListener('click', handleIgnore);
        btnProtect.addEventListener('click', handleProtect);

        choiceSelection.style.display = 'flex';
        choiceSelection.classList.add('show');
        console.log("showChoices: Choix affichés");
    });
}

// Fonctions de gestion des choix
async function handleIgnore() {
    console.log("handleIgnore: Choix Ignorer sélectionné");
    fadeOutElement(choiceSelection, async () => {
        console.log("handleIgnore: choiceSelection masqué.");
        const symbol = '&#x2620;';
        const message = selectedLang === 'fr' ? "Mauvaise idée, tu devrais aller voir un vendeur." : "Slecht idee, je zou een verkoper moeten spreken.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'red';
        document.getElementById('choice-result-message').textContent = message;
        
        choiceResult.style.display = 'flex';
        choiceResult.classList.add('show');
        console.log("handleIgnore: Résultat affiché (Tête de mort)");
    });
}

async function handleProtect() {
    console.log("handleProtect: Choix Protéger sélectionné");
    fadeOutElement(choiceSelection, async () => {
        console.log("handleProtect: choiceSelection masqué.");
        const symbol = '&#x1F6E1;';
        const message = selectedLang === 'fr' ? "Bonne idée, approche-toi d'un vendeur." : "Goed idee, spreek een verkoper aan.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'green';
        document.getElementById('choice-result-message').textContent = message;
        
        choiceResult.style.display = 'flex';
        choiceResult.classList.add('show');
        console.log("handleProtect: Résultat affiché (Bouclier)");
    });
}

async function showAnimation() {
    console.log("showAnimation: Démarrage de l'animation");
    const { device, browser, os } = await getDeviceInfo();

    const initialPhrases = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", "Et pourtant voilà ce qu’on a récupéré de ton appareil…"]
        : ["Denk je dat je beschermd bent?", "Dit hebben we gevonden:"];

    const deviceInfoPhrases = selectedLang === 'fr'
        ? [`Identifiant Appareil : ${device}`, `Système : ${os}`, `Mapsur : ${browser}`]
        : [`Apparaat: ${device}`, `Systeem: ${os}`, `Browser: ${browser}`];

    const introAfterPhrases = selectedLang === 'fr'
        ? ["Un hacker mettrait 30 secondes à faire pire.", "C’est pour ça qu’on a créé le Digital Service Pack."]
        : ["Een hacker zou erger doen in 30 seconden.", "Daarom hebben we de Digital Service Pack ontwikkeld."];

    textContainer.style.display = "block";

    await showLinesSequentially(initialPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500));

    await typeMultiLines(deviceInfoPhrases);
    await new Promise(resolve => fadeOutText(resolve));

    const selfieDisplayed = await takeSelfie();

    if (selfieDisplayed) {
        console.log("showAnimation: Selfie affiché. Attente...");
        await new Promise(resolve => setTimeout(resolve, 4000));
        await new Promise(resolve => fadeOutElement(selfieContainer, resolve));
        console.log("showAnimation: Selfie masqué.");
    } else {
        selfieContainer.style.display = "none";
        console.log("showAnimation: Pas de selfie ou erreur caméra.");
    }

    textContainer.style.display = "block";
    textElement.innerHTML = "";

    await showLinesSequentially(introAfterPhrases);
    console.log("showAnimation: Phrases d'introduction DSP terminées.");
    await new Promise(resolve => setTimeout(() => fadeOutText(() => {
        showChoices();
    }), 1000));
    console.log("showAnimation: Transition vers les choix.");
}

function setupLanguageButtons() {
    // Nettoyer les anciens écouteurs avant d'en ajouter de nouveaux (important pour les resets)
    const btnFr = document.getElementById("btn-fr");
    const btnNl = document.getElementById("btn-nl");

    if (btnFr) btnFr.removeEventListener("click", handleLanguageClick);
    if (btnNl) btnNl.removeEventListener("click", handleLanguageClick);

    // Fonction de gestionnaire d'événement commune pour les boutons de langue
    const handleLanguageClick = async (event) => {
        selectedLang = event.target.id === 'btn-fr' ? 'fr' : 'nl';
        // Masquer le conteneur de langue avec fade out avant de lancer l'animation
        fadeOutElement(languageSelection, startAnimation);
    };

    btnFr.addEventListener("click", handleLanguageClick);
    btnNl.addEventListener("click", handleLanguageClick);

    // Rendre le conteneur de langue visible avec le fondu initial
    languageSelection.classList.add('show');
}

function generateMatrixEffect() {
    const matrixContainer = document.getElementById("matrix-container");
    // Limiter la génération de chiffres pour éviter de surcharger le DOM sur des reloads fréquents
    if (matrixContainer.children.length > 0) return;

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

async function startAnimation() {
    console.log("startAnimation: Démarrage (nettoyage précédent)");
    
    // Assurer que le flux de la caméra est bien coupé si une tentative précédente a échoué
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    // Assurer que l'intervalle de typing est stoppé
    if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
    }

    // Réinitialiser la visibilité des conteneurs
    textContainer.style.display = "none";
    textElement.innerHTML = ""; 

    choiceSelection.classList.remove('show');
    choiceSelection.style.display = "none";

    choiceResult.classList.remove('show'); // Pas besoin de success/failure ici, géré par la couleur du symbole
    choiceResult.style.display = "none";
    
    // Nettoyer le contenu de selfieContainer avant de le réutiliser
    if (selfieContainer) {
        selfieContainer.style.display = "none";
        selfieContainer.innerHTML = ""; // Vider complètement le contenu (vidéo, img)
    }

    generateMatrixEffect();
    await showAnimation();
    console.log("startAnimation: Animation principale terminée.");
}

async function takeSelfie() {
    let selfieTaken = false;
    currentStream = null; // Réinitialiser le stream à chaque appel

    // Supprimer tout élément vidéo/image existant pour éviter les cumuls
    selfieContainer.innerHTML = ''; 

    try {
        selfieContainer.style.cssText = `
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
        selfieContainer.style.display = "flex";
        selfieContainer.style.opacity = 1;

        // Message avant la caméra
        const cameraPrompt = document.createElement('p');
        cameraPrompt.textContent = selectedLang === 'fr' ? "Prépare-toi pour une photo..." : "Bereid je voor op een foto...";
        cameraPrompt.style.fontSize = '2em';
        cameraPrompt.style.marginBottom = '20px';
        selfieContainer.appendChild(cameraPrompt);

        // Demander l'accès à la caméra
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = currentStream;
        video.style.maxWidth = "90vw";
        video.style.borderRadius = "15px";
        video.style.marginTop = '20px'; // Espacement du message
        selfieContainer.appendChild(video);

        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Laisser la vidéo tourner 2s

        // Prendre snapshot
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/png");

        // Arrêter le flux de la caméra immédiatement après la capture
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null; // Libérer la référence au flux

        // Nettoyer le conteneur et afficher la photo
        selfieContainer.innerHTML = ''; // Vider les éléments vidéo et le prompt
        
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "90vw";
        img.style.borderRadius = "15px";
        img.style.border = '2px solid white'; // Ajouter un petit cadre pour la photo
        img.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
        selfieContainer.appendChild(img);

        const photoMessage = document.createElement('p');
        photoMessage.textContent = selectedLang === 'fr' ? "On a une photo de toi !" : "We hebben een foto van jou!";
        photoMessage.style.fontSize = '1.8em';
        photoMessage.style.marginTop = '20px';
        selfieContainer.appendChild(photoMessage);

        selfieTaken = true;

        await new Promise(resolve => setTimeout(resolve, 3000)); // Photo visible 3s
    } catch (err) {
        console.warn("Erreur lors de la prise de selfie:", err);
        if (currentStream) { // Assurer que le stream est arrêté même en cas d'erreur après son initialisation
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        selfieContainer.innerHTML = ''; // Nettoyer le conteneur en cas d'erreur
        const errorMessage = document.createElement('p');
        errorMessage.textContent = selectedLang === 'fr' ? "Impossible de prendre de selfie (accès caméra refusé ou erreur)." : "Kan geen selfie nemen (cameratoegang geweigerd of fout).";
        errorMessage.style.color = 'red';
        errorMessage.style.fontSize = '1.5em';
        selfieContainer.appendChild(errorMessage);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Laisser le message d'erreur visible 3s
    }

    return selfieTaken;
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que UAParser est chargé si tu l'utilises via un script externe
    if (typeof UAParser === 'undefined') {
        console.error("UAParser.js n'est pas chargé. Assurez-vous d'inclure la bibliothèque.");
        // Tu peux choisir de charger dynamiquement ou d'afficher un message d'erreur plus visible
    }
    setupLanguageButtons();
});