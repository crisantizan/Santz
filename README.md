# Santz 0.9.0
## Librería Nodejs para realizar consultas a base de datos MySQL

`Santz` es una pequeña librería que facilita la manera de realizar consultas `SQL` desde `Nodejs` a `MySQL`. Específicamente hablando, ejecutará sentencias sin escribir código `SQL`, todo mediante métodos `JavaScript`, encadenados y con nombres intuitivos, que permitirán comprender fácilmente la acción a ejecutar.

## Instalar
```sh
$ npm install santz
```
## Configuración

```js
// Requerir la librería
const database = require('santz');

// Credenciales básicas para establecer conexión a base de datos
const config = {
    "host"      : "127.0.0.1",
    "user"      : "root",
    "password"  : "",
    "database"  : "nodejs"
};

// Constante que almacenará el objeto conexión
const connection = database.getConnection(config);

// Método que ejecutará la conexión, segundo parámetro 'true' si se quiere ver si la conexión fue exitosa en consola
database.connect(connection, true);

// Obtener los métodos disponibles de la librería, listos para ejecutar
const Model = database.Model({
    // Objecto conexión
    connection      : connection,
    // Especificar el modo estricto, si se omite por defecto estará activo
    strict          : true,
    // Nombre de la columna que indicará la visibilidad de las filas, omitirse cuando el modo estricto esté inactivo
    columnNameState : 'state',
    // Indica si se quiere ver mensajes de respuesta en consola, por defecto será verdadero
    showQuery       : true
});
```
## Descripción de métodos de conexión
* `getConnection(config)`: Método encargado de obtener el objeto conexión de la librería `MySQL`. Su parámetro `config` deberá ser un objeto que contendrá las credenciales básicas necesarias para establecer conexión con la base de datos.
Lo que se obtenga aquí deberá ser pasado como parámetro al método `connect` y `Model` respectivamente.

* `connect(connection, showMessageStatus)`: Está función ejecutará la conexión, y pondrá su objecto listo para realizar consultas. Su parámetro `connection` será el objeto conexión, y `showMessageStatus`, vendrá a ser un boleano que indicará si se quiere mostrar en consola si la conexión fue exitosa, por defecto será falso.

