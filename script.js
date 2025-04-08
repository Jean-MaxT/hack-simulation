let selectedLang = '';

// Sélection de la langue
document.getElementById('btn-fr').addEventListener('click', () => {
    selectedLang = 'fr';
    updateCardText();
    startAnimation();
});

document.getElementById('btn-nl').addEventListener('click', () => {
    selectedLang = 'nl';
    updateCardText();
    startAnimation();
});

// Phrases pour les animations
const phrases = {
    fr: [
        "Attends...",
        "Tu viens vraiment de scanner ce QR code sans protection ?",
        "T'as de la chance, je ne vais pas voler tes données aujourd'hui.",
        "C'est si facile de voler des données, tu devrais les protéger.",
        "J'ai quelque chose pour toi, regarde ça..."
    ],
    nl: [
        "Wacht...",
        "Heb je echt deze QR-code gescand zonder bescherming?",
        "Je hebt geluk, ik ga je gegevens vandaag niet stelen.",
        "Het is zo makkelijk om gegevens te stelen, je zou ze moeten beschermen.",
        "Ik heb iets voor je, kijk hier naar..."
    ]
};

let index = 0, charIndex = 0;
const textElement = document.getElementById("content");

function startAnimation() {
    // Masque les boutons et autres éléments
    document.getElementById('language-selection').style.display = 'none';
    document.getElementById('text').style.display = 'block';
    document.querySelector('.logo-glitch').style.display = 'block';
    document.querySelector('.logo-glitch').style.animation = 'glitchLogo 2.5s infinite steps(1)';
    document.querySelector('.logo-no-glitch').style.display = 'none';

    createMatrixEffect();
    typeText();
}

function typeText() {
    const phrase = phrases[selectedLang][index];

    if (charIndex < phrase.length) {
        textElement.innerHTML += phrase.charAt(charIndex);
        charIndex++;
        setTimeout(typeText, 25);
    } else {
        // Attends un petit moment avant de lancer l'effacement
        setTimeout(() => {
            eraseText(); // → ne lance qu'une fois la phrase finie
        }, 1750);
    }
}


function eraseText() {
    textElement.classList.add('fade-out');
    charIndex = 0; // important pour la prochaine phrase

    setTimeout(() => {
        textElement.innerHTML = '';
        textElement.classList.remove('fade-out');

        index++;
        if (index < phrases[selectedLang].length) {
            setTimeout(typeText, 200); // petite pause avant d'enchaîner
        } else {
            setTimeout(() => {
                document.querySelector('.cursor').style.display = 'none';
                const rewardCard = document.getElementById('rewardCard');
                rewardCard.style.display = 'flex';
                rewardCard.classList.add('show');
                updateCardText();
            }, 800);
        }
    }, 600); // temps pour laisser l'effet de fondu
}

function createMatrixEffect() {
    const matrix = document.createElement("div");
    matrix.classList.add("matrix");
    document.body.appendChild(matrix);

    function spawnNumbers() {
        matrix.innerHTML = "";
        for (let i = 0; i < 60; i++) {
            let span = document.createElement("span");
            span.textContent = Math.floor(Math.random() * 10);
            span.style.left = Math.random() * 100 + "vw";
            span.style.top = Math.random() * 100 + "vh";
            span.style.animationDuration = (Math.random() * 2 + 0.5) + "s";
            span.style.animationDelay = (Math.random() * 2) + "s";
            span.classList.add("matrix-number");

            matrix.appendChild(span);

            setInterval(() => {
                span.textContent = Math.floor(Math.random() * 10);
            }, Math.random() * 1000 + 500);
        }
    }

    spawnNumbers();
}

// Activation du retournement de la carte
document.getElementById('cardInner').addEventListener('click', () => {
    document.getElementById('cardInner').classList.toggle('flipped');
    // Ajout de la classe 'rotate-border' pour appliquer la bordure lumineuse continue pendant le retournement
    document.getElementById('rewardCard').classList.add('rotate-border');
});

// Fonction pour changer le texte de la carte en fonction de la langue sélectionnée
function updateCardText() {
    const cardText = document.getElementById('card-text');
    
    if (selectedLang === 'nl') {
        cardText.textContent = 'Klik hier en toon deze kaart aan een verkoper';
    } else {
        cardText.textContent = 'Clique ici et présente cette carte à un vendeur';
    }
}