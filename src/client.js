const config = {
	proxyPath: "/",
	proxyPort: 5757
};


class Request {
    static queue;

    static complete(origin) {
        let curQueue = [].concat(this.queue);
        this.queue.length = 0;

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

        fetch(proxyUrl.toString(), {
            method: "POST",
            body: JSON.stringify({
                originalOrigin: origin,
                
                condensedReq
            })
        })
            .then(res => res.json())
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

    constructor(config, endpoint, options) {
        options = Object.assign(
            (options.headers || {}),
            (config.headers || {})
        );
        this.options = options;
        
        // Retrieve related proxy URL
        const url = (endpoint.charAt(0) == "/")
            ? `${config.origin}${endpoint}`
            : endpoint;
        this.url = new URL(url);

        this.constructor.queue
        = (this.constructor.queue || [])
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

        // TODO: Provide un-promisified?
        const message = data.data;
        delete data.data;
        this.resolve({
            ...data,

            // Mediate support methods
            text: _ => {
                return promisify(message);
            },
            json: _ => {
                return promisify(JSON.stringify(message));
            }
        });
    }
}

class Scope {
    static IntervalRequest = class extends Request {
        static queue = [];
        static timeout;
    
        constructor(config, endpoint, options) {
            super(config, endpoint, options);

            if(this.constructor.timeout) {
                return;
            }
            
            this.constructor.timeout = setTimeout(_ => {
                this.constructor.complete(config.origin);
            }, config.interval || 250);
        }
    };
    
    static ScheduledRequest = class extends Request {
        static queue = [];
    
        constructor(config, endpoint, options) {
            super(config, endpoint, options);
        }
    };


    constructor(config) {
        for(const key in config) {
            switch(key) {
            case "interval":
                if(isNaN(config[key])) {
                    throw new TypeError(`Configured condensation interval is not a number '${obj[key]}'`);
                }
                if(config[key] <= 0) {
                    throw new RangeError("Configured condensation interval must be greater than 0. Use fetch() method instead for direct communication.");
                }
    
                break;
                
            default:
                if(!["origin", "headers"].includes(key)) {
                    throw new SyntaxError(`Invalid configuration parameter '${key}'`);
                }
            }
        }
        
        if(!config.origin) {
            throw new ReferenceError("Missing origin configururation");
        }

        this.config = config;
    }

    fetch(pathname, options) {
        //return fetch(`${this.config.origin}${pathname}`, options);
    }

    interval(pathname, options) {
        return this.constructor.IntervalRequest.instanciate(this.config, pathname, options);
    };
    
    schedule(pathname, options) {
        return this.constructor.ScheduledRequest.instanciate(this.config, pathname, options);
    };
    
    complete() {
        return this.constructor.ScheduledRequest.complete(this.config.origin);
    };
    
    info() {
        const info = this.constructor.ScheduledRequest.queue
            .map(obj => {
                return {
                    pathname: obj.pathname,
                    options: obj.options
                };
            });
    
        console.log("Scheduled parsel requests:");
        console.log(info);
        console.log("Configuration:");
        console.log(this.config);
    };
}


module.exports = Scope;