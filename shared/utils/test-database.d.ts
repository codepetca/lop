import { Kysely } from 'kysely';
import type { Database as DatabaseSchema } from '../../backend/src/database/types';
export declare function setupTestDatabase(): Promise<Kysely<DatabaseSchema>>;
export declare function cleanupTestDatabase(): Promise<void>;
export declare function getTestDb(): Kysely<DatabaseSchema>;
//# sourceMappingURL=test-database.d.ts.map