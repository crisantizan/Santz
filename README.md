# Santz 0.9.7
## Librería Nodejs para realizar consultas a base de datos MySQL
Novedad: ¡Ahora se puede trabajar con TypeScript! <a href="#usar-con-typescript">ver</a>
* <a href="#instalar">Instalación</a>
* <a href="#descripcion-de-metodos-conexion">Métodos de conexión</a>
* <a href="#modo-estricto-y-tablas-estaticas">Modo estricto y tablas estáticas</a>
  - <a href="#modo-estricto">Modo estricto</a>
  - <a href="#tablas-estaticas">Tablas estáticas</a>
* <a href="#metodos-de-la-clase-santz">Métodos de la clase Santz</a>
  - <a href="#select">select</a>
  - <a href="#where">where</a>
  - <a href="#from">from</a>
  - <a href="#insert">insert</a>
  - <a href="#update">update</a>
  - <a href="#values">values</a>
  - <a href="#destroy">destroy</a>
  - <a href="#hidden">hidden</a>
  - <a href="#show">show</a>
  - <a href="#rowshidden">rowsHidden</a>
  - <a href="#innerjoin">innerJoin</a>
  - <a href="#leftjoin">leftJoin</a>
  - <a href="#rightjoin">rightJoin</a>
  - <a href="#on">on</a>
  - <a href="#and">and</a>
  - <a href="#or">or</a>
  - <a href="#orderby">orderBy</a>
  - <a href="#limit">limit</a>
  - <a href="#exec">exec</a>
* <a href="#ejemplos-de-uso">Ejemplos de uso</a>
  - <a href="#select-simple">Select simple</a>
  - <a href="#select-con-where">Select con where</a>
  - <a href="#select-con-strtosql">Select con strToSql</a>
  - <a href="#insercion-de-datos">Inserción de datos</a>
  - <a href="#actualizacion-de-datos">Actualización de datos</a>
  - <a href="#ejemplo-inner-join">Sentencia INNER JOIN</a>
  - <a href="#ejemplo-right-join">Sentencia RIGHT/LEFT JOIN</a>
  - <a href="#ocultar-filas">Ocultas filas</a>
  - <a href="#volver-visibles-filas-ocultas">Volver visibles filas ocultas</a>
  - <a href="#ver-todos-los-registros-ocultos">Ver todos los registros ocultos</a>
  - <a href="#eliminacion-de-datos">Eliminación de datos</a>
  - <a href="#ordenar-valores-devueltos">Ordenar valores devueltos</a>
  - <a href="#limitar-el-numero-de-filas-a-mostrar">Limitar el número de filas a mostrar</a>
* <a href="#ejecutando-codigo-sql-mas-complejo">Ejecutando código SQL más complejo</a>
* <a href="#con-async-await">Con Async - Await</a>
* <a href="#usar-con-typescript">Usar con TypeScript</a>

`Santz` es una pequeña librería que facilita la manera de realizar algunas consultas `SQL` desde `Nodejs` a `MySQL`. Específicamente hablando, ejecutará sentencias sin escribir código `SQL`, todo mediante métodos `JavaScript`, encadenados y con nombres intuitivos, que permitirán comprender fácilmente la acción a ejecutar.

Escapará todos los datos ingresandos en los diferentes métodos, tantos los identificadores como sus valores, evitando así injeccion SQL.

<h2 id="instalar">Instalar</h2>

```sh
$ npm install santz
```
<h2 id="configuracion">Configuración</h2>

```js
// Requerir métodos de la librería
const { createPool, santzModel } = require('santz');

// Credenciales básicas para establecer conexión a base de datos
const config = {
    host      : '127.0.0.1',
    user      : 'root',
    password  : '',
    database  : 'nodejs'
};

// Método que creará y retornará un objeto tipo «Pool», el cual será el encargado de ejecutar las queries.
const pool = createPool(config);

// Obtener los métodos disponibles de la librería, listos para ejecutar
const model = santzModel({
    // Objecto conexión
    pool: pool,
    // Especificar el modo estricto. Si se omite por defecto estará activo
    strict: true,
    // Nombre de la columna que indicará la visibilidad de las filas, omitirse cuando el modo estricto esté inactivo
    columnNameState: 'state',
    // Indica si se quiere ver mensajes de respuesta en consola, por defecto será verdadero
    showQuery: true
});
```
_Las mismas <a href="https://github.com/mysqljs/mysql/blob/master/Readme.md#connection-options" target="_blank">opciones de conexión</a> son admitidas cuando se crea un objeto Pool.
Para ver las opciones específicas de esta puede ir a: <a href="https://github.com/mysqljs/mysql/blob/master/Readme.md#pool-options" target="_blank">opciones Pool</a>_

