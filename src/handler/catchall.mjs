/**
 * This handler uses the old school try/catch to catch all errors. It is not
 * implemented as a middleware, so it will not affect performance logging.
 *
 * This handler reduces the complexity of otherwise complicated handlers that
 * would need to consider the states of previous handlers
 */
import * as Logger from "service_logger";

export async function catchall(ctx, next) {
    try {
        await next();
    }
    catch (err) {
        const log = Logger.get("error/catchall");

        log.info("called");
        log.error(err);

        ctx.status = err.status || 500;
        ctx.body = err.body || { message: err.message || "Internal Server Error" };

        if (!ctx.body.message) {
            ctx.body.message =  err.message || "Internal Server Error";
        }
    }
}
