"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersByRole = listUsersByRole;
exports.listJudges = listJudges;
exports.getUserByEmail = getUserByEmail;
const tslib_1 = require("tslib");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
function listUsersByRole(roles) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.inArray)(schema_1.users.role, roles));
    });
}
function listJudges() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.role, 'judge'));
    });
}
function getUserByEmail(email) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        const rows = yield client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    });
}
//# sourceMappingURL=userRepository.js.map