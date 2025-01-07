const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const mcpadc = require('mcp-spi-adc');
const Gpio = require('onoff').Gpio;
const app = express();
const bodyParser = require('body-parser');

var moistureLevel;

app.use(bodyParser.json()); // To parse JSON request bodies
// Global tearTotal variable (updated by frontend)
let tearTotal = 0;
let isAttemptingToCry = false;
let isCrying = false;


// API route to get the current tearTotal
app.get('/get-tear-total', (req, res) => {
  res.json({ tearTotal: tearTotal }); // Send the current tearTotal as JSON
});

// Serve the p5.js interface
app.use(express.static(path.join(__dirname, 'public')));

// API route to updaacte tearTotal from frontend
app.post('/update-tear-total', (req, res) => {
  tearTotal = req.body.tearTotal; // Update the global tearTotal
  console.log(`Tear total updated: ${tearTotal} mL`);
  res.sendStatus(200); // Respond with success
});

app.get('/get-watering-state', (req, res) => {
  res.json({ 
    isAttemptingToCry: isAttemptingToCry, 
    isCrying: isCrying 
  });
});



// Relay and watering system setup
const pumpRelay = new Gpio(17, 'high');
const completelyWet = 400;
const completelyDry = 880;



// Watering logic
function getSensorReadings(sensor) {
  return new Promise((resolve, reject) => {
    sensor.read((readError, reading) => {
      if (readError) {
        return reject(new Error(`Error getting sensor reading: ${readError}`));
      }
      return resolve(reading);
    });
  });
}

function getMoistureLevel() {
  const completelyWet = 400;  // Adjust based on sensor calibration
  const completelyDry = 880;  // Adjust based on sensor calibration

  return new Promise((resolve, reject) => {
    const sensor = mcpadc.open(5, { speedHz: 20000 }, (err) => {
      if (err) return reject(`Error accessing sensor: ${err}`);

      sensor.read((error, reading) => {
        if (error) return reject(`Error reading sensor: ${error}`);

        const rawValue = reading.rawValue;
        const dryness = Math.min(
          Math.max(
            ((rawValue - completelyWet) / (completelyDry - completelyWet)) * 100,
            0
          ),
          100
        ); // Scale dryness to 0–100

        console.log(`Raw sensor value: ${rawValue}, Dryness: ${dryness}%`);
        resolve({
          rawValue,
          dryness: Math.round(dryness), // Round to the nearest integer
        });
      });
    });
  });
}




app.get('/get-moisture', (req, res) => {
  getMoistureLevel()
    .then((moisture) => {
      console.log(`Sending dryness: ${moisture.dryness}%`);  // Log the dryness value
      res.json({ dryness: moisture.dryness }); // Send the dryness to the frontend
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error getting moisture level');
    });
});



function shouldWater(moistureLevel) {
  return moistureLevel > 200;
}

async function waterThePlant() {
  try {
    const moistureLevel = await getMoistureLevel();
    console.log(`Soil dryness: ${moistureLevel.dryness}%`);
    console.log(`tearTotal: ${tearTotal}`);

    const drynessThreshold = 80; // Adjust threshold based on requirements

    if (moistureLevel.dryness > drynessThreshold && tearTotal >= 8) {
      // Start by indicating that we are about to attempt crying
      isAttemptingToCry = true;
      isCrying = false;
      console.log('Attempting to cry...');

      // Wait 5 seconds before actually starting to "cry"
      setTimeout(() => {
        // Now transition from attempting to cry -> crying
        isAttemptingToCry = false;
        isCrying = true;
        pumpRelay.writeSync(0); // Start watering (crying)
        console.log('Crying...');

        // After 3 seconds of crying, stop
        setTimeout(() => {
          pumpRelay.writeSync(1); // Stop watering
          isCrying = false; // Done crying
          tearTotal -= 8;
          if (tearTotal < 0) tearTotal = 0;
          console.log(`TearTotal after watering: ${tearTotal}`);
        }, 3000); // 3 seconds of watering

      }, 5000); // 5 seconds delay before starting watering
    } else {
      console.log('Not enough tears or soil is moist enough.');
    }
  } catch (error) {
    console.error('Error during watering:', error);
    isAttemptingToCry = false;
    isCrying = false;
  }
}




function stopWateringPlant() {
  pumpRelay.writeSync(1); // Stop the pump
  console.log('Stopped watering.');
}

/* Run the watering check every minute
setInterval(() => {
  waterThePlant();
}, 60000);*/


const schedule = require('node-schedule');

// Schedule a daily check at 17:30 Montreal local time
schedule.scheduleJob({ hour: 17, minute: 30, tz: 'America/Toronto' }, () => {
  console.log('Daily watering check at 17:30 triggered.');
  waterThePlant(); // Trigger the watering logic
});

// Endpoint to check and water when triggered by frontend
app.post('/check-and-water', (req, res) => {
  console.log('Watering check triggered from frontend.');
  waterThePlant(); // Trigger the watering logic
  res.sendStatus(200);
});

// Start server
app.listen(3000, () => {
  console.log('Interface running at http://localhost:3000');
});
