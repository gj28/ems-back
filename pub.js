const mqtt = require('mqtt');
const moment = require('moment-timezone');

// MQTT broker URL
const broker = 'mqtt://broker.emqx.io';

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to generate random JSON data for a specific device ID
function generateRandomData(deviceid) {
  const Device_uid = deviceid;
  const Voltage1N = getRandomNumber(100, 300).toFixed(1);
  const Voltage2N = getRandomNumber(100, 300).toFixed(1);
  const Voltage3N = getRandomNumber(100, 300).toFixed(1);
  const VoltageN = getRandomNumber(100, 300).toFixed(1);
  const Voltage12 = getRandomNumber(100, 300).toFixed(1);
  const Voltage23 = getRandomNumber(100, 300).toFixed(1);
  const Voltage31 = getRandomNumber(100, 300).toFixed(1);
  const VoltageL = getRandomNumber(100, 300).toFixed(1);
  const Current1 = getRandomNumber(5, 20).toFixed(1);
  const Current2 = getRandomNumber(5, 20).toFixed(1);
  const Current3 = getRandomNumber(5, 20).toFixed(1);
  const Current = getRandomNumber(5, 20).toFixed(1);
  const KW1 = getRandomNumber(10, 50).toFixed(1);
  const KW2 = getRandomNumber(10, 50).toFixed(1);
  const KW3 = getRandomNumber(10, 50).toFixed(1);
  const KVAR1 = getRandomNumber(5, 20).toFixed(1);
  const KVAR2 = getRandomNumber(5, 20).toFixed(1);
  const KVAR3 = getRandomNumber(5, 20).toFixed(1);
  const KVA1 = getRandomNumber(10, 50).toFixed(1);
  const KVA2 = getRandomNumber(10, 50).toFixed(1);
  const KVA3 = getRandomNumber(10, 50).toFixed(1);
  const PF1 = getRandomNumber(0.7, 0.99).toFixed(2);
  const PF2 = getRandomNumber(0.7, 0.99).toFixed(2);
  const PF3 = getRandomNumber(0.7, 0.99).toFixed(2);
  const PF = getRandomNumber(0.7, 0.99).toFixed(2);
  const Freq = getRandomNumber(49.5, 50.5).toFixed(1);
  const KW = getRandomNumber(1000, 5000).toFixed(1);
  const KVAR = getRandomNumber(500, 2000).toFixed(1);
  const KVA = getRandomNumber(1000, 5000).toFixed(1);
  const MaxKW = getRandomNumber(100, 500).toFixed(1);
  const MinKW = getRandomNumber(10, 100).toFixed(1);
  const MaxKVAR = getRandomNumber(50, 200).toFixed(1);
  const MinKVAR = getRandomNumber(5, 50).toFixed(1);
  const MaxKVA = getRandomNumber(100, 500).toFixed(1);
  const MaxIntV1N = getRandomNumber(100, 300).toFixed(1);
  const MaxIntV2N = getRandomNumber(100, 300).toFixed(1);
  const MaxIntV3N = getRandomNumber(100, 300).toFixed(1);
  const MaxIntV12 = getRandomNumber(100, 300).toFixed(1);
  const MaxIntV23 = getRandomNumber(100, 300).toFixed(1);
  const MaxIntV31 = getRandomNumber(100, 300).toFixed(1);
  const MaxIntI1 = getRandomNumber(5, 20).toFixed(1);
  const MaxIntI2 = getRandomNumber(5, 20).toFixed(1);
  const MaxIntI3 = getRandomNumber(5, 20).toFixed(1);
  const ImpKWH = getRandomNumber(1000, 5000).toFixed(1);
  const ExpKWH = getRandomNumber(500, 2000).toFixed(1);
  const KWH = getRandomNumber(2000, 7000).toFixed(1);
  const ImpKVARH = getRandomNumber(500, 2000).toFixed(1);
  const ExpKVARH = getRandomNumber(100, 500).toFixed(1);
  const KVARH = getRandomNumber(600, 2500).toFixed(1);
  const KVAH = getRandomNumber(2000, 7000).toFixed(1);
  const RunH = getRandomNumber(1000, 5000).toFixed(0);
  const OnH = getRandomNumber(0, 10).toFixed(0);
  const THDV1N = getRandomNumber(1, 10).toFixed(2);
  const THDV2N = getRandomNumber(1, 10).toFixed(2);
  const THDV3N = getRandomNumber(1, 10).toFixed(2);
  const THDV12 = getRandomNumber(1, 10).toFixed(2);
  const THDV23 = getRandomNumber(1, 10).toFixed(2);
  const THDV31 = getRandomNumber(1, 10).toFixed(2);
  const THDI1 = getRandomNumber(1, 10).toFixed(2);
  const THDI2 = getRandomNumber(1, 10).toFixed(2);
  const THDI3 = getRandomNumber(1, 10).toFixed(2);

  const data = {
    Device_uid,
    Voltage1N,
    Voltage2N,
    Voltage3N,
    VoltageN,
    Voltage12,
    Voltage23,
    Voltage31,
    VoltageL,
    Current1,
    Current2,
    Current3,
    Current,
    KW1,
    KW2,
    KW3,
    KVAR1,
    KVAR2,
    KVAR3,
    KVA1,
    KVA2,
    KVA3,
    PF1,
    PF2,
    PF3,
    PF,
    Freq,
    KW,
    KVAR,
    KVA,
    MaxKW,
    MinKW,
    MaxKVAR,
    MinKVAR,
    MaxKVA,
    MaxIntV1N,
    MaxIntV2N,
    MaxIntV3N,
    MaxIntV12,
    MaxIntV23,
    MaxIntV31,
    MaxIntI1,
    MaxIntI2,
    MaxIntI3,
    ImpKWH,
    ExpKWH,
    KWH,
    ImpKVARH,
    ExpKVARH,
    KVARH,
    KVAH,
    RunH,
    OnH,
    THDV1N,
    THDV2N,
    THDV3N,
    THDV12,
    THDV23,
    THDV31,
    THDI1,
    THDI2,
    THDI3,
  };

  return JSON.stringify(data);
}


// Connect to the MQTT broker
const client = mqtt.connect(broker);

// Handle MQTT connection event
client.on('connect', () => {
  //console.log('Connected to MQTT broker');

  // Publish random data for each device ID every 20 seconds
  for (let i = 1; i <= 9; i++) {
    const deviceid = `SL0120230${i}`;
    const topic = `ems/data/${deviceid}`;

    setInterval(() => {
      const message = generateRandomData(deviceid);
      client.publish(topic, message);
    }, 20000);
  }
});

// Handle MQTT error event
client.on('error', (error) => {
  console.error('MQTT error:', error);
});
