// Déclarations Globales
var afinn;
var totalScore = 0;
var actualScore; 
var tearEstimate = 0;
var tearTotal = 0;
var tearsOfJoymode = false;
var imThirsty = false;
var textinput = '';
var helpMode = false; // Suivi du mode aide
var VideoIsplaying = true;
var VideoIspaused = false;
var scoreChanged = false; // Indicateur de changement de score
var tearTotalChanged = false;
var changeColorDuration = 700; // Durée du changement de couleur
var lastScoreUpdateTime = 0; // Dernière mise à jour du score
var lastTearUpdateTime = 0;
var lastInteractionTime = 0; // Dernière interaction utilisateur
var callForHelpTriggered = false; // Suivi du mode appel à l'aide
var txt;
var isAttemptingToCry = false;
var isCrying = false;
var currentDryness = 0; // Humidité du sol
let currentDisplay = ""; // Suivi du mode d'affichage

let audioInitialized = false;

// Traductions
const translations = {
  "en": {
    "placeholder": "How do you feel ?",
    // --- displayAlert() ---
    "alertTitleLine1": "PLEASE",
    "alertTitleLine2": "MAKE",
    "alertTitleLine3": "ME",
    "alertTitleLine4": "CRY",
    "alertPressEnter": "PRESS ENTER TO HELP",

    // --- displayCallforHelp() ---
    "callTitleLine1": "PLEASE",
    "callTitleLine2": "MAKE",
    "callTitleLine3": "ME",
    "callTitleLine4": "SAD",
    "callPressEnter": "PRESS ENTER TO HELP",

    // --- displayRegularScreen() ---
    "regularTitle": "CryBot_v1",
    "regularSubTitle": "Please make me cry",
    "sentimentLabel": "SENTIMENT",
    "tearEstimateLabel": "TEAR ESTIMATE",
    "tearsAvailable": "tears available",
    "eightMLneeded": "8mL per day needed",
    "pressShiftKey": "PRESS SHIFT KEY TO SEND",
    "soilDryness": "Soil Dryness:",
    "crying": "crying...",
    "attemptingToCry": "attempting to cry",

    // --- displayHelpmodescreen() ---
    "helpNeededLine": "*the plant needs at least 8mL per day",
    "helpMe": "Please help!",

    // Tu peux ajouter ou renommer des clés selon tes besoins
  },

  "fr": {
    "placeholder": "Comment vous sentez-vous ?",
    // --- displayAlert() ---
    "alertTitleLine1": "S'IL VOUS PLAÎT",
    "alertTitleLine2": "FAITES",
    "alertTitleLine3": "MOI",
    "alertTitleLine4": "PLEURER",
    "alertPressEnter": "APPUYEZ SUR ENTRÉE POUR AIDER",

    // --- displayCallforHelp() ---
    "callTitleLine1": "S'IL VOUS PLAÎT",
    "callTitleLine2": "RENDEZ",
    "callTitleLine3": "MOI",
    "callTitleLine4": "TRISTE",
    "callPressEnter": "APPUYEZ SUR ENTRÉE POUR AIDER",

    // --- displayRegularScreen() ---
    "regularTitle": "CryBot_v1",
    "regularSubTitle": "Faites-moi pleurer",
    "sentimentLabel": "SENTIMENT",
    "tearEstimateLabel": "LARMES ESTIMÉES",
    "tearsAvailable": "larmes disponibles",
    "eightMLneeded": "8mL par jour nécessaires",
    "pressShiftKey": "APPUYEZ SUR MAJ POUR ENVOYER",
    "soilDryness": "Humidité du sol :",
    "crying": "en train de pleurer...",
    "attemptingToCry": "essaie de pleurer",

    // --- displayHelpmodescreen() ---
    "helpNeededLine": "*la plante a besoin d’au moins 8mL par jour",
    "helpMe": "Aidez-moi s'il vous plaît !",
  }
};

let currentLanguage = 'en'; // ou 'fr'

