

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
var currentDryness = 0; // Store the fetched dryness value

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

  video = createVideo('gradient.mp4', videoLoaded);
  video.elt.muted = true;
  video.hide();

  video2 = createVideo('gradient2.mp4', videoLoaded);
  video2.elt.muted = true;
  video2.hide();

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
  }

  else if (tearTotal < 8 && !helpMode) {
    displayAlert(); // Show alert screen if tearTotal < 8 mL
    document.getElementById('txt').style.display = "none"; // Hide input box
  } 
  // If 1 minute of inactivity has passed and call for help mode is triggered
  if (callForHelpTriggered) {
    displayCallforHelp(); // Show call for help screen
    document.getElementById('txt').style.display = "none"; // Hide input box
  } 
  // If user is in "I'm thirsty" mode and not in help mode
  else if (imThirsty && !helpMode) {
    displayAlert(); // Show alert screen when imThirsty is true
    document.getElementById('txt').style.display = "none"; // Hide input box
  } 
  // If in help mode
  else if (helpMode) {
    displayHelpmodescreen(); // Switch to help mode
    document.getElementById('txt').style.display = "block"; // Show input box
  } 
  // Default case: display regular screen
  else {
    displayRegularScreen(); // Show the regular screen
    document.getElementById('txt').style.display = "block"; // Show input box
  }

  // Always focus the text area if it's shown
  if (txt && txt.elt.style.display !== 'none') {
    setTimeout(() => txt.elt.focus(), 0);
  }
}

function videoLoaded() {
  video.loop();
  video2.loop();
}

function displayAlert() {
  
  clear();
  image(video2, 0, 0, width, height); // Background video
  txt.hide(); // Hide the text area, no need to focus it
  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500));

  fill(clicktextcolor);
  textSize(100);
  text('PLEASE', 460, 380);
  text('MAKE', 500, 480);
  text('ME', 560, 580);
  text('CRY', 530, 680);
  fill(clicktextcolor2);
  textSize(25);
  text('PRESS ENTER TO HELP', 512, 900);
}

function displayCallforHelp() {
  
  clear();
  image(video, 0, 0, width, height); // Background video
  txt.hide(); // Hide the text area during this display

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  clicktextcolor2 = color(255, 255, 255);
  clicktextcolor2.setAlpha(128 + 128 * sin(millis() / 500));

  fill(clicktextcolor);
  textSize(100);
  text('PLEASE', 460, 380);
  text('MAKE', 500, 480);
  text('ME', 560, 580);
  text('SAD', 530, 680);
  fill(clicktextcolor2);
  textSize(25);
  text('PRESS ENTER TO HELP', 512, 900);
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
  fill(255);
  textSize(22);
  text('CryBot_v1', 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text('Please make me cry', 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Logo

  fill(255);
  textSize(25);
  text('SENTIMENT ', 700, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870, 600); // Updated score
  fill(255);
  textSize(25);
  text('TEAR ESTIMATE ', 950, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Updated score 
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 390-100);
  textSize(40);
  text('tears available ', 60, 425-90);

  fill(255);
  textSize(22);
  text(`Soil Dryness: ${currentDryness}%`, 650, 465); // Use the global variable

  txt.show(); // Ensure text area is visible
  setTimeout(() => txt.elt.focus(), 0); // Focus the text area

  fill(255);
  textSize(30);
  text('4 min 52 sec', 60, 400);
  textSize(22);
  text('______', 60,350)
  text('Until next crying attempt', 60, 430);
//console.log(txt);
  
  if (actualScore < 0) { 
    fill(clicktextcolor);
    textSize(25);
    text('PRESS SHIFT KEY TO SEND', 512, 960);
    fill(255);
  }
}

function displayHelpmodescreen() {
  clear();
  image(video2, 0, 0, width, height); // Background video

  txt.show(); // Ensure text area is visible
  setTimeout(() => txt.elt.focus(), 0); // Focus the text ar

  fill(255);
  textSize(22);
  text('CryBot_v1', 50, 50);

  clicktextcolor = color(255, 255, 255);
  clicktextcolor.setAlpha(128 + 128 * sin(millis() / 1000));
  fill(clicktextcolor);
  text('Please make me cry', 1000, 50);

  img.resize(300, 0);
  image(img, 820, 130); // Logo

  fill(255);
  textSize(25);
  text('SENTIMENT ', 700, 600);
  textSize(25);
  highlightText();

  text(actualScore, 870, 600); // Updated score
  fill(255);
  textSize(25);
  text('TEAR ESTIMATE ', 950, 600);
  textSize(25);
  text(tearEstimate + ' mL', 1170, 600); // Updated score 
  fill(255);
  textSize(70);
  highlightTearTotal();
  text(tearTotal + ' mL', 60, 390-100);
  textSize(40);
  text('tears available ', 60, 425-90);

 fill(255);
  textSize(22);
  text(`Soil Dryness: ${currentDryness}%`, 650, 465); // Use the global variable

  if (actualScore < 0) { 
    fill(clicktextcolor);
    textSize(25);
    text('PRESS SHIFT KEY TO SEND', 512, 960);
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






