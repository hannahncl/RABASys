const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const authPath = require.resolve("../middleware/auth");
const db = {
    query() {
        throw new Error("Unexpected database query in database-free test.");
    },
};

// Stub the pool import while loading the middleware so config/db.js does not
// load dotenv or create a database pool in these database-free tests.
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === "../config/db" && parent?.filename === authPath) return db;
    return originalLoad.call(this, request, parent, isMain);
};

let requireAuth;
let allowRoles;
try {
    ({ requireAuth, allowRoles } = require(authPath));
} finally {
    Module._load = originalLoad;
}

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

let queryCalls = 0;
let originalQuery;

beforeEach(() => {
    originalQuery = db.query;
    queryCalls = 0;
    db.query = async () => {
        queryCalls += 1;
        throw new Error("Unexpected database query in database-free test.");
    };
});

afterEach(() => {
    db.query = originalQuery;
});

test("allowRoles calls next for an authorized role", () => {
    const req = { user: { role: "Tour Guide" } };
    const res = createResponse();
    let nextCalled = false;

    allowRoles("Admin", "Tour Guide")(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
    assert.equal(queryCalls, 0);
});

test("allowRoles rejects an unauthorized role with the existing 403 response", () => {
    const req = { user: { role: "Customer" } };
    const res = createResponse();
    let nextCalled = false;

    allowRoles("Admin")(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "You do not have permission for this action." });
    assert.equal(queryCalls, 0);
});

test("requireAuth rejects a missing token with the existing 401 response", async () => {
    const res = createResponse();
    let nextCalled = false;

    await requireAuth({ headers: {} }, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: "Authentication token is required." });
    assert.equal(queryCalls, 0);
});

test("requireAuth rejects a malformed token before querying the database", async () => {
    const hadNodeEnv = Object.prototype.hasOwnProperty.call(process.env, "NODE_ENV");
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const res = createResponse();
    let nextCalled = false;

    try {
        await requireAuth({ headers: { authorization: "Bearer not-a-valid-jwt" } }, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 401);
        assert.deepEqual(res.body, { message: "Authentication token is invalid or expired." });
        assert.equal(queryCalls, 0);
    } finally {
        if (hadNodeEnv) process.env.NODE_ENV = originalNodeEnv;
        else delete process.env.NODE_ENV;
    }
});