Con el código anterior se establecerá una conexión. Para saber si todo ha ido bien ejecutar el método `testConnection()`:
```js
model.testConnection();
```
Vista en consola:
```js

                    **********************************************************
                    *                                                        *
*********************  Santz ha conectado exitosamente con la base de datos  *********************
*********************                                                        *********************
                    *                         ID: 1                          *
                    **********************************************************
```

<h2 id="descripcion-de-metodos-conexion">Descripción de métodos de conexión</h2>

* `createPool(poolConfig)`: Método encargado de obtener un objeto conexión Pool de la librería `MySQL`. Su parámetro `poolConfig` deberá ser un objeto que contendrá las credenciales básicas necesarias para establecer conexión con la base de datos.
Retornará el mismo objeto de conexión que deberá ser pasado como parámetro al método `modelSantz` para ser usado, finalmente, en la ejecución de queries.

* `modelSantz(objectConfig)`: Retornará una instancia de la clase `Santz` con todos los métodos disponibles para realizar y ejecutar consultas `SQLs`. Recibirá un objeto con ciertas propiedades útiles para configurar la librería.

  La propiedad `pool` será el objeto conexión obtenido en el método `createPool`, `strict` indicará si la librería utilizará el modo estricto, por defecto estará activado; se puede omitir, `columnNameState` es el nombre de la columna que le indicará a la clase `Santz` la visibilidad de las filas; esta columna deberá ser incluida en todas las tablas dinámicas en `modo estricto`, de lo contrario se puede omitir. Por último, `showQuery` será un boleano que indique si se quiere ver en consola la query actual en ejecución, por defecto será verdadero. Puede omitirse.

<h2 id="modo-estricto-y-tablas-estaticas">Modo estricto y tablas estáticas</h2>
Constantemente se estará hablando de dos conceptos súper importantes, que serán el modo estricto y las tablás estáticas. A continuación se explican los conceptos:

 <h3 id="modo-estricto">Modo estricto:</h3>
  La librería por defecto lo tendrá activado. Este modo busca impedir la eliminación de valores por accidente o por cualquier otra circunstancia.

  Literalmente, lo que hará este paquete en cada consulta `SQL`, será agregarle un `WHERE` implícitamente al `query` para buscar o afectar solo aquella información que tenga en su `columnNameState` (dicho nombre de columna será pasado en el objecto configuración) el valor de `1`. Por ejemplo, si se hace '`SELECT * FROM ´user´;`', la librería lo convertiría a '`SELECT * FROM ´user´ WHERE ´user´.´state´ = 1;`' y así para todas aquellas consultas que quieran leer, modificar, o insertar información (excepto el método <a href="#destroy">destroy</a>, este eliminará cualquier dato), recordando que esto siempre y cuando el modo estricto esté activo.

  Ahora bien, aún con el modo estricto, habrán `tablas estáticas`, lo que quiere decir que estas no contarán con la columna `columnNameState`, todo un problema si la librería siempre busca información dependiendo del valor de esta columna. Para indicarle al módulo que la tabla a consultar será estática, los métodos: `from`, `innerJoin`, `leftJoin`, `rightJoin`, `insert`, `update`, tendrán un segundo parámetro boleano, `staticTable` que por defecto estrá en `false`, simplemente se le pasa un `true` y listo, se omitirá la búsqueda de la columna `columnNameState` en dicha tabla.

  Cuando se ponga este modo como inactivo se deberá omitir el paso de la propiedad `columnNameState` en el objeto conexión pasado al método `santzModel`.
  <h2 id="tablas-estaticas">Tablas estáticas</h2>
  Por defecto, en modo estricto, para la librería todas las tablás serán dinámicas, es decir, sus valores serán modificados constantemente. Una `tabla estática`, por el contrario será aquella en la cual su información no será cambiante (o por lo menos no por usuarios de la aplicación), solo será de lectura. Por ejemplo: los grados de un colegio, las ciudades de un país, los países de un continente, los tipos de usuarios en equis aplicación, el sexo de una persona, etcétera.

  Si se dejase el modo estricto inactivo no sería necesario indicar cuando una tabla será estática, pero sí si lo está es simple de pasar en el método a usar un `true` como segundo parámetro.
  <h2 id="metodos-de-la-clase-santz">Métodos de la clase Santz</h2>

> ### __`select()`__
### __Parámetros:__
### columns : array | string | object
### executable?: boolean - false

Crea una consulta de tipo `SELECT`. Como parámetro se puede pasar un arreglo de `strings`, identificando cada uno como el nombre de una columna; esto cuando se quiera traer información de ciertas columnas. Cuando se requieran todas se puede usar `'*'` o como un arreglo `['*']`, o si se quiere seleccionar una sola columna se puede especificar como un string `'nick'`.  Ahora bien, para consultas más completas, tipo `JOIN (INNER, LEFT, RIGHT)`, el parámetro que se requiere es un objeto, donde cada propiedad o llave del mismo hará referencia al nombre de la tabla y su valor, un arreglo, contendrá los nombres de columnas a consultar. Si se quisiese seleccionar todas las columnas en una consulta de tipo `JOIN`, se pasará un objeto con una propiedad especial `all` cuyo valor será un `boolean` con `true`.

