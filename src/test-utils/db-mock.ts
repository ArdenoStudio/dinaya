import { vi } from "vitest";

function asThenable<T extends Record<string, unknown>>(query: T, result: unknown): T {
  const promise = Promise.resolve(result);
  return Object.assign(query, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
}

export function makeSelectQuery<T>(result: T) {
  const query = asThenable({
    from: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    groupBy: vi.fn(() => query),
    limit: vi.fn(async () => result),
  }, result);
  return query;
}

export function makeInsertQuery<T>(result: T) {
  const query = asThenable({
    values: vi.fn(() => query),
    onConflictDoNothing: vi.fn(() => query),
    onConflictDoUpdate: vi.fn(() => query),
    returning: vi.fn(async () => result),
  }, result);
  return query;
}

export function makeUpdateQuery<T>(result: T) {
  const query = asThenable({
    set: vi.fn(() => query),
    where: vi.fn(() => query),
    returning: vi.fn(async () => result),
  }, result);
  return query;
}

export function makeDeleteQuery<T>(result: T = undefined as T) {
  const query = asThenable({
    where: vi.fn(async () => result),
  }, result);
  return query;
}

export function createDbMocks() {
  const select = vi.fn(() => makeSelectQuery([]));
  const insert = vi.fn(() => makeInsertQuery([]));
  const update = vi.fn(() => makeUpdateQuery([]));
  const deleteFn = vi.fn(() => makeDeleteQuery());

  return {
    select,
    insert,
    update,
    delete: deleteFn,
    db: { select, insert, update, delete: deleteFn },
  };
}
