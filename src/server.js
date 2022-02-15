const config = {
	proxyPath: "/",
	proxyPort: 5757
};


const eventEmitter = new (require("events"))();

module.exports.on = function(...args) {
	eventEmitter.on(...args);
};


let mediates = false;

// TODO: Proxy mode OR dedicated route ?
// TODO: SSL/TLS, ... => EXPOSE, keep actual HTTP interface to localhost
module.exports.mediate = function() {
	if(mediates) {
		throw new RangeError("Duplicate parsel mediation initialization.");
	}

	mediates = true;

	function message(message) {
		eventEmitter.emit("message", message);
	}

	// parsel cache
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