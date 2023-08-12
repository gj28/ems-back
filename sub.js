const mqtt = require('mqtt');
const { Client } = require('pg');

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
//   for (let i = 10; i <= 1000; i++) {
//     const deviceId = `SL012023${i}`;
//     const topic = `ems/mqtt/${deviceId}`;
//     mqttClient.subscribe(topic, (error) => {
//       if (error) {
//         console.error(`Error subscribing to ${topic}:`, error);
//       } else {
//         console.log(`Subscribed to ${topic}`);
//       }
//     });
//   }
});

mqttClient.on('message', async (topic, message) => {
  try {
    console.log(`Received message on topic '${topic}': ${message.toString()}`);
  
    const data = JSON.parse(message);
  
    const insertQuery = `
    INSERT INTO ems.ems_actual_data (deviceuid, voltage, current, kva, kw, pf, freq, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
