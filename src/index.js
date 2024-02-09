import Koa from "koa";
import Router from "@koa/router";
import KoaCompose from "koa-compose";
import koaBody from "koa-body";

import * as Config from "@phish108/yaml-configurator";
import * as Logger from "service_logger";

import * as MQ from "./models/MQUtilities.mjs";
import * as GQL from "./models/GraphQL.mjs";

import {logHeader, logRequest, catchall} from "./handler/index.mjs";

export async function init(defaults, ServiceHandler, cfg_locations = []) {
    Logger.init("info");

    const log = Logger.get("web-service-core");

    if (!ServiceHandler) {
        log.error("No ServiceHandler provided");
        throw new Error("ERR_NO_SERVICERR_HANDLER");
    }

    if (!Array.isArray(cfg_locations)) {
        cfg_locations = [cfg_locations];
    }

    const locations = [
        ...cfg_locations,
        "/etc/app/config.yaml",
        "/etc/app/config.json",
        "./config.yaml",
        "./tools/config.yaml",
    ];

    const config = await Config.readConfig(
        locations,
        [],
        defaults
    );

    Logger.init(config.debug || {level: "debug"});

    log.debug(config);

    if ( !("endpoints" in config)) {
        log.error("Missing endpoints in configuration");
        throw new Error("ERR_MISSING_ENDPOINTS");
    }

    if (config.endpoints.length === 0) {
        log.error("No endpoints defined in configuration");
        throw new Error("ERR_NO_ENDPOINTS_DEFINED");
    }

    // check if all defined endpoints have handlers.
    config.endpoints
        .reduce((acc, {route, handler}, i) => {
            if (typeof route !== "string" || route.length === 0) {
                log.error(`Invalid route definition for endpoint ${i}` );
                throw new Error("ERR_MISSING_ROUTE");
            }

            if (!handler) {
                log.error(`No handler defined for endpoint ${i}`);
                throw new Error("ERR_MISSING_HANDLER");
            }

            if (!Array.isArray(handler)) {
                handler = [handler];
            }

            if (handler.length === 0) {
                log.error(`No handler defined for endpoint ${i}`);
                throw new Error("ERR_EMPTY_HANDLER_STACK");
            }

            acc.push(...handler);
            return acc;
        }, [])
        .map(handler => {
            if (!(handler in ServiceHandler)) {
                log.error(`Missing service handler for "${handler}"`);
                throw new Error("ERR_MISSING_HANDLER_FUNCTION");
            }
            if (typeof ServiceHandler[handler] !== "function") {
                log.error(`Service handler for "${handler}" is not a function`);
                throw new Error("ERR_HANDLER_NOT_A_FUNCTION");
            }
        });


    // init database
    if (config.service?.dbhost || config.database?.dbhost){
        try {
            GQL.init(config.database || config.service);
        }
        catch (err) {
            log.error(err.message);
            throw new Error("ERR_FAILED_DATABASE_CONNECTION");
        }
    }

    // init message queue
    if (config.service?.mq_host || config.message_queue?.mq_host){
        try {
            MQ.init(config.message_queue || config.service);
            MQ.connect();
        }
        catch (err) {
            log.error(err.message);
            throw new Error("ERR_FAILED_MESSAGE_QUEUE_CONNECTION");
        }
    }

    const app = new Koa();
    const koarouter = new Router;

    async function stateInit(ctx, next) {
        ctx.state.config = config;
        ctx.state.logger = Logger;
        ctx.state.mq = MQ;
        ctx.state.gql = GQL;
        await next();
    }

    // add routes
    config.endpoints.reduce((router, {route, handler, method}) => {
        if (!Array.isArray(handler)) {
            handler = [handler];
        }

        const pipeline = KoaCompose([
            catchall,
            // load the handler functions by name
            ...handler.map(h => ServiceHandler[h])
        ]);

        if (!method) {
            method = "get";
        }

        if (method in ["post", "put", "patch"]) {
            router[method](route, koaBody.koaBody(), KoaCompose([
                logHeader,
                stateInit,
                pipeline,
                logRequest
            ]));
        }
        else {
            router[method](route, pipeline);
        }

        return router;
    }, koarouter);

    app.use(koarouter.routes());

    return {
        run: () => {
            log.info(`Starting server on port ${config.api?.port || 8080}`);
            return app.listen(config.api?.port || 8080);
        },
        config,
        logger: Logger,
        mq: MQ,
        gql: GQL
    };
}
