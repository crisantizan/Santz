/**
 * Created by Chris Santiz
 * La Dorada, Caldas - Colombia
 * 14/08/2018 11:32
 */

const mysql = require('mysql');

// Variables a utilizar dentro de la clase
let conn,
    strictMode,
    query,
    delColumnName,
    arrIdentifiers,
    arrValues,
    isJoin,
    firstColumnState,
    changeVisibility,
    haveWhere,
    isInsert,
    showQuery,
    destroy,
    arrColumnsState,
    haveOn,
    order,
    createTableStatic,
    usedMethod;
/**
 * @description Clase que permitirá realizar consultas SQL desde código JavaScript.
 * @param {object} connetion Conexión establecida a MySQL.
 * @param {string} mode Manera en que la librería ejecutará sentencias.
 * @class Santz
 */
class Santz {

    constructor(connetion, strict=true) {
        // Conexión a la base de datos
        conn = connetion;
        // Manera en que la librería ejecutará sentencias
        strictMode = strict;
        // Query con la consula SQL
        query = '';
        // Nombre de la columna que indicará si el registro estará visible
        delColumnName = null;
        // Arreglo con los identificadores de columnas
        arrIdentifiers = [];
        // Arreglo que almacena todos los parámetros escapados en la query
        arrValues = [];
        // Será verdadero solo cuando se ejecute una sentencia INNER JOIN
        isJoin = false;
        // Primera tabla de la consulta INNER JOIN
        firstColumnState = '';
        // Será verdadero cuando se quiera rehacer u ocultar un registro
        changeVisibility = false;
        // Propiedad que indica si la query ya tiene un WHERE
        haveWhere = false;
        // Indicará al método "values" si su antecesor es un INSERT
        isInsert = false;
        // Mostrar la query completa en consola al ejecutar
        showQuery = false;    
        // Indicará que se quiere eliminar completamente 
        destroy = false;
        // true cuando la query tenga una cláusula 'on'
        haveOn = false;
        // Nombres de las tablas y sus columnas que indican la visibilidad de tales filas
        arrColumnsState = [];
        // Tendrá la parte de la query que ordenará de cierta manera las filas obtenidas
        order = '';
        // El tipo de tabla donde se insertará/modificará datos
        createTableStatic = false;
        // Saber cuál método (show, hidden, rowsHidden) se usó en modo no estricto
        usedMethod = '';
    }
    /**
     * @description Método que agrega la cláusula SELECT al query e inicializa la 
     * preparación de la sentencia SQL.
     * @param {string | object} params Puede ser de tipo string (varios valores o solo uno)
     * cuando es en un SELECT normal, si el caso es utilizarlo con una cláusula
     * INNER JOIN debe pasarse un objeto.
     * @return Santz object
     */
    select (...params) {
        if (params) {
            // Cuando la consulta es de tipo INNER JOIN
            if (typeof params[0] === 'object') {
                isJoin = true;
                query = `SELECT `;
                for (let key in params[0]) {
                    for (let value of params[0][key]) {
                        query += `${conn.escapeId(`${key}.${value}`)}, `;
                    }
                }
                query = query.substr(0, query.length-2);
                return this;
            // Cuando se quieren obtener todas las columnas
            } else if (params[0] === '*'){
                query = 'SELECT *';
                return this;
            }
            // Si se quieren mostrar columnas en específico
            query = 'SELECT ??';
            arrIdentifiers.push(...params);
            arrValues.push(arrIdentifiers);
            return this;
        }
        return;
    }
    /**
     * @description Método que agrega la cláusula FROM al query.
     * @param {string} table Nombre de la tabla
     * @return Santz object
     */
    from (table, staticTable = false) {
        query += ` FROM ?? `;
        // Comprobación del tipo de dato
        if (typeof table === 'string' && table){
            // Si los valores de la tabla no son estáticos
            if (!staticTable && strictMode) {
                firstColumnState = `${conn.escapeId(table)}.${conn.escapeId(delColumnName)} = 1`;
            }
        /* 
        Cuando no se quiera cambiar la visibilidad de la fila ni que la consulta sea de tipo INNER JOIN  
        */
            if (!changeVisibility && !isJoin && !staticTable && strictMode) {
                /* 
                Se indica que solo queremos ver registros que no estén
                ocultos (eliminados para el usuario final). Principalmente se le agrega
                este WHERE cuando queremos traer todos los registros de una tabla(obviamente los visibles) sin hacer el llamado al método 'where'.
                1 equivale a visible, 0 a oculto.
                */
                query += `WHERE ${firstColumnState}`;
                /* 
                Indica que el query ya tiene una cláusula WHERE, esto será útil
                para cuando se requiera hacer otro filtro.
                */
                haveWhere = true;
            }
            arrValues.push(table);
            return this;
        }
        return;
    }
     /**
     * @description Método que añade la cláusula WHERE al query.
     * @param {string} identifier Nombre del identificador o columna
     * @param {string} operator Tipo de filtro ( = || LIKE )
     * @param {string | number} value Valor a asignar
     * @return Santz object  
     */
    where (identifier, operator, value) {
        // Permite omitir el paso del operador cuando este vaya a ser '='
        if (typeof value === 'undefined') {
            value = operator;
            operator = '=';
        }
        operator = (operator === '=') ? operator : operator.toUpperCase();
        /*
        Cuando el operador sea LIKE, al 'value' se de debe porner antes y después un
        '%' para indicar que la consulta traerá todas las filas que contengan alguna letra de las pasadas en el parámetro.
        */
        value = (operator === 'LIKE' ) 
                ? `%${value}%` 
                : value;
        // Verifica si el query ya tiene la cláusula WHERE
        if (haveWhere) {
            /* 
            Si es verdadero es porque solo vamos a obtener los registros que estén visibles. Le agregamos la cláusula AND para hacer un filtro en las filas que pueden ser accedidas
            (visibles).
            */
            query += ` AND ?? ${operator} ?`;
        } else {
           /* 
            Cuando no la posee (cláusula WHERE), indica que la consulta no será de tipo INNER JOIN o de cambio de estado (ocultar o volver visible una fila), esto cuando el método 'where' va encadenado al 'from'.
           */
            query +=  `WHERE ?? ${operator} ?`;
            /* 
            'changeVisibility' Solo será verdadero cuando este método vaya antecedido del 'hidden' o 'show', puesto que tales métodos precisamente modificarán la visibiliadad de un registro.
            También se verifica que no se vaya a eliminar un registro de manera definitiva
            (destroy), y que los valores de la tabla (en el método from) sean 
            dinámicos (firstColumnState).
            */
            if (!changeVisibility && !destroy && firstColumnState && strictMode) {
                query += ` AND ${firstColumnState}`;
            }
        }
        arrValues.push(identifier, value);
        return this;
    }
    /**
     * @description Método encargado de concatenar la cláusula INSERT INTO al query.
     * @param {string} table Nombre de la tabla
     * @param {boolean} staticTable Tipo de valores de la tabla: estáticos o dinámicos
     * @return Santz object  
     */
    insert (table, staticTable = false) {
        if (table && typeof table === 'string') {
            if(staticTable && !strictMode) {
                console.log(`PRECAUCIÓN: Cuando el modo estricto está inactivo, no es necesario definir una tabla como estática.\n`);
            }
            createTableStatic = staticTable;
            isInsert = true;
            query = `INSERT INTO ?? `;
            arrValues.push(table);
            return this;
        }
        return;
    }
    /**
     * @description Método que agregará la cláusula UPDATE al query en preparación.
     * @param {string} table Nombre de la tabla 
     * @param {boolean} staticTable Tipo de valores de la tabla: estáticos o dinámicos
     * @return Santz object
     */
    update (table, staticTable = false) {
        if (table && typeof table === 'string') {
            if(staticTable && !strictMode) {
                console.log(`PRECAUCIÓN: Cuando el modo estricto está inactivo, no es necesario definir una tabla como estática.\n`);
            }
            createTableStatic = staticTable;
            query = `UPDATE ?? `;
            arrValues.push(table);
            return this;
        }
        return;
    }
    /**
     * @description Método que asignará al query las columnas y valores a
     * insertar o modificar.
     * @param {object} values Objeto que tendrá en sus llaves los nombres de las 
     * columnas a establecer y en sus valores el contenido de cada identificador.
     * Ejemplo: `{"name":"Chris", "lastname":"Santiz"}`
     * @return Santz object 
     */
    values(values) {
        if (typeof values === 'object') {
            // Si es de tipo 'INSERT' y no será una tabla de valores estáticos 
            if (isInsert && !createTableStatic && strictMode) {
                values[delColumnName] = 1;
            }
            query += `SET ? `;
            arrValues.push(values);
            return this;
        }
        return;
    }
    /**
     * @description Eliminación completa de datos. 
     * @param {string} table Nombre de la tabla.
     * @return Santz object  
     */
    destroy(table) {
        if (table && typeof table === 'string') {
            destroy = true;
            query = `DELETE FROM ?? `;
            arrValues.push(table);
            return this;
        }
        return;
    }
    /**
     * 
     * @description Método que se encarga de ocultar una fila en específico, solo en modo estricto. 
     * @param {string} table Nombre de la tabla.
     * @return Santz object  
     */
    hidden (table) {
        if (table && typeof table === 'string') {
            changeVisibility = true;
            query = `UPDATE ?? SET ${conn.escapeId(table)}.${conn.escapeId(delColumnName)} = 0 `;
            arrValues.push(table);
            usedMethod = `hidden()`;
            return this;
        }
        return;
    }
    /**
     * @description Método contrario a `hidden`, volverá visible el registro 
     * especificado, solo en modo estricto.
     * @param {string} table Nombre de la tabla.
     * @return Santz object
     */
    show (table) {
        if (table && typeof table === 'string') {
            changeVisibility = true;
            query = `UPDATE ?? SET ${conn.escapeId(table)}.${conn.escapeId(delColumnName)} = 1 `;
            arrValues.push(table);
            usedMethod = `show()`;
            return this;
        }
        return;
    }
    /**
     * @description Método que mostrará todos los registros ocultos en la tabla
     * especificada, solo en modo estricto.
     * @param {string} table Nombre de la tabla
     * @return Santz object
     */
    rowsHidden(table) {
        if (table && typeof table === 'string') {
            query = `SELECT * FROM ?? WHERE ${conn.escapeId(table)}.${conn.escapeId(delColumnName)} = 0`;
            arrValues.push(table);
            usedMethod = `rowsHidden()`;
            return this;
        }
        return;
    }
    /**
     * @description Método encargado de agregar al query la cláusula
     * INNER JOIN. Antes de su invocación debe estar encadenado a los métodos 
     * `select` y `from` respectivamente. Y continuar con los métodos: `on`, 
     * `where` y `exec` para ejecutar.
     * Su sintaxis completa sería:
     * .select()
     * .from()
     * .innerJoin()
     * .on()
     * .where()
     * .exec();
     * @param {string} table Nombre de la tabla
     * @param {boolean} staticTable
     * @return Santz object 
     */
    innerJoin (table, staticTable = false) {
        if (table && typeof table === 'string') {
            /*
            Con tabla estática se refiere a aquellas cuyos valores no vayan a ser dinámicos,
            es decir, que no se estarán insertando ni modificando sus valores por el usuario.
            Si la tabla no es estática, entonces se añade el filtro para la respectiva tabla
            y columna (ya escapados), filtro que indica que solo se quiren filas visibles. 
            */
            if (!staticTable && strictMode) {
                arrColumnsState.push(`${conn.escapeId(`${table}.${delColumnName}`)} = 1`);
            }
            query += `INNER JOIN ?? `;
            arrValues.push(table);
            return this;
        }
        return;
    }
    /**
     * @description Agrega la cláusula ON al query. Sus dos parámetros deberán
     * corresponder a los identificadores a comparar.
     * @param {string} firstIdentifier Nombre del primer identificador
     * @param {string} secondIdentifier Nombre del segundo identificador
     * @return Santz object 
     */
    on (firstIdentifier, secondIdentifier) {
        if (firstIdentifier && secondIdentifier && typeof firstIdentifier === 'string' && typeof secondIdentifier === 'string') {
            query += `ON ?? = ?? `;
            arrValues.push(firstIdentifier, secondIdentifier);
            haveOn = true;
            return this;
        }
        return;
    }
    /**
     * @description Añade la cláusula 'AND' al query.
     * @param {string} identifier Identificador o nombre de columna.
     * @param {string} operator Operador de comparación. Puede omitirse.
     * @param {string | number} value Valor de la columna.
     * @returns Santz object
     */
    and (identifier, operator, value) {
        // Permite omitir el paso del operador cuando este vaya a ser '='
        if (typeof value === 'undefined') {
            value = operator;
            operator = '=';
        }
        operator = (operator === '=') ? operator : operator.toUpperCase();
        /*
        Cuando el operador sea LIKE, al 'value' se de debe porner antes y después un
        '%' para indicar que la consulta traerá todas las filas que contengan alguna letra de las pasadas en el parámetro.
        */
        value = (operator === 'LIKE' ) 
                ? `%${value}%` 
                : value;
        query += ` AND ?? ${operator} ?`;
        arrValues.push(identifier, value);
        return this;
    }
    /**
     * @description Añade la cláusula 'OR' al query.
     * @param {string} identifier Identificador o nombre de columna.
     * @param {string} operator Operador de comparación. Puede omitirse.
     * @param {string | number} value Valor de la columna.
     * @returns Santz object
     */
    or(identifier, operator, value) {
        if (typeof value === 'undefined') {
            value = operator;
            operator = '=';
        }
        operator = (operator === '=') ? operator : operator.toUpperCase();
        value = (operator === 'LIKE' ) 
                ? `%${value}%` 
                : value;
        query += ` OR ?? ${operator} ?`;
        arrValues.push(identifier, value);
        return this;
    }
    /**
     * @description Ordena ascendente o descendentemente todas las filas obtenidas por los valores de una columna en específico.
     * @param {strin} column Nombre de la columna por la cual se ordenarán las filas.
     * @param {string} mode Modo de ordenamiento ascendiente o descendiente. Por defecto será ascendiente.
     * @returns Santz object
     */
    orderBy(column, mode='ASC') {
        if (column && typeof column === 'string') {
            order = ` ORDER BY ${conn.escapeId(column)} ${mode.toUpperCase()}`;
            return this;
        }
        return;
    }
    /**
     * @description Método encargado de ejecutar las sentencias SQL's antes
     * preparadas. Siempre debe ser invocado de último. Retornará una promesa
     * con los resultados del query.
     * @return Promise
     */
    exec () { 
        const execution = new Promise( (resolve, reject) => {
            // Si la query tiene la cláusula `ON`
            if (haveOn) {
                let newQuery = new String(query);
                // Se pregunta si el query tiene no la cláusula `WHERE`
                if (!newQuery.includes('WHERE')) {
                    // Si la tabla (pasada por el método from) tiene valores dinámicos
                    if (firstColumnState && strictMode) {
                        // Para obtener solo aquellos visibles
                        query += `WHERE ${firstColumnState}`;
                    }
                    /*
                    'arrColumnsState' se irá llenando automáticamente siempre y cuando la/s
                    tabla/s pasada/s en el método 'innerJoin' (sí, varias tablas porque el método se puede llamar las veces que sean necesarias) sean dinámicas,
                    lo cual requiere añadir un filtro por tabla para traer solo los registros
                    que estén visibles de cada una.
                    */
                    if(arrColumnsState.length) {
                        for (let i=0; i<arrColumnsState.length; i++) {
                            /*
                            Si la primera tabla (aquella pasada en el método from) es estática,
                            hará que 'firstColumnState' esté vacía, lo cual quiere decir que
                            aún no se le ha agregado la cláusula 'WHERE' al query.
                            Se confirma que el valor de tal variable sea falso, y que sea la
                            primera iteración del ciclo para añadirle la cláusula antes de
                            posibles 'AND' que puedan venir después.
                            */
                            if(!firstColumnState && i===0) {
                                query += `WHERE ${arrColumnsState[i]}`;
                                continue;
                            }
                            query += ` AND ${arrColumnsState[i]}`;
                        }
                    }
                }
            }
            // Si se require un ordenamiento de filas por un valor en específico
            if (order) {
                query += order;
            }
            /* 
            Prepara la query asignando sus respectivos valores almacenados en el
            arreglo 'this._arrValues'
            */
           // Parámetros finales a ejecutar
            let stmt = mysql.format(`${query};`, arrValues);
            /* 
            Se convertirá en objeto cuando la sentencia SQL sea de tipo INNER JOIN,
            esto para separar el nombre la tabla con su columna con el símbolo
            pasado en la propiedad 'nestTables' en el resultado de la sentencia. Si 
            se pone en 'true', devolverá en el resultado de la ejecución un objeto
            en el cual las propiedades serán los nombres de las tablas ocupadas en 
            el query, y sus llaves serán las columnas específicadas.
            Es importante el uso de esta propiedad, porque que las tablas podrían tener nombres de columnas repetidos y esto al ejecutar impedirá obtener
            todos los registros deseados.
            */
            stmt = (isJoin) ? {sql:stmt, nestTables: '_'} : stmt;
            // Mostrar o no mensajes en consola
            if (showQuery) {
                console.log(
                    (strictMode) 
                        ? 'MODO ESTRICTO: ACTIVADO\n'
                        : 'MODO ESTRICTO: DESACTIVADO\n'
                );
                if (!usedMethod || strictMode) {
                    console.log((isJoin) ? stmt.sql : stmt);
                    console.log('\n');
                }
            }
            // Ejecución de la sentencia
            conn.query(stmt, (err, rows, fields) => {
                if (usedMethod && !strictMode) {
                    return reject(`El método '${usedMethod}' solo se puede usar en modo estricto`);
                }
                return (err) ? reject(err.message) : resolve(rows);
            });
        } );
        reset();
        return execution;
    }

    /* ------------- Getter and setters ------------- */
    /* 
    Asigna el nombre de la columna que hará referencia al estado de la visibilidad
    de los registros: 1 será visible, 0 será oculto.
    */
    set columnNameState(name) {
        delColumnName = name;
    }
    // Indica si se quiere mostrar la query en consola al ejecutar la sentencia
    set showQuery(visibility) {
        showQuery = visibility;
    }
}
/**
 * @description Función que se encargará de reiniciar los valores de las
 * variables utilizadas para construir y ejecutar las queries.
 * @return void
 */
const reset = () => {
    query               = '';
    arrValues           = [];
    arrIdentifiers      = [];
    isJoin              = false;
    firstColumnState    = '';
    changeVisibility    = false;
    haveWhere           = false;
    isInsert            = false;
    showQuery           = false;
    destroy             = false;
    haveOn              = false;
    order               = '';
    arrColumnsState     = [];
}
module.exports = Santz;