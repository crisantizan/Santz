const mysql = require('mysql');

module.exports = (config, showStatus) => {
    const pool = mysql.createPool(config);

    pool.getConnection( (err, connection) => {
        if (err) {
            switch (err) {
                case 'PROTOCOL_CONNECTION_LOST':
                    console.error('Conexión a la base de datos perdida.');
                    break;

                case 'ECONNREFUSED':
                    console.error('La conexión a la base de datos ha sido rechazada.');
                    break;

                default:
                    console.error(err);
                break;
            }
        }
        if (connection) {
            connection.release();
                if (showStatus) {
                    console.info('                    **********************************************************');
                    console.info('                    *                                                        *');
                    console.info('*********************  Santz ha conectado exitosamente con la base de datos  *********************');
                    console.info('*********************                                                        *********************');
                    console.info(`                    *                         ID: ${connection.threadId}                        *`);
                    console.info('                    **********************************************************\n');
                }
        }
        return;
    });
    return pool;
};