// Fonction de Traduction
function t(key) {
  if (translations[currentLanguage] && translations[currentLanguage][key]) {
    return translations[currentLanguage][key];
  }
  return key; // Retourner la clé elle-même si non trouvé
}

// Fonction de Typage
function typing() {
  var textinput = txt.value();
  var words = textinput.split(/\W/);
  var scoredwords = [];
  var totalScore = 0;
  
  for (var i = 0; i < words.length; i++) {
    var word = words[i].toLowerCase();
    if (afinn.hasOwnProperty(word)) {
      var score = afinn[word];
      totalScore += Number(score);
      scoredwords.push(word + ': ' + score + ' ');
    }
  }

  if (actualScore !== totalScore) { // Vérifie si le score a changé
    actualScore = totalScore;
    scoreChanged = true; // Marque le score comme changé
    lastScoreUpdateTime = millis(); // Met à jour le temps de la dernière mise à jour du score
  }
  
  tearEstimate = totalScore * (-1) * 2;

  if (totalScore >= 20) {
    tearEstimate = 10;
    tearsOfJoymode = true;
  }

  if (tearEstimate <= 0) {
    tearEstimate = 0;
  }
}

// Fonction pour charger les ressources avant le démarrage
function preload() {
  afinn = loadJSON('afinn111.json');
  img = loadImage('graf2.png');
  alarm = loadSound('alarm.wav');
}

// Fonction d'initialisation
function setup() {
  var canvas = createCanvas(1280, 1024);
  canvas.parent('sketch-holder');
  var x = (windowWidth - width) / 2;
  canvas.position(x, 0);

  video = createVideo('gradient.mp4', video1Loaded);
  video.elt.muted = true;
  video.hide();

  video2 = createVideo('gradient2.mp4', video2Loaded);
  video2.elt.muted = true;
  video2.hide();

  function video1Loaded() {
    video.loop();
    video.play();
  }

  function video2Loaded() {
    video2.loop();
    video2.play();
  }

  clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500));
  clicktextcolor3 = color(255, 255, 255);
  clicktextcolor3.setAlpha(128 + 128 * sin(millis() / 100));
  
  textSize(32);

  txt = select('#txt');
  txt.input(typing);
  console.log(txt);
  txt.hide(); // Cacher la textarea initialement
  // Ne pas mettre le focus sur la textarea car elle est cachée

  // Gestion des touches Tab et Search pour refocus sur la zone de texte
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Empêche le comportement par défaut du Tab
      txt.elt.focus(); // Refocus sur la zone de texte
    }
    if (event.key === '170') { // Touche Search (peut varier selon le clavier)
      event.preventDefault(); // Empêche le comportement par défaut
      txt.elt.focus(); // Refocus sur la zone de texte
    }
  });
  
  // Afficher un message d'instruction
  // La textarea est cachée, donc on ne la montre pas ici
  // Le message d'instruction sera géré dans la fonction draw()
  
  // Initialiser le dernier temps d'interaction
  lastInteractionTime = Date.now();

  // Récupérer le tearTotal depuis le stockage local après une mise à jour de la page
  let savedTearTotal = localStorage.getItem('tearTotal');
  if (savedTearTotal !== null) {
    tearTotal = parseFloat(savedTearTotal);

    fetchDrynessFromBackend(); // Récupérer l'humidité
    fetchTearTotalFromBackend(); // Récupérer le tearTotal

    setInterval(fetchDrynessFromBackend, 5000); // Récupérer toutes les 5 secondes
    setInterval(fetchTearTotalFromBackend, 5000); // Récupérer le tearTotal toutes les 5 secondes
  }
}

