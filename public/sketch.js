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
var scoreChanged = false;
var tearTotalChanged = false;
var changeColorDuration = 700;
var lastScoreUpdateTime = 0;
var lastTearUpdateTime = 0;
var lastInteractionTime = 0;
var callForHelpTriggered = false;
var txt;
var isAttemptingToCry = false;
var isCrying = false;
var currentDryness = 0;
let currentDisplay = "";

let audioInitialized = false;

// Traductions
const translations = {
  "en": {
    "placeholder": "How do you feel ?",
    "alertTitleLine1": "PLEASE",
    "alertTitleLine2": "MAKE",
    "alertTitleLine3": "ME",
    "alertTitleLine4": "CRY",
    "alertPressEnter": "PRESS ENTER TO HELP",
    "callTitleLine1": "PLEASE",
    "callTitleLine2": "MAKE",
    "callTitleLine3": "ME",
    "callTitleLine4": "SAD",
    "callPressEnter": "PRESS ENTER TO HELP",
    "regularTitle": "CryBot_v1",
    "regularSubTitle": "Please make me cry",
    "sentimentLabel": "SENTIMENT",
    "tearEstimateLabel": "TEAR ESTIMATE",
    "tearsAvailable": "tears available",
    "eightMLneeded": "8mL per day needed",
    "pressShiftKey": "PRESS ENTER KEY TO SEND",
    "soilDryness": "Soil Dryness:",
    "crying": "crying...",
    "attemptingToCry": "attempting to cry",
    "helpNeededLine": "*the plant needs at least 8mL per day",
    "helpMe": "Please help!"
  },
  "fr": {
    "placeholder": "Comment vous sentez-vous ?",
    "alertTitleLine1": "S'IL VOUS PLAÎT",
    "alertTitleLine2": "FAITES",
    "alertTitleLine3": "MOI",
    "alertTitleLine4": "PLEURER",
    "alertPressEnter": "APPUYEZ SUR ENTRÉE POUR AIDER",
    "callTitleLine1": "S'IL VOUS PLAÎT",
    "callTitleLine2": "RENDEZ",
    "callTitleLine3": "MOI",
    "callTitleLine4": "TRISTE",
    "callPressEnter": "APPUYEZ SUR ENTRÉE POUR AIDER",
    "regularTitle": "CryBot_v1",
    "regularSubTitle": "Faites-moi pleurer",
    "sentimentLabel": "SENTIMENT",
    "tearEstimateLabel": "LARMES ESTIMÉES",
    "tearsAvailable": "larmes disponibles",
    "eightMLneeded": "8mL par jour nécessaires",
    "pressShiftKey": "APPUYEZ SUR ENTRÉE POUR ENVOYER",
    "soilDryness": "Humidité du sol :",
    "crying": "en train de pleurer...",
    "attemptingToCry": "essaie de pleurer",
    "helpNeededLine": "*la plante a besoin d’au moins 8mL par jour",
    "helpMe": "Aidez-moi s'il vous plaît !"
  }
};

let currentLanguage = 'en';

// Fonction de Traduction
function t(key) {
  if (translations[currentLanguage] && translations[currentLanguage][key]) {
    return translations[currentLanguage][key];
  }
  return key;
}