Cuando se quiera ejecutar funciones como `CURRENT_TIMESTAMP()`, por ejemplo, en el `select`, se debe invocar el método `strToSql` del modelo, colocarle como parámetro el string correspondiente al código SQL y luego pasarselo al método `select`. Este último, entonces, deberá recibir un segundo parámetro de tipo boolean con un valor de «true».
- Ejemplos:
  ```js
  // Todas las columnas, string
  select('*')
  // Todas las columnas, sintaxis de array
  select(['*'])
  // Solo ciertas columnas
  select(['id', 'name', 'age', 'country'])
  // Cierta columna (cuando es una sola se puede pasar como string)
  select('nick')
  // Cuando es de tipo JOIN
  select({ user: ['id', 'name'], type: ['name'] })
  // De tipo JOIN seleccionando todas las columnas (all es una propiedad especial)
  select({ all: true })

  /* --- Ejecutando funciones, código SQL --- */
  const model = santzModel({...});
  // Objeto que permitirá ejecutar el string
  const currentTime = model.strToSql('CURRENT_TIMESTAMP()'); // pasarle el string a ejecutar
  // Pasar el objeto al método select (obligatorio el paso del segundo parámetro)
  select(currentTime, true)
  ```
  Ejemplos prácticos:
  * <a href="#select-simple">select simple</a>
  * <a href="#select-con-where">select con where</a>
  * <a href="#select-con-strtosql">select con srtToSql</a>
> ### __`where()`__
### __Parámetros:__
### columnName: string
### operator: string
### value: string | number
Añade la cláusula `WHERE`, permitiendo así filtrar datos. Como primer parámetro recibirá el `identificador` o nombre de columna, de segundo el `operador` (=, LIKE, >, <, >= ...) por el cual se van a comparar los datos. Por último se tiene el `valor`, que va a ser el dato a buscar.
- Ejemplos:
  ```js
  where('id', '=', 7)
  // Utilizando el operador 'LIKE' (name LIKE %jos%)
  where('name', 'like', 'jos')
  ```
> ### `from()`
### __Parámetros:__
### tableName: string
### staticTable boolean - default: false

Inserta al query la cláusula `FROM`.

El parámetro `tableName` hará referencia al nombre de la tabla donde se consultarán datos, y `staticTable` (<a href="#tablas-estaticas">tablas estáticas</a>), que por defecto será falso, indica si sus valores serán estáticos o no, es decir, que el usuario no cambiará su información (_solo en <a href="#modo-estricto">modo estricto</a>_)
* Ejemplos:
  ```js
  // De la tabla 'user' (modo estático desactivado)
  from('user')
  // Activado (sus valores solo son para leerse)
  from('user', true)
  ```
> ### `insert()`
### __Parámetros:__
### tableName: string
### staticTable: boolean - default: false

Crea una sentencia `SQL` de inserción de datos.

Su parámetro `tabla`, indica el nombre de la tabla donde se insertarán las nuevas filas.
* Ejemplo:
  ```js
  // Inserta datos en la tabla 'user'
  insert('user')
  // En una tabla estática
  insert('user', true)
  ```
Ejemplo práctico:
* <a href="#insercion-de-datos">Inserción de datos</a>
> ### `update()`
### __Parámetros:__
### tableName: string
### staticTable: boolean - default: false

Sentencia `SQL` para la modificación de datos.

Su parámetro `tabla`, indica la tabla donde se modificarán las filas.
* Ejemplo:
  ```js
  // Modifica datos en la tabla 'user'
  update('user')
  // Tabla estática
  update('user', true)
  ```
Ejemplo práctico:
* <a href="#actualizacion-de-datos">Actualización de datos</a>
> ### `values()`
### __Parámetros:__
### data: object

Recibirá un objeto donde las propiedad serán nombres de tablas y su valor el dato a insertar/modificar. Utilizarse solo desde los métodos <a href="#insert">insert</a> o <a href="#update">update</a>.
* Ejemplo:
  ```js
  // Inserta/modifica el valor de la columna `name`, `age` y `country`
  values({
    name    : "Chris",
    age     : 22,
    country : "Colombia"
  })
  ```
> ### `destroy()`
### __Parámetros:__
### tableName: string

Ejecutará una sentencia `DELETE` en el cual, a diferencia del método <a href="#hidden">hidden</a>, eliminará definitivamente los datos especificados.
* Ejemplo:
  ```js
  // ELimina la fila donde el valor de la columna `id` sea igual a 7
  destroy('user').where('id','=', 7)
  ```