// Fonction pour gérer les pressions de touches
function keyPressed() {
  var txt = select('#txt');

  // Réinitialiser le dernier temps d'interaction à chaque pression de touche
  lastInteractionTime = millis();

  // Traduction
  if (keyCode === 216) {
    currentLanguage = 'en'; // Basculer en anglais
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Language switched to English");
  } 
  else if (keyCode === 217) {
    currentLanguage = 'fr'; // Basculer en français
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Langue changée en français");
  }

  // Initialiser l'audio si ce n'est pas déjà fait et que la touche "Enter" est pressée
  if (!audioInitialized && keyCode === 13) { // Touche Enter
    userStartAudio().then(() => {
      console.log("Audio context started via Enter key");
      audioInitialized = true;
      
      // Si le système est déjà en mode alert ou help, démarrer le son
      if ((imThirsty && !helpMode) || helpMode) {
        alarm.loop();
      }
      
      // Afficher la textarea maintenant que l'audio est initialisé
      if (tearTotal >= 8 || (tearTotal < 8 && !callForHelpTriggered)) {
        txt.show();
        setTimeout(() => txt.elt.focus(), 0);
      }
    }).catch(err => {
      console.error("Error starting audio context via Enter key:", err);
    });
  }

  // Si en mode "appel à l'aide" et la touche Enter est pressée
  if (callForHelpTriggered && keyCode === 13) { 
    callForHelpTriggered = false;  // Quitter le mode appel à l'aide
    displayRegularScreen();        // Revenir à l'écran régulier
  }

  // Si la touche Enter est pressée et que tearTotal < 8
  if (tearTotal < 8 && keyCode === 13) { 
    helpMode = true;  // Entrer en mode aide
    displayHelpmodescreen(); // Afficher l'écran aide
    document.getElementById('txt').style.display = "block"; // Afficher la zone de texte
  }

  if (keyCode === 16) { // Touche Shift pressée
    if (tearEstimate > 0) { // Augmenter seulement si tearEstimate > 0
      tearTotal += tearEstimate;
      tearTotalChanged = true; // Marquer le tearTotal comme changé
      lastTearUpdateTime = millis(); // Mettre à jour le temps de la dernière mise à jour
      localStorage.setItem('tearTotal', tearTotal); // Sauvegarder dans le stockage local
      updateTearTotalBackend(); // Envoyer au backend

      tearEstimate = 0;
      actualScore = 0;
      txt.value('');

      // Déclencher immédiatement la vérification d'arrosage après envoi
      triggerWateringCheck();
    }
    // Refocaliser sur la zone de texte
    setTimeout(() => txt.elt.focus(), 0);
  }

  if (keyCode === 13) { // Touche Enter pressée
    if (imThirsty) {
      helpMode = true;  // Passer en mode aide si en mode "soif"
      imThirsty = false; // Désactiver le mode "soif"
    }
  }

  if (keyCode === 37) { // Touche flèche gauche
    imThirsty = true;
    // Si audio est initialisé et en mode alert/help, démarrer le son
    if (audioInitialized && ((imThirsty && !helpMode) || helpMode)) {
      alarm.loop();
    }
  }

  if (keyCode === 39) { // Touche flèche droite
    imThirsty = false;
    // Si audio est initialisé et en mode alert/help, démarrer le son
    if (audioInitialized && ((imThirsty && !helpMode) || helpMode)) {
      alarm.loop();
    } else {
      alarm.stop();
    }
  }

  if (keyCode === 38) { // Touche flèche haut
    imThirsty = true;
    helpMode = false;
    // Démarrer le son si audio est initialisé et pas déjà en train de jouer
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }
}

// Fonction de Dessin Continu
function draw() {
  if (!audioInitialized) {
    // Afficher uniquement le message d'instruction et cacher la textarea
    background(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255);
    text("Appuyez sur 'Enter' pour initialiser Crybot", width / 2, height / 2);
    
    // S'assurer que la textarea est cachée
    if (txt && txt.elt.style.display !== "none") {
      txt.hide();
    }
    
    return; // Ne rien faire d'autre tant que l'audio n'est pas initialisé
  }

  chooseCanvas();

  // Vérifier si 1 minute (60000 ms) s'est écoulée depuis la dernière interaction
  if (millis() - lastInteractionTime >= 60000 && !callForHelpTriggered) {
    callForHelpTriggered = true;  // Passer en mode appel à l'aide
    displayCallforHelp();         // Afficher l'écran d'appel à l'aide
  }
}

