let selectedLang = 'fr'; // Par défaut

const phrasesFR = [
    "Et voilà, on sait déjà qui tu es.",
    "Et si c’était tes mots de passe ?",
    "Ou ta carte bancaire ?",
    "Ton téléphone, c’est une porte ouverte."
];

const phrasesNL = [
    "En zo weten we al wie je bent.",
    "En als het je wachtwoorden waren?",
    "Of je bankkaart?",
    "Je telefoon is een open deur."
];

const textElement = document.getElementById("content");

function getDeviceInfo() {
    const parser = new UAParser();
    const result = parser.getResult();

    const device = result.device.model || result.device.vendor || "Appareil inconnu";
    const os = result.os.name ? `${result.os.name} ${result.os.version || ""}` : "Système inconnu";
    const browser = result.browser.name ? `${result.browser.name} ${result.browser.version || ""}` : "Navigateur inconnu";

    return { device, os, browser };
}

// Typing effect qui ajoute ligne par ligne (sans saut de ligne final sur la dernière)
function typeTextAppendLine(text, isLastLine, callback) {
    let index = 0;
    let currentContent = textElement.innerHTML.replace(/<br>/g, "\n");

    function typeChar() {
        if (index < text.length) {
            currentContent += text[index];
            textElement.innerHTML = currentContent.replace(/\n/g, "<br>");
            index++;
            setTimeout(typeChar, 30);
        } else {
            if (!isLastLine) {
                currentContent += "\n";
                textElement.innerHTML = currentContent.replace(/\n/g, "<br>");
            }
            callback();
        }
    }

    typeChar();
}

// Typing effect classique (efface avant de taper)
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

// Effet fondu pour effacer texte (passe opacity à 0)
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

function showAnimation() {
    const { device, browser, os } = getDeviceInfo();

    const infoLines = [
        `Appareil détecté : ${device}`,
        `Système : ${os}`,
        `Navigateur : ${browser}`
    ];

    const phrases = selectedLang === 'fr' ? phrasesFR : phrasesNL;

    function showInfoLines(index) {
        if (index >= infoLines.length) {
            // Ajout du fondu avant de passer aux phrases
            setTimeout(() => {
                fadeOutText(() => {
                    showPhrases(0);
                });
            }, 1000);
            return;
        }

        typeTextAppendLine(infoLines[index], index === infoLines.length -1, () => {
            setTimeout(() => {
                showInfoLines(index + 1);
            }, 900);
        });
    }


    function showPhrases(i) {
        if (i >= phrases.length) {
            showCard();
            return;
        }

        typeText(phrases[i], () => {
            setTimeout(() => {
                fadeOutText(() => {
                    showPhrases(i + 1);
                });
            }, 
            1200);
        });
    }

    showInfoLines(0);
}

function showCard() {
    const textDiv = document.getElementById("text");
    const cardDiv = document.getElementById("rewardCard");

    textDiv.style.display = "none";
    cardDiv.style.display = "flex";

    setTimeout(() => {
        cardDiv.classList.add("show");
    }, 100);

    const cardInner = document.getElementById("cardInner");
    cardInner.addEventListener("click", () => {
        cardInner.classList.toggle("flipped");
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

function startAnimation() {
    document.getElementById("language-selection").style.display = "none";
    document.getElementById("text").style.display = "block";
    document.getElementById("rewardCard").style.display = "none";
    document.getElementById("rewardCard").classList.remove("show");
    document.getElementById("cardInner").classList.remove("flipped");
    textElement.innerHTML = "";
    showAnimation();
}

// Initialisation
setupLanguageButtons();