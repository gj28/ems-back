const db = require('../db');

function maxdemand() {
    try {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const deviceIdsQuery = `
            SELECT DISTINCT device_uid
            FROM ems.ems_live;`;

        db.query(deviceIdsQuery, (deviceIdsError, deviceIdsResult) => {
            if (deviceIdsError) {
                console.error('Error fetching unique device IDs:', deviceIdsError);
                return;
            }

            const uniqueDeviceIds = deviceIdsResult.rows;

            uniqueDeviceIds.forEach((device) => {
                const deviceID = device.device_uid;

                const deviceHighestKVAQuery = `
                    SELECT
                        MAX(kva) AS highest_kva
                    FROM ems.ems_live
                    WHERE date_time >= $1 AND device_uid = $2;`;

                db.query(deviceHighestKVAQuery, [currentDate, deviceID], (error, result) => {
                    if (error) {
                        console.error(`Error fetching highest KVA for device ${deviceID}:`, error);
                        return;
                    }

                    const highestKVA = result.rows[0]?.highest_kva || 0;

                    const latestKVAQuery = `
                        SELECT
                            kva
                        FROM ems.ems_live
                        WHERE device_uid = $1
                        ORDER BY date_time DESC
                        LIMIT 1;`;

                    db.query(latestKVAQuery, [deviceID], (latestKVAError, latestKVAResult) => {
                        if (latestKVAError) {
                            console.error(`Error fetching latest KVA for device ${deviceID}:`, latestKVAError);
                            return;
                        }

                        const latestKVA = latestKVAResult.rows[0]?.kva || 0;

                        const upsertQuery = `
                            INSERT INTO ems.maxdemand (deviceid, highest_kva, live_kva, calculation_date)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (deviceid, calculation_date)
                            DO UPDATE SET
                                highest_kva = GREATEST(EXCLUDED.highest_kva, $2),
                                live_kva = $3;`;

                        db.query(upsertQuery, [deviceID, highestKVA, latestKVA, currentDate], (upsertError) => {
                            if (upsertError) {
                                console.error(`Error inserting or updating KVA values for device ${deviceID}:`, upsertError);
                            } else {
                                //console.log(`KVA values for device ${deviceID} inserted or updated successfully.`);
                            }
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error inserting or updating device KVA values:', error);
    }
}

setInterval(maxdemand, 60 * 1000);

maxdemand();
