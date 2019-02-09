const mysql = require('mysql');
const Santz = require('./lib/Santz');

module.exports = {
    createPool (poolConfig) {
        return mysql.createPool(poolConfig);
    },

    santzModel ({ pool, strict=true, columnNameState=null, showQuery=true }) {
        if (strict && !columnNameState) {
            let error = new Error(`Si utiliza el modo estricto debe especificar el nombre de la columna que tendrán todas las tablas dinámicas.\n`);
            console.log(error.stack);
            return console.log('\n');
        }
        if(!strict && columnNameState) {
            console.log(`PRECAUCIÓN: No hace falta especificar la propiedad 'columnNameState' si el modo estricto está desactivado.`);
        }

        const Model = new Santz (pool, strict);
        Model.columnNameState = columnNameState;
        Model.showQuery = showQuery;
        return Model;
    }
};