* `Model(objectConfig)`: Retornará una clase con todos los métodos disponibles para realizar y ejecutar consultas `SQLs`. Recibirá un objeto con ciertas propiedades útiles para configurar la librería. La propiedad `connection` será de igual manera el objeto conexión, `strict` indicará si la librería utilizará el modo estricto, por defecto estará activado; se puede omitir, `columnNameState` es el nombre de la columna que le indicará a la clase `Santz` la visibilidad de las filas; esta columna deberá ser incluida en todas las tablas dinámicas en `modo estricto`, de lo contrario se puede omitir. Por último, `showQuery` será un boleano que indique si se quiere ver en consola la query actual en ejecución, por defecto será verdadero. Puede omitirse.
## Modo estricto y tablas estáticas
Constantemente se estará hablando de dos conceptos súper importantes, que serán el modo estricto y las tablás estáticas, a continuación se explican los conceptos:
 ### Modo estricto:
  La librería por defecto lo tendrá activado. Este modo busca impedir la eliminación de valores por accidente o por cualquier otra circunstancia.

  Literalmente, lo que hará este paquete en cada consulta `SQL`, será agregarle un `WHERE` implícitamente al `query` para buscar o afectar solo aquella información que tenga en su `columnNameState` (dicho nombre de columna será pasado en el objecto configuración) el valor de `1`. Por ejemplo, si se hace '`SELECT * FROM ´user´;`', la librería lo convertiría a '`SELECT * FROM ´user´ WHERE ´user´.´state´ = 1;`' y así para todas aquellas consultas que quieran leer, modificar, o insertar información (excepto el método [`destroy`](#destroy), este eliminará cualquier dato), recordando que esto siempre y cuando el modo estricto esté activo.

  Ahora bien, aún con el modo estricto, habrán `tablas estáticas`, lo que quiere decir que estas no contarán con la columna `columnNameState`, todo un problema si la librería siempre busca información dependiendo del valor de esta columna. Para indicarle al módulo que la tabla a consultar será estática, los métodos: [`from`](#from), [`innerJoin`](#inner-join), [`insert`](#insert), [`update`](#update) tendrán un segundo parámetro boleano, `staticTable` que por defecto estrá en `false`, simplemente se le pasa un `true` y listo, se omitirá la búsqueda de la columna `columnNameState` en dicha tabla.

  Cuando se ponga este modo como inactivo se deberá omitir el paso de la propiedad `columnNameState` en el objeto conexión pasado al método `Model`.
### Tablas estáticas
  Por defecto, en modo estricto, para la librería todas las tablás serán dinámicas, es decir, sus valores serán modificados constantemente. Una `tabla estática`, por el contrario será aquella en la cual su información no será cambiante (o por lo menos no por usuarios de la aplicación), solo será de lectura. Por ejemplo: los grados de un colegio, las ciudades de un país, los países de un continente, los tipos de usuarios en equis aplicación, el sexo de una persona, etcétera.

  Si se dejase el modo estricto inactivo no sería necesario indicar cuando una tabla será estática, pero sí si lo está es simple de pasar en el método a usar un `true` como segundo parámetro.
## Métodos de la clase Santz
> ### __`select()`__
### __Parámetros:__
### columns : ...string | object 

Crea una consulta de tipo `SELECT`. Como parámetro se pueden pasar una serie de `strings`, identificando cada uno como el nombre de una columna; esto cuando se quiera traer información de ciertas columnas, cuando se requieran todas se puede usar `'*'`. Ahora bien, para consultas más completas, tipo `INNER JOIN`, el parámetro que se requiere es un objeto, donde cada propiedad o llave del mismo hará referencia al nombre de la tabla y su valor, un arreglo, contendrá los nombres de columnas a consultar.
- Ejemplos:
  ```js
  // Solo ciertas columnas
  select('id', 'name', 'age', 'country')
  // Todas las columnas
  select('*')
  // De tipo INNER JOIN
  select({user: ['id','name'], type:['name']})
  ```
  Ejemplos prácticos:
  * [`select simple`](#select-simple)
  * [`select con where`](#select-con-where)
> ### __`where()`__
### __Parámetros:__
### columnName: string
### operator: string - default '='
### value: string | number
Añade la cláusula `WHERE`, permitiendo así filtrar datos. Como primer parámetro recibirá el `identificador` o nombre de columna, de segundo el `operador` (=, LIKE, >, <, >= ...) por el cual se van a comparar los datos; si se omite por defecto será `'='`. Por último se tiene el `valor`, que va a ser el dato a buscar.
- Ejemplos:
  ```js
  // Omitiendo el operador (id = 7)
  where('id', 7)
  // Especifícandolo
  where('id', '=', 7)
  // Utilizando el operador 'LIKE' (name LIKE %jos%)
  where('name', 'like', 'jos')
  ```
> ### `from()`
### __Parámetros:__
### tableName: string
### staticTable boolean - default: false

Inserta al query la cláusula `FROM`.

El parámetro `tableName` hará referencia al nombre de la tabla donde se consultarán datos, y `staticTable` ([`Tablas Estáticas`](#tablas-estáticas)), que por defecto será falso, indica si sus valores serán estáticos o no, es decir, que el usuario no cambiará su información (_solo en [Modo Estricto](#modo-estricto) activado_)
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
* [`Inserción de datos`](#inserción-de-datos)
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
* [`Actualización de datos`](#actualización-de-datos)
> ### `values()`
### __Parámetros:__
### data: object

Recibirá un objeto donde las propiedad serán nombres de tablas y su valor el dato a insertar/modificar. Utilizarse solo desde los métodos [`insert`](#insert) o [`update`](#update). 
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

Ejecutará una sentencia `DELETE` en el cual, a diferencia del método [`hidden`](#hidden), eliminará definitivamente los datos especificados.
* Ejemplo:
  ```js
  // ELimina la fila donde el valor de la columna `id` sea igual a 7
  destroy('user').where('id', 7)
  ```
Ejemplo práctico:
* [`Eliminación de datos`](#eliminación-de-datos)
> ### `hidden()`
### __Parámetros:__
### tableName: string
Solo en [`modo estricto`](#modo-estricto).

Cambiará el estado de visibilidad de la filas seleccionadas. Esto impedirá que al intentar leer o modificar estos datos sea imposible con los métodos [`select`](#select) y [`update`](#update).
* Ejemplo:
  ```js
  // Oculta los datos de la columna `user` donde el `id` sea 5 
  hidden('user').where('id','=', 5)
  ```
_Si se intenta llamar este método, con el  [`modo estricto`](#modo-estricto) desactivado, no se ejecutará._

Ejemplo práctico:
* [`Ocultar filas`](#ocultar-filas)
> ### `show()`
### __Parámetros:__
### tableName: string
Solo en [`modo estricto`](#modo-estricto).

Volverá visibles aquellas filas que han sido ocultas por el método [`hidden`](#hidden).
* Ejemplo:
  ```js
  // Vuelve visibles los datos de la columna `user` donde el `id` es 7 
  show('user').where('user.id', 7)
  ```
_Si se intenta llamar este método, con el  [`modo estricto`](#modo-estricto) desactivado, no se ejecutará._

Ejemplo práctico:
* [`Volver visibles filas ocultas`](#Volver-visibles-filas-ocultas)
> ### `rowsHidden()`
### __Parámetros:__
### tableName: string
Solo en [`modo estricto`](#modo-estricto).

Permitirá visualizar todas aquellas filas que han sido ocultas por el método [`hidden`](#hidden). A diferencia de [`show`](#show), este no cambiará el estado de visibilidad, solo leerá los datos.
* Ejemplo:
  ```js
  // Devuelve todas las filas ocultas de la columna `user`
  rowsHidden('user')
  ```
_Si se intenta llamar este método, con el  [`modo estricto`](#modo-estricto) desactivado, no se ejecutará._

Ejemplo práctico:
* [`Ver todos los registros ocultos`](#Ver-todos-los-registros-ocultos)
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
* [`Sentencia INNER JOIN`](#sentencia-INNER-JOIN)
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
### operator: string - default: '='
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
### operator: string - default: '='
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
* [`Ordenar valores devueltos`](#Ordenar-valores-devueltos)
> ### `exec()`

Método encargado de ejecutar la sentencia `SQL` antes  preparada. Siempre debe ser invocado de último. Retornará una promesa con los resultados de la ejecución del query.
* Ejemplo:
  ```js
  // No necesita de parámetros
  exec()
  ```
## Ejemplos de uso
> ### Select simple

```js
const result = Model.select('name').from('user').exec();
```
Obtención de la respuesta:
```js
result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado de ejecución mostrado en consola:
```sh
SELECT `name` FROM `user` WHERE `user`.`state` = 1;

[ 
  RowDataPacket { name: 'Adrián' },
  RowDataPacket { name: 'María' },
  RowDataPacket { name: 'Sandra' }
]
```
El identificador o columna `´state´`, llamado en este caso así. Será la columna que indica si ese registro es visible o no.  `1` es visible, `0` está oculto.  

El nombre de esta columna será asignado en el método `Model` con el parámetro `columnNameState`, y será insertado automáticamente en la query al ejecutar.
> ### Select con where
```js
const result = Model.select('*').from('user').where('user.id',2).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

SELECT * FROM `user` WHERE `user`.`state` = 1 AND `user.id` = 2;


[ 
  RowDataPacket { id: 2, name: 'Esteban Chávez', type: 1, state: 1 } 
]
```
> ### Inserción de datos
```js
// Valores a insertar. Cada propiedad del objeto debe corresponder al nombre de la columna.
let data = {name:"Alberto", type:2};

const result = Model.insert('user').values(data).exec();
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

INSERT INTO `user` SET `name` = 'Alberto', `type` = 2, `state` = 1;

OkPacket {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 5,
  serverStatus: 2,
  warningCount: 0,
  message: '',
  protocol41: true,
  changedRows: 0 
  }
```
> ### Actualización de datos 
```js
let data = {name:"Natalia", type:1};

const result = Model.update('user').values(data).where('id', 2).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

UPDATE `user` SET `name` = 'Natalia', `type` = 1 WHERE `id` = 2 AND `state` = 1;

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
> ### Sentencia INNER JOIN
Cuando la consulta a realizar es de tipo `INNERJOIN`, al método [`select`](#select) se le debe pasar un objeto en el cual sus llaves corresponderán al nombre de la tabla y su valor, un arreglo, contendrá los nombres de columnas a mostrar.
```js
const result = Model.select({
    // De la tabla `user` las columnas `id` y `name`
    user: ['id','name'],
    // De la tabla `types` la columna `name`
    types: ['name']
  })
  .from('user')
  // Se le agrega 'true' porque es una tabla estática
  .innerJoin('types', true)
  // Donde las columnas `user.type` y `types.id_type` sean iguales
  .on('user.type','types.id_type')
  .exec();
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

SELECT `user`.`id`, `user`.`name`, `types`.`name` FROM `user` INNER JOIN `types` ON `user`.`type` = `types`.`id_type` WHERE `user`.`state` = 1;

[
  RowDataPacket { user_id: 1, user_name: 'Adrián', types_name: 'admin' },
  RowDataPacket { user_id: 2, user_name: 'María', types_name: 'admin' },
  RowDataPacket { user_id: 4, user_name: 'Sandra', types_name: 'admin' },
  RowDataPacket { user_id: 5, user_name: 'Alberto', types_name: 'studen' }
]
```
En la consulta anterior no se le añadió el método [`where()`](#where) pero sí la cláusula, esto pues, como ya se ha dicho, la librería por defecto estará buscando solo aquellos registros cuyo valor de la columna `state` (en este caso) sea `1`, es decir, se puede ver.

Con el método [`where()`](#where) se vería así:
```js
const result = Model.select({
        user: ['id','name'],
        types: ['name']
      })
      .from('user')
      .innerJoin('types')
      .on('user.type','types.id_type')
      .where('id', 5)
      .exec();
```
```sh
MODO ESTRICTO: ACTIVADO

SELECT `user`.`id`, `user`.`name`, `types`.`name` FROM `user` INNER JOIN `types` ON `user`.`type` = `types`.`id_type` WHERE `id` = 5 AND `user`.`state` = 1;

[
  RowDataPacket { user_id: 5, user_name: 'Alberto', types_name: 'studen' }
]
```
> ### Ocultar filas
Cambia la visibilidad de la fila a oculto.

_Si se quisiese eliminar datos completamente, puede mirar el método [Eliminación total de datos](#ELiminación-de-datos)_
```js
const result = Model.hidden('user').where('id','=', 5).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
_Nótese que en el método [`where()`](#where) esta vez se le pasan 3 parámetros. Se le indica el operador de comparación `'='` de manera manual. Cuando este parámetro es omitido, implícitamente la librería lo añade._

Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

UPDATE `user` SET `user`.`state` = 0 WHERE `id` = 5;

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
> ### Volver visibles filas ocultas
```js
const result = Model.show('user').where('id', 5).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

UPDATE `user` SET `user`.`state` = 1 WHERE `id` = 5;

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
> ### Ver todos los registros ocultos
```js
const result = Model.rowsHidden('user').exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola:
```sh
MODO ESTRICTO: ACTIVADO

SELECT * FROM `user` WHERE `user`.`state` = 0;

[ RowDataPacket { id: 3, name: 'Tefy', type: 1, state: 0 } ]
```

_Estas filas solo pueden ser mostradas mediante este método, [`rowsHidden()`](#rowsHidden)._ 
> ### ELiminación de datos

```js
const result = Model.destroy('user').where('id', 6).exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola
```sh
MODO ESTRICTO: ACTIVADO

DELETE FROM `user` WHERE `id` = 5;

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
> ### Ordenar valores devueltos
```js
// Si se quisiese ordenar descendentemente, pasarle al método `orderBy` como segundo parámetro 'DESC'
const result = Model.select('*').from('user').orderBy('id').exec();

result
    .then( res => console.log(res) )
    .catch( err => console.log(err) )
```
Resultado en consola
```sh
MODO ESTRICTO: ACTIVADO

SELECT * FROM `user` WHERE `user`.`state` = 1 ORDER BY `id` ASC;


[ 
  RowDataPacket { id: 1, name: 'Natalia', type: 1, state: 1 },
  RowDataPacket { id: 2, name: 'Esteban Chávez', type: 1, state: 1 },
  RowDataPacket { id: 4, name: 'María', type: 1, state: 1 },
  RowDataPacket { id: 7, name: 'Gabriel', type: 1, state: 1 },
  RowDataPacket { id: 8, name: 'José', type: 2, state: 1 },
  RowDataPacket { id: 9, name: 'Sandra', type: 1, state: 1 },
  RowDataPacket { id: 10, name: 'Liliana', type: 2, state: 1 },
  RowDataPacket { id: 13, name: 'Viviana', type: 1, state: 1 },
  RowDataPacket { id: 14, name: 'Alfonso', type: 2, state: 1 },
  RowDataPacket { id: 15, name: 'Vanessa', type: 2, state: 1 },
  RowDataPacket { id: 16, name: 'Víctor', type: 1, state: 1 },
  RowDataPacket { id: 17, name: 'Viviana', type: 1, state: 1 },
  RowDataPacket { id: 18, name: 'Chris', type: 1, state: 1 },
  RowDataPacket { id: 19, name: 'Mau', type: 2, state: 1 },
  RowDataPacket { id: 20, name: 'Alberto', type: 2, state: 1 } 
]
```