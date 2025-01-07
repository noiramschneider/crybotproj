

var afinn;
var totalScore = 0;
var actualScore; 
var tearEstimate = 0;
var tearTotal = 0;
var tearsOfJoymode = false;
var imThirsty = false;
var textinput = '';
var helpMode = false; // This will track if we're in the help screen
var VideoIsplaying = true;
var VideoIspaused = false;
var scoreChanged = false; // Flag to track if the score has changed
var tearTotalChanged = false;
var changeColorDuration = 700; // Duration for which the score will stay blue (in milliseconds)
var lastScoreUpdateTime = 0; // Time of the last score update
var lastTearUpdateTime = 0;
var lastInteractionTime = 0; // To track the last time user interacted
var callForHelpTriggered = false; // To track if we're in call for help mode
var txt;
var isAttemptingToCry = false;
var isCrying = false;
var currentDryness = 0; // Store the fetched dryness value
let currentDisplay = ""; // Tracks the current display mode


function fetchTearTotalFromBackend() {
  fetch('/get-tear-total')
    .then((response) => response.json())
    .then((data) => {
      if (data.tearTotal !== undefined) {
        console.log(`Tear total fetched: ${data.tearTotal} mL`);
        tearTotal = data.tearTotal; // Update the global tearTotal variable
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

  setInterval(fetchWateringState, 5000); // every 5 seconds

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


const translations = {
  "en": {
    "placeholder": "Type something...",
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
    "placeholder": "Écris quelque chose...",
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
    "attemptingToCry": "tentative de pleurer",

    // --- displayHelpmodescreen() ---
    "helpNeededLine": "*la plante a besoin d’au moins 8mL par jour",
    "helpMe": "Aidez-moi s'il vous plaît !",
  }
};


let currentLanguage = 'en'; // ou 'fr'

function t(key) {
  // Si la clé existe dans la langue courante, on la retourne
  if (translations[currentLanguage] && translations[currentLanguage][key]) {
    return translations[currentLanguage][key];
  }
  // Sinon, par sécurité, on retourne la clé elle-même
  return key;
}


function preload() {
  afinn = loadJSON('afinn111.json');
  img = loadImage('graf2.png');
  alarm = loadSound('alarm.wav');

}

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
  txt.show();
  setTimeout(() => txt.elt.focus(), 0); // Focus the text area on load

  // Add a global event listener for the Tab key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default tabbing behavior
      txt.elt.focus(); // Refocus the text area
    }
  });

    // Add a global event listener for the Search key
  document.addEventListener('keydown', (event) => {
    if (event.key === '170') {
      event.preventDefault(); // Prevent the default search key behavior
      txt.elt.focus(); // Refocus the text area
    }
  });
  
  if (txt){
    txt.show();
    setTimeout(() => txt.elt.focus(), 100);
  } else {
    console.error("Text area with id txt not available to focus");
  }
}
// Initialize the last interaction time to the current time
lastInteractionTime = Date.now();


