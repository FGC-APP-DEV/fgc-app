"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.pool = exports.db = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
const tslib_1 = require("tslib");
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = tslib_1.__importStar(require("./schema"));
exports.schema = schema;
function getConnectionConfig() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const urlWithoutSsl = databaseUrl
        .replace(/[?&]sslmode=[^&]*/gi, '')
        .replace(/[?&]ssl=[^&]*/gi, '')
        .replace(/\?&/, '?')
        .replace(/\?$/, '');
    return { connectionString: urlWithoutSsl };
}
function getPool() {
    if (global.__fgcDbPool)
        return global.__fgcDbPool;
    global.__fgcDbPool = new pg_1.Pool(getConnectionConfig());
    return global.__fgcDbPool;
}
function getDb() {
    if (global.__fgcDb)
        return global.__fgcDb;
    global.__fgcDb = (0, node_postgres_1.drizzle)(getPool(), { schema });
    return global.__fgcDb;
}
exports.db = getDb();
exports.pool = getPool();
function connectDatabase() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = yield exports.pool.connect();
        yield client.query('SELECT 1');
        client.release();
    });
}
function disconnectDatabase() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield exports.pool.end();
        global.__fgcDbPool = undefined;
        global.__fgcDb = undefined;
    });
}
function checkDatabaseHealth() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const client = yield exports.pool.connect();
            yield client.query('SELECT 1');
            client.release();
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
//# sourceMappingURL=client.js.map