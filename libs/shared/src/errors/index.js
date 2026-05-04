"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
//# sourceMappingURL=index.js.map