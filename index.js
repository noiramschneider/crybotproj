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
  const completelyWet = 400;  // Adjust based on your sensor calibration
  const completelyDry = 880;  // Adjust based on your sensor calibration

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

        console.log(`Raw sensor value: ${rawValue}, Dryness: ${dryness}%`); // Log the values
        resolve({
          rawValue,
          dryness: Math.round(dryness), // Round to nearest whole number
        });
      });
    });
  });
}

app.get('/get-moisture', (req, res) => {
  getMoistureLevel()
    .then((moisture) => {
      console.log(`Sending dryness: ${moisture.dryness}%`);  // Log the dryness value for debugging
      res.json({ dryness: moisture.dryness }); // Send the dryness percentage to the frontend
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error getting moisture level');
    });
});

function shouldWater(moistureLevel) {
  return moistureLevel > 200;
}

function waterThePlant() {
  return new Promise(async (resolve, reject) => {
    const moistureLevel = await getMoistureLevel();
    console.log(`Soil dryness: ${moistureLevel.soilDrynessPercentage}%`);
console.log("tearTotal "+tearTotal);

    if (moistureLevel.soilDrynessPercentage > 200 && tearTotal >= 8) {
      pumpRelay.writeSync(0); // Start the pump
      console.log('Watering the plant...');
      setTimeout(() => {
        stopWateringPlant();
        
                // Deduct 8 mL from tearTotal after watering
        tearTotal -= 8;
        if (tearTotal < 0) tearTotal = 0; // Prevent negative tearTotal

        console.log(`Tear total after watering: ${tearTotal} mL`);
      }, 3000); // Water for 3 seconds
    } else {
      console.log('Not enough tears or soil is moist enough.');
    }

    resolve();
  });
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