//to remember the last tearTotal after a page update
  let savedTearTotal = localStorage.getItem('tearTotal');
  if (savedTearTotal !== null) {
  tearTotal = parseFloat(savedTearTotal);

  fetchDrynessFromBackend(); // Fetch dryness
  fetchTearTotalFromBackend(); // Fetch tearTotal

  setInterval(fetchDrynessFromBackend, 5000); // Fetch every 5 seconds
  setInterval(fetchTearTotalFromBackend, 5000); // Fetch tearTotal every 5 seconds

}


  
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

    if (actualScore !== totalScore) { // Check if score has changed
      actualScore = totalScore;
      scoreChanged = true; // Mark score as changed
      lastScoreUpdateTime = millis(); // Update the time of the last score change
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


// Function to update the backend with the current tearTotal
function updateTearTotalBackend() {
  fetch('/update-tear-total', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tearTotal: tearTotal }), // Send tearTotal as JSON
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

function keyPressed() {
  var txt = select('#txt');

  // Reset the last interaction time on any key press
  lastInteractionTime = millis();

   // Traduction
  if (keyCode === 216) {
    currentLanguage = 'en'; // Bascule en anglais
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Language switched to English");
  } 
  else if (keyCode === 217) {
    currentLanguage = 'fr'; // Bascule en français
    document.getElementById('txt').placeholder = t("placeholder");
    console.log("Langue changée en français");
  }


// If in call for help mode and the Enter key is pressed
  if (callForHelpTriggered && keyCode === 13) { 
    callForHelpTriggered = false;  // Exit call for help mode
    displayRegularScreen();        // Go back to regular screen
  }

  // If Enter key is pressed and we're in displayAlert mode (tearTotal < 8)
  if (tearTotal < 8 && keyCode === 13) { 
    helpMode = true;  // Enter help mode
    displayHelpmodescreen(); // Show help mode screen
    document.getElementById('txt').style.display = "block"; // Show input box
  }

if (keyCode === 16) { // Shift key is pressed
    if (tearEstimate > 0) { // Only increase if tearEstimate is greater than 0
      tearTotal += tearEstimate;
      tearTotalChanged = true; // Set the flag to true
      lastTearUpdateTime = millis(); // Update the last update time
      localStorage.setItem('tearTotal', tearTotal); // Save tearTotal to localStorage
      updateTearTotalBackend(); // Send tearTotal to backend

      tearEstimate = 0;
      actualScore = 0;
      txt.value('');

      // Immediately trigger watering check after sending text
      triggerWateringCheck();
    }
     // Refocus the text area
    setTimeout(() => txt.elt.focus(), 0);
  }

  if (keyCode === 13) { // Enter key is pressed
    if (imThirsty) {
      helpMode = true;  // Switch to help mode on Enter if in Alert mode
      imThirsty = false; // Turn off Alert mode when entering help mode
    }
  }

  if (keyCode === 37) { // Left arrow key
    imThirsty = true;
  }

  if (keyCode === 39) { // Right arrow key
    imThirsty = false;
  }

  if (keyCode === 38) { // Up arrow key
    imThirsty = true;
    helpMode = false;
    alarm.loop();
  }
}

function draw() {
  chooseCanvas();

    // Check if 1 minute (60000 ms) has passed since the last interaction
  if (millis() - lastInteractionTime >= 60000 && !callForHelpTriggered) {
    callForHelpTriggered = true;  // Switch to call for help mode
    displayCallforHelp();         // Display the help screen
  }
}


function chooseCanvas() {
  // Check if tearTotal has reached 8ml or more, if so, exit help mode
  if (tearTotal >= 8) {
    helpMode = false; // Exit help mode once tearTotal reaches 8 mL or more
    fetchTearTotalFromBackend();
    displayRegularScreen(); // Show regular screen
    document.getElementById('txt').style.display = "block"; // Show input box
  } else if (tearTotal < 8 && !helpMode) {
    // Enter help mode when tears are insufficient
    helpMode = true;
    displayHelpmodescreen(); // Show help mode screen
    document.getElementById('txt').style.display = "block"; // Show input box
  }

  // Handle inactivity transitions
  if (millis() - lastInteractionTime >= 60000) { // 1 minute of inactivity
    if (helpMode) {
      console.log("Inactivity detected in helpMode. Transitioning to Alert.");
      helpMode = false; // Exit help mode
      displayAlert(); // Transition to alert mode
      document.getElementById('txt').style.display = "none"; // Hide input box
    } else {
      console.log("Inactivity detected. Transitioning to Call for Help.");
      callForHelpTriggered = true; // Enter call for help mode
      displayCallforHelp(); // Show call for help screen
      document.getElementById('txt').style.display = "none"; // Hide input box
    }
    return; // Prevent further checks this frame
  }

  // If user is in "I'm thirsty" mode and not in help mode
  if (imThirsty && !helpMode) {
    displayAlert(); // Show alert screen when imThirsty is true
    document.getElementById('txt').style.display = "none"; // Hide input box
  }

  // Continuously display the help mode screen if we are in helpMode, 
  // haven't reached the tearTotal threshold yet, and are not in callForHelp mode
  if (helpMode && tearTotal < 8 && !callForHelpTriggered) {
    displayHelpmodescreen();
    document.getElementById('txt').style.display = "block";
  }

  // If not in help mode, not in callForHelp, and tearTotal >= 8, show regular screen
  if (!helpMode && !callForHelpTriggered && tearTotal >= 8) {
    displayRegularScreen(); 
    document.getElementById('txt').style.display = "block"; // Show input box
  }

  // Always focus the text area if it's shown
  if (txt && txt.elt.style.display !== 'none') {
    setTimeout(() => txt.elt.focus(), 0);
  }
}




function displayAlert() {
  clear();
  image(video2, 0, 0, width, height); // Background video

  // Blinking text effect
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 500)); // Adjust alpha over time
textAlign(CENTER); // Centrage horizontal
  fill(clicktextcolor);
  textSize(100);
  text(t("alertTitleLine1"), windowWidth/2, 380);
  text(t("alertTitleLine2"), windowWidth/2, 480);
  text(t("alertTitleLine3"), windowWidth/2, 580);
  text(t("alertTitleLine4"), windowWidth/2, 680);

  // Blinking help message
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 300)); // Adjust alpha faster

  fill(clicktextcolor2);
  textSize(25);
  text(t("alertPressEnter"), windowWidth/2, 900);
}



