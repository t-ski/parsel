const { json } = require("express");

const config = {
	proxyPath: "/",
	proxyPort: 5757
};


const eventEmitter = new (require("events"))();

module.exports.on = function(...args) {
	eventEmitter.on(...args);
};


let mediates = false;

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

			let reqMessage = "Condensed request:";
			const condensedRes = [];
			const limit = payload.condensedReq.length;

			payload.condensedReq
				.forEach(async singleReq => {
					let singleRes = await require("./node-fetch")
					(`${internalOrigin}${singleReq.path}`, singleReq.options);

					let data;
					try {
						data = await singleRes.json();
					} catch {
						data = await singleRes.text();
					}

					delete singleRes.text;
					delete singleRes.json;
					condensedRes.push({
						data,
						
						...singleRes
					});

					reqMessage += `\n+ ${singleReq.path}`;
				
					if(condensedRes.length < limit) {
						return;
					}

					res.statusCode = 200;
					
					res.end(JSON.stringify(condensedRes));

					message(reqMessage);
				});
		});

		req.on("error", err => {
			res.statusCode = 500;

			res.end(JSON.stringify(err.message));
		});
	}
};