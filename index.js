const dbConnection = require('./lib/connection');
const Jovi = require('./lib/Jovi');

module.exports = {

    getConnection(config) {
        return dbConnection(config);
    },

    connect(connection, showOrHidden=false) {
        connection.connect(err => {
            if (err) return console.log(err.stack);
            if (showOrHidden) {
                console.log(`Connected as id ${connection.threadId}`);
            }
        });
    },

    Model({connection, strict=true, columnNameState=null, showQuery=true}) {
        if (strict && !columnNameState) {
            let error = new Error(`Si utiliza el modo estricto debe especificar el nombre de la columna que tendrán todas las tablas dinámicas.\n`);
            console.log(error.stack);
            return console.log('\n');
        } 
        if(!strict && columnNameState) {
            console.log(`PRECAUCIÓN: No hace falta especificar la propiedad 'columnNameState' si el modo estricto está desactivado.\n`);
        }
        const Model = new Jovi(connection, strict);
        Model.columnNameState = columnNameState;
        Model.showQuery = showQuery;
        return Model;
    }

};