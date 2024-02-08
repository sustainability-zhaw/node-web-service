import {describe, it} from "node:test";
import assert from "node:assert/strict";

describe("Test 01 basic loading", async () => {
    it("Load App Module", async () => {
        try {
            const app = await import("../src/index.js");

            assert.ok(app);
        }
        catch (e) {
            assert.fail(e);
        }
    });
});
