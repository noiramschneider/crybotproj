const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const mcpadc = require('mcp-spi-adc');
const Gpio = require('pigpio').Gpio;
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');  // Module pour la manipulation de fichiers

var moistureLevel;

app.use(bodyParser.json()); // Pour parser les requêtes JSON

// --- Gestion de la sauvegarde de tearTotal dans un fichier ---
function loadTearTotal() {
  try {
    const data = fs.readFileSync('tearTotal.json', 'utf8');
    const json = JSON.parse(data);
    if (typeof json.tearTotal === 'number') {
      console.log(`tearTotal chargé depuis le fichier : ${json.tearTotal} mL`);
      return json.tearTotal;
    }
  } catch (error) {
    console.warn('Aucune sauvegarde trouvée, initialisation de tearTotal à 0.');
  }
  return 0;
}

function saveTearTotal() {
  const data = JSON.stringify({ tearTotal: tearTotal }, null, 2);
  fs.writeFile('tearTotal.json', data, 'utf8', (err) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde du tearTotal :', err);
    } else {
      console.log(`tearTotal sauvegardé dans le fichier : ${tearTotal} mL`);
    }
  });
}

// Initialisation de la variable globale tearTotal depuis le fichier
let tearTotal = loadTearTotal();
let isAttemptingToCry = false;
let isCrying = false;

// --- API Routes ---

// Endpoint pour obtenir le tearTotal
app.get('/get-tear-total', (req, res) => {
  res.json({ tearTotal: tearTotal });
});

// Servir l'interface statique (vos fichiers p5.js, index.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint pour mettre à jour le tearTotal depuis le frontend
app.post('/update-tear-total', (req, res) => {
  tearTotal = req.body.tearTotal;
  console.log(`Tear total updated: ${tearTotal} mL`);
  saveTearTotal();
  res.sendStatus(200);
});

// Endpoint pour obtenir l'état d'arrosage
app.get('/get-watering-state', (req, res) => {
  res.json({ 
    isAttemptingToCry: isAttemptingToCry, 
    isCrying: isCrying 
  });
});

// --- Endpoint pour réinitialiser tearTotal via un cheat code ---
app.post('/reset-tear-total', (req, res) => {
  // Si nécessaire, vous pouvez vérifier une clé secrète ici :
  // const { secret } = req.body;
  // if (secret !== 'votre_clé_secrète_ici') {
  //   console.warn('Tentative de réinitialisation avec une clé incorrecte.');
  //   return res.status(403).send('Forbidden');
  // }
  tearTotal = 0;
  console.log('tearTotal a été réinitialisé à 0 mL');
  saveTearTotal();
  res.sendStatus(200);
});

// --- Configuration du relais (pompe) ---
const pumpRelay = new Gpio(17, { mode: Gpio.OUTPUT });
pumpRelay.digitalWrite(1); // Placer le relais à l'état haut
const completelyWet = 400;
const completelyDry = 880;

// --- Logique d'arrosage ---
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
  const completelyWet = 400;
  const completelyDry = 880;
  return new Promise((resolve, reject) => {
    const sensor = mcpadc.open(5, { speedHz: 20000 }, (err) => {
      if (err) return reject(`Error accessing sensor: ${err}`);
      sensor.read((error, reading) => {
        if (error) return reject(`Error reading sensor: ${error}`);
        const rawValue = reading.rawValue;
        const dryness = Math.min(
          Math.max(((rawValue - completelyWet) / (completelyDry - completelyWet)) * 100, 0),
          100
        );
        console.log(`Raw sensor value: ${rawValue}, Dryness: ${dryness}%`);
        resolve({
          rawValue,
          dryness: Math.round(dryness)
        });
      });
    });
  });
}

app.get('/get-moisture', (req, res) => {
  getMoistureLevel()
    .then((moisture) => {
      console.log(`Sending dryness: ${moisture.dryness}%`);
      res.json({ dryness: moisture.dryness });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error getting moisture level');
    });
});

async function waterThePlant() {
  try {
    const moistureLevel = await getMoistureLevel();
    console.log(`Soil dryness: ${moistureLevel.dryness}%`);
    console.log(`tearTotal: ${tearTotal}`);
    const drynessThreshold = 70; // Seuil ajustable
    if (moistureLevel.dryness > drynessThreshold && tearTotal >= 8) {
      isAttemptingToCry = true;
      isCrying = false;
      console.log('Attempting to cry...');
      // Attendre 5 secondes avant de lancer le relais (arrosage)
      setTimeout(() => {
        isAttemptingToCry = false;
        isCrying = true;
        pumpRelay.digitalWrite(0);
        console.log('Crying...');
        // Après 3 secondes, arrêter le relais
        setTimeout(() => {
          pumpRelay.digitalWrite(1);
          isCrying = false;
          tearTotal -= 8;
          if (tearTotal < 0) tearTotal = 0;
          console.log(`TearTotal after watering: ${tearTotal}`);
          saveTearTotal();
        }, 12000);
      }, 5000);
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
  pumpRelay.digitalWrite(1);
  console.log('Stopped watering.');
}

// --- Planification avec node-schedule ---
const schedule = require('node-schedule');
schedule.scheduleJob({ hour: 16, minute: 30, tz: 'America/Toronto' }, () => {
  console.log('Daily watering check at 16:30 triggered.');
  waterThePlant();
});

// Endpoint pour déclencher l'arrosage depuis le frontend
app.post('/check-and-water', (req, res) => {
  console.log('Watering check triggered from frontend.');
  waterThePlant();
  res.sendStatus(200);
});

// Démarrer le serveur sur le port 3000
app.listen(3000, () => {
  console.log('Interface running at http://localhost:3000');
});
