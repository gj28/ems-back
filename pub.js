const mqtt = require('mqtt');
const moment = require('moment-timezone');

// MQTT broker URL
const broker = 'mqtt://broker.emqx.io';

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to generate random JSON data for a specific device ID
function generateRandomData(deviceId) {
  const DeviceUID = deviceId;
  const Voltage = getRandomNumber(35, 50).toFixed(1);
  const Current = getRandomNumber(35, 50).toFixed(1);
  const KVA = getRandomNumber(35, 50).toFixed(1);
  const KW = getRandomNumber(35, 50).toFixed(1);
  const PF = getRandomNumber(35, 50).toFixed(1);
  const Freq = getRandomNumber(35, 50).toFixed(1);
  const Timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss');



  const data = {
    DeviceUID,
    Voltage,
    Current,
    KVA,
    KW,
    PF,
    Freq,
    Timestamp
  };

  return JSON.stringify(data);
}

// Connect to the MQTT broker
const client = mqtt.connect(broker);

// Handle MQTT connection event
client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Publish random data for each device ID every 1 second
  for (let i = 1; i <= 9; i++) {
    const deviceId = `SL0120230${i}`;
    const topic = `ems/mqtt/${deviceId}`;

    setInterval(() => {
      const message = generateRandomData(deviceId);
      client.publish(topic, message);
    }, 20000);
  }
  // for (let i = 10; i <= 1000; i++) {
  //     const deviceId = `SL012023${i}`;
  //     const topic = `sense/live/${deviceId}`;

  //     setInterval(() => {
  //       const message = generateRandomData(deviceId);
  //       client.publish(topic, message);
  //     }, 20000);
  //   }
  }
);

// Handle MQTT error event
client.on('error', (error) => {
  console.error('MQTT error:', error);
});

