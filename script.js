// Variable globale pour la langue sélectionnée
let selectedLang = 'fr';

// Références aux éléments DOM principaux
const textElement = document.getElementById("content");
const textContainer = document.getElementById("text");

// Récupération ou création des conteneurs de choix et de résultat
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

/**
 * Récupère les informations sur l'appareil, le système d'exploitation et le navigateur de l'utilisateur.
 * Utilise User-Agent Client Hints si disponible, sinon fallback sur UAParser.js.
 * @returns {Promise<{device: string, browser: string, os: string}>} Un objet contenant les infos de l'appareil.
 */
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

/**
 * Simule l'écriture de texte lettre par lettre dans un élément.
 * @param {string} textToType Le texte à afficher.
 * @param {function} callback La fonction à appeler une fois le texte entièrement tapé.
 * @param {boolean} [clearBefore=true] Indique si le contenu de l'élément doit être effacé avant de taper.
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
    if (cursor) cursor.style.display = 'inline-block';

    const interval = setInterval(() => {
        textElement.innerHTML = initialContent + textToType.slice(0, index++);
        if (index > textToType.length) {
            clearInterval(interval);
            callback();
        }
    }, 30);
}

/**
 * Fait disparaître le texte avec une transition d'opacité.
 * @param {function} callback La fonction à appeler une fois le texte disparu.
 */
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

/**
 * Fait disparaître un élément HTML avec une transition d'opacité.
 * @param {HTMLElement} element L'élément DOM à faire disparaître.
 * @param {function} callback La fonction à appeler une fois l'élément disparu.
 */
function fadeOutElement(element, callback) {
    if (!element) {
        callback();
        return;
    }
    element.style.opacity = 0;
    element.style.transition = "opacity 0.6s ease-out";
    setTimeout(() => {
        element.style.display = "none";
        element.style.transition = "";
        element.style.opacity = 1;
        element.classList.remove('show'); // Pour les éléments utilisant la classe 'show'
        element.classList.remove('show-selfie'); // Pour le selfieContainer
        callback();
    }, 600);
}

/**
 * Fait apparaître un élément HTML avec une transition d'opacité.
 * @param {HTMLElement} element L'élément DOM à faire apparaître.
 * @param {function} callback La fonction à appeler une fois l'élément apparu.
 */
function fadeInElement(element, callback) {
    if (!element) {
        callback();
        return;
    }
    element.style.display = "flex"; // Ou "block" ou "grid" selon le display de base de l'élément
    element.offsetHeight; // Force reflow pour que la transition opère
    element.classList.add('show-selfie'); // Utilise la classe pour le fondu d'apparition
    setTimeout(() => {
        callback();
    }, 800); // Durée qui correspond à la transition CSS
}

/**
 * Affiche une séquence de lignes de texte, une par one, avec des pauses et des fondus.
 * @param {string[]} lines Un tableau de chaînes de caractères à afficher séquentiellement.
 */
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

/**
 * Affiche plusieurs lignes de texte en les tapant, en ajoutant des sauts de ligne entre elles.
 * @param {string[]} lines Un tableau de chaînes de caractères à afficher.
 */
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

/**
 * Affiche les boutons de choix "Protéger" ou "Ignorer" après la séquence d'animation.
 */
async function showChoices() {
    console.log("showChoices: Démarrage");
    fadeOutElement(textContainer, () => {
        console.log("showChoices: textContainer masqué.");
        choiceSelection.innerHTML = `
            <p class="choice-prompt">${selectedLang === 'fr' ? "Maintenant que tu sais ça…" : "Nu je dit weet…"}</p>
            <button id="btn-protect">${selectedLang === 'fr' ? "Protéger mes données avec le DSP" : "Bescherm mijn gegevens met de DSP"}</button>
            <button id="btn-ignore">${selectedLang === 'fr' ? "Ignorer et espérer que ça n’arrive jamais" : "Negeer en hoop dat het nooit gebeurt"}</button>
        `;

        const btnIgnore = choiceSelection.querySelector('#btn-ignore');
        const btnProtect = choiceSelection.querySelector('#btn-protect');

        if (btnIgnore) btnIgnore.removeEventListener('click', handleIgnore);
        if (btnProtect) btnProtect.removeEventListener('click', handleProtect);

        btnIgnore.addEventListener('click', handleIgnore);
        btnProtect.addEventListener('click', handleProtect);

        choiceSelection.style.display = 'flex';
        choiceSelection.classList.add('show');
        console.log("showChoices: Choix affichés");
    });
}

