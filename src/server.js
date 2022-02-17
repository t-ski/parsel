const config = {
	proxyPath: "/",
	proxyPort: 5757
};

// TODO: Cache implementation
// TODO: Proxy mode OR dedicated route ?
// TODO: SSL/TLS, ... => EXPOSE, keep actual HTTP interface to localhost
// TODO: Use localhost only for server-local communication; requires manual interface setup (address, ...)

/**
 * Event emission interface for public messaging.
 */
const eventEmitter = new (require("events"))();

function message(message) {
	eventEmitter.emit("message", message);
}

module.exports.on = function(...args) {
	eventEmitter.on(...args);
};

/**
 * 
 */
let mediates = false;

module.exports.mediate = function() {
	// No duplicate mediation (single proxy)
	if(mediates) {
		throw new RangeError("Duplicate parsel mediation initialization.");
	}
	mediates = true;

	/**
	 * Create proxy server.
	 * Receives condensed requests in order to split them up into single ones.
	 * Single requests submit asynchronically and (re-)merged for condensed response.
	 */
	require("http")
		.createServer(handleRequest)
		.listen(config.proxyPort,
			() => {
				message("Parsel mediation activated");
			});
	
	async function handleRequest(req, res) {
		res.setHeader("Access-Control-Allow-Origin", "*");

		if(req.method.toUpperCase() != "POST") {
			res.statusCode = 406;

			return;
		}

		const body = [];

		req.on("data", chunk => {
			body.push(chunk);
		});

		req.on("end", _ => {
			// Parse payload
			const payload = JSON.parse(String(body));
			
			let internalOrigin = new URL(payload.originalOrigin);
			internalOrigin.host = "localhost";
			internalOrigin = internalOrigin.toString().replace(/\/$/, "");

			const reqMessage = [];
			const condensedRes = [];
			const limit = payload.condensedReq.length;

			payload.condensedReq
				.forEach(singleReq => {
					singleReq.options.body = JSON.stringify(singleReq.options.body);
					
					require("./node-fetch")(`${internalOrigin}${singleReq.path}`, singleReq.options)
						.then(async singleRes => {
							let data = await singleRes.text();
							
							// eslint-disable-next-line
							const { text, json, ...meta } = singleRes;

							condensedRes.push({
								...meta,
							
								data
							});
	
							reqMessage.push(singleReq.path);
					
							if(condensedRes.length < limit) {
								return;
							}
	
							res.statusCode = 200;
	
							res.end(JSON.stringify(condensedRes));
	
							message(`Entity: [${reqMessage.map(r => `\n + ${r}`).join("")}\n]`);
						});
				});
		});

		req.on("error", err => {
			res.statusCode = 500;

			res.end(JSON.stringify(err.message));
		});
	}
};