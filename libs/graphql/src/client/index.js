"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApolloClient = exports.ApolloProvider = exports.gql = exports.InMemoryCache = exports.ApolloClient = void 0;
exports.createApolloClient = createApolloClient;
exports.getApolloClient = getApolloClient;
exports.resetApolloClient = resetApolloClient;
const tslib_1 = require("tslib");
const core_1 = require("@apollo/client/core");
const errors_1 = require("@apollo/client/errors");
const context_1 = require("@apollo/client/link/context");
const error_1 = require("@apollo/client/link/error");
function createApolloClient(config) {
    const httpLink = (0, core_1.createHttpLink)({ uri: config.uri });
    const authLink = (0, context_1.setContext)((_1, _a) => tslib_1.__awaiter(this, [_1, _a], void 0, function* (_, { headers }) {
        const token = config.getToken ? yield config.getToken() : null;
        return {
            headers: Object.assign(Object.assign({}, headers), { authorization: token ? `Bearer ${token}` : '' }),
        };
    }));
    const errorLink = (0, error_1.onError)(({ error }) => {
        var _a, _b, _c;
        if (errors_1.CombinedGraphQLErrors.is(error)) {
            for (const err of error.errors) {
                console.error(`[GraphQL error]: ${err.message}`);
                if (((_a = err.extensions) === null || _a === void 0 ? void 0 : _a.code) === 'UNAUTHENTICATED') {
                    (_b = config.onAuthError) === null || _b === void 0 ? void 0 : _b.call(config);
                }
            }
            return;
        }
        console.error(`[Network error]: ${error}`);
        if (error instanceof Error) {
            (_c = config.onNetworkError) === null || _c === void 0 ? void 0 : _c.call(config, error);
        }
    });
    const cache = new core_1.InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    teams: { merge: (_existing, incoming) => incoming },
                    interviews: { merge: (_existing, incoming) => incoming },
                },
            },
        },
    });
    return new core_1.ApolloClient({
        link: core_1.ApolloLink.from([errorLink, authLink, httpLink]),
        cache,
        defaultOptions: {
            watchQuery: { fetchPolicy: 'cache-and-network' },
            query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
            mutate: { errorPolicy: 'all' },
        },
    });
}
let singleton = null;
function getApolloClient(config) {
    if (!singleton) {
        singleton = createApolloClient(config);
    }
    return singleton;
}
function resetApolloClient() {
    singleton === null || singleton === void 0 ? void 0 : singleton.clearStore();
    singleton = null;
}
var core_2 = require("@apollo/client/core");
Object.defineProperty(exports, "ApolloClient", { enumerable: true, get: function () { return core_2.ApolloClient; } });
Object.defineProperty(exports, "InMemoryCache", { enumerable: true, get: function () { return core_2.InMemoryCache; } });
Object.defineProperty(exports, "gql", { enumerable: true, get: function () { return core_2.gql; } });
var react_1 = require("@apollo/client/react");
Object.defineProperty(exports, "ApolloProvider", { enumerable: true, get: function () { return react_1.ApolloProvider; } });
Object.defineProperty(exports, "useApolloClient", { enumerable: true, get: function () { return react_1.useApolloClient; } });
//# sourceMappingURL=index.js.map