document.addEventListener("DOMContentLoaded", () => {
    const config = {
        fr: {
            initialPhrases: ["Tu penses être protégé ?", "Et pourtant, voilà ce qu'on a récupéré sur ton appareil…"],
            deviceInfo: (device, os, browser) => [ `APPAREIL : ${device}`, `SYSTÈME : ${os}`, `MapsUR : ${browser}` ],
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
            deviceInfo: (device, os, browser) => [ `TOESTEL: ${device}`, `SYSTEEM: ${os}`, `BROWSER: ${browser}` ],
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
        screens: {
            matrix: document.getElementById('matrix-container'),
            language: document.getElementById('language-screen'),
            text: document.getElementById('text-screen'),
            selfie: document.getElementById('selfie-screen'),
            choice: document.getElementById('choice-screen'),
            result: document.getElementById('result-screen'),
        },
        textContent: document.getElementById('text-content'),
        cursor: document.querySelector('.cursor'),
        resultSymbol: document.getElementById('result-symbol'),
        resultMessage: document.getElementById('result-message'),
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const showScreen = (element) => element.classList.add('is-visible');
    const hideScreen = async (element) => {
        element.classList.remove('is-visible');
        await delay(600);
    };

    const typeText = (text) => {
        return new Promise(resolve => {
            let i = 0;
            dom.textContent.innerHTML = "";
            dom.cursor.style.display = 'inline-block';
            const interval = setInterval(() => {
                if (i < text.length) {
                    dom.textContent.innerHTML += text.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    dom.cursor.style.display = 'none';
                    resolve();
                }
            }, 30);
        });
    };

    const getDeviceInfo = async () => {
        try {
            const parser = new UAParser();
            const result = parser.getResult();
            let device = `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || 'Appareil générique';
            if (device === 'Appareil générique') {
                 if (result.os.name?.toLowerCase().includes('android')) device = 'Appareil Android';
                 if (result.os.name?.toLowerCase().includes('ios')) device = 'iPhone';
            }
            return {
                device,
                os: `${result.os.name || ''} ${result.os.version || ''}`.trim() || 'OS Inconnu',
                browser: result.browser.name || 'Navigateur Inconnu'
            };
        } catch (e) { return { device: 'Appareil', os: 'Inconnu', browser: 'Inconnu' }; }
    };

    const runExperience = async (lang) => {
        const texts = config[lang];

        showScreen(dom.screens.matrix);
        await delay(100);
        for (let i = 0; i < 100; i++) {
            const char = document.createElement("span");
            char.className = "matrix-number";
            char.textContent = Math.round(Math.random());
            char.style.left = `${Math.random() * 100}%`;
            char.style.top = `${Math.random() * 100}%`;
            char.style.animationDelay = `${Math.random() * 2}s`;
            dom.screens.matrix.appendChild(char);
        }
        
        for (const phrase of texts.initialPhrases) {
            showScreen(dom.screens.text);
            await typeText(phrase);
            await delay(1500);
            await hideScreen(dom.screens.text);
        }

        const deviceInfo = await getDeviceInfo();
        const infoLines = texts.deviceInfo(deviceInfo.device, deviceInfo.os, deviceInfo.browser);
        showScreen(dom.screens.text);
        dom.screens.text.style.textAlign = 'left';
        for (let i = 0; i < infoLines.length; i++) {
            await typeText(infoLines[i]);
            if (i < infoLines.length - 1) dom.textContent.innerHTML += '<br>';
            await delay(500);
        }
        await delay(4000);
        await hideScreen(dom.screens.text);
        dom.screens.text.style.textAlign = 'center';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            const video = document.createElement("video");
            video.srcObject = stream;
            video.onloadeddata = () => video.play();
            await delay(500);
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d").drawImage(video, 0, 0);
            stream.getTracks().forEach(track => track.stop());
            
            dom.screens.selfie.innerHTML = `
                <div class="selfie-frame">
                    <p class="selfie-message">${texts.selfieMessage}</p>
                    <img src="${canvas.toDataURL("image/jpeg")}" alt="Selfie" class="selfie-image"/>
                    <p class="selfie-disclaimer">${texts.selfieDisclaimer}</p>
                </div>`;
            showScreen(dom.screens.selfie);
            await delay(4000);
            await hideScreen(dom.screens.selfie);
        } catch (error) { console.warn("Selfie impossible:", error); }

        for (const phrase of texts.finalPhrases) {
            showScreen(dom.screens.text);
            await typeText(phrase);
            await delay(1500);
            await hideScreen(dom.screens.text);
        }

        dom.screens.choice.innerHTML = `
            <p class="choice-prompt">${texts.choicePrompt}</p>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                <button data-choice="protect">${texts.protectButton}</button>
                <button data-choice="ignore">${texts.ignoreButton}</button>
            </div>`;
        showScreen(dom.screens.choice);
        
        dom.screens.choice.addEventListener('click', async (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const choice = e.target.dataset.choice;
            const isProtect = choice === 'protect';
            
            await hideScreen(dom.screens.choice);
            
            dom.resultSymbol.innerHTML = isProtect ? '&#x1F6E1;' : '&#x2620;';
            dom.resultSymbol.style.color = isProtect ? '#2ecc71' : '#e74c3c';
            dom.resultMessage.textContent = isProtect ? texts.protectResult : texts.ignoreResult;
            showScreen(dom.screens.result);
        }, { once: true });
    };

    const init = () => {
        showScreen(dom.screens.language);
        dom.screens.language.addEventListener('click', async (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const lang = e.target.dataset.lang;
            if (!lang) return;
            dom.screens.language.querySelectorAll('button').forEach(b => b.disabled = true);
            await hideScreen(dom.screens.language);
            runExperience(lang);
        });
    };

    init();
});