Ejemplo práctico:
* <a href="#eliminacion-de-datos">Eliminación de datos</a>
> ### `hidden()`
### __Parámetros:__
### tableName: string
Solo en <a href="#modo-estricto">modo estricto</a>.

Cambiará el estado de visibilidad de la filas seleccionadas. Esto impedirá que al intentar leer o modificar estos datos sea imposible con los métodos <a href="#select">`select`</a> y <a href="#update">`update`</a>.
* Ejemplo:
  ```js
  // Oculta los datos de la columna `user` donde el `id` sea 5
  hidden('user').where('id','=', 5)
  ```
_Si se intenta llamar este método, con el  <a href="#modo-estricto">modo estricto</a> desactivado, no se ejecutará._

Ejemplo práctico:
* <a href="#ocultar-filas">Ocultar filas</a>
> ### `show()`
### __Parámetros:__
### tableName: string
Solo en <a href="#modo-estricto">modo estricto</a>.

Volverá visibles aquellas filas que han sido ocultas por el método <a href="#hidden">hidden</a>.
* Ejemplo:
  ```js
  // Vuelve visibles los datos de la columna `user` donde el `id` es 7
  show('user').where('user.id','=', 7)
  ```
_Si se intenta llamar este método, con el  <a href="#modo-estricto">modo estricto</a> desactivado, no se ejecutará._

Ejemplo práctico:
<a href="#volver-visible-filas-ocultas">Volver visibles filas ocultas</a>
> ### `rowsHidden()`
### __Parámetros:__
### tableName: string
### columns: type - string | default - []
Solo en <a href="#modo-estricto">modo estricto</a>.

Permitirá visualizar todas aquellas filas que han sido ocultas por el método <a href="#hidden">hidden</a>. A diferencia de <a href="#show">show</a>, este no cambiará el estado de visibilidad, solo leerá los datos.
* Ejemplo:
  ```js
  // Devuelve todas las filas ocultas de la columna `user`
  rowsHidden('user')
  // Obtener solo ciertas columnas
  rowsHidden('user', ['id','nick'])
  ```
_Si se intenta llamar este método, con el <a href="#modo-estricto">modo estricto</a> desactivado, no se ejecutará._

Ejemplo práctico:
* <a href="#ver-todos-los-registros-ocultos">Ver todos los registros ocultos</a>
> ### `innerJoin()`
### __Parámetros:__
### tableName: string
### staticTable: boolean - default: false

Método encargado de agregar al query la cláusula `INNER JOIN`.
* Ejemplo:
  ```js
  // Añade la tabla `types`
  innerJoin('types')
  // Con una tabla estática
  innerJoin('types', true)
  ```
Ejemplo práctico:
* <a href="#ejemplo-inner-join">Sentencia INNER JOIN</a>
> ### `leftJoin()`
### __Parámetros:__
### tableName: string
### staticTable: boolean - default: false

Método encargado de agregar al query la cláusula `LEFT JOIN`.
* Ejemplo:
  ```js
  // Añade la tabla `types`
  leftJoin('types')
  // Con una tabla estática
  leftJoin('types', true)
  ```
Ejemplo práctico:
* <a href="#ejemplo-right-join">Sentencia LEFT JOIN</a>
> ### `rightJoin()`
### __Parámetros:__
### tableName: string
### staticTable: boolean - default: false

Método encargado de agregar al query la cláusula `RIGHT JOIN`.
* Ejemplo:
  ```js
  // Añade la tabla `types`
  rightJoin('types')
  // Con una tabla estática
  rightJoin('types', true)
  ```
Ejemplo práctico:
* <a href="#ejemplo-right-join">Sentencia RIGHT JOIN</a>
> ### `on()`
### __Parámetros:__
### firstIdentifier: string
### secondIdentifier: string

Agrega la cláusula `ON` al query. Sus dos parámetros deberán corresponder a los identificadores, o nombre de columnas, a comparar.
* Ejemplo:
  ```js
  // Verifica si la columna `type` de la tabla `user` es igual a `id_type` de la columna `types`
  on('user.type','types.id_type')
  ```
> ### `and()`
### __Parámetros:__
### columnName: string
### operator: string
### value: string | number

Añade la cláusula `AND` al query.
* Ejemplo:
  ```js
  // Donde el valor de `cash` sea mayor a 1200
  and('user.cash','>', 1200)
  ```
> ### `or()`
### __Parámetros:__
### columnName: string
### operator: string
### value: string | number

Añade la cláusula `OR` al query.
* Ejemplo:
  ```js
  // Donde el valor de `age` sea mayor o igual a 18
  or('user.age','>=', 18)
  ```
> ### `orderBy()`
### __Parámetros:__
* columnName: string
* mode: string - default: 'ASC'

