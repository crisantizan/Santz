/**
 * Created by Chris Santiz
 * La Dorada, Caldas - Colombia
 * 14/08/2018 11:32
 */

import {
  Pool,
  raw,
  format,
  QueryOptions,
  PoolConnection,
} from 'mysql';
import {
  IndexSignature,
  OrderMode,
  SelectTypes,
  TestConnectionResult,
} from '../index.d';

interface ILengthKey {
  length?: number;
  [key: string]: any;
}

// Conexión a la base de datos
let _pool: Pool,
  // Manera en que la librería ejecutará sentencias
  _strictMode: boolean,
  // Query con la consula SQL
  _query: string,
  // Nombre de la columna que indicará si el registro estará visible
  _delColumnName: string,
  // Arreglo con los identificadores de columnas
  _arrIdentifiers: string[],
  // Arreglo que almacena todos los parámetros escapados en la query
  _arrValues: Array<string | string[] | number | object>,
  // Será verdadero solo cuando se ejecute una sentencia INNER JOIN
  _isJoin: boolean,
  // Primera tabla de la consulta INNER JOIN
  _firstColumnState: string,
  // Será verdadero cuando se quiera rehacer u ocultar un registro
  _changeVisibility: boolean,
  // Propiedad que indica si la query ya tiene un WHERE
  _haveWhere: boolean,
  // Indicará al método "values" si su antecesor es un INSERT
  _isInsert: boolean,
  // Mostrar la query completa en consola al ejecutar
  _showQuery: boolean,
  // Indicará que se quiere eliminar completamente
  _isDestroy: boolean,
  // true cuando la query tenga una cláusula 'on'
  _haveOn: boolean,
  // Nombres de las tablas y sus columnas que indican la visibilidad de tales filas
  _arrColumnsState: string[],
  // Tendrá la parte de la query que ordenará de cierta manera las filas obtenidas
  _order: string,
  // El tipo de tabla donde se insertará/modificará datos
  _isCreateStaticTable: boolean,
  // Saber cuál método (show, hidden, rowsHidden) se usó en modo no estricto
  _usedMethod: string,
  // Guardar string de la cláusula LIMIT cuando esta se agregue
  _strLimitClausule: string,
  // columnas que se quieren omitir
  _notColumns: { [key: string]: string[] },
  // indica si está dentro de una transacción
  _isTransaction: boolean;

