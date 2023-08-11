const mqtt = require('mqtt');
const moment = require('moment-timezone');
const { Pool } = require('pg');

// MQTT broker URL
const broker = 'ws://broker.emqx.io:8083/mqtt';
const topic = 'device/emsinfo';

// PostgreSQL Database Configuration
const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
  port: 5432, // PostgreSQL default port
};

const pool = new Pool(dbConfig);

// Connect to the MQTT broker
const client = mqtt.connect(broker);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Error subscribing to topic:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());
  console.log('Received message:', data);

  try {
    // Store the entry in the PostgreSQL database
    const insertQuery = `
      INSERT INTO ems.ems_actual_data (
        DeviceUID,
        Voltage,
        Current,
        KVA,
        KW,
        PF,
        Freq,
        Timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [
      data.DeviceUID,
      data.Voltage,
      data.Current,
      data.KVA,
      data.KW,
      data.PF,
      data.Freq,
      data.Timestamp,
    ];

    const client = await pool.connect();
    await client.query(insertQuery, values);
    console.log('Data inserted into the PostgreSQL database');
  } catch (error) {
    console.error('Error inserting data into the database:', error);
  }
});

client.on('error', (err) => {
  console.error('MQTT client error:', err);
});

// Close the MQTT client and the PostgreSQL pool on SIGINT
process.on('SIGINT', () => {
  console.log('Closing MQTT client...');
  client.end();
  pool.end(); // Close the PostgreSQL pool
  process.exit();
});