Ordena ascendente o descendentemente todas las filas obtenidas, por los valores de una columna en específico.
* Ejemplo:
  ```js
  // Por defecto odenará ascendentemente
  orderBy('user.id')
  // Descendentemente
  orderBy('user.id', 'DESC')
  ```
Ejemplo práctico:
* <a href="#ordenar-valores-devueltos">Ordenar valores devueltos</a>
> ### `limit()`
### __Parámetros:__
* startOrAmount: number
* numRows: number

Agrega la cláusula «LIMIT» a la consulta, usarse solo al final de esta. Recibirá dos parámetros cuando se quiera mostrar filas desde cierta posición hasta la cantidad deseada, o un parámetro cuando solo se quiera limitar la cantidad de registros a mostrar iniciando desde la primera posición por defecto (0).

* Ejemplo:
  ```js
  // Con un solo parámetro: mostrará las 5 primeras filas.
  limit(5).exec();
  // Con dos parámetros: Mostrará 2 filas, a partir de la 5.
  limit(5,2).exec();
  ```
Ejemplo práctico:
* <a href="#limitar-el-numero-de-filas-a-mostrar">Limitar el número de filas a mostrar</a>

> ### `exec()`

Método encargado de ejecutar la sentencia `SQL` antes  preparada. Siempre debe ser invocado de último. Retornará una promesa con los resultados de la ejecución del query.
* Ejemplo:
  ```js
  // No necesita de parámetros
  exec()
  ```
<h2 id="ejemplos-de-uso">Ejemplos de uso</h2>

> <h3 id="select-simple">Select simple</h3>

```js
( async () => {
  try {
    const result = await model.select('nick').from('users').exec();
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}) ();
```
Resultado de ejecución mostrado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT `nick` FROM `users` WHERE `users`.`state` = 1;

**************************************************************************************************
[
  RowDataPacket { nick: 'chris' },
  RowDataPacket { nick: 'sky' },
  RowDataPacket { nick: 'luc' },
  RowDataPacket { nick: 'rex' },
  RowDataPacket { nick: 'angel' },
  RowDataPacket { nick: 'julia' },
  RowDataPacket { nick: 'andrea' },
  RowDataPacket { nick: 'Alex' }
]
```
El identificador o columna `´state´`, llamado en este caso así. Será la columna que indica si ese registro es visible o no.  `1` es visible, `0` está oculto.

El nombre de esta columna será asignado en el método `santzModel` con el parámetro `columnNameState`, y será insertado automáticamente en la query al ejecutar.
> <h3 id="select-con-where">Select con where</h3>
```js
( async () => {
  try {
    const result = await model.select(['id','nick']).from('users').where('id','=',4).exec();
    console.log(result);
  } catch (err) {
    console.log(err);
  }
})();
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT `id`, `nick` FROM `users` WHERE `users`.`state` = 1 AND `id` = 4;

**************************************************************************************************
[ RowDataPacket { id: 4, nick: 'luc' } ]
```
> <h3 id="select-con-strtosql">Select con strToSql</h3>
```js
// Modelo
const model = santzModel({...});

( async () => {
  try {
    // Objeto que permitirá ejecutar el string
    const currentTime = model.strToSql('CURRENT_TIMESTAMP()'); // string del SQL
    // Ejecución de la sentencia (segundo parámetro obligatorio cuando se va a ejecutar una función SQL)
    const result = await model.select(currentTime, true).exec();

    console.log(result);
  } catch (err) {
    console.log(err);
  }
})();
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT CURRENT_TIMESTAMP();

**************************************************************************************************
[ RowDataPacket { 'CURRENT_TIMESTAMP()': 2019-02-10T22:29:59.000Z } ]
```
> <h3 id="insercion-de-datos">Inserción de datos</h3>
```js
// Valores a insertar. Cada propiedad del objeto debe corresponder al nombre de la columna.
let data = { nick: 'dLil', pass: 'password' };

const result = model.insert('user').values(data).exec();

result
  .then (res => console.log(res))
  .catch (err => console.log(err))
```
Resultado en consola:
```sh
************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

INSERT INTO `users` SET `nick` = 'dLil', `pass` = 'password', `state` = 1;

**************************************************************************************************
OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 12,
  serverStatus: 2,
  warningCount: 0,
  message: '',
  protocol41: true,
  changedRows: 0
}
```
> <h3 id="actualizacion-de-datos">Actualización de datos</h3>
```js
let data = { pass: 'newPassword' };

const result = model.update('users').values(data).where('id','=', 2).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh
************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

UPDATE `users` SET `pass` = 'newPassword' WHERE `id` = 12 AND `users`.`state` = 1;

