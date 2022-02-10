const PARSEL = (_ => {

    // PRIVATE

    const config = {
        proxyPath: "/",
        proxyPort: 5757
    };

    let parselConfig;

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
                mode: "cors",
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

            if(!parselConfig.interval
            || this.constructor.timeout[this.url.origin]) {
                return;
            }

            this.constructor.timeout[this.url.origin]
            = setTimeout(_ => {
                FetchRequest.complete(this.url.origin);
            }, config.interval);
        }
    }

    class ScheduledRequest extends Request {
        static queue = [];

        constructor(endpoint, options) {
            super(endpoint, options);
        }

        // TODO: Complete all?
    }

    // PUBLIC

    const exports = {};

    exports.config = function(obj) {
        parselConfig = obj;

        // TODO: Validate?
    };

    exports.fetch = function(pathname, options) {
        const req = FetchRequest.instanciate(pathname, options);

        if(!parselConfig.interval) {
            return FetchRequest.complete(); // Immediately
        }

        return req;
    };
    
    exports.schedule = function(pathname, options) {
        return ScheduledRequest.instanciate(pathname, options);
    };
    
    exports.complete = function() {
        return ScheduledRequest.complete();
    };
    
    exports.info = function() {
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

    return exports;

})();