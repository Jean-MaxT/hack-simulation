document.addEventListener("DOMContentLoaded", () => {
    const config = {
        fr: {
            initialPhrases: ["Tu penses être protégé ?", "Et pourtant, voilà ce qu'on a récupéré sur ton appareil…"],
            deviceInfo: (device, os, browser) => [`APPAREIL : ${device}`, `SYSTÈME : ${os}`, `MapsUR : ${browser}`],
            finalPhrases: ["Un hacker mettrait 30 secondes à faire pire.", "C'est pour ça qu'on a créé le Digital Service Pack."],
            selfieMessage: "Et ça, c'est ta tête quand tu réalises que tes infos sont accessibles…",
            selfieDisclaimer: "Rassure-toi, rien n'est enregistré.",
            choicePrompt: "Maintenant que tu sais ça...",
            protectButton: "Protéger mes données avec le DSP",
            ignoreButton: "Ignorer et espérer que ça n'arrive jamais",
            protectResult: "Bonne idée, approche-toi d'un vendeur.",
            ignoreResult: "Mauvaise idée, tu devrais aller voir un vendeur.",
            genericDeviceName: "Cet appareil"
        },
        nl: {
            initialPhrases: ["Denk je dat je beschermd bent?", "En toch, dit is wat we van je toestel hebben gehaald…"],
            deviceInfo: (device, os, browser) => [`TOESTEL: ${device}`, `SYSTEEM: ${os}`, `BROWSER: ${browser}`],
            finalPhrases: ["Een hacker zou in 30 seconden erger doen.", "Daarom hebben we het Digital Service Pack ontwikkeld."],
            selfieMessage: "En dat is jouw gezicht als je beseft dat je gegevens toegankelijk zijn…",
            selfieDisclaimer: "Wees gerust, er wordt niets opgeslagen.",
            choicePrompt: "Nu je dit weet…",
            protectButton: "Mijn gegevens beschermen met de DSP",
            ignoreButton: "Negeren en hopen dat het nooit gebeurt",
            protectResult: "Goed idee, spreek een verkoper aan.",
            ignoreResult: "Slecht idee, je kan beter een verkoper aanspreken.",
            genericDeviceName: "Dit toestel"
        }
    };

    const dom = {
        matrix: document.getElementById('matrix-container'),
        language: document.getElementById('language-selection'),
        text: document.getElementById('text'),
        textContent: document.getElementById('content'),
        selfie: document.getElementById('selfie-container'),
        choice: document.getElementById('choice-selection'),
        result: document.getElementById('result-container'),
        resultSymbol: document.getElementById('result-symbol'),
        resultMessage: document.getElementById('result-message'),
    };

    let selectedLang = 'fr';

    const show = (element) => {
        if (!element) return;
        element.style.display = 'flex';
        requestAnimationFrame(() => element.classList.add('visible'));
    };

    const hide = (element, callback) => {
        if (!element) {
            if (callback) callback();
            return;
        }
        element.classList.remove('visible');
        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, 600);
    };

    // Fonction de frappe promise-based pour un meilleur contrôle avec async/await
    const typeText = (text, element, append = false) => {
        return new Promise(resolve => {
            if (!append) {
                element.innerHTML = '';
            }
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 30); // Vitesse de frappe réglée à 30ms
        });
    };
    
    const getDeviceInfo = () => {
        try {
            const parser = new UAParser();
            const device = parser.getDevice();
            const os = parser.getOS();
            const browser = parser.getBrowser();
            
            // Sur desktop, le modèle est souvent vide. On se rabat sur le nom générique.
            const deviceName = `${device.vendor || ''} ${device.model || ''}`.trim() || config[selectedLang].genericDeviceName;
            const osName = `${os.name || ''} ${os.version || ''}`.trim() || 'OS Inconnu';
            const browserName = browser.name || 'Navigateur Inconnu';

            return { device: deviceName, os: osName, browser: browserName };
        } catch (e) {
            console.error("Erreur détection appareil:", e);
            return { device: config[selectedLang].genericDeviceName, os: 'Inconnu', browser: 'Inconnu' };
        }
    };

    const runExperience = async () => {
        const texts = config[selectedLang];
        const deviceInfo = getDeviceInfo();

        // Fonction pour afficher des phrases l'une après l'autre (en effaçant la précédente)
        const showLinesSequentially = async (lines, onComplete) => {
            show(dom.text);
            for (const line of lines) {
                await typeText(line, dom.textContent);
                await new Promise(res => setTimeout(res, 1200)); // Pause entre les lignes
            }
            if (onComplete) onComplete();
        };
        
        // Nouvelle fonction pour taper les infos de l'appareil ligne par ligne
        const typeMultiLinesSequentially = async (lines, onComplete) => {
            show(dom.text);
            dom.textContent.innerHTML = ''; // Vide le conteneur
            
            let firstLine = true;
            for (const line of lines) {
                if (!firstLine) {
                    dom.textContent.innerHTML += '<br>';
                }
                await typeText(line, dom.textContent, true); // Le 'true' signifie "append" (ajouter)
                firstLine = false;
            }
            if (onComplete) onComplete();
        };

        const takeSelfie = (onComplete) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn("API Média non supportée.");
                if (onComplete) onComplete();
                return;
            }
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
                .then(stream => {
                    const video = document.createElement("video");
                    video.srcObject = stream;
                    video.onloadeddata = () => video.play();
                    
                    setTimeout(() => {
                        const canvas = document.createElement("canvas");
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext("2d").drawImage(video, 0, 0);
                        stream.getTracks().forEach(track => track.stop());

                        dom.selfie.innerHTML = `<div class="selfie-frame"><p class="selfie-message">${texts.selfieMessage}</p><img src="${canvas.toDataURL("image/jpeg")}" alt="Selfie" class="selfie-image"/><p class="selfie-disclaimer">${texts.selfieDisclaimer}</p></div>`;
                        show(dom.selfie);
                        if (onComplete) setTimeout(onComplete, 4000);
                    }, 500);
                })
                .catch(error => {
                    console.warn("Selfie impossible:", error);
                    if (onComplete) onComplete();
                });
        };

        const showFinalChoices = () => {
            dom.choice.innerHTML = `<p class="choice-prompt">${texts.choicePrompt}</p><div class="choices-wrapper"><button data-choice="protect">${texts.protectButton}</button><button data-choice="ignore">${texts.ignoreButton}</button></div>`;
            show(dom.choice);
            
            dom.choice.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') return;
                
                const isProtect = e.target.dataset.choice === 'protect';
                hide(dom.choice, () => {
                    dom.resultSymbol.innerHTML = isProtect ? '&#x1F6E1;' : '&#x2620;';
                    dom.resultSymbol.style.color = isProtect ? '#2ecc71' : '#e74c3c';
                    dom.resultMessage.textContent = isProtect ? texts.protectResult : texts.ignoreResult;
                    show(dom.result);
                });
            }, { once: true });
        };

        // --- DÉROULEMENT DE L'EXPÉRIENCE ---
        show(dom.matrix);
        for (let i = 0; i < 100; i++) {
            const char = document.createElement("span");
            char.className = "matrix-number";
            char.textContent = Math.round(Math.random());
            char.style.left = `${Math.random() * 100}%`;
            char.style.top = `${Math.random() * 100}%`;
            char.style.animationDelay = `${Math.random() * 2}s`;
            char.style.fontSize = `${Math.random() * 1.5 + 0.5}rem`;
            dom.matrix.appendChild(char);
        }

        await showLinesSequentially(texts.initialPhrases);
        
        hide(dom.text, async () => {
            await typeMultiLinesSequentially(texts.deviceInfo(deviceInfo.device, deviceInfo.os, deviceInfo.browser));
            await new Promise(res => setTimeout(res, 4000)); // Pause de 4s
            
            hide(dom.text, () => {
                takeSelfie(() => {
                    hide(dom.selfie, async () => {
                        await showLinesSequentially(texts.finalPhrases);
                        hide(dom.text, showFinalChoices);
                    });
                });
            });
        });
    };

    const init = () => {
        show(dom.language);
        dom.language.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            selectedLang = button.dataset.lang;
            dom.language.querySelectorAll('button').forEach(b => b.disabled = true);
            hide(dom.language, runExperience);
        });
    };

    init();
});