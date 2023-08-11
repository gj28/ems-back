const mqtt = require('mqtt');
const moment = require('moment-timezone');

// MQTT broker URL
const broker = 'ws://broker.emqx.io:8083/mqtt';

// Connect to the MQTT broker
const client = mqtt.connect(broker);

// Generate random number between min and max
function getRandomNumber(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

// Generate random sample data for a device
function generateRandomData(deviceuid) {
  deviceuid = deviceuid;
  const voltage = getRandomNumber(200, 240);
  const current = getRandomNumber(5, 15);
  const freq = getRandomNumber(49, 51);
  const kva = getRandomNumber(20, 30);
  const kw = getRandomNumber(18, 25);
  const pf = getRandomNumber(0.85, 0.95);
  const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss');

  return {
    deviceuid,
    voltage,
    current,
    freq,
    kva,
    kw,
    pf,
    timestamp,
  };
}

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Publish random data for each device ID every 20 seconds
  for (let i = 1; i <= 9; i++) {
    const deviceuid = `SL0120230${i}`;
    setInterval(() => {
      const data = generateRandomData(deviceuid);
      const topic = `device/${deviceuid}`;
      const message = JSON.stringify(data);
      client.publish(topic, message, (err) => {
        if (err) {
          console.error('Error publishing message:', err);
        } else {
          console.log('Published message:', message);
        }
      });
    }, 20000);
  }
});

client.on('error', (err) => {
  console.error('MQTT client error:', err);
});

// Close the MQTT client on SIGINT
process.on('SIGINT', () => {
  console.log('Closing MQTT client...');
  client.end();
  process.exit();
});