function displayCallforHelp() {
  clear();
  image(video, 0, 0, width, height); // Background video
  //txt.hide(); // Hide the text area during this display
textAlign(CENTER); // Centrage horizontal
  // Blinking text effect
  const clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000)); // Slower blink

  fill(clicktextcolor);
  textSize(100);

text(t("callTitleLine1"), windowWidth/2, 380);
text(t("callTitleLine2"), windowWidth/2, 480);
text(t("callTitleLine3"), windowWidth/2, 580);
text(t("callTitleLine4"), windowWidth/2, 680);

  // Blinking help message
  const clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500)); // Faster blink

  fill(clicktextcolor2);
  textSize(25);
text(t("callPressEnter"), windowWidth/2, 900);
}


function displaySoilDryness(dryness) {
  console.log(`Updating dryness value on the frontend: ${dryness}%`); // Debug log
  currentDryness = dryness; // Update the global variable
}


function displayRegularScreen() {
  txt.show();
  clear();
  alarm.stop();
  image(video, 0, 0, width, height); // Background video
  textAlign(LEFT); // Centrage horizontal
  fill(255);
  textSize(22);
  text(t("regularTitle"), 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text(t("regularSubTitle"), 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Logo

  txt.show(); // Ensure text area is visible
  setTimeout(() => txt.elt.focus(), 0); // Focus the text area

  fill(255);
  textSize(25);
text(t("sentimentLabel"), 700-40, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870-40, 600); // Updated score
  fill(255);
  textSize(25);
text(t("tearEstimateLabel"), 950-40, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Updated score 
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
    text('crying...', 60, 400);
  } else if (isAttemptingToCry) {
    textSize(30);
    text('attempting to cry', 60, 400);
  } else {
    
    textSize(22);
 text(t("eightMLneeded"), 60, 400);
  }
  //text('Until next crying attempt', 60, 430);

  fill(255);
  textSize(22);
text(`${t("soilDryness")} ${currentDryness}%`, 650, 465);



//console.log(txt);
  
  if (actualScore < 0) { 
    fill(clicktextcolor);
    textSize(25);
text(t("pressShiftKey"), 512, 960);
    fill(255);
  }
}

function displayHelpmodescreen() {
  clear();

  image(video2, 0, 0, width, height); // Display the video as the background

  txt.show(); // Ensure text area is visible
  setTimeout(() => txt.elt.focus(), 0); // Focus the text area
textAlign(LEFT); // Centrage horizontal
  fill(255);
  textSize(22);
text(t("regularTitle"), 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
 text(t("regularSubTitle"), 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Display the logo

  fill(255);
  textSize(25);
 text(t("sentimentLabel"), 700-40, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870-40, 600); // Updated score
  fill(255);
  textSize(25);
text(t("tearEstimateLabel"), 950-40, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Updated score
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
}



function highlightText() {
  if (scoreChanged && millis() - lastScoreUpdateTime <= changeColorDuration && actualScore!=0) {
    // Blinking effect: Toggle visibility every 250 milliseconds
    if (floor((millis() - lastScoreUpdateTime) / 100) % 2 === 0) {
      fill(255); // Green color when visible
    } else {
      fill(0, 0, 0, 0); // Transparent when invisible
    }
  } else {
    fill(255); // Default color
    scoreChanged = false; // Reset the score changed flag
  }
}

function highlightTearTotal() {
  if (tearTotalChanged && millis() - lastTearUpdateTime <= changeColorDuration) {
    // Blinking effect: Toggle visibility every 250 milliseconds
    if (floor((millis() - lastTearUpdateTime) / 200) % 2 === 0) {
      fill(255); // Visible
    } else {
      fill(0, 0, 0, 0); // Transparent when invisible
    }
  } else {
    fill(255); // Default color
    tearTotalChanged = false; // Reset the flag
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






