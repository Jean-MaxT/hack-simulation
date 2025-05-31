// Variable globale pour la langue sélectionnée
let selectedLang = 'fr';

// Références aux éléments DOM principaux
const textElement = document.getElementById("content"); // Le <span> où le texte est tapé
const textContainer = document.getElementById("text"); // La <div> parente du texte

// Récupération ou création des conteneurs de choix et de résultat
// Ces éléments devraient déjà exister dans le HTML, mais cette vérification assure la robustesse
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

    // Tentative d'utiliser User-Agent Client Hints pour des informations plus précises
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
                // Fallback si Client Hints ne donne pas de marque principale mais a un userAgentData.ua
                const parser = new UAParser();
                const result = parser.getResult();
                browser = result.browser.name || "Navigateur inconnu";
            }
            // Si des informations significatives ont été obtenues via Client Hints, les retourner
            if (device !== "Appareil inconnu" || os !== "Système inconnu") {
                console.log("Infos appareil via Client Hints :", { device, os, browser });
                return { device, browser, os };
            }
        } catch (error) {
            console.warn("Erreur lors de la récupération des User-Agent Client Hints (tentative de fallback) :", error);
        }
    }

    // Fallback sur UAParser.js si Client Hints n'est pas disponible ou échoue
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

    textElement.style.opacity = 1; // Assure que le texte est visible

    const cursor = document.querySelector('.cursor');
    if (cursor) cursor.style.display = 'inline-block'; // Affiche le curseur

    const interval = setInterval(() => {
        textElement.innerHTML = initialContent + textToType.slice(0, index++);
        if (index > textToType.length) {
            clearInterval(interval);
            callback(); // Appelle le callback une fois le texte tapé
        }
    }, 30); // Délai entre chaque lettre
}

/**
 * Fait disparaître le texte avec une transition d'opacité.
 * @param {function} callback La fonction à appeler une fois le texte disparu.
 */
