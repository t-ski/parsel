const config = {
    proxyPath: "/",
    proxyPort: 5757
};

let parselConfig = {};

function getImplicitOrigin() {
    const url = new URL(parselConfig.origin || document.location.origin);
    
    return url.origin;
}

class Request {
    static queue = {};

    static complete(origin = getImplicitOrigin()) {
        let curQueue = [].concat(this.queue[origin]);
        this.queue[origin].length = 0;

        // TODO: If given protocol less retrieve registered related origin
        const condensedReq = curQueue
        .map(req => {
            return {
                options: req.options,
                path: `${req.url.pathname}${req.hash || ""}${req.query || ""}`
            };
        });

        // fetch <=> parsel proxy <=> actual api (local request)
        const proxyUrl = new URL(`${origin}${config.proxyPath}`);
        proxyUrl.port = config.proxyPort;
        
        window.fetch(proxyUrl.toString(), {
            method: "POST",
            body: JSON.stringify({
                originalOrigin: origin,

                condensedReq
            })
        })
        .then(condensedRes => condensedRes.json())
        .then(condensedRes => {
            let i = 0;
            condensedRes.forEach(singleRes => {
                curQueue[i++].useResolve(singleRes);
            });
        })
        .catch(err => {
            console.error(err);
        });
    }

    static instanciate(...args) {
        const instance = new this(...args);

        return new Promise((resolve) => {
            // TODO: Reject?
            instance.setResolve(resolve);
        });
    }

    constructor(endpoint, options) {
        this.options = options;
        this.options = Object.assign(
            (this.options.headers || {}),
            (parselConfig.headers || {})
        );

        // Retrieve related proxy URL
        const url = (endpoint.charAt(0) == '/')
        ? `${getImplicitOrigin()}${endpoint}`
        : endpoint;
        this.url = new URL(url);

        this.constructor.queue[this.url.origin]
        = (this.constructor.queue[this.url.origin] || [])
        .concat([this]);
    }

    setResolve(func) {
        this.resolve = func;
    }
    useResolve(data) {
        const promisify = value => {
            return new Promise(resolve => {
                resolve(value);
            });
        };

        this.resolve({
            ...data,

            // Mediate support methods
            text: _ => {
                return promisify(data.message);
            },
            json: _ => {
                return promisify(JSON.stringify(data.message));
            }
        });
    }
}

class FetchRequest extends Request {
    static queue = [];
    static timeout = {};

    constructor(endpoint, options) {
        super(endpoint, options);

        if(this.constructor.timeout[this.url.origin]) {
            return;
        }

        this.constructor.timeout[this.url.origin]
        = setTimeout(_ => {
            FetchRequest.complete(this.url.origin);
        }, config.interval || 250);
    }
}

class ScheduledRequest extends Request {
    static queue = [];

    constructor(endpoint, options) {
        super(endpoint, options);
    }

    // TODO: Complete all?
}


module.exports.config = function(obj) {
    for(const key in obj) {
        switch(key) {
            case "interval":
                if(isNaN(obj[key])) {
                    throw new TypeError(`Configured condensation interval is not a number '${obj[key]}'`);
                }
                if(obj[key] <= 0) {
                    throw new RangeError("Configured condensation interval must be greater than 0. Use fetch() method instead for direct communication.");
                }

                break;
            
            default:
                if(!["origin", "headers"].includes(key)) {
                    throw new SyntaxError(`Invalid configuration parameter '${key}'.`);
                }
        }
    }

    parselConfig = obj;
};


module.exports.complete = function() {
    return ScheduledRequest.complete();
};

module.exports.fetch = function(pathname, options) {
    const req = FetchRequest.instanciate(pathname, options);

    return req;
};

module.exports.schedule = function(pathname, options) {
    return ScheduledRequest.instanciate(pathname, options);
};

module.exports.complete = function() {
    return ScheduledRequest.complete();
};

module.exports.info = function() {
    const info = ScheduledRequest.queue
    .map(obj => {
        return {
            pathname: obj.pathname,
            options: obj.options
        };
    });

    console.log("Scheduled parsel requests:");
    console.log(info);
    console.log("Configuration:")
    console.log(parselConfig);
};