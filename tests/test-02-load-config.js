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

    it("T15 no config with good handler spec", async () => {
        const config = {
            endpoints: [{route: "/", handler: ["foo", "bar"]}]
        };

        let instance;

        try {
            instance = await app.init(
                config,
                {
                    foo: async (_, next) => { await next(); },
                    bar: async (_, next) => { await next(); }
                }
            );
        }
        catch (e) {
            assert.fail(e);
        }

        assert.ok(instance);
        assert.ok("run" in instance);
        assert.ok("config" in instance);
        assert.ok("logger" in instance);
        assert.deepEqual(instance.config, config);

        try {
            instance.logger.get("test").info("test");
        }
        catch (e) {
            assert.fail(e);
        }

        const server = instance.run();

        assert.ok(server);

        server.close();
    });

    it("T16 no config with good handler spec", async () => {
        const config = {
            endpoints: [{route: "/", handler: ["foo", "bar"]}]
        };

        const responseObj = {msg: "OK"};
        let instance;

        try {
            instance = await app.init(
                config,
                {
                    foo: async (ctx, next) => {
                        ctx.body = responseObj;
                        await next();
                    },
                    bar: async (_, next) => { await next(); }
                }
            );
        }
        catch (e) {
            assert.fail(e);
        }

        assert.ok(instance);

        const server = instance.run();

        assert.ok(server);

        try {
            const response = await fetch("http://localhost:8080", {method: "GET"});
            const json = await response.json();

            assert.deepEqual(json, responseObj);
        }
        catch (e) {
            server.close();
            assert.fail(e);
        }

        server.close();
    });
});