// Fonction de Typage
function typing() {
  var textinput = txt.value();

  // Détection du cheat code pour réinitialiser tearTotal
  if (textinput.trim().toLowerCase() === "resetmytears") {
    resetTearTotalCheat();
    txt.value('');
    return;
  }

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

  if (actualScore !== totalScore) {
    actualScore = totalScore;
    scoreChanged = true;
    lastScoreUpdateTime = millis();
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

// Fonction de réinitialisation via cheat code
function resetTearTotalCheat() {
  console.log("Cheat code détecté : réinitialisation des larmes...");
  fetch('/reset-tear-total', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ /* secret: "votre_clé_secrète_ici" */ }), // Ajoutez la clé secrète ici si besoin
  })
    .then(response => {
      if (response.ok) {
        console.log('tearTotal a été réinitialisé avec succès via cheat code.');
        tearTotal = 0;
        localStorage.setItem('tearTotal', tearTotal);
        displayRegularScreen();
      } else {
        console.error('Échec de la réinitialisation de tearTotal via cheat code.');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la réinitialisation de tearTotal via cheat code:', error);
    });
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
  txt.elt.addEventListener('keydown', function(e) {
  if (e.keyCode === 13) {
    e.preventDefault();
  }
});

  txt.input(typing);
  console.log(txt);
  txt.hide(); // On cache la textarea initialement

  // Gestion des touches Tab et Search pour refocaliser la zone de texte
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      txt.elt.focus();
    }
    if (event.key === '170') {
      event.preventDefault();
      txt.elt.focus();
    }
  });

  lastInteractionTime = Date.now();

  // Récupérer la valeur de tearTotal depuis localStorage (pour le cas où le backend ne serait pas sollicité)
  let savedTearTotal = localStorage.getItem('tearTotal');
  if (savedTearTotal !== null) {
    tearTotal = parseFloat(savedTearTotal);
    fetchDrynessFromBackend();
    fetchTearTotalFromBackend();
    setInterval(fetchDrynessFromBackend, 5000);
    setInterval(fetchTearTotalFromBackend, 5000);
  }
}

// Gestion des événements clavier
function keyPressed() {
  var txt = select('#txt');
  lastInteractionTime = millis();

  if (keyCode === 216) {
    currentLanguage = 'en';
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Language switched to English");
  } else if (keyCode === 217) {
    currentLanguage = 'fr';
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Langue changée en français");
  }

  if (!audioInitialized && keyCode === 13) {
    userStartAudio().then(() => {
      console.log("Audio context started via Enter key");
      audioInitialized = true;
      if ((imThirsty && !helpMode) || helpMode) {
        alarm.loop();
      }
      if (tearTotal >= 8 || (tearTotal < 8 && !callForHelpTriggered)) {
        txt.show();
        setTimeout(() => txt.elt.focus(), 0);
      }
    }).catch(err => {
      console.error("Error starting audio context via Enter key:", err);
    });
  }

  if (keyCode === 13 && txt.value().trim() !== "") {
  // Si un message est saisi, on l'envoie :
  if (tearEstimate > 0) {
    tearTotal += tearEstimate;
    tearTotalChanged = true;
    lastTearUpdateTime = millis();
    localStorage.setItem('tearTotal', tearTotal);
    updateTearTotalBackend();
  }
  // Réinitialisation et envoi du message (pour message triste ou positif)
  tearEstimate = 0;
  actualScore = 0;
  txt.value('');
  triggerWateringCheck();
  setTimeout(() => txt.elt.focus(), 0);
  return; // Empêche l'exécution des autres traitements liés à Enter
} 
  
  if (callForHelpTriggered && keyCode === 13) {
    callForHelpTriggered = false;
    displayRegularScreen();
  }

  if (tearTotal < 8 && keyCode === 13) {
    helpMode = true;
    displayHelpmodescreen();
    document.getElementById('txt').style.display = "block";
  }

if (keyCode === 16) {
  // On vérifie qu'un message a été saisi (non vide)
  if (txt.value().trim() !== "") {
    // Si tearEstimate > 0 (donc message triste), on met à jour tearTotal
    if (tearEstimate > 0) {
      tearTotal += tearEstimate;
      tearTotalChanged = true;
      lastTearUpdateTime = millis();
      localStorage.setItem('tearTotal', tearTotal);
      updateTearTotalBackend();
    }
    // Dans tous les cas, on réinitialise les variables et on vide le champ
    tearEstimate = 0;
    actualScore = 0;
    txt.value('');
    triggerWateringCheck();
  }
  setTimeout(() => txt.elt.focus(), 0);
}


  if (keyCode === 13) {
    if (imThirsty) {
      helpMode = true;
      imThirsty = false;
    }

  }

  if (keyCode === 37) {
    imThirsty = true;
    if (audioInitialized && ((imThirsty && !helpMode) || helpMode)) {
      alarm.loop();
    }
  }

  if (keyCode === 39) {
    imThirsty = false;
    if (audioInitialized && ((imThirsty && !helpMode) || helpMode)) {
      alarm.loop();
    } else {
      alarm.stop();
    }
  }

  if (keyCode === 38) {
    imThirsty = true;
    helpMode = false;
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }
}

