const db = require('../db');

function kw_sum() {
    try {
        const currentDate = new Date();
        const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const last24Hours = new Date(currentDate - 24 * 60 * 60 * 1000);

        const deviceIdsQuery = 'SELECT DISTINCT deviceid FROM ems.ems_actual_data;';

        db.query(deviceIdsQuery, (deviceIdsError, deviceIdsResult) => {
            if (deviceIdsError) {
                console.error('Error fetching unique device IDs:', deviceIdsError);
                return;
            }

            const uniqueDeviceIds = deviceIdsResult.rows;

            uniqueDeviceIds.forEach((device) => {
                const deviceID = device.deviceid;

                const monthSumQuery = `
                SELECT
                    SUM(kw) AS total_kw_month,
                    SUM(kvar) AS total_kvar_month
                FROM ems.ems_actual_data
                WHERE timestamp >= $1 AND timestamp <= $2 AND deviceid = $3;`;

                db.query(monthSumQuery, [firstDayOfPreviousMonth, lastDayOfPreviousMonth, deviceID], (monthError, monthResult) => {
                    if (monthError) {
                        console.error(`Error fetching data for the previous month for device ${deviceID}:`, monthError);
                        return;
                    }

                    const { total_kw_month, total_kvar_month } = monthResult.rows[0];

                    const last24HoursSumQuery = `
                    SELECT
                        SUM(kw) AS total_kw_24_hours,
                        SUM(kvar) AS total_kvar_24_hours
                    FROM ems.ems_actual_data
                    WHERE timestamp >= $1 AND deviceid = $2;`;

                    db.query(last24HoursSumQuery, [last24Hours, deviceID], (last24HoursError, last24HoursResult) => {
                        if (last24HoursError) {
                            console.error(`Error fetching data for the last 24 hours for device ${deviceID}:`, last24HoursError);
                            return;
                        }

                        const { total_kw_24_hours, total_kvar_24_hours } = last24HoursResult.rows[0];

                        const insertQuery = `
                            INSERT INTO ems.sum_kw (deviceid, total_kw_month, total_kvar_month, total_kw_day, total_kvar_day, calculation_date)
                            VALUES ($1, $2, $3, $4, $5, $6);`;

                        const currentDate = new Date();

                        db.query(insertQuery, [deviceID, total_kw_month, total_kvar_month, total_kw_24_hours, total_kvar_24_hours, currentDate], (insertError) => {
                            if (insertError) {
                                console.error(`Error inserting data for device ${deviceID}:`, insertError);
                            }
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error fetching and storing data:', error);
    }
}

kw_sum();
setInterval(kw_sum, 24 * 60 * 60 * 1000);