const fs = require('fs');
const path = require('path');

const translations = {
  "en": {
    "title": "Welcome to Nonogram World",
    "p1": "Nonogram World is a free online puzzle game where logic is your only tool. Each day brings a new nonogram — a grid-based picture puzzle solved through pure deduction, no guessing required.",
    "p2": "Choose your challenge: play the Daily Puzzle that resets every 24 hours for players worldwide, or start a new random game anytime. Puzzles range from compact 10×10 grids to demanding 20×20 challenges.",
    "p3": "New to nonograms? Check out our Rules & Strategy guide to learn how to read clues, apply the overlap method, and solve any puzzle step by step."
  },
  "ru": {
    "title": "Добро пожаловать в Nonogram World",
    "p1": "Nonogram World — это бесплатная онлайн-головоломка, где логика является вашим единственным инструментом. Каждый день появляется новый японский кроссворд — картинка, зашифрованная цифрами, которая решается чистой дедукцией без угадываний.",
    "p2": "Выбирайте свой уровень: играйте в Ежедневный Пазл, который обновляется каждые 24 часа для всех игроков мира, или начните случайную игру в любой момент. Размеры варьируются от компактных 10×10 до сложных полей 20×20.",
    "p3": "Впервые решаете японские кроссворды? Загляните в раздел Правила и Стратегия, чтобы узнать, как читать подсказки, применять метод перекрытия и шаг за шагом решить любой пазл."
  },
  "de": {
    "title": "Willkommen bei Nonogram World",
    "p1": "Nonogram World ist ein kostenloses Online-Puzzlespiel, bei dem Logik Ihr einziges Werkzeug ist. Jeden Tag gibt es ein neues Nonogramm — ein rasterbasiertes Bilderrätsel, das durch reine Deduktion gelöst wird, ganz ohne Raten.",
    "p2": "Wählen Sie Ihre Herausforderung: Spielen Sie das Tägliche Puzzle, das alle 24 Stunden für Spieler weltweit aktualisiert wird, oder starten Sie jederzeit ein neues zufälliges Spiel. Die Rätselgrößen reichen von kompakten 10×10 Rastern bis hin zu anspruchsvollen 20×20 Herausforderungen.",
    "p3": "Neu bei Nonogrammen? Schauen Sie in unseren Regeln & Strategie-Leitfaden, um zu erfahren, wie man Hinweise liest, die Überlappungsmethode anwendet und jedes Rätsel Schritt für Schritt löst."
  },
  "fr": {
    "title": "Bienvenue sur Nonogram World",
    "p1": "Nonogram World est un jeu de puzzle en ligne gratuit où la logique est votre seul outil. Chaque jour apporte un nouveau picross — un puzzle d'images basé sur une grille, résolu par pure déduction, sans avoir besoin de deviner.",
    "p2": "Choisissez votre défi : jouez au Puzzle Quotidien qui se réinitialise toutes les 24 heures pour les joueurs du monde entier, ou démarrez une nouvelle partie aléatoire à tout moment. Les puzzles vont des grilles compactes de 10×10 aux défis ardus de 20×20.",
    "p3": "Nouveau dans les nonogrammes ? Consultez notre guide Règles et Stratégie pour apprendre à lire les indices, appliquer la méthode de chevauchement et résoudre chaque puzzle étape par étape."
  },
  "es": {
    "title": "Bienvenido a Nonogram World",
    "p1": "Nonogram World es un juego de rompecabezas en línea gratuito donde la lógica es tu única herramienta. Cada día trae un nuevo nonograma: un rompecabezas de imágenes basado en cuadrículas que se resuelve mediante deducción pura, sin necesidad de adivinar.",
    "p2": "Elige tu desafío: juega al Rompecabezas Diario que se reinicia cada 24 horas para los jugadores de todo el mundo, o comienza un nuevo juego al azar en cualquier momento. Los rompecabezas van desde cuadrículas compactas de 10×10 hasta desafíos exigentes de 20×20.",
    "p3": "¿Nuevo en los nonogramas? Echa un vistazo a nuestra guía de Reglas y Estrategia para aprender cómo leer pistas, aplicar el método de superposición y resolver cualquier rompecabezas paso a paso."
  },
  "it": {
    "title": "Benvenuto su Nonogram World",
    "p1": "Nonogram World è un gioco di puzzle online gratuito dove la logica è il tuo unico strumento. Ogni giorno viene proposto un nuovo nonogram: un puzzle di immagini basato su griglie, risolto tramite pura deduzione, senza bisogno di tirare a indovinare.",
    "p2": "Scegli la tua sfida: gioca al Puzzle Quotidiano che si azzera ogni 24 ore per i giocatori di tutto il mondo, oppure inizia una nuova partita casuale in qualsiasi momento. I puzzle variano da griglie compatte di 10×10 a sfide impegnative di 20×20.",
    "p3": "Nuovo nei nonogram? Dai un'occhiata alla nostra guida Regole e Strategia per imparare come leggere gli indizi, applicare il metodo della sovrapposizione e risolvere ogni puzzle passo dopo passo."
  }
};

const langDir = path.join(process.cwd(), 'public', 'lang');

Object.entries(translations).forEach(([lang, values]) => {
  const filePath = path.join(langDir, \`\${lang}.json\`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.home = data.home || {};
    data.home.title = values.title;
    data.home.p1 = values.p1;
    data.home.p2 = values.p2;
    data.home.p3 = values.p3;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(\`Updated \${filePath}\`);
  }
});
