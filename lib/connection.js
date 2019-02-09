const mysql = require('mysql');

module.exports = (poolConfig, showStatus) => {
    const pool = mysql.createPool(poolConfig);

    pool.getConnection( (err, connection) => {
        if (err) throw err;

        if (showStatus) {
            console.info('                    **********************************************************');
            console.info('                    *                                                        *');
            console.info('*********************  Santz ha conectado exitosamente con la base de datos  *********************');
            console.info('*********************                                                        *********************');
            console.info(`                    *                         ID: ${connection.threadId}                         *`);
            console.info('                    **********************************************************\n');
        }
        connection.release();
        return;
    });

    return pool;
};