// Fonction de dessin continu
function draw() {
  if (!audioInitialized) {
    background(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255);
    text("Appuyez sur 'Enter' pour initialiser Crybot", width / 2, height / 2);
    if (txt && txt.elt.style.display !== "none") {
      txt.hide();
    }
    return;
  }

  chooseCanvas();

  if (millis() - lastInteractionTime >= 60000 && !callForHelpTriggered) {
    callForHelpTriggered = true;
    displayCallforHelp();
  }
}

// Fonction de gestion des écrans
function chooseCanvas() {
  if (tearTotal >= 8) {
    helpMode = false;
    fetchTearTotalFromBackend();
    displayRegularScreen();
    document.getElementById('txt').style.display = "block";
    if (alarm.isPlaying()) {
      alarm.stop();
    }
  } else if (tearTotal < 8 && !helpMode) {
    helpMode = true;
    displayHelpmodescreen();
    document.getElementById('txt').style.display = "block";
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  if (millis() - lastInteractionTime >= 60000) {
    if (helpMode) {
      console.log("Inactivity detected in helpMode. Transitioning to Alert.");
      helpMode = false;
      displayAlert();
      document.getElementById('txt').style.display = "none";
      if (audioInitialized && !alarm.isPlaying()) {
        alarm.loop();
      }
    } else {
      console.log("Inactivity detected. Transitioning to Call for Help.");
      callForHelpTriggered = true;
      displayCallforHelp();
      document.getElementById('txt').style.display = "none";
    }
    return;
  }

  if (imThirsty && !helpMode) {
    displayAlert();
    document.getElementById('txt').style.display = "none";
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  if (helpMode && tearTotal < 8 && !callForHelpTriggered) {
    displayHelpmodescreen();
    document.getElementById('txt').style.display = "block";
    if (audioInitialized && !alarm.isPlaying()) {
      alarm.loop();
    }
  }

  if (!helpMode && !callForHelpTriggered && tearTotal >= 8) {
    displayRegularScreen();
    document.getElementById('txt').style.display = "block";
    if (alarm.isPlaying()) {
      alarm.stop();
    }
  }

  if (txt && txt.elt.style.display !== 'none') {
    setTimeout(() => txt.elt.focus(), 0);
  }
}

function displayAlert() {
  clear();
  image(video2, 0, 0, width, height);
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 500));
  textAlign(CENTER);
  fill(clicktextcolor);
  textSize(100);
  text(t("alertTitleLine1"), width / 2, 380);
  text(t("alertTitleLine2"), width / 2, 480);
  text(t("alertTitleLine3"), width / 2, 580);
  text(t("alertTitleLine4"), width / 2, 680);
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 300));
  fill(clicktextcolor2);
  textSize(25);
  text(t("alertPressEnter"), width / 2, 900);
  if (!alarm.isPlaying() && audioInitialized) {
    alarm.loop();
  }
}

function displayCallforHelp() {
  clear();
  image(video, 0, 0, width, height);
  textAlign(CENTER);
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  textSize(100);
  text(t("callTitleLine1"), width / 2, 380);
  text(t("callTitleLine2"), width / 2, 480);
  text(t("callTitleLine3"), width / 2, 580);
  text(t("callTitleLine4"), width / 2, 680);
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500));
  fill(clicktextcolor2);
  textSize(25);
  text(t("callPressEnter"), width / 2, 900);
}

