import test from 'ava';
import {
  DataIntegrityError, NotFoundError,
} from '../../../src/errors';
import {
  createSqlTag,
} from '../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../helpers/createPool';

const sql = createSqlTag();

test('returns the first row', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
    ],
  });

  const result = await pool.one(sql`SELECT 1`);

  t.deepEqual(result, {
    foo: 1,
  });
});

test('throws an error if no rows are returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [],
  });

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

  t.true(error instanceof NotFoundError);
});

test('throws an error if more than one row is returned', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1,
      },
      {
        foo: 2,
      },
    ],
  });

  const error = await t.throwsAsync(pool.one(sql`SELECT 1`));

  t.true(error instanceof DataIntegrityError);
});

test('typing is correct', async (t) => {
  type Foo = {
    date: Date,
    number: number,
    string: string,
  };
  const pool = createPool();
  const date = new Date('2000-01-01T00:00:00.000Z');
  const number = 1;
  const string = 'a';

  pool.querySpy.returns({
    rows: [
      {
        date,
        number,
        string,
      },
    ],
  });

  t.deepEqual(
    await pool.one<Foo>(sql`
      SELECT
        '2000-01-01T00:00:00.000Z'::timestamp AS date,
        1 AS number,
        'a' AS string
    `),
    {
      // a timestamp typeParser is assumed
      date,
      number,
      string,
    } as Foo,
  );
});
