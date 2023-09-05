const mqtt = require('mqtt');
const { Client } = require('pg');
const os = require('os');

// MQTT broker URL
const broker = 'mqtt://broker.emqx.io';

// PostgreSQL configuration
const pgConfig = {
    host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
    user: 'gaurav',
    password: 'gaurav123',
    database: 'postgres',
    port: 5432,
};

// Create a PostgreSQL client
const pgClient = new Client(pgConfig);

// Connect to the PostgreSQL database
pgClient.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch(error => {
    console.error('Error connecting to PostgreSQL:', error);
  });

// Fetch the local IP address
const localIpAddress = getLocalIpAddress();

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    const iface = interfaces[key];
    for (const item of iface) {
      if (item.family === 'IPv4' && !item.internal) {
        return item.address;
      }
    }
  }
  return 'Unknown'; // Return 'Unknown' if no IP address is found
}

console.log('Local IP Address:', localIpAddress);

// Connect to the MQTT broker
const mqttClient = mqtt.connect(broker);

// Handle MQTT connection event
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');

  for (let i = 1; i <= 9; i++) {
    const deviceId = `SL0120230${i}`;
    const topic = `ems/mqtt/${deviceId}`;
    mqttClient.subscribe(topic, (error) => {
      if (error) {
        console.error(`Error subscribing to ${topic}:`, error);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message);

    const insertQuery = `
    INSERT INTO ems.ems_actual_data (deviceuid, voltage, current, kva, kw, pf, freq, timestamp, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const insertValues = [
      data.DeviceUID,
      data.Voltage,
      data.Current,
      data.KVA,
      data.KW,
      data.PF,
      data.Freq,
      data.Timestamp,
      localIpAddress,
    ];

    await pgClient.query(insertQuery, insertValues);
    console.log('Data inserted into PostgreSQL');
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT error:', error);
});

process.on('exit', () => {
  pgClient.end();
});
