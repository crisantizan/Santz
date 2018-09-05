const mysql = require('mysql');
module.exports = config => mysql.createConnection(config);