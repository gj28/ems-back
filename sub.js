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
pgClient.connect().then(() => {
 // console.log('Connected to PostgreSQL database');
}).catch(error => {
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
  //console.log('Connected to MQTT broker');

  for (let i = 1; i <= 9; i++) {
    const deviceid = `SL0120230${i}`;
    const topic = `ems/${deviceid}`;
    mqttClient.subscribe(topic, (error) => {
      if (error) {
        console.error(`Error subscribing to ${topic}:`, error);
      } else {
        //console.log(`Subscribed to ${topic}`);
      }
    });
  }
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message);

    const insertQuery = `
    INSERT INTO ems.ems_actual_data (deviceid, voltage_1n, voltage_2n, voltage_3n, voltage_N, voltage_12, voltage_23, voltage_31, 
    voltage_L, current_1, current_2, current_3, current, kw_1, kw_2, kw_3, kvar_1, kvar_2, kvar_3, kva_1, kva_2, kva_3, 
    pf_1, pf_2, pf_3, pf, freq, kw, kvar, kva, max_kw, min_kw, max_kvar, min_kvar, max_kva, max_int_v1n, max_int_v2n, 
    max_int_v3n, max_int_v12, max_int_v23, max_int_v31, max_int_i1, max_int_i2, max_int_i3, imp_kwh, exp_kwh, kwh, 
    imp_kvarh, exp_kvarh, kvarh, kvah, run_h, on_h, thd_v1n, thd_v2n, thd_v3n, thd_v12, thd_v23, thd_v31, thd_i1, 
    thd_i2, thd_i3, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
      $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43,
      $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63
    )`;

    const insertValues = [
      data.Device_uid,
      data.Voltage1N,
      data.Voltage2N,
      data.Voltage3N,
      data.VoltageN,
      data.Voltage12,
      data.Voltage23,
      data.Voltage31,
      data.VoltageL,
      data.Current1,
      data.Current2,
      data.Current3,
      data.Current,
      data.KW1,
      data.KW2,
      data.KW3,
      data.KVAR1,
      data.KVAR2,
      data.KVAR3,
      data.KVA1,
      data.KVA2,
      data.KVA3,
      data.PF1,
      data.PF2,
      data.PF3,
      data.PF,
      data.Freq,
      data.KW,
      data.KVAR,
      data.KVA,
      data.MaxKW,
      data.MinKW,
      data.MaxKVAR,
      data.MinKVAR,
      data.MaxKVA,
      data.MaxIntV1N,
      data.MaxIntV2N,
      data.MaxIntV3N,
      data.MaxIntV12,
      data.MaxIntV23,
      data.MaxIntV31,
      data.MaxIntI1,
      data.MaxIntI2,
      data.MaxIntI3,
      data.ImpKWH,
      data.ExpKWH,
      data.KWH,
      data.ImpKVARH,
      data.ExpKVARH,
      data.KVARH,
      data.KVAH,
      data.RunH,
      data.OnH,
      data.THDV1N,
      data.THDV2N,
      data.THDV3N,
      data.THDV12,
      data.THDV23,
      data.THDV31,
      data.THDI1,
      data.THDI2,
      data.THDI3,
      localIpAddress,
    ];

    pgClient.query(insertQuery, insertValues)
      .then(() => {
        console.log('Data inserted into PostgreSQL');
      })
      .catch((error) => {
        console.error('Error inserting data into PostgreSQL:', error);
      });
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