function displayRegularScreen() {
  txt.show();
  clear();
  alarm.stop();
  image(video, 0, 0, width, height);
  textAlign(LEFT);
  fill(255);
  textSize(22);
  text(t("regularTitle"), 50, 50);
  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text(t("regularSubTitle"), 1000, 50);
  img.resize(300, 0);
  image(img, 820, 130);
  txt.show();
  setTimeout(() => txt.elt.focus(), 0);
  fill(255);
  textSize(25);
  text(t("sentimentLabel"), 660, 600);
  textSize(25);
  highlightText();
  text(actualScore, 830, 600);
  fill(255);
  textSize(25);
  text(t("tearEstimateLabel"), 910, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600);
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 290);
  textSize(40);
  text(t("tearsAvailable"), 60, 335);
  textSize(22);
  text('______', 60,350)
  fill(255);
  textSize(22);

  if (txt.value().trim() !== "") {
  fill(clicktextcolor);
  textSize(25);
  text(t("pressShiftKey"), 512, 960);
  fill(255);
}

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
  fill(255);
  textSize(22);
  text(`${t("soilDryness")} ${currentDryness}%`, 650, 465);
 /* if (actualScore < 0) {
    fill(clicktextcolor);
    textSize(25);
    text(t("pressShiftKey"), 512, 960);
    fill(255);
  } */
  if (!((imThirsty && !helpMode) || helpMode) && alarm.isPlaying()) {
    alarm.stop();
  }
}

function displayHelpmodescreen() {
  clear();
  image(video2, 0, 0, width, height);
  txt.show();
  setTimeout(() => txt.elt.focus(), 0);
  textAlign(LEFT);
  fill(255);
  textSize(22);
  text(t("regularTitle"), 50, 50);
  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text(t("regularSubTitle"), 1000, 50);
  img.resize(300, 0);
  image(img, 820, 130);
  fill(255);
  textSize(25);
  text(t("sentimentLabel"), 660, 600);
  textSize(25);
  highlightText();
  text(actualScore, 830, 600);
  fill(255);
  textSize(25);
  text(t("tearEstimateLabel"), 910, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600);
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 290);
  textSize(40);
  text(t("tearsAvailable"), 60, 335);
  textSize(22);
  text('______', 60,350)
  fill(255);
  textSize(22);
  text(t("helpNeededLine"), 60, 400);
  text(t("helpMe"), 60, 430);
  fill(255);
  textSize(22);
  text(`${t("soilDryness")} ${currentDryness}%`, 650, 465);

    if (txt.value().trim() !== "") {
  fill(clicktextcolor);
  textSize(25);
  text(t("pressShiftKey"), 512, 960);
  fill(255);
}
/*  if (actualScore < 0) {
    fill(clicktextcolor);
    textSize(25);
    text(t("pressShiftKey"), 512, 960);
    fill(255);
  } */
  if (!alarm.isPlaying() && audioInitialized) {
    alarm.loop();
  }
}

function highlightText() {
  if (scoreChanged && millis() - lastScoreUpdateTime <= changeColorDuration && actualScore != 0) {
    if (floor((millis() - lastScoreUpdateTime) / 100) % 2 === 0) {
      fill(255);
    } else {
      fill(0, 0, 0, 0);
    }
  } else {
    fill(255);
    scoreChanged = false;
  }
}

function highlightTearTotal() {
  if (tearTotalChanged && millis() - lastTearUpdateTime <= changeColorDuration) {
    if (floor((millis() - lastTearUpdateTime) / 200) % 2 === 0) {
      fill(255);
    } else {
      fill(0, 0, 0, 0);
    }
  } else {
    fill(255);
    tearTotalChanged = false;
  }
}

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

function displaySoilDryness(dryness) {
  console.log(`Updating dryness value on the frontend: ${dryness}%`);
  currentDryness = dryness;
}

function fetchTearTotalFromBackend() {
  fetch('/get-tear-total')
    .then((response) => response.json())
    .then((data) => {
      if (data.tearTotal !== undefined) {
        console.log(`Tear total fetched: ${data.tearTotal} mL`);
        tearTotal = data.tearTotal;
      } else {
        console.error('Invalid or missing tearTotal value');
      }
    })
    .catch((error) => {
      console.error('Error fetching tearTotal:', error);
    });
}

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

setInterval(fetchWateringState, 5000);
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

function updateTearTotalBackend() {
  fetch('/update-tear-total', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tearTotal: tearTotal }),
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