// Fonction pour choisir quel écran afficher
function chooseCanvas() {
  // Vérifier si tearTotal atteint 8ml ou plus, si oui, quitter le mode aide
  if (tearTotal >= 8) {
    helpMode = false; // Quitter le mode aide une fois que tearTotal atteint 8 mL ou plus
    fetchTearTotalFromBackend();
    displayRegularScreen(); // Afficher l'écran régulier
    document.getElementById('txt').style.display = "block"; // Afficher la zone de texte
    
    // Arrêter l'alarme si elle jouait
    if (alarm.isPlaying()) {
      alarm.stop();
    }
  } else if (tearTotal < 8 && !helpMode) {
    // Entrer en mode aide lorsque les larmes sont insuffisantes
    helpMode = true;
    displayHelpmodescreen(); // Afficher l'écran aide
    document.getElementById('txt').style.display = "block"; // Afficher la zone de texte
    
    // Démarrer l'alarme
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  // Gérer les transitions d'inactivité
  if (millis() - lastInteractionTime >= 60000) { // 1 minute d'inactivité
    if (helpMode) {
      console.log("Inactivity detected in helpMode. Transitioning to Alert.");
      helpMode = false; // Quitter le mode aide
      displayAlert(); // Passer en mode alerte
      document.getElementById('txt').style.display = "none"; // Masquer la zone de texte
      
      // Démarrer l'alarme
      if (audioInitialized && !alarm.isPlaying()) {
        alarm.loop();
      }
    } else {
      console.log("Inactivity detected. Transitioning to Call for Help.");
      callForHelpTriggered = true; // Entrer en mode appel à l'aide
      displayCallforHelp(); // Afficher l'écran d'appel à l'aide
      document.getElementById('txt').style.display = "none"; // Masquer la zone de texte
      
      // Ne pas démarrer l'alarme en mode Call for Help
      // Suppression de l'appel à alarm.loop()
    }
    return; // Empêcher d'autres vérifications cette frame
  }

  // Si l'utilisateur est en mode "soif" et pas en mode aide
  if (imThirsty && !helpMode) {
    displayAlert(); // Afficher l'écran d'alerte
    document.getElementById('txt').style.display = "none"; // Masquer la zone de texte
    
    // Démarrer l'alarme
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  // Afficher continuellement l'écran aide si en mode aide, tearTotal < 8, et pas en mode appel à l'aide
  if (helpMode && tearTotal < 8 && !callForHelpTriggered) {
    displayHelpmodescreen();
    document.getElementById('txt').style.display = "block";
    
    // Démarrer l'alarme
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  // Si pas en mode aide, pas en mode appel à l'aide, et tearTotal >= 8, afficher l'écran régulier
  if (!helpMode && !callForHelpTriggered && tearTotal >= 8) {
    displayRegularScreen(); 
    document.getElementById('txt').style.display = "block"; // Afficher la zone de texte
    
    // Arrêter l'alarme
    if (alarm.isPlaying()) {
      alarm.stop();
    }
  }

  // Toujours focuser sur la zone de texte si elle est affichée
  if (txt && txt.elt.style.display !== 'none') {
    setTimeout(() => txt.elt.focus(), 0);
  }
}

// Fonction pour afficher l'écran d'alerte
function displayAlert() {
  clear();
  image(video2, 0, 0, width, height); // Vidéo de fond

  // Effet de texte clignotant
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 500)); // Ajuster l'alpha avec le temps
  textAlign(CENTER); // Centrage horizontal
  fill(clicktextcolor);
  textSize(100);
  text(t("alertTitleLine1"), width / 2, 380);
  text(t("alertTitleLine2"), width / 2, 480);
  text(t("alertTitleLine3"), width / 2, 580);
  text(t("alertTitleLine4"), width / 2, 680);

  // Message d'aide clignotant
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 300)); // Ajuster l'alpha plus rapidement

  fill(clicktextcolor2);
  textSize(25);
  text(t("alertPressEnter"), width / 2, 900);

  // Jouer le son si pas déjà en train de jouer
  if (!alarm.isPlaying() && audioInitialized) {
    alarm.loop();
  }
}

