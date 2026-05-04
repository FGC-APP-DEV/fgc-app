"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAnnouncements = listAnnouncements;
const tslib_1 = require("tslib");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
function listAnnouncements() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return client_1.db.select().from(schema_1.announcements).orderBy((0, drizzle_orm_1.desc)(schema_1.announcements.createdAt));
    });
}
//# sourceMappingURL=announcementRepository.js.map