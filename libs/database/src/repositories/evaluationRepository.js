"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvaluationsForTeam = listEvaluationsForTeam;
exports.upsertEvaluation = upsertEvaluation;
const tslib_1 = require("tslib");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
function listEvaluationsForTeam(teamId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return client_1.db.select().from(schema_1.evaluations).where((0, drizzle_orm_1.eq)(schema_1.evaluations.teamId, teamId));
    });
}
function upsertEvaluation(input) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const existing = yield client_1.db
            .select()
            .from(schema_1.evaluations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.evaluations.teamId, input.teamId), (0, drizzle_orm_1.eq)(schema_1.evaluations.judgeId, input.judgeId)))
            .limit(1);
        if (existing[0]) {
            const [row] = yield client_1.db
                .update(schema_1.evaluations)
                .set({
                status: input.status,
                scores: (_a = input.scores) !== null && _a !== void 0 ? _a : existing[0].scores,
                notes: (_b = input.notes) !== null && _b !== void 0 ? _b : existing[0].notes,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.evaluations.id, existing[0].id))
                .returning();
            return row;
        }
        const [row] = yield client_1.db
            .insert(schema_1.evaluations)
            .values({
            teamId: input.teamId,
            judgeId: input.judgeId,
            status: input.status,
            scores: (_c = input.scores) !== null && _c !== void 0 ? _c : null,
            notes: (_d = input.notes) !== null && _d !== void 0 ? _d : null,
        })
            .returning();
        return row;
    });
}
//# sourceMappingURL=evaluationRepository.js.map