**************************************************************************************************
OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 0,
  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
  protocol41: true,
  changedRows: 1
}
```
> <h3 id="sentencias-join">Sentencias JOIN</h3>
Cuando la consulta a realizar es de tipo `JOIN`, al método <a href="#select">select</a> se le debe pasar un objeto en el cual sus llaves corresponderán al nombre de la tabla y su valor, un arreglo, contendrá los nombres de columnas a mostrar.

<h3 id="ejemplo-inner-join">Ejemplo innerJoin()</h3>

```js
const result = model.select({
    // De la tabla `user` las columnas `id` y `name`
    users: ['id','nick'],
    // De la tabla `country` la columna `name`
    country: ['name']
  })
  .from('users')
  // Se le agrega 'true' porque 'country' es una tabla estática
  .innerJoin('country', true)
  // Donde las columnas `users.country` y `country.id` sean iguales
  .on('users.country','country.id')
  .exec();

  result
    .then( res => console.log(res) , err => console.log(err) );
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT `users`.`id`, `users`.`nick`, `country`.`name` FROM `users` INNER JOIN `country` ON `users`.`country` = `country`.`id` WHERE `users`.`state` = 1;

**************************************************************************************************
[ RowDataPacket { users_id: 3, users_nick: 'Chris', country_name: 'Venezuela' },
  RowDataPacket { users_id: 4, users_nick: 'Santz', country_name: 'Colombia' },
  RowDataPacket { users_id: 5, users_nick: 'sky', country_name: 'none' } ]
```
En la consulta anterior no se le añadió el método <a href="#where">where</a>, esto pues, como ya se ha dicho, la librería por defecto estará buscando solo aquellos registros cuyo valor de la columna `state` (en este caso) sea `1`, es decir, se puede ver.

Con el método <a href="#where">where</a> se vería así:
```js
const result = model.select({ users: ['id','nick'], country: ['name'] })
          .from('users')
          .innerJoin('country', true)
          .on('users.country','country.id')
          // Importante pasar el nombre de la tabla primero, para evitar ambigüedad
          .where('users.id', '=', 4)
          .exec();

result
  .then ( res => console.log(res) )
  .catch ( err => console.log(err) )
```
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT `users`.`id`, `users`.`nick`, `country`.`name` FROM `users` INNER JOIN `country` ON `users`.`country` = `country`.`id` WHERE `users`.`id` = 4 AND `users`.`state` = 1;

**************************************************************************************************
[ RowDataPacket { users_id: 4, users_nick: 'Santz', country_name: 'Colombia' } ]
```
<h3 id="ejemplo-right-join">Ejemplo rightJoin() - leftJoin()</h3>

A continuación se hará un ejemplo con `rightJoin()`, pero la sintaxis para el método `leftJoin()`es el mismo.

Como se sabe, con el `modo estricto` solo se estarán seleccionando aquellas filas que estén configuradas como visibles para la librería. Por lo tanto, para este caso en específico, si quiero ver realmente todas las filas que estén a en la tabla dos, sin la necesidad que estén en la uno, hay que declarar a la tabla `users` (tabla uno) como estática (pasando «true» como segundo parámetro) para evitar así el «WHERE» implícito que se hace en una tabla dinámica.
```js
const result = model.select({ users: ['id','nick'], country: ['name'] })
                    // Definiéndola como estática
                    .from('users', true)
                    .rightJoin('country', true)
                    .on('users.country','country.id')
                    .exec();
```
Resultado en consola:
```sh
************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT `users`.`id`, `users`.`nick`, `country`.`name` FROM `users` RIGHT JOIN `country` ON `users`.`country` = `country`.`id`;

**************************************************************************************************
[
  RowDataPacket { users_id: 5, users_nick: 'sky', country_name: 'none' },
  RowDataPacket { users_id: 3, users_nick: 'Chris', country_name: 'Venezuela' },
  RowDataPacket { users_id: 4, users_nick: 'Santz', country_name: 'Colombia' },
  # Fila que no se encontraba relacionada con la tabla uno (users)
  RowDataPacket { users_id: null, users_nick: null, country_name: 'Chile' }
]
```

> <h3 id="ocultar-filas">Ocultar filas</h3>
Cambia la visibilidad de la fila a oculto.

_Si se quisiese eliminar datos completamente, puede mirar el método de <a href="#eliminacion-de-datos">eliminación de datos</a>_
```js
const result = model.hidden('user').where('id','=', 5).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

UPDATE `user` SET `user`.`state` = 0 WHERE `id` = 5;

**************************************************************************************************

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 0,
  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
  protocol41: true,
  changedRows: 1
}
```
> <h3 id="volver-visibles-filas-ocultas">Volver visibles filas ocultas</h3>
```js
const result = model.show('user').where('id','=', 5).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

UPDATE `user` SET `user`.`state` = 1 WHERE `id` = 5;

**************************************************************************************************

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 0,
  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
  protocol41: true,
  changedRows: 1
}
```
> <h3 id="ver-todos-los-registros-ocultos">Ver todos los registros ocultos</h3>
```js
(async () => {
  try {
    // Todas las columnas
    const result = model.rowsHidden('user').exec();
    // Obteniendo solo ciertas columnas
    const result1 = model.rowsHidden('user', ['id', 'nick']).exec();

    const all = await Promise.all([result, result1]);
    console.log(all);

  } catch (err) {
    console.log(err);
  }
})();
```
Resultado en consola:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT * FROM `user` WHERE `user`.`state` = 0;

