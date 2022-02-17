const config = {
	proxyPath: "/",
	proxyPort: 5757
};

// TODO: Options: interval size relative to loading duration(s)?
// TODO: Options: schedule wait for number?
// TODO: Scope wide .then() firing like resolve for all requests

/**
 * Class representing a generic request.
 * @abstract @class
 */
class Request {
	static defaultOptions = {
		method: "GET"
	};

	/**
	 * Complete a condensed request.
	 * @param {String} origin API origin URL
	 */
	static complete(origin) {
		let curQueue = [].concat(this.queue);
		this.queue.length = 0;

		// TODO: If given protocol less retrieve registered related origin
		const condensedReq = curQueue
			.map(req => {
				return {
					options: req.options,
					path: req.endpoint
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

	/**
	 * Create an instance of the associatedly calling sub class.
	 * @returns {Promise} Promise resolving with request individual response data
	 */
	static instanciate(...args) {
		const instance = new this(...args);

		return new Promise((resolve) => {
			// TODO: Reject?
			instance.setResolve(resolve);
		});
	}

	/**
	 * Create a request.
	 * @param {String} endpoint Endpoint URL part (pathname + opional query)
	 * @param {Object} options Request options (headers, method, ...)
	 */
	constructor(endpoint, options = {}) {
		if(new.target === Request) {
			throw new TypeError("Must not create instance of Request as is abstract");
		}

		this.options = {
			...this.defaultOptions,
			...options,

			headers: {
				...(options.headers || {}),
				...(config.headers || {})
			}
		};

		this.endpoint = endpoint;
        
		this.constructor.queue
			.push(this);
	}

	/**
	 * Promise management.
	 */
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
				return promisify(JSON.parse(message));
			}
		});
	}
}

/**
 * Class representing an API communication interface scope.
 * Origin and configuration individual.
 * @abstract @class
 */
class Scope {
	static defaultConfig = {
		interval: 250
	};

	/**
	 * Create a scope instance.
	 * @class
	 * @param {String} origin API origin URL
	 * @param {Object} config Configuration object
	 */
	constructor(origin, config) {
		// Validate and construct configuration object:

		if(!origin) {
			throw new ReferenceError("Origin not defined");
		}
		this.origin = origin;

		for(const key in config) {
			switch(key) {
			case "interval":
				if(isNaN(config[key])) {
					throw new TypeError(`Configured condensation interval is not a number '${config[key]}'`);
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

		this.config = {
			...this.constructor.defaultConfig,
			...config
		};

		// Scope individual concrete request classes:

		/**
		 * Class representing an interval request.
		 * Condensed along all interval requests made within a certain time window.
		 * Interval opens with (each) first interval request not fitting a window.
		 * Time window size to be defined in scope configuration object.
	 	 * @class
		 */
		this.IntervalRequest = class extends Request {
			static queue = [];
			static intervalTimeout;

			static instanciate(interval, ...args) {
				const res = super.instanciate(...args);

				if(this.intervalTimeout) {
					return res;
				}

				this.intervalTimeout = setTimeout(_ => {
					this.complete(origin);
				}, interval);

				return res;
			}
		};
		
		/**
		 * Class representing a schedule request.
		 * Condensed along all schedule requests made until manual completion.
	 	 * @class
		 */
		this.ScheduleRequest = class extends Request {
			static queue = [];
		};
		
		/**
		 * Class representing an immediate request.
		 * Augments the browser native fetch() for direct communication (no condensation).
	 	 * @class
		 */
		this.ImmediateRequest = class extends Request {
			static queue = [];

			static instanciate(...args) {
				const res = super.instanciate(...args);

				this.complete(origin);

				return res;
			}
		};
	}

	/**
	 * Conrete request instance creation (and management) interface.
	 */
	immediate(pathname, options) {
		return this.ImmediateRequest.instanciate(pathname, options);
	}
	interval(pathname, options) {
		return this.IntervalRequest.instanciate(this.config.interval, pathname, options);
	}
	schedule = {
		add: (pathname, options) => {
			return this.ScheduleRequest.instanciate(pathname, options);
		},
		complete: _ => {
			return this.ScheduleRequest.complete(this.origin);
		}
	};
    
	/**
	 * Retrieve scope information.
	 * • Active scope configuration object.
	 * • Pending requests
	 * @returns {Object}
	 */
	info() {
		const retrieveRequestInfo = queue => {
			return queue
				.map(obj => {
					return {
						pathname: obj.pathname,
						options: obj.options
					};
				});
		};
		
		return {
			origin: this.origin,
			configuration: this.config,
			pending: {
				interval: retrieveRequestInfo(this.IntervalRequest.queue),
				scheduled: retrieveRequestInfo(this.ScheduleRequest.queue)
			}
		};
	}
}


/**
 * Default scope class export for client side wrapper build.
 */
module.exports = Scope;