/**
 * Gère le choix "Ignorer".
 */
async function handleIgnore() {
    console.log("handleIgnore: Choix Ignorer sélectionné");

    fadeOutElement(choiceSelection, async () => {
        console.log("handleIgnore: choiceSelection masqué.");
        const symbol = '&#x2620;';
        const message = selectedLang === 'fr' ? "Mauvaise idée, tu devrais aller voir un vendeur." : "Slecht idee, je zou een verkoper moeten spreken.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'red';
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure');

        choiceResult.style.display = 'flex';
        choiceResult.classList.add('show');
        console.log("handleIgnore: Résultat affiché (Tête de mort)");
    });
}

/**
 * Gère le choix "Protéger".
 */
async function handleProtect() {
    console.log("handleProtect: Choix Protéger sélectionné");

    fadeOutElement(choiceSelection, async () => {
        console.log("handleProtect: choiceSelection masqué.");
        const symbol = '&#x1F6E1;';
        const message = selectedLang === 'fr' ? "Bonne idée, approche-toi d'un vendeur." : "Goed idee, spreek een verkoper aan.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'green';
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure');

        choiceResult.style.display = 'flex';
        choiceResult.classList.add('show');
        console.log("handleProtect: Résultat affiché (Bouclier)");
    });
}

/**
 * Orchestre la séquence principale de l'animation : affichage des infos, selfie, puis introduction DSP.
 */
async function showAnimation() {
    console.log("showAnimation: Démarrage de l'animation");
    const { device, browser, os } = await getDeviceInfo();

    // Phrases originales
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
    textElement.innerHTML = "";

    await showLinesSequentially(initialPhrases);
    await new Promise(resolve => fadeOutText(resolve));
    await new Promise(resolve => setTimeout(resolve, 500));

    textContainer.style.display = "block";
    await typeMultiLines(deviceInfoPhrases);
    await new Promise(resolve => fadeOutText(resolve));

    const selfieContainer = document.getElementById("selfieContainer");
    const selfieDisplayed = await takeSelfie(); // Appel de la fonction takeSelfie modifiée

    if (selfieDisplayed) {
        console.log("showAnimation: Selfie affiché. Attente...");
        await new Promise(resolve => setTimeout(resolve, 4000)); // Photo affichée plus longtemps
        // Utiliser fadeOutElement pour la transition CSS
        await new Promise(resolve => fadeOutElement(selfieContainer, () => {
            selfieContainer.innerHTML = ""; // Nettoyer le contenu après le fadeOut
            resolve();
        }));
        console.log("showAnimation: Selfie masqué.");
    } else {
        // Si le selfie n'est pas affiché (erreur caméra ou pas de selfie),
        // le container est déjà display: none et vide, donc on ne fait rien.
        // L'animation passe directement à la suite.
        console.log("showAnimation: Pas de selfie ou erreur caméra, passage direct à la suite.");
    }

    textContainer.style.display = "block"; // Afficher à nouveau le conteneur de texte pour les phrases suivantes
    textElement.innerHTML = ""; // Vider le contenu pour la prochaine séquence

    await showLinesSequentially(introAfterPhrases);
    console.log("showAnimation: Phrases d'introduction DSP terminées.");
    // Après les phrases introductives du DSP, masquer le texte principal et afficher les choix
    await new Promise(resolve => setTimeout(() => fadeOutText(() => {
        showChoices(); // Appelle showChoices ici, qui gérera le display de textContainer
        resolve();
    }), 1000)); // Attendre 1s avant de commencer le fade out et afficher les choix
    console.log("showAnimation: Transition vers les choix.");
}

/**
 * Configure les écouteurs d'événements pour les boutons de sélection de langue.
 */
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

/**
 * Génère l'effet visuel "Matrix" en arrière-plan.
 */
