const mcpadc = require('mcp-spi-adc');
const Gpio = require('onoff').Gpio;
const schedule = require('node-schedule');

const completelyWet = 400;
const completelyDry = 880;

const pumpRelay = new Gpio(17, 'high'); 
// IMPORTANT: Use 'high' if relay uses low level trigger

function getSensorReadings(sensor) {
    return new Promise((resolve, reject) => {        
        sensor.read((readError, reading) => {
            if (readError) {
                return reject(new Error(`There was an error getting the sensor reading: ${readError}`)); 
            }
            return resolve(reading);       
     });
});};
function getMoistureLevel() {    
    const readingPromises = [];
    let readings = {};
    readings.rawValues = [];
    readings.values = [];
    
    return new Promise((resolve, reject) => {
        const sensor = mcpadc.open(5, {speedHz: 20000}, (error) => {              
            if (error) {
                return reject(new Error(`There was an error accessing the sensor: ${error}`));            
            }
            let iterator = 50; // Just need a large number of readings to try for better accuracy             
            while (iterator >= 0) {                    
                readingPromises.push(getSensorReadings(sensor)                    
                  .then(reading => {                        
                    readings.rawValues.push(reading.rawValue);                        
                    readings.values.push(reading.value);                    
                  }).catch(error => {
                    return reject(error);
                  })
                 );                 
                 iterator--;
            }
        
            return Promise.all(readingPromises).then(() => {                
                const averageRawValue = readings.rawValues.reduce((a, b) => a + b, 0) / 50;                
                const averageValue = readings.values.reduce((a, b) => a + b, 0) / 50;

                // Normalize rawValue to percentage
                let soilDrynessPercentage = ((averageRawValue - completelyWet) / (completelyDry - completelyWet)) * 100;
                
                // Clamp the value to be between 0 and 100
                soilDrynessPercentage = Math.max(0, Math.min(100, soilDrynessPercentage));
                
                return resolve({
                    rawValue: averageRawValue,                     
                    value: averageValue,
                    soilDrynessPercentage: soilDrynessPercentage.toFixed(0),                
                });
             });
        });    
    });
};

function shouldWater(moistureLevel) {
    // Adjust the threshold based on the percentage scale
    const dryThreshold = 30; // Example threshold for when the soil is considered too dry
    return moistureLevel < dryThreshold;
};

function waterThePlant() {
    return new Promise((resolve, reject) => {        
        pumpRelay.read(async (error, status) => {
            if (error) {
                return reject(new Error(`There was an error getting the pump relay status: ${error}`));
            }
            const moistureLevel = await getMoistureLevel();  
            console.log(moistureLevel);          
            const needsWater = shouldWater(moistureLevel.soilDrynessPercentage);
            if (status !== 0 && needsWater) {                
                pumpRelay.writeSync(0); 
                // closes the circuit and starts the pump
                console.log("valve should open");
            }
            return resolve({
                status: `The plant is being watered.`,
            });
        });    
    });
};
function stopWateringPlant() {
    return new Promise((resolve, reject) => {        
        pumpRelay.read((error, status) => {
            if (error) {
                return reject(new Error(`There was an error getting the pump relay status: ${error}`));
            }             
            if (status !== 1) {
                pumpRelay.writeSync(1);
                // opens the circuit and stops the pump
                console.log("valve should close");       

            }
            return resolve({
                status: `The plant is not being watered.`, 
            });
        });
    });
};

function shouldWaterPlant() {    
    // Run every day at 7 a.m.    

        // Water the plant for three seconds           
        setTimeout(() => {
            waterThePlant();
 
            setTimeout(() => {                 
                stopWateringPlant();
            }, 3000);
         }, 3000);
    
};

shouldWaterPlant();
//A GARDER POUR SCHEDULER PLUS TARD
/*const shouldWaterPlant = () => {    
    // Run every day at 7 a.m.    
   return schedule.scheduleJob('0 7 * * *', async () => {
        // Water the plant for three seconds           
        setTimeout(() => {
            waterThePlant();
 
            setTimeout(() => {                 
                stopWateringPlant();
            }, 3000);
         }, 3000);
    });
};*/


