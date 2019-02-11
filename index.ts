import { createPool as McreatePool, PoolConfig, Pool } from 'mysql';
import { Santz } from './lib/Santz';
import { ModelConfig } from './interfaces';

export function createPool (poolConfig: PoolConfig): Pool  {
    return McreatePool(poolConfig);
}

export function santzModel (config: ModelConfig): Santz  {
  if (config.strict === undefined) config.strict = true;
  if (config.columnNameState === undefined) config.columnNameState = '';
  if (config.showQuery === undefined) config.showQuery = true;

    if (config.strict && !config.columnNameState) {
        throw new Error(`[Método santzModel()]: Si utiliza el modo estricto debe especificar el nombre de la columna que tendrán todas las tablas dinámicas.\n`);
    }
    if(!config.strict && config.columnNameState) {
        console.log(`\n[Método santzModel()]: No hace falta especificar la propiedad 'columnNameState' si el modo estricto está desactivado.`);
    }

    const Model = new Santz (config.pool, config.strict);
    Model.columnNameState = config.columnNameState;
    Model.showQuery = config.showQuery;
    return Model;
}
