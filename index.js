const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const mcpadc = require('mcp-spi-adc');
const Gpio = require('onoff').Gpio;
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // To parse JSON request bodies

// Global tearTotal variable (updated by frontend)
let tearTotal = 0;

// Relay and watering system setup
const pumpRelay = new Gpio(17, 'high');
const completelyWet = 400;
const completelyDry = 880;

// Serve the p5.js interface
app.use(express.static(path.join(__dirname, 'public')));

// API route to update tearTotal from frontend
app.post('/update-tear-total', (req, res) => {
  tearTotal = req.body.tearTotal; // Update the global tearTotal
  console.log(`Tear total updated: ${tearTotal} mL`);
  res.sendStatus(200); // Respond with success
});

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
  const readingPromises = [];
  let readings = { rawValues: [], values: [] };

  return new Promise((resolve, reject) => {
    const sensor = mcpadc.open(5, { speedHz: 20000 }, (error) => {
      if (error) {
        return reject(new Error(`Error accessing sensor: ${error}`));
      }

      let iterator = 50;
      while (iterator >= 0) {
        readingPromises.push(
          getSensorReadings(sensor)
            .then((reading) => {
              readings.rawValues.push(reading.rawValue);
              readings.values.push(reading.value);
            })
            .catch((error) => reject(error))
        );
        iterator--;
      }

      Promise.all(readingPromises).then(() => {
        const averageRawValue = readings.rawValues.reduce((a, b) => a + b, 0) / 50;
        return resolve({
          rawValue: averageRawValue,
          soilDrynessPercentage: averageRawValue > 0 ? ((averageRawValue / completelyWet) * 100).toFixed(0) : 0,
        });
      });
    });
  });
}

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

// Run the watering check every minute
setInterval(() => {
  waterThePlant();
}, 60000);

// Start server
app.listen(3000, () => {
  console.log('Interface running at http://localhost:3000');
});
