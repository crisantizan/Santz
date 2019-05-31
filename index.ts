import { createPool as McreatePool, PoolConfig, Pool } from 'mysql';
import { Santz } from './lib/Santz';
import { ModelConfig } from './index.d';

export function createPool(poolConfig: PoolConfig): Pool {
  return McreatePool(poolConfig);
}

export function santzModel(config: ModelConfig): Santz {
  if (config.strict === undefined) config.strict = true;
  if (config.columnNameState === undefined) config.columnNameState = '';
  if (config.showQuery === undefined) config.showQuery = true;
  if (config.nestTables === undefined) config.nestTables = true;

  if (config.strict && !config.columnNameState) {
    throw new Error(
      `[Método santzModel()]: Si utiliza el modo estricto debe especificar el nombre de la columna que tendrán todas las tablas dinámicas.\n`,
    );
  }
  if (!config.strict && config.columnNameState) {
    console.log(
      `\n[Método santzModel()] No hace falta especificar la propiedad 'columnNameState' si el modo estricto está desactivado.`,
    );
  }
  if (config.nestTables !== true && config.nestTables !== '_') {
    throw new Error(
      '[Método santzModel()] La propiedad «nestTables» solo admite los valores de «true» o «_»',
    );
  }

  const model = new Santz(config.pool, config.nestTables, config.strict);
  model.columnNameState = config.columnNameState;
  model.showQuery = config.showQuery;
  return model;
}
