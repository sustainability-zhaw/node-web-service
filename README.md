# node-web-service

Synthesize common functions for JS-Koa Webserivces.

This package serves as the foundation for the sdg js services. It allows to 
focus on handler functions instead by removing common code. It also enforces 
common standard practices for the services.

## Features
- Koa integration 
- Message Queue integration
- Dynamic configuration

## Usage

```bash
npm install @phish108/web-service
```

```javascript
import * as App from "@phish108/web-service"

import * as ServiceHandler from "./handler"

import defaults from "./defaults.json" with {type: "json"};

const instance = App.init(defaults, ServiceHandler);

// run any module level initialisation based on instance.config etc.

instance.run();
```

## Service configuration

This system uses `@phish108/yaml-configurator` for system configuration. 
This allows for flexible service configuation in YAML or JSON with default
presets. 

The `defaults` need to be provided as JSON (to make us of the JSON importer).

### Routes

In order to make this module work for you, you need to define your endpoint 
logic under endpoints. The following example shows a simple service 
configuation with a single endpoint. 

```json
{
    "endpoints": [
        {
            "route": "/hello",
            "method": "post",
            "handler": [
                "loadFromDatabase",
                "respondHello"
            ]
        }
    ]
}
```

The  handler list needs to be a list of type string, where each string 
is a handler provided in your `ServiceHandler`-object. Internally these 
handlers are stacked by docker compose in the given sequence. If a handler 
is missing, the service raises an error and refuses to start.

### Configuration files

The `init()` function requires the defaults and the service handler object.
Optionally, one can pass a number of locations where the module should look 
for the configuration files. By default the module will check the following
locations in the order given below: 

- `/etc/app/config.yaml`
- `/etc/app/config.json`
- `./config.yaml`
- `./tools/config.yaml`

It is convinient not to touch these locations and just place your config
in one of these locations in your Docker container. If you insist, you 
can pass custom locations to the `init()` function. These locations 
will be prefixed to the default locations, so in case a sysadmin ignores 
your locations the default locations will still work. 