function generateMatrixEffect() {
    const matrixContainer = document.getElementById("matrix-container");
    matrixContainer.innerHTML = ""; // Nettoie le conteneur avant de générer

    const characters = "01"; // Caractères pour l'effet Matrix
    const totalChars = 150; // Nombre total de caractères à générer

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
 * Effectue un nettoyage des éléments précédents.
 */
async function startAnimation() {
    console.log("startAnimation: Démarrage (nettoyage précédent)");

    // Réinitialiser la visibilité et le contenu des conteneurs
    textContainer.style.display = "none";
    textElement.innerHTML = "";

    choiceSelection.classList.remove('show');
    choiceSelection.style.display = "none";

    choiceResult.classList.remove('show', 'success', 'failure');
    choiceResult.style.display = "none";

    const selfieContainer = document.getElementById("selfieContainer");
    if (selfieContainer) {
        selfieContainer.style.display = "none";
        selfieContainer.innerHTML = ""; // Nettoie le contenu du conteneur selfie
    }

    generateMatrixEffect(); // Lance l'effet Matrix
    await showAnimation(); // Lance la séquence d'animation principale
    console.log("startAnimation: Animation principale terminée.");
}

/**
 * Prend une photo du client via la webcam, l'affiche avec des messages.
 * Si la caméra n'est pas accessible, l'opération est silencieusement ignorée.
 * @returns {Promise<boolean>} Vrai si la selfie a été prise et affichée, faux sinon.
 */
async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    container.innerHTML = ""; // Nettoyer le conteneur au début

    try {
        // Obtenir le flux vidéo de la caméra frontale
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true);

        // Crée un conteneur temporaire pour la vidéo, masqué à l'écran
        // Ceci permet à la vidéo de se charger et de "jouer" sans être visible
        const tempVideoContainer = document.createElement('div');
        tempVideoContainer.style.position = 'fixed';
        tempVideoContainer.style.left = '-9999px';
        tempVideoContainer.style.top = '-9999px';
        tempVideoContainer.style.opacity = '0';
        document.body.appendChild(tempVideoContainer);
        tempVideoContainer.appendChild(video);

        // Attendre que la vidéo soit chargée et prête à être lue
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // Attendre un très court instant pour que le flux vidéo soit stable et qu'une image soit prête
        await new Promise(resolve => setTimeout(resolve, 300));

        // Créer un élément canvas pour capturer l'image du flux vidéo
        const canvas = document.createElement("canvas");
        // Assure que le canvas a la même résolution que la vidéo ou une taille définie si besoin
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Arrêter le flux de la caméra immédiatement après la capture pour libérer les ressources
        stream.getTracks().forEach(track => track.stop());
        tempVideoContainer.remove(); // Supprime le conteneur vidéo temporaire

        // Convertir l'image du canvas en URL de données (Base64)
        const imageDataURL = canvas.toDataURL("image/png");

        // Messages à afficher au-dessus et en dessous de la photo (phrases originales)
        const selfieMessageText = selectedLang === 'fr'
            ? "Et ça, c’est ta tête quand tu réalises que tes infos sont pas si protégées…"
            : "En dit is je gezicht als je beseft dat je gegevens niet zo veilig zijn…";
        const selfieDisclaimerText = selectedLang === 'fr'
            ? "Rien n’est stocké, pas de panique."
            : "Niets wordt opgeslagen, geen paniek.";

        // Créer les éléments à ajouter au selfieContainer
        const selfieFrame = document.createElement('div');
        selfieFrame.className = 'selfie-frame';

        const selfieMessage = document.createElement('p');
        selfieMessage.className = 'selfie-message';
        selfieMessage.textContent = selfieMessageText;

        const selfieImage = document.createElement('img');
        selfieImage.className = 'selfie-image';
        selfieImage.src = imageDataURL;
        selfieImage.alt = selectedLang === 'fr' ? "Selfie de votre webcam" : "Webcam selfie";

        const selfieDisclaimer = document.createElement('p');
        selfieDisclaimer.className = 'selfie-disclaimer';
        selfieDisclaimer.textContent = selfieDisclaimerText;

        selfieFrame.appendChild(selfieMessage);
        selfieFrame.appendChild(selfieImage);
        selfieFrame.appendChild(selfieDisclaimer);
        container.appendChild(selfieFrame);

        // Afficher le conteneur de selfie avec le fondu d'apparition
        await new Promise(resolve => fadeInElement(container, resolve));
        selfieTaken = true; // Indique que la selfie a été prise avec succès

    } catch (error) {
        console.warn("Erreur lors de la prise de selfie (caméra inaccessible ou autre) :", error);
        // Si la caméra est inaccessible, on ne fait rien pour afficher un message.
        // Le container reste masqué et vide. L'animation principale passera à l'étape suivante.
        container.innerHTML = ""; // S'assurer qu'il n'y a pas de contenu d'erreur
        container.style.display = "none"; // S'assurer qu'il est masqué
        selfieTaken = false; // Indique que le selfie n'a pas été pris
    }

    return selfieTaken;
}

// Initialisation de l'application : configure les boutons de sélection de langue au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    setupLanguageButtons();
});