import {describe, it} from "node:test";
import assert from "node:assert/strict";

import * as app from "../src/index.js";

describe("Test 02 basic loading", async () => {
    it("T01 no service handler", async () => {
        try {
            await app.init();
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_NO_SERVICERR_HANDLER");
        }
    });

    it("T02 no service handler", async () => {
        try {
            await app.init();
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_NO_SERVICERR_HANDLER");
        }
    });

    it("T03 no config no defaults", async () => {
        try {
            await app.init(null, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_ENDPOINTS");
        }
    });

    it("T04 no config with empty defaults", async () => {
        try {
            await app.init({}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_ENDPOINTS");
        }
    });

    it("T05 no config with empty endpoints", async () => {
        try {
            await app.init({endpoints: []}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_NO_ENDPOINTS_DEFINED");
        }
    });

    it("T06 no config with undefined endpoints", async () => {
        try {
            await app.init({endpoints: [{}]}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_ROUTE");
        }
    });

    it("T07 no config with no handler", async () => {
        try {
            await app.init({endpoints: [{route: "/"}]}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_HANDLER");
        }
    });

    it("T08 no config with empty handler stack", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: []}]}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_EMPTY_HANDLER_STACK");
        }
    });

    it("T09 no config with no handler", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: null}]}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_HANDLER");
        }
    });

    it("T10 no config with no handler spec", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: "foo"}]}, {});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_MISSING_HANDLER_FUNCTION");
        }
    });

    it("T11 no config with bad handler spec", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: "foo"}]}, {foo: "bar"});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_HANDLER_NOT_A_FUNCTION");
        }
    });

    it("T12 no config with bad handler spec", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: ["foo"]}]}, {foo: "bar"});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_HANDLER_NOT_A_FUNCTION");
        }
    });

    it("T13 no config with partical bad handler spec", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: ["foo", "bar"]}]}, {foo: "bar", bar: () => {}});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_HANDLER_NOT_A_FUNCTION");
        }
    });

    it("T14 no config with partical bad handler spec on second handler", async () => {
        try {
            await app.init({endpoints: [{route: "/", handler: ["foo", "bar"]}]}, {foo: () => {}, bar: "baz"});
            assert.fail("Expected error");
        }
        catch (e) {
            assert.strictEqual(e.message, "ERR_HANDLER_NOT_A_FUNCTION");
        }
    });
});
