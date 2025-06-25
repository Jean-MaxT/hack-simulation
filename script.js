document.addEventListener("DOMContentLoaded", () => {
    const config = {
        fr: {
            initialPhrases: ["Tu penses être protégé ?", "Et pourtant, voilà ce qu'on a récupéré sur ton appareil…"],
            deviceInfo: (device, os, browser, battery) => [`APPAREIL : ${device}`, `SYSTÈME : ${os}`, `MapsUR : ${browser}`, `BATTERIE : ${battery}`],
            finalPhrases: ["Un hacker mettrait 30 secondes à faire pire.", "C'est pour ça qu'on a créé le Digital Service Pack."],
            selfieMessage: "Et ça, c'est ta tête quand tu réalises que tes infos sont accessibles…",
            selfieDisclaimer: "Rassure-toi, rien n'est enregistré.",
            choicePrompt: "Maintenant que tu sais ça...",
            protectButton: "Protéger mes données avec le DSP",
            ignoreButton: "Ignorer et espérer que ça n'arrive jamais",
            protectResult: "Bonne idée, approche-toi d'un vendeur.",
            ignoreResult: "Mauvaise idée, tu devrais aller voir un vendeur."
        },
        nl: {
            initialPhrases: ["Denk je dat je beschermd bent?", "En toch, dit is wat we van je toestel hebben gehaald…"],
            deviceInfo: (device, os, browser, battery) => [`TOESTEL: ${device}`, `SYSTEEM: ${os}`, `BROWSER: ${browser}`, `BATTERIJ: ${battery}`],
            finalPhrases: ["Een hacker zou in 30 seconden erger doen.", "Daarom hebben we het Digital Service Pack ontwikkeld."],
            selfieMessage: "En dat is jouw gezicht als je beseft dat je gegevens toegankelijk zijn…",
            selfieDisclaimer: "Wees gerust, er wordt niets opgeslagen.",
            choicePrompt: "Nu je dit weet…",
            protectButton: "Mijn gegevens beschermen met de DSP",
            ignoreButton: "Negeren en hopen dat het nooit gebeurt",
            protectResult: "Goed idee, spreek een verkoper aan.",
            ignoreResult: "Slecht idee, je kan beter een verkoper aanspreken."
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
        setTimeout(() => {
            element.classList.add('visible');
        }, 20);
    };

    const hide = (element, callback) => {
        if (!element || !element.classList.contains('visible')) {
            if (callback) callback();
            return;
        }
        element.classList.remove('visible');
        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, 600);
    };
    
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
            }, 30);
        });
    };
    
    const getDeviceInfo = () => {
        try {
            const parser = new UAParser();
            const result = parser.getResult();
            
            const osName = (result.os && result.os.name) ? result.os.name : "OS Inconnu";
            const browserName = (result.browser && result.browser.name) ? result.browser.name : "Navigateur Inconnu";
            const browserVersion = (result.browser && result.browser.major) ? result.browser.major : "";
            let deviceVendor = (result.device && result.device.vendor) ? result.device.vendor : "";
            
            let finalDeviceName = "";

            // Priorité 1: On essaie d'obtenir une marque de confiance (plus de 2 lettres)
            if (deviceVendor && deviceVendor.length > 2) {
                finalDeviceName = deviceVendor;
            } 
            
            // Priorité 2 (Plan B): Si on n'a rien trouvé, on se base sur l'OS
            if (!finalDeviceName) {
                if (osName.includes("Android")) {
                    finalDeviceName = "Appareil Android";
                } else if (osName.includes("iOS")) {
                    finalDeviceName = "iPhone"; // Pour Apple, on peut être plus précis
                } else if (osName.includes("Windows")) {
                    finalDeviceName = "PC Windows";
                } else if (osName.includes("Mac OS")) {
                    finalDeviceName = "Mac";
                } else {
                    finalDeviceName = "Appareil"; // Dernier recours
                }
            }

            return {
                device: finalDeviceName,
                os: osName,
                browser: `${browserName} ${browserVersion}`.trim()
            };
        } catch (error) {
            return { device: "Appareil", os: "Inconnu", browser: "Inconnu" };
        }
    };

    const getBatteryInfo = async () => {
        if (!('getBattery' in navigator)) {
            return "Non détectée";
        }
        try {
            const battery = await navigator.getBattery();
            const level = Math.round(battery.level * 100);
            const charging = battery.charging ? " (en charge)" : "";
            return `${level}%${charging}`;
        } catch (error) {
            return "Non détectée";
        }
    };

    const runExperience = async () => {
        const texts = config[selectedLang];
        const deviceInfo = getDeviceInfo();
        const batteryInfo = await getBatteryInfo();

        const showLinesSequentially = async (lines) => {
            for (const line of lines) {
                show(dom.text);
                await typeText(line, dom.textContent);
                await new Promise(res => setTimeout(res, 2500));
                await new Promise(resolve => hide(dom.text, resolve));
                await new Promise(res => setTimeout(res, 300));
            }
        };
        
        const typeMultiLinesSequentially = async (lines) => {
            show(dom.text);
            dom.textContent.innerHTML = '';
            
            let firstLine = true;
            for (const line of lines) {
                if (!firstLine) {
                    dom.textContent.innerHTML += '<br>';
                }
                await typeText(line, dom.textContent, true);
                firstLine = false;
            }
        };

        const takeSelfie = (onComplete) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
                .catch(() => {
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
                    const imageName = isProtect ? 'protection.png' : 'malware.png';
                    const altText = isProtect ? 'Icône de protection' : 'Icône de malware';

                    dom.resultSymbol.innerHTML = `<img src="${imageName}" alt="${altText}" class="result-icon">`;

                    dom.resultMessage.textContent = isProtect ? texts.protectResult : texts.ignoreResult;
                    show(dom.result);
                });
            }, { once: true });
        };

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
        
        await typeMultiLinesSequentially(texts.deviceInfo(deviceInfo.device, deviceInfo.os, deviceInfo.browser, batteryInfo));
        await new Promise(res => setTimeout(res, 4000));
        
        hide(dom.text, () => {
            takeSelfie(() => {
                hide(dom.selfie, async () => {
                    await showLinesSequentially(texts.finalPhrases);
                    showFinalChoices();
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