QUERY:

SELECT `id`, `nick` FROM `user` WHERE `user`.`state` = 0;

**************************************************************************************************

[
  # Resultado sentencia uno
  [RowDataPacket { id: 3, name: 'Tefy', type: 1, state: 0 }],
  # Resultado sentencia dos
  [RowDataPacket { id: 3, name: 'Tefy'}]
]
```

_Estas filas solo pueden ser mostradas mediante este método, <a href="#rowshidden">rowsHidden()</a>._
> <h3 id="eliminacion-de-datos">Eliminación de datos</h3>

```js
const result = model.destroy('user').where('id','=', 6).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

DELETE FROM `user` WHERE `id` = 5;

**************************************************************************************************

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 0,
  message: '',
  protocol41: true,
  changedRows: 0
}
```
> <h3 id="ordenar-valores-devueltos">Ordenar valores devueltos</h3>
```js
// Si se quisiese ordenar descendentemente, pasarle al método `orderBy` como segundo parámetro 'DESC'
const result = model.select('*').from('user').orderBy('id').exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

SELECT * FROM `user` WHERE `user`.`state` = 1 ORDER BY `id` ASC;

**************************************************************************************************

[
  RowDataPacket { id: 1, name: 'Natalia', type: 1, state: 1 },
  RowDataPacket { id: 2, name: 'Esteban Chávez', type: 1, state: 1 },
  RowDataPacket { id: 4, name: 'María', type: 1, state: 1 },
  RowDataPacket { id: 7, name: 'Gabriel', type: 1, state: 1 },
  RowDataPacket { id: 8, name: 'José', type: 2, state: 1 },
  RowDataPacket { id: 9, name: 'Sandra', type: 1, state: 1 },
  RowDataPacket { id: 10, name: 'Liliana', type: 2, state: 1 }
]
```
> <h3 id="limitar-el-numero-de-filas-a-mostrar">Limitar el número de filas a mostrar</h3>
_`Recordatorio:` Como en las filas de una tabla en MySql la primera posición siempre será «0», cuando le indicamos al método `limit` en qué fila empezar, hay que tener en cuenta que si le colocamos «1» esta nos mostrará el registro «2», y así con las demás posiciones._
```js
// Mostrando los primeros 5 registros
const result = model.select('id','nick').from('users').limit(5).exec();

// Mostrando 5 filas a partir de la posición 2
const result1 = model.select('id','nick').from('users').limit(2,5).exec();

// Ejecutar las dos consultas
Promise
  .all([result, result1])
  .then( data => console.log(data) )
  .catch ( err => console.log(err) )
```
Resultado en consola:
```sh
[
  #  Sentencia 1: mostrando los primeros 5 registros
  [
    RowDataPacket { id: 2, nick: 'santz' },
    RowDataPacket { id: 3, nick: 'may' },
    RowDataPacket { id: 4, nick: 'sky' },
    RowDataPacket { id: 5, nick: 'chris' },
    RowDataPacket { id: 6, nick: 'angel' }
  ],
  #  Sentencia 2: mostrando 5 registros a partir de la posición 2
  [
    RowDataPacket { id: 4, nick: 'sky' },
    RowDataPacket { id: 5, nick: 'chris' },
    RowDataPacket { id: 6, nick: 'angel' },
    RowDataPacket { id: 7, nick: 'charly' },
    RowDataPacket { id: 8, nick: 'jose' }
  ]
]
```
> <h3 id="ejecutando-codigo-sql-mas-complejo">Ejecutando código SQL más complejo</h3>
¿Qué pasaría si quisiésemos actualizar una columna con valores numéricos incrementando su valor actual en uno, dos, etcétera?

Por ejemplo, en el siguiente caso tenemos una columna «pj» cuyo valor requiere ser incrementado en uno, su valor actual es «10».

Se podría ejecutar un SELECT consultando su contenido, almacenarlo en una variable, sumarle uno y luego ejecutar un UPDATE. Pero esto no sería para nada recomendado si pensamos en el rendimiento de nuestro servidor. Si eres bueno en SQL, o por lo menos conoces conceptos básicos, sabrás que este incremento se puede ejecutar en la misma sentencia UPDATE sin necesidad de obtener previamente el valor de la columna. Sería algo así:

`UPDATE users SET pj = pj + 1 WHERE id = 4;`

Si no conocías este «truco» es hora de ponerlo en práctica.

Hasta ahí bien, ahora intentemos ejecutar esa misma sentencia SQL desde nuestra librería:
```js
const result = model.update('users').values({ pj: 'pj + 1' }).where('id','=', 4).exec();

