
const config = {
	proxyPath: "/",
	proxyPort: 5757
};


const eventEmitter = new (require("events"))();
module.exports = eventEmitter;

function message(message) {
	eventEmitter.emit("message", message);
}

// parsel cache

require("http")
	.createServer(handleRequest)
	.listen(config.proxyPort,
		() => {
			console.log("Parsel mediation activated");
		});

async function handleRequest(req, res) {
	let body = [];

	res.setHeader("Access-Control-Allow-Origin", "*");

	req.on("data", chunk => {
		body.push(chunk);
	});

	req.on("end", _ => {
		// Parse payload
		const payload = JSON.parse(body.toString());
        
		let internalOrigin = new URL(payload.originalOrigin);
		internalOrigin.host = "localhost";
		internalOrigin = internalOrigin.toString().replace(/\/$/, "");

		let reqMessage = "Condensed request:";
		const condensedRes = [];
		const limit = payload.condensedReq.length;

		payload.condensedReq
			.forEach(async singleReq => {
				const singleRes = await require("./node-fetch")(new URL(`${internalOrigin}${singleReq.path}`), singleReq.options);

				condensedRes.push(singleRes);

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