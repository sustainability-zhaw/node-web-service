import * as Logger from "service_logger";

import * as timers from "node:timers/promises";

const log = Logger.get("models/GraphQL");
const Connection = {};

export function init(options) {

    if (!options.dbhost) {
        log.error("No dbhost provided");
        throw new Error("E_NO_DBHOST");
    }
    
    Connection.target = `http://${options.dbhost}/graphql`;
}

/**
 * Performs a Graphql query with the given parameters
 * 
 * @param {string} query 
 * @param {object} variables 
 * @param {AbortSignal} abortSignal (Optional)
 * @returns responst object or null
 */
export async function submit(query, variables, abortSignal) {
    let result = null;
    
    for (let i = 0; i < 10; i++) {
        result = await fetchJson({ query, variables }, abortSignal);
        if (result) {
            return result;
        }
        await waitRandomTime(10, 45);
    }

    log.error("failed after 10 retries");
    return result;
}

async function waitRandomTime(min, max) {
    const waitRange = Math.floor(
        (Math.random() * (max + 1 - min) + min) * 1000
    );

    await timers.setTimeout(waitRange, 'nextTick');
    log.debug(`waited for ${waitRange}ms`);
    // return new Promise((r) => setTimeout(r, waitRange));
}

async function fetchJson(jsonObj, signal) {
    const method = "POST"; // all GQL requests are POST requests
    const cache = "no-store";

    const headers = {
        "Content-Type": "application/json"
    };

    const body = JSON.stringify(jsonObj);

    let result;

    if (!signal) {
        signal = new AbortController().signal;
    }

    // log.debug(`fetch ${targetHost} with ${body}`);

    try {
        const response = await fetch(Connection.target, {
            signal,
            method,
            headers,
            cache,
            body
        });

        result = await response.json();
    }
    catch (err) {
        log.error(`fetching ${targetHost} failed: ${err.message}`);
        // there are 2 reasons for an error:
        // 1. the file is invalid
        // 2. the MQ connection is broken

        result = { data: [] };
    }

    if (!result ||
        "errors" in  result &&
         result.errors[0].message.endsWith("Please retry")) {
        // if asked to retry, wait for 10-45 seconds
        await waitRandomTime(10, 45);
        return null;
    }

    return result;
}