export class Santz {
  constructor(
    pool: Pool,
    private nestTables: boolean | '_',
    strict: boolean = true,
  ) {
    _pool = pool;
    _strictMode = strict;
    _query = '';
    _delColumnName = '';
    _arrIdentifiers = [];
    _arrValues = [];
    _isJoin = false;
    _firstColumnState = '';
    _changeVisibility = false;
    _haveWhere = false;
    _isInsert = false;
    _showQuery = false;
    _isDestroy = false;
    _haveOn = false;
    _arrColumnsState = [];
    _order = '';
    _isCreateStaticTable = false;
    _usedMethod = '';
    _strLimitClausule = '';
    _notColumns = {};
    _isTransaction = false;
  }
  public strToSql(strSql: string): object {
    return raw(strSql);
  }
  public select(
    columns: IndexSignature<SelectTypes> | string | string[],
    executable: boolean = false,
  ): this {
    if (columns) {
      // Cuando se pasa como parámetro un objeto devuelto por el método «strToSql»
      if (
        typeof columns === 'object' &&
        columns.hasOwnProperty('toSqlString')
      ) {
        // Verificar antes que se haya pasado un «true»
        switch (executable) {
          case true:
            _query = 'SELECT ?';
            _arrValues.push(columns as any);
            return this;

          default:
            throw new Error(
              '[Método select()]: para poder ejecutar código mediante el método «strToSql» se requiere el paso de un segundo parámetro con un valor de «true»',
            );
        }
      }
      // si se quieren omitir ciertas columnas (consulta select normal)
      if (typeof columns === 'object' && columns.hasOwnProperty('not')) {
        _query += 'SELECT *';
        // almacenar las columnas que se quieren omitir de esta tabla
        _notColumns['not'] = (columns as IndexSignature<string[]>)['not'];
        return this;
      }
      // Convertirlo en un objeto con índice y la propiedad length
      const param: ILengthKey = columns as object;
      // Cuando la consulta es de tipo JOIN
      if (typeof param === 'object' && !param.length) {
        _isJoin = true;
        _query = `SELECT `;

        // Cuando se quiere seleccionar todas las filas
        if (param.hasOwnProperty('all')) {
          // Verificar que su valor haya sido el esperado
          if (param.all === true) {
            _query += '*';
            return this;
          } else {
            throw new Error(
              '[Método select()]: Para seleccionar todas las filas, de todas las tablas, en una consulta JOIN, debe pasar en un objeto la propiedad especial «all» con un valor booleano «true»',
            );
          }
        }
        // Cuando se quieren columnas en específico
        // escapar identificadores y sus valores
        for (let key in param) {
          // si se quieren obtener todas las columnas de esta tabla
          if (typeof param[key] === 'string') {
            // verificar que es un string y que sea = *
            if (param[key] !== '*') {
              throw new Error(
                `[Método select]: «${
                  param[key]
                }» es un valor inválido. Solo se acepta el carácter «*» para obtener todas las columnas de la tabla «${key}». Si lo que se necesita es obtener solo ciertas columnas debe pasarse un arreglo de string con los nombres.`,
              );
            }
            // todas de esta tabla
            _query += `${_pool.escapeId(`${key}`)}.*, `;
            continue;
          }

          // cuando se quieren obtener todas menos ciertas columnas
          if (
            typeof param[key] === 'object' &&
            param[key].hasOwnProperty('not')
          ) {
            // verificar que la propiedad nestTables esté en verdadero
            if (this.nestTables === '_') {
              throw new Error(
                `[Método select]: No se puede omitir columnas con la propiedad «nestTables» en «_», para acceder a esta característica colocarlo en «true».`,
              );
            }
            // cuando la propiedad «not» es diferente a un objeto o biene un array vacío
            if (
              typeof param[key]['not'] !== 'object' ||
              param[key]['not'].length < 1
            ) {
              throw new Error(
                `[Método select]: La propiedad «not» debe ser un arreglo de string, especificando las columnas que no quiere mostrar.`,
              );
            }
            // seleccionar todo de esta tabla
            _query += `${_pool.escapeId(`${key}`)}.*, `;

            // almacenar las columnas que se quieren omitir de esta tabla
            _notColumns[key] = param[key]['not'] as string[];
            continue;
          }

          // cuando se quieren solo ciertas columnas especificadas
          for (let value of param[key]) {
            _query += `${_pool.escapeId(`${key}.${value}`)}, `;
          }
        }
        _query = _query.substr(0, _query.length - 2);
        return this;
      }

      // Cuando se quieren obtener todas las columnas
      if (
        (typeof columns === 'string' && columns === '*') ||
        param[0] === '*'
      ) {
        _query = 'SELECT *';
        return this;
      }

      // Si se quieren mostrar columnas en específico
      _query = 'SELECT ??';

      // Agregarlo al arreglo dependiendo el tipo de dato
      if (typeof columns === 'string') {
        _arrIdentifiers.push(columns);
      } else {
        _arrIdentifiers.push(...(param as any));
      }

      _arrValues.push(_arrIdentifiers);
    } else {
      throw new Error(
        '[Método select()]: Debe pasar el o los nombres de las columnas a seleccionar',
      );
    }
    return this;
  }
  public from(table: string, staticTable: boolean = false): this {
    _query += ` FROM ?? `;
    // Comprobación del tipo de dato
    if (typeof table === 'string' && table) {
      // Si los valores de la tabla no son estáticos
      if (!staticTable && _strictMode) {
        _firstColumnState = `${_pool.escapeId(table)}.${_pool.escapeId(
          _delColumnName,
        )} = 1`;
      }
      /*
			Cuando no se quiera cambiar la visibilidad de la fila ni que la consulta sea de tipo INNER JOIN
			*/
      if (!_changeVisibility && !_isJoin && !staticTable && _strictMode) {
        /*
				Se indica que solo queremos ver registros que no estén
				ocultos (eliminados para el usuario final). Principalmente se le agrega
				este WHERE cuando queremos traer todos los registros de una tabla(obviamente los visibles) sin hacer el llamado al método 'where'.
				1 equivale a visible, 0 a oculto.
				*/
        _query += `WHERE ${_firstColumnState}`;
        /*
				Indica que el query ya tiene una cláusula WHERE, esto será útil
				para cuando se requiera hacer otro filtro.
				*/
        _haveWhere = true;
      }
      _arrValues.push(table);
    } else {
      throw new Error(
        '[Método from()]: Parámetro «table» es requerido y debe ser un string',
      );
    }
    return this;
  }
  public where(
    identifier: string,
    operator: string,
    value: string | number,
  ): this {
    if (
      identifier === undefined ||
      operator === undefined ||
      value === undefined
    ) {
      throw new Error('[Método from()]: Todos los parámetros son requeridos');
    }
    operator = operator === '=' ? operator : operator.toUpperCase();
    /*
		Cuando el operador sea LIKE, al 'value' se de debe porner antes y después un
		'%' para indicar que la consulta traerá todas las filas que contengan alguna letra de las pasadas en el parámetro.
		*/
    value = operator === 'LIKE' ? `%${value}%` : value;
    // Verifica si el query ya tiene la cláusula WHERE
    if (_haveWhere) {
      /*
			Si es verdadero es porque solo vamos a obtener los registros que estén visibles. Le agregamos la cláusula AND para hacer un filtro en las filas que pueden ser accedidas
			(visibles).
			*/
      _query += ` AND ?? ${operator} ?`;
    } else {
      /*
			 Cuando no la posee (cláusula WHERE), indica que la consulta no será de tipo INNER JOIN o de cambio de estado (ocultar o volver visible una fila), esto cuando el método 'where' va encadenado al 'from'.
			*/
      _query += `WHERE ?? ${operator} ?`;
      /*
			'changeVisibility' Solo será verdadero cuando este método vaya antecedido del 'hidden' o 'show', puesto que tales métodos precisamente modificarán la visibiliadad de un registro.
			También se verifica que no se vaya a eliminar un registro de manera definitiva
			(destroy), y que los valores de la tabla (en el método from) sean
			dinámicos (firstColumnState).
			*/
      if (
        !_changeVisibility &&
        !_isDestroy &&
        _firstColumnState &&
        _strictMode
      ) {
        _query += ` AND ${_firstColumnState}`;
      }
    }
    _arrValues.push(identifier, value);
    return this;
  }
  public insert(table: string, staticTable: boolean = false): this {
    if (table && typeof table === 'string') {
      if (staticTable && !_strictMode) {
        console.log(
          `[Método insert()]: PRECAUCIÓN: Cuando el modo estricto está inactivo, no es necesario definir una tabla como estática.\n`,
        );
      }
      _isCreateStaticTable = staticTable;
      _isInsert = true;
      _query = `INSERT INTO ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método insert()]: El parámetro «table» es requerido y debe ser un string',
      );
    }
  }
  public update(table: string, staticTable: boolean = false): this {
    if (table && typeof table === 'string') {
      if (staticTable && !_strictMode) {
        console.log(
          `[Método update()]: PRECAUCIÓN: Cuando el modo estricto está inactivo, no es necesario definir una tabla como estática.\n`,
        );
      }
      // Si los valores de la tabla no son estáticos, actualizar solo filas visibles
      if (!staticTable && _strictMode) {
        _firstColumnState = `${_pool.escapeId(table)}.${_pool.escapeId(
          _delColumnName,
        )} = 1`;
      }
      _isCreateStaticTable = staticTable;
      _query = `UPDATE ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método update()]: El parámetro «table» es requerido y debe ser un string',
      );
    }
  }
  public values(values: object): this {
    // Solo para uso en TypeScript, para que acepte índices
    const newValues: ILengthKey = values;
    if (newValues && typeof newValues === 'object') {
      // Si es de tipo 'INSERT' y no será una tabla de valores estáticos
      if (_isInsert && !_isCreateStaticTable && _strictMode) {
        newValues[_delColumnName] = 1;
      }
      _query += `SET ? `;
      _arrValues.push(newValues);
      return this;
    } else {
      throw new Error(
        '[Método values()]: El parámetro «values» debe ser un objeto y es requerido',
      );
    }
  }
  public destroy(table: string): this {
    if (table && typeof table === 'string') {
      _isDestroy = true;
      _query = `DELETE FROM ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método destroy()]: El parámetro «table» debe ser un string y es requerido',
      );
    }
  }
  public hidden(table: string): this {
    if (table && typeof table === 'string') {
      _changeVisibility = true;
      _query = `UPDATE ?? SET ${_pool.escapeId(table)}.${_pool.escapeId(
        _delColumnName,
      )} = 0 `;
      _arrValues.push(table);
      _usedMethod = `hidden()`;
      return this;
    } else {
      throw new Error(
        '[Método hidden()]: El parámetro «table» debe ser un string y es obligatorio',
      );
    }
  }
  public show(table: string): this {
    if (table && typeof table === 'string') {
      _changeVisibility = true;
      _query = `UPDATE ?? SET ${_pool.escapeId(table)}.${_pool.escapeId(
        _delColumnName,
      )} = 1 `;
      _arrValues.push(table);
      _usedMethod = `show()`;
      return this;
    } else {
      throw new Error(
        '[Método show()]: El parámetro «table» debe ser un string y es obligatorio',
      );
    }
  }
  public rowsHidden(table: string, columns: string[] = []): this {
    if (table && typeof table === 'string') {
      _query = `SELECT * `;
      // Cuando se quiera obtener solo ciertas columnas
      if (columns.length > 0) {
        _query = `SELECT ?? `;
      }

      _query += `FROM ?? WHERE ${_pool.escapeId(table)}.${_pool.escapeId(
        _delColumnName,
      )} = 0`;

      if (columns.length > 0) {
        _arrValues.push(columns, table);
      } else {
        _arrValues.push(table);
      }
      _usedMethod = `rowsHidden()`;
      return this;
    } else {
      throw new Error(
        '[Método rowsHidden()]: El parámetro «table» debe ser un string y es obligatorio',
      );
    }
  }
  public innerJoin(table: string, staticTable: boolean = false): this {
    if (table && typeof table === 'string') {
      /*
			Con tabla estática se refiere a aquellas cuyos valores no vayan a ser dinámicos,
			es decir, que no se estarán insertando ni modificando sus valores por el usuario.
			Si la tabla no es estática, entonces se añade el filtro para la respectiva tabla
			y columna (ya escapados), filtro que indica que solo se quiren filas visibles.
			*/
      if (!staticTable && _strictMode) {
        let str = `${_pool.escapeId(`${table}.${_delColumnName}`)} = 1`;
        _arrColumnsState.push(str);
      }
      _query += `INNER JOIN ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método innerJoin()]: El parámetro «table» debe ser un string y es requerido',
      );
    }
  }
  public leftJoin(table: string, staticTable: boolean = false): this {
    if (table && typeof table === 'string') {
      /*
			Con tabla estática se refiere a aquellas cuyos valores no vayan a ser dinámicos,
			es decir, que no se estarán insertando ni modificando sus valores por el usuario.
			Si la tabla no es estática, entonces se añade el filtro para la respectiva tabla
			y columna (ya escapados), filtro que indica que solo se quiren filas visibles.
			*/
      if (!staticTable && _strictMode) {
        let str = `${_pool.escapeId(`${table}.${_delColumnName}`)} = 1`;
        _arrColumnsState.push(str);
      }
      _query += `LEFT JOIN ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método leftJoin()]: El parámetro «table» debe ser un string y es requerido',
      );
    }
  }
  public rightJoin(table: string, staticTable: boolean = false): this {
    if (table && typeof table === 'string') {
      /*
			Con tabla estática se refiere a aquellas cuyos valores no vayan a ser dinámicos,
			es decir, que no se estarán insertando ni modificando sus valores por el usuario.
			Si la tabla no es estática, entonces se añade el filtro para la respectiva tabla
			y columna (ya escapados), filtro que indica que solo se quiren filas visibles.
			*/
      if (!staticTable && _strictMode) {
        let str = `${_pool.escapeId(`${table}.${_delColumnName}`)} = 1`;
        _arrColumnsState.push(str);
      }
      _query += `RIGHT JOIN ?? `;
      _arrValues.push(table);
      return this;
    } else {
      throw new Error(
        '[Método rightJoin()]: El parámetro «table» debe ser un string y es requerido',
      );
    }
  }
  public on(firstIdentifier: string, secondIdentifier: string): this {
    if (
      firstIdentifier &&
      secondIdentifier &&
      typeof firstIdentifier === 'string' &&
      typeof secondIdentifier === 'string'
    ) {
      _query += `ON ?? = ?? `;
      _arrValues.push(firstIdentifier, secondIdentifier);
      _haveOn = true;
      return this;
    } else {
      throw new Error('[Método on()]: Todos los parámetros son requeridos');
    }
  }
  public and(
    identifier: string,
    operator: string,
    value: string | number,
  ): this {
    if (
      identifier === undefined ||
      operator === undefined ||
      value === undefined
    ) {
      throw new Error('[Método and()]: Todos los parámetros son requeridos');
    }
    operator = operator === '=' ? operator : operator.toUpperCase();
    /*
		Cuando el operador sea LIKE, al 'value' se de debe porner antes y después un
		'%' para indicar que la consulta traerá todas las filas que contengan alguna letra de las pasadas en el parámetro.
		*/
    value = operator === 'LIKE' ? `%${value}%` : value;
    _query += ` AND ?? ${operator} ?`;
    _arrValues.push(identifier, value);
    return this;
  }
  public or(
    identifier: string,
    operator: string,
    value: string | number,
  ): this {
    if (
      identifier === undefined ||
      operator === undefined ||
      value === undefined
    ) {
      throw new Error('[Método or()]: Todos los parámetros son requeridos');
    }
    operator = operator === '=' ? operator : operator.toUpperCase();
    value = operator === 'LIKE' ? `%${value}%` : value;
    _query += ` OR ?? ${operator} ?`;
    _arrValues.push(identifier, value);
    return this;
  }
  public orderBy(column: string, mode: OrderMode = 'ASC'): this {
    if (column && typeof column === 'string') {
      _order = ` ORDER BY ${_pool.escapeId(column)} ${mode.toUpperCase()}`;
      return this;
    } else {
      throw new Error(
        '[Método orderBy()]: El parámetro «column» debe ser un string y es obligatorio',
      );
    }
  }
  public limit(startOrAmount: number, numRows: number | null = null): this {
    if (startOrAmount === undefined || typeof startOrAmount !== 'number') {
      throw new Error(
        '[Método limit()]: Debe pasar por lo menos el número de filas que quiere limitar',
      );
    }
    /* Cuando solo se quiere limitar */
    if (numRows === null) {
      _strLimitClausule = `LIMIT ${startOrAmount}`;
    } else {
      _strLimitClausule = `LIMIT ${startOrAmount}, ${numRows}`;
    }
    // Agregar la consulta LIMIT siempre y cuando no sea una consulta INNERJOIN
    if (!_isJoin && !_order) {
      /* Si no tiene un espacio al final, se le agrega */
      if (_query[_query.length - 1] !== ' ') {
        _query += ' ';
      }
      _query += _strLimitClausule;
    }
    return this;
  }
  public testConnection(): Promise<TestConnectionResult> {
    return new Promise((resolve, reject) => {
      _pool.getConnection((err, connection) => {
        if (err) {
          resolve({ connected: false, message: err.message });
        }
        resolve({ connected: true, message: 'conectado' });
      });
    });
  }
  public startTransaction(): Promise<{
    connection: PoolConnection;
    commit: () => Promise<void>;
  }> {
    // indicar que hay una transacción activa
    _isTransaction = true;
    return new Promise((resolve, reject) => {
      _pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        // iniciar transacción
        connection.beginTransaction(error => {
          if (error) {
            return reject(err);
          }
          resolve({
            // conexión que será utilizada por las queries a realizar
            connection,
            // método para hacer commit
            commit: (): Promise<void> => {
              // indicar que ya no se encuentra una transacción activa
              _isTransaction = false;
              return new Promise((resolve1, reject1) => {
                connection.commit(error1 => {
                  if (error1) {
                    return connection.rollback(() => {
                      reject1(error1);
                    });
                  }
                  connection.release();
                  resolve1();
                });
              });
            }, // fin commit
          }); // fin resolve
        }); // fin startTransaction
      }); // fin getConnection
    }); // fin new Promise
  }
  public exec(conn?: PoolConnection): Promise<any> {
    return new Promise((resolve, reject) => {
      // Si la query tiene la cláusula `ON`
      if (_haveOn) {
        let newQuery = new String(_query);
        // Se pregunta si el query tiene no la cláusula `WHERE`
        if (!newQuery.includes('WHERE')) {
          // Si la tabla (pasada por el método from) tiene valores dinámicos
          if (_firstColumnState && _strictMode) {
            // Para obtener solo aquellos visibles
            _query += `WHERE ${_firstColumnState}`;
          }
          /*
					'arrColumnsState' se irá llenando automáticamente siempre y cuando la/s
					tabla/s pasada/s en el método 'innerJoin' (sí, varias tablas porque el método se puede llamar las veces que sean necesarias) sean dinámicas,
					lo cual requiere añadir un filtro por tabla para traer solo los registros
					que estén visibles de cada una.
					*/
          if (_arrColumnsState.length) {
            for (let i = 0; i < _arrColumnsState.length; i++) {
              /*
							Si la primera tabla (aquella pasada en el método from) es estática,
							hará que 'firstColumnState' esté vacía, lo cual quiere decir que
							aún no se le ha agregado la cláusula 'WHERE' al query.
							Se confirma que el valor de tal variable sea falso, y que sea la
							primera iteración del ciclo para añadirle la cláusula antes de
							posibles 'AND' que puedan venir después.
							*/
              if (!_firstColumnState && i === 0) {
                _query += `WHERE ${_arrColumnsState[i]}`;
                continue;
              }
              _query += ` AND ${_arrColumnsState[i]}`;
            }
          }
        }
      }
      // Si se require un ordenamiento de filas por un valor en específico
      if (_order) {
        _query += _order;
      }
      /*
			Si la consulta es de tipo INNERJOIN o lleva la cláusula ON asegurarse siempre de colocar el LIMIT al final
			*/
      if ((_isJoin && _strLimitClausule) || (_order && _strLimitClausule)) {
        /* Si no tiene un espacio al final, se le agrega */
        if (_query[_query.length - 1] !== ' ') {
          _query += ' ';
        }
        _query += _strLimitClausule;
      }
      /* Si tiene un espacio al final, se le quita */
      if (_query[_query.length - 1] === ' ') {
        _query = _query.substr(0, _query.length - 1);
      }
      /*
			Prepara la query asignando sus respectivos valores almacenados en el
			arreglo '_arrValues'
			*/
      // Parámetros finales a ejecutar
      let stmt: string | QueryOptions = format(`${_query};`, _arrValues);
      // Mostrar o no mensajes en consola
      if (_showQuery) {
        console.log(
          _strictMode
            ? '\n************************************* MODO ESTRICTO: ACTIVADO ************************************\n'
            : '\n*********************************** MODO ESTRICTO: DESACTIVADO ***********************************\n',
        );
        console.log(
          `QUERY:\n\n${stmt}\n\n**************************************************************************************************`,
        );
      }
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
      stmt = _isJoin ? { sql: stmt, nestTables: this.nestTables } : stmt;
      // Resetear variables
      reset();
      // cuando no se ha pasado la conexión
      if (!conn) {
        // verificar que no se haya invocado (sin el parámetro) en una transacción
        if (_isTransaction) {
          return reject(
            new Error(
              `[Método exec]: Para realizar consultas dentro de una transacción es obligatorio pasar la conexión obtenida por la misma.`,
            ),
          );
        }
        _pool.getConnection((err, connection) => {
          if (err) reject(err);

          connection.query(stmt, (err, rows, fields) => {
            connection.release();

            if (err) reject(err);

            if (_usedMethod && !_strictMode) {
              return reject(
                new Error(
                  `El método '${_usedMethod}' solo se puede usar en modo estricto`,
                ),
              );
            }
            // cuando se quieren omitir ciertas columnas
            if (Object.keys(_notColumns).length > 0) {
              rows = this.omit(rows);
              // resetar valor
              _notColumns = {};
            }

            resolve(rows);
          });
        });
      } else {
        // cuando se pasa la conexión pero no es una transacción
        if (!_isTransaction) {
          return reject(
            new Error(
              `[Método exec] Solo se debe pasar una conexión cuando se está dentro de una transacción`,
            ),
          );
        }
        // cuando se ha especificado la conexión (transacción)
        conn.query(stmt, (err, rows, fields) => {
          // si pasase un error
          if (err) {
            return conn.rollback(() => {
              reject(err);
            });
          }
          if (_usedMethod && !_strictMode) {
            return reject(
              new Error(
                `El método '${_usedMethod}' solo se puede usar en modo estricto`,
              ),
            );
          }
          // cuando se quieren omitir ciertas columnas
          if (Object.keys(_notColumns).length > 0) {
            rows = this.omit(rows);
            // resetar valor
            _notColumns = {};
          }
          resolve(rows);
        });
      }
    });
  }

  private omit(rows: any[]) {
    // consulta select normal
    if (_notColumns.hasOwnProperty('not')) {
      return rows.map((row: any) => {
        // columnas a omitir
        const columns = _notColumns['not'];
        // recorrer propiedades de la fila actual
        for (const prop in row) {
          // verificar si la propiedad tiene que ser eliminada
          if (columns.some(column => column === prop)) {
            delete row[prop];
          }
        }
        // retornar la fila transformada (o no)
        return row;
      });
      // (sentencias JOIN)
    } else {
      // recorrer todas las filas
      return rows.map((row: any) => {
        // recorrer el objeto con las tablas y sus propiedades a omitir.
        for (const table in _notColumns) {
          // verificar que la tabla exista en el resultado obtenido
          if (row.hasOwnProperty(table)) {
            // recorrer las propiedades de la tabla
            for (const prop in row[table]) {
              // recorrer las propiedades de la tabla actual que van a ser eliminadas
              for (const propToDelete of _notColumns[table]) {
                // verificar que la propiedad actual vaya a ser eliminada
                if (prop === propToDelete) {
                  // eliminar
                  delete row[table][propToDelete];
                }
              }
            }
          }
        }
        // retornar la fila transformada (o no)
        return row;
      });
    }
  }
  set columnNameState(name: string) {
    _delColumnName = name;
  }
  set showQuery(visibility: boolean) {
    _showQuery = visibility;
  }
}
// Formatear algunos valores
function reset(): void {
  _query = '';
  _isJoin = false;
  _firstColumnState = '';
  _changeVisibility = false;
  _haveWhere = false;
  _isInsert = false;
  _arrIdentifiers = [];
  _arrValues = [];
  _isDestroy = false;
  _haveOn = false;
  _arrColumnsState = [];
  _order = '';
  _isCreateStaticTable = false;
  _strLimitClausule = '';
}