// Fonction pour afficher l'écran d'appel à l'aide
function displayCallforHelp() {
  clear();
  image(video, 0, 0, width, height); // Vidéo de fond
  textAlign(CENTER); // Centrage horizontal

  // Effet de texte clignotant
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000)); // Clignotement plus lent

  fill(clicktextcolor);
  textSize(100);

  text(t("callTitleLine1"), width / 2, 380);
  text(t("callTitleLine2"), width / 2, 480);
  text(t("callTitleLine3"), width / 2, 580);
  text(t("callTitleLine4"), width / 2, 680);

  // Message d'aide clignotant
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500)); // Clignotement plus rapide

  fill(clicktextcolor2);
  textSize(25);
  text(t("callPressEnter"), width / 2, 900);

  // **Ne pas jouer le son en mode Call for Help**
  // Suppression de l'appel à alarm.loop()
}

// Fonction pour afficher l'écran régulier
function displayRegularScreen() {
  txt.show();
  clear();
  alarm.stop(); // Arrêter le son ici
  image(video, 0, 0, width, height); // Vidéo de fond
  textAlign(LEFT); // Alignement à gauche
  fill(255);
  textSize(22);
  text(t("regularTitle"), 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text(t("regularSubTitle"), 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Logo

  txt.show(); // Assurer que la zone de texte est visible
  setTimeout(() => txt.elt.focus(), 0); // Focus sur la zone de texte

  fill(255);
  textSize(25);
  text(t("sentimentLabel"), 700-40, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870-40, 600); // Score mis à jour
  fill(255);
  textSize(25);
  text(t("tearEstimateLabel"), 950-40, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Score mis à jour
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 390-100);
  textSize(40);
  text(t("tearsAvailable"), 60, 425-90);
  textSize(22);
  text('______', 60,350)
  fill(255);
  textSize(22);
  if (isCrying) {
    textSize(30);
    text(t('crying'), 60, 400);
  } else if (isAttemptingToCry) {
    textSize(30);
    text(t('attemptingToCry'), 60, 400);
  } else {
    textSize(22);
    text(t("eightMLneeded"), 60, 400);
  }
  //text('Until next crying attempt', 60, 430);

  fill(255);
  textSize(22);
  text(`${t("soilDryness")} ${currentDryness}%`, 650, 465);

  if (actualScore < 0) { 
    fill(clicktextcolor);
    textSize(25);
    text(t("pressShiftKey"), 512, 960);
    fill(255);
  }

  // Arrêter le son si on est passé en mode régulier
  if (!((imThirsty && !helpMode) || helpMode) && alarm.isPlaying()) {
    alarm.stop();
  }
}

// Fonction pour afficher l'écran aide
function displayHelpmodescreen() {
  clear();
  image(video2, 0, 0, width, height); // Vidéo de fond

  txt.show(); // Assurer que la zone de texte est visible
  setTimeout(() => txt.elt.focus(), 0); // Focus sur la zone de texte
  textAlign(LEFT); // Alignement à gauche
  fill(255);
  textSize(22);
  text(t("regularTitle"), 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text(t("regularSubTitle"), 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Afficher le logo

  fill(255);
  textSize(25);
  text(t("sentimentLabel"), 700-40, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870-40, 600); // Score mis à jour
  fill(255);
  textSize(25);
  text(t("tearEstimateLabel"), 950-40, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Score mis à jour
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 390 - 100);
  textSize(40);
  text(t("tearsAvailable"), 60, 425-90);

  textSize(22);
  text('______', 60,350)
  fill(255);
  textSize(22);
  text(t("helpNeededLine"), 60, 400);
  text(t("helpMe"), 60, 430);

  fill(255);
  textSize(22);
  text(`${t("soilDryness")} ${currentDryness}%`, 650, 465);

  if (actualScore < 0) {
    fill(clicktextcolor);
    textSize(25);
    text(t("pressShiftKey"), 512, 960);
    fill(255);
  }

  // Jouer le son si pas déjà en train de jouer
  if (!alarm.isPlaying() && audioInitialized) {
    alarm.loop();
  }
}

// Fonction pour mettre en évidence le texte du sentiment
function highlightText() {
  if (scoreChanged && millis() - lastScoreUpdateTime <= changeColorDuration && actualScore != 0) {
    // Effet clignotant : alterner la visibilité toutes les 100 millisecondes
    if (floor((millis() - lastScoreUpdateTime) / 100) % 2 === 0) {
      fill(255); // Couleur blanche lorsqu'elle est visible
    } else {
      fill(0, 0, 0, 0); // Transparent lorsqu'elle est invisible
    }
  } else {
    fill(255); // Couleur par défaut
    scoreChanged = false; // Réinitialiser l'indicateur de changement de score
  }
}

// Fonction pour mettre en évidence le tearTotal
function highlightTearTotal() {
  if (tearTotalChanged && millis() - lastTearUpdateTime <= changeColorDuration) {
    // Effet clignotant : alterner la visibilité toutes les 200 millisecondes
    if (floor((millis() - lastTearUpdateTime) / 200) % 2 === 0) {
      fill(255); // Visible
    } else {
      fill(0, 0, 0, 0); // Transparent lorsqu'elle est invisible
    }
  } else {
    fill(255); // Couleur par défaut
    tearTotalChanged = false; // Réinitialiser l'indicateur
  }
}

// Fonction pour déclencher une vérification d'arrosage
function triggerWateringCheck() {
  fetch('/check-and-water', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log('Watering check triggered successfully.');
      } else {
        console.error('Failed to trigger watering check.');
      }
    })
    .catch((error) => {
      console.error('Error triggering watering check:', error);
    });
}

// Fonction pour mettre à jour l'humidité du sol sur le frontend
function displaySoilDryness(dryness) {
  console.log(`Updating dryness value on the frontend: ${dryness}%`); // Log de débogage
  currentDryness = dryness; // Mettre à jour la variable globale
}

// Fonction pour mettre à jour le tearTotal depuis le backend
function fetchTearTotalFromBackend() {
  fetch('/get-tear-total')
    .then((response) => response.json())
    .then((data) => {
      if (data.tearTotal !== undefined) {
        console.log(`Tear total fetched: ${data.tearTotal} mL`);
        tearTotal = data.tearTotal; // Mettre à jour la variable globale
      } else {
        console.error('Invalid or missing tearTotal value');
      }
    })
    .catch((error) => {
      console.error('Error fetching tearTotal:', error);
    });
}

// Fonction pour mettre à jour l'humidité du sol depuis le backend
function fetchDrynessFromBackend() {
  fetch('/get-moisture')
    .then((response) => response.json())
    .then((data) => {
      if (data.dryness !== undefined && !isNaN(data.dryness)) {
        console.log(`Soil dryness fetched: ${data.dryness}%`);
        displaySoilDryness(data.dryness);
      } else {
        console.error('Invalid or missing dryness value');
      }
    })
    .catch((error) => {
      console.error('Error fetching soil dryness:', error);
    });
}

// Fonction pour récupérer l'état d'arrosage toutes les 5 secondes
setInterval(fetchWateringState, 5000); // toutes les 5 secondes

function fetchWateringState() {
  fetch('/get-watering-state')
    .then(response => response.json())
    .then(data => {
      isAttemptingToCry = data.isAttemptingToCry;
      isCrying = data.isCrying;
    })
    .catch(error => {
      console.error('Error fetching watering state:', error);
    });
}

// Fonction pour mettre à jour le tearTotal sur le backend
function updateTearTotalBackend() {
  fetch('/update-tear-total', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tearTotal: tearTotal }), // Envoyer tearTotal en JSON
  })
    .then((response) => {
      if (response.ok) {
        console.log('Tear total sent to backend');
      } else {
        console.error('Failed to send tear total to backend');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