result.then( data => console.log(data) );
```
Obtendremos lo siguiente:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

UPDATE `users` SET `pj` = 'pj + 1' WHERE `id` = 4 AND `users`.`state` = 1;

**************************************************************************************************

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 1,
  message: '(Rows matched: 1  Changed: 1  Warnings: 1',
  protocol41: true,
  changedRows: 1
}
```
A primera parece que se ejecutó correctamente, si vemos la propiedad «changedRows» (indica el número de filas cuyo valor haya cambiado) del objeto devuelto tiene como valor «1», y efectivamente, revisa tu base de datos y te fijarás en sí, cambió, pero no de la manera esperada. Recordemos que su contenido anterior era «10», debería ser ahora «11» pero no, es «0» (en caso de que solo acepte números).

Si revisamos el código SQL de nuestra ejecución en consola, a la columna «pj» se le está asignando como valor un string: «pj + 1», y es que para ejecutar código SQL en el valor de una propiedad del método `values` se debe recurrir a la función `strToSql`, contenida en el modelo, que deberá ser pasada a la propiedad correspondiente como su valor:
```js
(async () => {

  try {
    // Se le indica, en el string, que incremente el valor de la columa «pj» en uno
    const increment = model.strToSql('pj + 1');
    const result = await model.update('users').values({ pj: increment }).where('id','=', 4).exec();

    console.log(result);
  } catch (err) {
    console.log(err);
  }

})();
```
Ejecución:
```sh

************************************* MODO ESTRICTO: ACTIVADO ************************************

QUERY:

UPDATE `users` SET `pj` = `pj` + 1 WHERE `id` = 4 AND `users`.`state` = 1;

**************************************************************************************************

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 0,
  serverStatus: 2,
  warningCount: 0,
  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
  protocol41: true,
  changedRows: 1
}
```
Ahora es diferente, el valor que se le asigna a la columna no es un string como anteriormente lo era. De igual manera podemos verificar la propiedad «changedRows» y ratifica la modificación. La información en base de datos, esta vez, ha sido exitosa.

> <h3 id="con-async-await">Con async - await</h3>
Como obtenemos los datos mediante promesas, por defecto se puede utilizar esta nueva manera para resolverlas (como ya se ha hecho en varios ejemplos anteriormente).

Para poder utilizar esta nueva metodología, hay que anteponerle el prefijo «async» a la función donde estemos trabajando:

```js
async function test () {
  // code
}

// Función flecha
const test = async () => {
  // code
};
```

Casi siempre será así, pero hay otros casos donde no, no estaremos en el ámbito de una función y no es factible su uso. En estos caso se puede utilizar funciones autoimbocables, funciones anónimas que se ejecutarán al mismo tiempo de ser declaradas:

```js
( async function () {

})(); // Paréntesis ejecutan la función, pueden recibir parámetros para su uso interno.

( async () => {

})();
```

Y una de las ventanjas de esta forma es el manejo de errores. Será de manera más clara y con el convencional bloque «try catch»:

```js
( async () => {

  try {
    const result = await model.select(['nick']).from('users').limit(4).exec();
    console.log(result));

  } catch(err) {
    console.log(err);
  }

})();
```

Otra de las palabras claves es «await», esta indica que esperará a que la promesa sea resuelta y luego así asignar su valor, dado el caso, en una variable.

Para finalizar, hay que entender que en toda función que se use con «async - await» automáticamente estará retornando una promesa, concepto clave cuando pretendemos devolver valores y asignarlos a variables de manera tradicional.

> <h3 id="usar-con-typescript">Usar con TypeScript</h3>
A partir de la versión `0.9.4` es posible el uso en TypeScript.
```ts
import { createPool, santzModel, PoolConfig, QueryResult } from 'santz';

const poolConfig: PoolConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'santz'
};

const pool = createPool(poolConfig);

const model = santzModel({
    pool,
    strict: true,
    columnNameState: 'state',
    showQuery: true
});
```
Aprovechando el tipado de TypeScript, en los métodos que establecen datos (insert, update, destroy, hidden...) es posible utilizar un tipo de valor de retorno en la promesa obtenida:
```ts
// Interfaz a utilizar
import { QueryResult } from 'santz';

(async () => {
  let newValues = { pass: 'newPassword' };
  const result = <QueryResult> await model.update('users').values(newValues).where('id','=', 12).exec();
})();
```
Ahora escribiendo `result`, se autocompletarán todas las propiedades disponibles.
```ts
// Propiedades de la interfaz QueryResult
interface QueryResult {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}
```

Chris Santiz, 2019