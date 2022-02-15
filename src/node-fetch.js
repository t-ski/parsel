module.exports = function(url, { body, ...options }) {
	url = new URL(url);
	
	const modOptions = {
		...options,

		hostname: url.hostname,
		port: url.port,
		path: `${url.pathname}${url.hash || ""}${url.query || ""}`,        
	};

	modOptions.headers = modOptions.headers || {};
	modOptions.headers["Content-Type"] = "application/json";

	return new Promise((resolve, reject) => {
		const req = require(url.protocol
			.replace(/:$/, "").toLowerCase())
			.request(modOptions, res => {
				resolve({
					headers: res.headers,
					status: res.statusCode,
					
					text: _ => {
						return new Promise(resolve => {
							let body = [];
							
							res.on("data", chunk => {
								body.push(chunk);
							});

							res.on("end", _ => {
								resolve(String(body));
							});
						});
					},
					json: _ => {
						return new Promise(resolve => {
							let body = [];
				
							res.on("data", chunk => {
								body.push(chunk);
							});

							res.on("end", _ => {
								resolve(JSON.parse(String(body)));
							});
						});
					}
				});
			});
		
		body && req.write(body);

		req.on("error", err => {
			reject(err);
		});

		req.end();
	});
};