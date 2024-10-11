const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const mcpadc = require('mcp-spi-adc');
const Gpio = require('onoff').Gpio;
const app = express();

// Plant watering logic (from waterplant.js)
const pumpRelay = new Gpio(17, 'high');
const completelyWet = 400;
const completelyDry = 880;

// Serve the p5.js interface
app.use(express.static(path.join(__dirname, 'public'))); // Make sure your p5.js sketch is in a 'public' folder

app.listen(3000, () => {
  console.log('Interface running at http://localhost:3000');
});

// Plant watering logic here
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
    const needsWater = shouldWater(moistureLevel.soilDrynessPercentage);

    if (needsWater) {
      pumpRelay.writeSync(0); // Start the pump
      console.log('Watering the plant...');
      setTimeout(() => {
        stopWateringPlant();
      }, 3000); // Water for 3 seconds
    } else {
      console.log('Conditions not met for watering.');
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
