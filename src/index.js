import Koa from "koa";
import Router from "@koa/router";
import KoaCompose from "koa-compose";
import koaBody from "koa-body";

import * as Config from "@phish108/yaml-configurator";
import * as Logger from "service_logger";

import * as MQ from "./models/MQUtilities.mjs";
import {logHeader, logRequest} from "./handler/index.mjs";

export async function init(defaults, ServiceHandler, cfg_locations = []) {
    Logger.init("info");

    const log = Logger.get("web-service stack");

    if (!ServiceHandler) {
        log.error("No ServiceHandler provided");
        throw new Error("E_NO_SERVICE_HANDLER");
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

    log.info(config);

    if ( !("endpoints" in config)) {
        log.error("Missing endpoints in configuration");
        throw new Error("E_MISSING_ENDPOINTS");
    }

    // check if all defined endpoints have handlers.
    config.endpoints
        .reduce((acc, {handler}) => {
            if (!Array.isArray(handler)) {
                handler = [handler];
            }
            acc.push(...handler);
            return acc;
        }, [])
        .forEach(handler => {
            if (!(handler in ServiceHandler)) {
                log.error(`Missing service handler for ${handler}`);
                throw new Error("E_MISSING_HANDLER");
            }
            if (typeof ServiceHandler[handler] !== "function") {
                log.error(`Service handler for ${handler} is not a function`);
                throw new Error("E_HANDLER_NOT_FUNCTION");
            }
        });

    // init message queue
    try {
        MQ.init(config.service || config.message_queue);
        MQ.connect();
    }
    catch (err) {
        log.error(err.message);
        throw new Error("E_FAILED_MESSAGE_QUEUE_CONNECTION");
    }

    const app = new Koa();
    const koarouter = new Router;

    async function stateInit() {
        ctx.state.config = config;
        ctx.state.logger = Logger;
        // ctx.state.mq = MQ;
        // ctx.state.db = DB;
        await next();
    }

    // add routes
    config.endpoints.reduce((router, {endpoint, handler, method}) => {
        if (!Array.isArray(handler)) {
            handler = [handler];
        }

        const pipeline = KoaCompose([
            logHeader,
            stateInit,
            // load the handler functions by name
            ...handler.map(h => ServiceHandler[h]),
            logRequest
        ]);

        if (!method) {
            method = "get";
        }

        if (method in ["post", "put", "patch"]) {
            router[method](endpoint, koaBody.koaBody(), pipeline);    
        }
        else {
            router[method](endpoint, pipeline);
        }
        
        return router;
    }, koarouter);
    
    app.use(koarouter.routes());

    return {
        run: () => app.listen(config.api?.port || 8080),
        config,
        logger: Logger,
        // mq: MQ,
        // db: DB
    };
}
