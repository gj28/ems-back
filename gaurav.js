const pgp = require('pg-promise')();
const sourceDBConfig = {
    host: '64.227.181.131',
    user: 'postgres',
    password: 'iotsenselive',
    database: 'senselive_db',
    port: 12440,
};

const targetDBConfig = {
    host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
    user: 'gaurav',
    password: 'gaurav123',
    database: 'postgres',
    port: 5432,
};

// Create a connection to the source and target databases
const sourceDB = pgp(sourceDBConfig);
const targetDB = pgp(targetDBConfig);

let lastTimestamp = null; // Keep track of the latest timestamp

async function transferData() {
  try {
    // Fetch the latest data from the source database
    const latestData = await sourceDB.oneOrNone(
      'SELECT * FROM public.energy_database WHERE date_time > $1 ORDER BY date_time DESC LIMIT 1',
      [lastTimestamp]
    );

    if (latestData) {
      // Insert the latest data into the target database
      await targetDB.tx(async (t) => {
        await t.none(
          `INSERT INTO ems.ems_actual_data (deviceid, ip_address, voltage_1n, voltage_2n, voltage_3n, voltage_n, voltage_12, voltage_23, 
          voltage_31, voltage_l, current_1, current_2, current_3, "current", kw_1, kw_2, kw_3, kvar_1, kvar_2, kvar_3, kva_1, kva_2, kva_3, 
          pf_1, pf_2, pf_3, pf, freq, kw, kvar, kva, max_kw, min_kw, max_kvar, min_kvar, max_kva, max_int_v1n, max_int_v2n, max_int_v3n, 
          max_int_v12, max_int_v23, max_int_v31, max_int_i1, max_int_i2, max_int_i3, run_h, on_h, thd_v1n, thd_v2n, thd_v3n, thd_v12, thd_v23, 
          thd_v31, thd_i1, thd_i2, thd_i3, imp_kwh, exp_kwh, kwh, imp_kvarh, exp_kvarh, kvarh, kvah, "timestamp") 
          VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, 
          $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64)`,
          [
            latestData.device_uid,
            latestData.ip_address,
            latestData.voltage_1n,
            latestData.voltage_2n,
            latestData.voltage_3n,
            latestData.voltage_n,
            latestData.voltage_12,
            latestData.voltage_23,
            latestData.voltage_31,
            latestData.voltage_l,
            latestData.current_1,
            latestData.current_2,
            latestData.current_3,
            latestData.current,
            latestData.kw_1,
            latestData.kw_2,
            latestData.kw_3,
            latestData.kvar_1,
            latestData.kvar_2,
            latestData.kvar_3,
            latestData.kva_1,
            latestData.kva_2,
            latestData.kva_3,
            latestData.pf_1,
            latestData.pf_2,
            latestData.pf_3,
            latestData.pf,
            latestData.freq,
            latestData.kw,
            latestData.kvar,
            latestData.kva,
            latestData.max_kw,
            latestData.min_kw,
            latestData.max_kvar,
            latestData.min_kvar,
            latestData.max_kva,
            latestData.max_int_v1n,
            latestData.max_int_v2n,
            latestData.max_int_v3n,
            latestData.max_int_v12,
            latestData.max_int_v23,
            latestData.max_int_v31,
            latestData.max_int_i1,
            latestData.max_int_i2,
            latestData.max_int_i3,
            latestData.run_h,
            latestData.on_h,
            latestData.thd_v1n,
            latestData.thd_v2n,
            latestData.thd_v3n,
            latestData.thd_v12,
            latestData.thd_v23,
            latestData.thd_v31,
            latestData.thd_i1,
            latestData.thd_i2,
            latestData.thd_i3,
            latestData.imp_kwh,
            latestData.exp_kwh,
            latestData.kwh,
            latestData.imp_kvarh,
            latestData.exp_kvarh,
            latestData.kvarh,
            latestData.kvah,
            latestData.date_time,
          ]
        );
      });

      lastTimestamp = latestData.date_time; // Update the last timestamp
      console.log('Data transferred successfully'); // Add this console log
    }
  } catch (error) {
    console.error('Error transferring data:', error);
  }
}

// Set up an interval to periodically transfer data
setInterval(transferData, 1000); // Every 1 second

// Handle application exit to gracefully close the database connections
process.on('exit', () => {
  sourceDB.$pool.end(); // Close the source database connection
  targetDB.$pool.end(); // Close the target database connection
});
