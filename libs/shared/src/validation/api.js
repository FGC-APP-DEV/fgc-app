"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEvaluationInputSchema = exports.loginInputSchema = void 0;
const zod_1 = require("zod");
exports.loginInputSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().optional(),
});
exports.updateEvaluationInputSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    judgeId: zod_1.z.string().uuid(),
    status: zod_1.z.string().min(1),
    scores: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=api.js.map