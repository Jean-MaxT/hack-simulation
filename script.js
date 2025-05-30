let selectedLang = 'fr';
const textElement = document.getElementById("content"); // C'est le <span> à l'intérieur de #text
const textContainer = document.getElementById("text"); // C'est la <div> #text

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
        textElement.style.opacity = 1; // Remettre l'opacité à 1 pour la prochaine utilisation
        callback();
    }, 600);
}

function fadeOutElement(element, callback) { // Prend l'élément directement au lieu de l'ID
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
    fadeOutElement(textContainer, () => { // Masquer le conteneur texte principal avec fadeOut
        console.log("showChoices: textContainer masqué.");
        // Ordre inversé des boutons ici
        choiceSelection.innerHTML = `
            <p class="choice-prompt">${selectedLang === 'fr' ? "Maintenant que tu sais ça…" : "Nu je dit weet…"}</p>
            <button id="btn-protect">${selectedLang === 'fr' ? "Protéger mes données avec le DSP" : "Bescherm mijn gegevens met de DSP"}</button>
            <button id="btn-ignore">${selectedLang === 'fr' ? "Ignorer et espérer que ça n’arrive jamais" : "Negeer en hoop dat het nooit gebeurt"}</button>
        `;

        // Ajouter les écouteurs d'événements après que les éléments soient dans le DOM
        // et les retirer avant de les recréer si on relance l'animation pour éviter les doubles écouteurs
        const btnIgnore = choiceSelection.querySelector('#btn-ignore');
        const btnProtect = choiceSelection.querySelector('#btn-protect');

        if (btnIgnore) btnIgnore.removeEventListener('click', handleIgnore);
        if (btnProtect) btnProtect.removeEventListener('click', handleProtect);

        btnIgnore.addEventListener('click', handleIgnore);
        btnProtect.addEventListener('click', handleProtect);

        choiceSelection.style.display = 'flex'; // Assurer que le conteneur est en flex pour le layout
        choiceSelection.classList.add('show'); // Rendre la div des choix visible avec transition
        console.log("showChoices: Choix affichés");
    });
}

// Fonctions de gestion des choix
async function handleIgnore() {
    console.log("handleIgnore: Choix Ignorer sélectionné");

    fadeOutElement(choiceSelection, async () => { // Masquer les boutons de choix
        console.log("handleIgnore: choiceSelection masqué.");
        const symbol = '&#x2620;'; // Symbole de la tête de mort
        const message = selectedLang === 'fr' ? "Mauvaise idée, tu devrais aller voir un vendeur." : "Slecht idee, je zou een verkoper moeten spreken.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'red'; // Couleur rouge pour la tête de mort
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure');

        choiceResult.style.display = 'flex'; // Assurer que le conteneur est en flex pour le layout
        choiceResult.classList.add('show'); // Afficher le résultat avec transition
        console.log("handleIgnore: Résultat affiché (Tête de mort)");
    });
}

async function handleProtect() {
    console.log("handleProtect: Choix Protéger sélectionné");

    fadeOutElement(choiceSelection, async () => { // Masquer les boutons de choix
        console.log("handleProtect: choiceSelection masqué.");
        const symbol = '&#x1F6E1;'; // Symbole du bouclier (unicode emoji)
        const message = selectedLang === 'fr' ? "Bonne idée, approche-toi d'un vendeur." : "Goed idee, spreek een verkoper aan.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'green'; // Couleur verte pour le bouclier
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure');

        choiceResult.style.display = 'flex'; // Assurer que le conteneur est en flex pour le layout
        choiceResult.classList.add('show'); // Afficher le résultat avec transition
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

    // S'assurer que le conteneur de texte est visible au début de chaque séquence de texte
    textContainer.style.display = "block";
    textElement.innerHTML = ""; // Vider le contenu pour la première séquence

    await showLinesSequentially(initialPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500));

    textContainer.style.display = "block"; // S'assurer qu'il est visible pour la suite
    await typeMultiLines(deviceInfoPhrases);
    await new Promise(resolve => fadeOutText(resolve));

    const selfieContainer = document.getElementById("selfieContainer");
    const selfieDisplayed = await takeSelfie();

    if (selfieDisplayed) {
        console.log("showAnimation: Selfie affiché. Attente...");
        await new Promise(resolve => setTimeout(resolve, 4000));
        await new Promise(resolve => fadeOutElement(selfieContainer, resolve)); // Utiliser la référence
        console.log("showAnimation: Selfie masqué.");
    } else {
        selfieContainer.style.display = "none";
        console.log("showAnimation: Pas de selfie ou erreur caméra.");
    }

    textContainer.style.display = "block"; // Afficher à nouveau le conteneur de texte pour les phrases suivantes
    textElement.innerHTML = ""; // Vider le contenu pour la prochaine séquence

    await showLinesSequentially(introAfterPhrases);
    console.log("showAnimation: Phrases d'introduction DSP terminées.");
    // Après les phrases introductives du DSP, masquer le texte principal et afficher les choix
    await new Promise(resolve => setTimeout(() => fadeOutText(() => {
        showChoices(); // Appelle showChoices ici, qui gérera le display de textContainer
    }), 1000)); // Attendre 1s avant de commencer le fade out et afficher les choix
    console.log("showAnimation: Transition vers les choix.");
}

function setupLanguageButtons() {
    // Rendre le conteneur de langue visible avec le fondu initial
    document.getElementById("language-selection").classList.add('show');

    document.getElementById("btn-fr").addEventListener("click", async () => {
        selectedLang = 'fr';
        // Masquer le conteneur de langue avec fade out avant de lancer l'animation
        fadeOutElement(document.getElementById("language-selection"), startAnimation);
    });

    document.getElementById("btn-nl").addEventListener("click", async () => {
        selectedLang = 'nl';
        // Masquer le conteneur de langue avec fade out avant de lancer l'animation
        fadeOutElement(document.getElementById("language-selection"), startAnimation);
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

async function startAnimation() {
    console.log("startAnimation: Démarrage (nettoyage précédent)");

    // Réinitialiser la visibilité des conteneurs
    textContainer.style.display = "none";
    textElement.innerHTML = "";

    choiceSelection.classList.remove('show');
    choiceSelection.style.display = "none";

    choiceResult.classList.remove('show', 'success', 'failure');
    choiceResult.style.display = "none";

    const selfieContainer = document.getElementById("selfieContainer");
    if (selfieContainer) {
        selfieContainer.style.display = "none";
        selfieContainer.innerHTML = "";
    }

    generateMatrixEffect();
    await showAnimation();
    console.log("startAnimation: Animation principale terminée.");
}

async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    // Nettoyer le conteneur avant de commencer
    container.innerHTML = ""; // AJOUTÉ POUR NETTOYER LE CONTENEUR
    
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
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;
        // Styles pour la vidéo gérés par le CSS (retiré d'ici)
        container.appendChild(video);

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

        // Afficher la photo prise
        video.pause();
        stream.getTracks().forEach(track => track.stop());
        container.removeChild(video);

        const img = document.createElement("img");
        img.src = imageUrl;
        // Styles pour l'image gérés par le CSS (retiré d'ici)
        container.appendChild(img);

        selfieTaken = true;

        await new Promise(resolve => setTimeout(resolve, 3000)); // Photo visible 3s avant la suite
    } catch (err) {
        console.warn("Erreur lors de la prise de selfie:", err);
    }

    return selfieTaken;
}

// Initialisation
setupLanguageButtons();