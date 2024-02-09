import {describe, it} from "node:test";
import assert from "node:assert/strict";

import * as app from "../src/index.js";

describe("Test 03 endpoint handling", async () => {

    it("T01 no config with good handler spec", async () => {
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

    it("T02 simple route", async () => {
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

    it("T03 error route", async () => {
        const config = {
            endpoints: [
                {route: "/", handler: ["foo", "bar"]},
                {route: "/error", handler: ["error", "foo"]}
            ]
        };

        const responseObj = {msg: "OK"};

        const handlers = {
            foo: async (ctx, next) => {
                ctx.body = responseObj;
                await next();
            },
            bar: async (_, next) => { await next(); },
            error: async (ctx, next) => {
                ctx.throw(404, "not found", {body: {info: "test context"}});
                await next();
            }
        };

        let instance;

        try {
            instance = await app.init(
                config,
                handlers
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

        try {
            const response = await fetch("http://localhost:8080/error", {method: "GET"});
            const json = await response.json();

            assert.strictEqual(response.status, 404);
            assert.deepEqual(json, {message: "not found", info: "test context"});
        }
        catch (e) {
            server.close();
            instance.logger.get("test").error(e);
            assert.fail(e);
        }

        server.close();
    });
});