function fadeOutText(callback) {
    textElement.style.transition = "opacity 0.6s ease-out"; // Applique la transition
    textElement.style.opacity = 0; // Démarre le fondu

    setTimeout(() => {
        const cursor = document.querySelector('.cursor');
        if (cursor) cursor.style.display = 'none'; // Cache le curseur
        textElement.innerHTML = ""; // Vide le contenu
        textElement.style.transition = ""; // Réinitialise les styles
        textElement.style.opacity = ""; // Nettoie l'opacité
        callback(); // Appelle le callback final
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
    element.style.transition = "opacity 0.6s ease-out"; // Définit la transition
    element.style.opacity = 0; // Lance la transition

    setTimeout(() => {
        element.classList.remove('show'); // Retire la classe qui pourrait forcer le display
        element.style.display = "none"; // Cache l'élément après la transition
        element.style.transition = ""; // Nettoie la transition
        element.style.opacity = ""; // Réinitialise l'opacité (utile pour les réutilisations)
        callback();
    }, 600);
}

/**
 * Affiche une séquence de lignes de texte, une par one, avec des pauses et des fondus.
 * @param {string[]} lines Un tableau de chaînes de caractères à afficher séquentiellement.
 */
async function showLinesSequentially(lines) {
    for (let i = 0; i < lines.length; i++) {
        await new Promise(resolve => {
            typeText(lines[i], async () => {
                await new Promise(readDelay => setTimeout(readDelay, 1500)); // Temps de lecture
                if (i < lines.length - 1) {
                    fadeOutText(resolve); // Fait disparaître le texte si ce n'est pas la dernière ligne
                } else {
                    resolve(); // Résout la promesse si c'est la dernière ligne
                }
            });
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Petite pause entre les fondus
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
            typeText(lines[i], resolve, i === 0); // Efface seulement avant la première ligne
        });
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre les lignes
            textElement.innerHTML += '<br>'; // Ajoute un saut de ligne
        }
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Petite pause après la dernière ligne
}

/**
 * Affiche les boutons de choix "Protéger" ou "Ignorer" après la séquence d'animation.
 */
async function showChoices() {
    console.log("showChoices: Démarrage");
    fadeOutElement(textContainer, () => { // Masque le conteneur texte principal
        console.log("showChoices: textContainer masqué.");
        // Remplit le conteneur de choix avec le prompt et les boutons
        choiceSelection.innerHTML = `
            <p class="choice-prompt">${selectedLang === 'fr' ? "Maintenant que tu sais ça…" : "Nu je dit weet…"}</p>
            <button id="btn-protect">${selectedLang === 'fr' ? "Protéger mes données avec le DSP" : "Bescherm mijn gegevens met de DSP"}</button>
            <button id="btn-ignore">${selectedLang === 'fr' ? "Ignorer et espérer que ça n’arrive jamais" : "Negeer en hoop dat het nooit gebeurt"}</button>
        `;

        // Ajoute les écouteurs d'événements aux nouveaux boutons
        const btnIgnore = choiceSelection.querySelector('#btn-ignore');
        const btnProtect = choiceSelection.querySelector('#btn-protect');

        // S'assure de retirer les écouteurs précédents pour éviter les duplications
        if (btnIgnore) btnIgnore.removeEventListener('click', handleIgnore);
        if (btnProtect) btnProtect.removeEventListener('click', handleProtect);

        btnIgnore.addEventListener('click', handleIgnore);
        btnProtect.addEventListener('click', handleProtect);

        choiceSelection.style.display = 'flex'; // Assure que le conteneur est en flex pour le layout
        choiceSelection.classList.add('show'); // Rend la div des choix visible avec transition
        console.log("showChoices: Choix affichés");
    });
}

/**
 * Gère le choix "Ignorer".
 */
async function handleIgnore() {
    console.log("handleIgnore: Choix Ignorer sélectionné");

    fadeOutElement(choiceSelection, async () => { // Masque les boutons de choix
        console.log("handleIgnore: choiceSelection masqué.");
        const symbol = '&#x2620;'; // Symbole de la tête de mort
        const message = selectedLang === 'fr' ? "Mauvaise idée, tu devrais aller voir un vendeur." : "Slecht idee, je zou een verkoper moeten spreken.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'red'; // Couleur rouge pour la tête de mort
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure'); // Supprime les classes de succès/échec précédentes

        choiceResult.style.display = 'flex'; // Assure que le conteneur est en flex pour le layout
        choiceResult.classList.add('show'); // Affiche le résultat avec transition
        console.log("handleIgnore: Résultat affiché (Tête de mort)");
    });
}

/**
 * Gère le choix "Protéger".
 */
async function handleProtect() {
    console.log("handleProtect: Choix Protéger sélectionné");

    fadeOutElement(choiceSelection, async () => { // Masque les boutons de choix
        console.log("handleProtect: choiceSelection masqué.");
        const symbol = '&#x1F6E1;'; // Symbole du bouclier (unicode emoji)
        const message = selectedLang === 'fr' ? "Bonne idée, approche-toi d'un vendeur." : "Goed idee, spreek een verkoper aan.";

        document.getElementById('choice-result-symbol').innerHTML = symbol;
        document.getElementById('choice-result-symbol').style.color = 'green'; // Couleur verte pour le bouclier
        document.getElementById('choice-result-message').textContent = message;

        choiceResult.classList.remove('success', 'failure'); // Supprime les classes de succès/échec précédentes

        choiceResult.style.display = 'flex'; // Assure que le conteneur est en flex pour le layout
        choiceResult.classList.add('show'); // Affiche le résultat avec transition
        console.log("handleProtect: Résultat affiché (Bouclier)");
    });
}

/**
 * Orchestre la séquence principale de l'animation : affichage des infos, selfie, puis introduction DSP.
 */
async function showAnimation() {
    console.log("showAnimation: Démarrage de l'animation");
    const { device, browser, os } = await getDeviceInfo();

    const initialPhrases = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", "Et pourtant voilà ce qu’on a récupéré de ton appareil…"]
        : ["Denk je dat je beschermd bent?", "Dit hebben we gevonden:"];

    const deviceInfoPhrases = selectedLang === 'fr'
        ? [`Identifiant Appareil : ${device}`, `Système : ${os}`, `Navigateur : ${browser}`]
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
    const selfieDisplayed = await takeSelfie(); // Appel de la fonction takeSelfie modifiée

    if (selfieDisplayed) {
        console.log("showAnimation: Selfie affiché. Attente...");
        await new Promise(resolve => setTimeout(resolve, 4000)); // Photo affichée plus longtemps
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
 * Prend une photo du client via la webcam, l'affiche avec des messages,
 * et ne montre pas le flux vidéo en direct à l'utilisateur.
 * La photo est affichée dans un cadre centré, non plein écran.
 * @returns {Promise<boolean>} Vrai si la selfie a été prise et affichée, faux sinon.
 */
async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    // Nettoyer le conteneur avant de commencer pour éviter les résidus
    container.innerHTML = "";

    try {
        // Ces styles sont maintenant principalement gérés par le CSS pour #selfieContainer
        // On s'assure juste que le conteneur est visible pour la transition
        container.style.display = "flex"; // S'assurer que le conteneur est visible
        container.style.opacity = 1;

        // Obtenir le flux vidéo de la caméra frontale
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // Important pour la lecture automatique sur iOS
        await video.play(); // Démarrer la lecture pour que le stream soit actif et qu'une image soit disponible

        // Attendre un très court instant pour que le flux vidéo soit stable et qu'une image soit prête
        await new Promise(resolve => setTimeout(resolve, 300)); // Délai réduit pour une capture quasi instantanée

        // Créer un élément canvas pour capturer l'image du flux vidéo
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; // Assure que le canvas a la même résolution que la vidéo
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Dessine l'image de la vidéo sur le canvas

        // Arrêter le flux de la caméra immédiatement après la capture pour libérer les ressources
        stream.getTracks().forEach(track => track.stop());

        // Convertir l'image du canvas en URL de données (Base64)
        const imgData = canvas.toDataURL("image/png");

        // Messages à afficher au-dessus et en dessous de la photo, en fonction de la langue sélectionnée
        const message = selectedLang === 'fr'
            ? "Et ça, c’est ta tête quand tu réalises que tes infos sont pas si protégées…"
            : "En dit is je gezicht als je beseft dat je gegevens niet zo veilig zijn…";
        const disclaimer = selectedLang === 'fr'
            ? "Rien n’est stocké, pas de panique."
            : "Niets wordt opgeslagen, geen paniek.";

        // Remplir le conteneur 'selfieContainer' avec le NOUVEAU CADRE (div.selfie-frame)
        container.innerHTML = `
            <div class="selfie-frame">
                <p class="selfie-message">${message}</p>
                <img src="${imgData}" alt="Selfie" class="selfie-image">
                <p class="selfie-disclaimer">${disclaimer}</p>
            </div>
        `;

        // Force un reflow pour s'assurer que les styles CSS sont appliqués à l'image avant l'affichage
        // (utile si des transitions ou animations CSS sont déclenchées à l'ajout de l'image)
        const selfieImage = container.querySelector('.selfie-image');
        if (selfieImage) void selfieImage.offsetWidth;

        selfieTaken = true; // Indique que la selfie a été prise avec succès

    } catch (err) {
        // Gérer les erreurs (ex: accès caméra refusé par l'utilisateur)
        console.warn("Accès caméra refusé ou erreur :", err);
        container.innerHTML = ""; // Nettoie le conteneur
        container.style.display = "none"; // Masque le conteneur en cas d'erreur
    }

    return selfieTaken; // Retourne l'état de la prise de selfie
}

// Initialisation de l'application : configure les boutons de sélection de langue au chargement de la page
setupLanguageButtons();