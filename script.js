let selectedLang = 'fr';

const textElement = document.getElementById("content");
const textContainer = document.getElementById("text");

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
 * @returns {Promise<{device: string, browser: string, os: string}>}
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
 * @param {string} textToType
 * @param {function} callback
 * @param {boolean} [clearBefore=true]
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
 * @param {function} callback
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
 * @param {HTMLElement} element
 * @param {function} callback
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
        element.classList.remove('show');
        element.classList.remove('show-selfie');
        callback();
    }, 600);
}

/**
 * @param {HTMLElement} element
 * @param {function} callback
 */
function fadeInElement(element, callback) {
    if (!element) {
        callback();
        return;
    }
    element.style.display = "flex";
    element.offsetHeight;
    element.classList.add('show-selfie');
    setTimeout(() => {
        callback();
    }, 800);
}

/**
 * @param {string[]} lines
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
 * @param {string[]} lines
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

async function showChoices() {
    console.log("showChoices: Démarrage");
    fadeOutElement(textContainer, () => {
        console.log("showChoices: textContainer masqué.");
        choiceSelection.innerHTML = `
            <p class="choice-prompt">${selectedLang === 'fr' ? "Maintenant que tu sais ça…" : "Nu je dit weet…"}</p>
            <button id="btn-protect" type="button"><span>${selectedLang === 'fr' ? "Protéger mes données avec le DSP" : "Bescherm mijn gegevens met de DSP"}</span></button>
            <button id="btn-ignore" type="button"><span>${selectedLang === 'fr' ? "Ignorer et espérer que ça n'arrive jamais" : "Negeer en hoop dat het nooit gebeurt"}</span></button>
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

async function showAnimation() {
    console.log("showAnimation: Démarrage de l'animation");
    const { device, browser, os } = await getDeviceInfo();

    const initialPhrases = selectedLang === 'fr'
        ? ["Tu penses être protégé ?", "Et pourtant voilà ce qu'on a récupéré de ton appareil…"]
        : ["Denk je dat je beschermd bent?", "Dit hebben we gevonden:"];

    const deviceInfoPhrases = selectedLang === 'fr'
        ? [`Identifiant Appareil : ${device}`, `Système : ${os}`, `Navigateur : ${browser}`]
        : [`Apparaat: ${device}`, `Systeem: ${os}`, `Browser: ${browser}`];

    const introAfterPhrases = selectedLang === 'fr'
        ? ["Un hacker mettrait 30 secondes à faire pire.", "C'est pour ça qu'on a créé le Digital Service Pack."]
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
    const selfieDisplayed = await takeSelfie();

    if (selfieDisplayed) {
        console.log("showAnimation: Selfie affiché. Attente...");
        await new Promise(resolve => setTimeout(resolve, 4000));
        await new Promise(resolve => fadeOutElement(selfieContainer, () => {
            selfieContainer.innerHTML = "";
            resolve();
        }));
        console.log("showAnimation: Selfie masqué.");
    } else {
        console.log("showAnimation: Pas de selfie ou erreur caméra, passage direct à la suite.");
    }

    textContainer.style.display = "block";
    textElement.innerHTML = "";

    await showLinesSequentially(introAfterPhrases);
    console.log("showAnimation: Phrases d'introduction DSP terminées.");
    await new Promise(resolve => setTimeout(() => fadeOutText(() => {
        showChoices();
        resolve();
    }), 1000));
    console.log("showAnimation: Transition vers les choix.");
}

function setupLanguageButtons() {
    document.getElementById("language-selection").classList.add('show');

    document.getElementById("btn-fr").addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedLang = 'fr';
        fadeOutElement(document.getElementById("language-selection"), startAnimation);
    });

    document.getElementById("btn-nl").addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedLang = 'nl';
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

/**
@returns {Promise<boolean>}
 */

async function takeSelfie() {
    const container = document.getElementById("selfieContainer");
    let selfieTaken = false;

    container.innerHTML = "";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true);

        const tempVideoContainer = document.createElement('div');
        tempVideoContainer.style.position = 'fixed';
        tempVideoContainer.style.left = '-9999px';
        tempVideoContainer.style.top = '-9999px';
        tempVideoContainer.style.opacity = '0';
        document.body.appendChild(tempVideoContainer);
        tempVideoContainer.appendChild(video);

        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop());
        tempVideoContainer.remove();

        const imageDataURL = canvas.toDataURL("image/png");

        const selfieMessageText = selectedLang === 'fr'
            ? "Et ça, c'est ta tête quand tu réalises que tes infos sont pas si protégées…"
            : "En dit is je gezicht als je beseft dat je gegevens niet zo veilig zijn…";
        const selfieDisclaimerText = selectedLang === 'fr'
            ? "Rien n'est stocké, pas de panique."
            : "Niets wordt opgeslagen, geen paniek.";

        const selfieFrame = document.createElement('div');
        selfieFrame.className = 'selfie-frame';

        const selfieMessage = document.createElement('div');
        selfieMessage.className = 'selfie-message';
        selfieMessage.textContent = selfieMessageText;

        const selfieImage = document.createElement('img');
        selfieImage.className = 'selfie-image';
        selfieImage.src = imageDataURL;
        selfieImage.alt = selectedLang === 'fr' ? "Selfie de votre webcam" : "Webcam selfie";

        const selfieDisclaimer = document.createElement('div');
        selfieDisclaimer.className = 'selfie-disclaimer';
        selfieDisclaimer.textContent = selfieDisclaimerText;

        selfieFrame.appendChild(selfieMessage);
        selfieFrame.appendChild(selfieImage);
        selfieFrame.appendChild(selfieDisclaimer);
        container.appendChild(selfieFrame);

        await new Promise(resolve => fadeInElement(container, resolve));
        selfieTaken = true;

    } catch (error) {
        console.warn("Erreur lors de la prise de selfie (caméra inaccessible ou autre) :", error);
        container.innerHTML = "";
        container.style.display = "none";
        selfieTaken = false;
    }

    return selfieTaken;
}

document.addEventListener("DOMContentLoaded", () => {
    setupLanguageButtons();
});