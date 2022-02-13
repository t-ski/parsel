module.exports = function(url, { body, ...options}) {
	url = new URL(url);
	
	const modOptions = {
		hostname: url.hostname,
		port: url.port,
		path: `${url.pathname}${url.hash || ""}${url.query || ""}`,
        
		...options
	};

	return new Promise((resolve, reject) => {
		const req = require(url.protocol
		.replace(/:$/, "").toLowerCase())
		.request(modOptions, res => {
			let body = [];
	
			res.on("data", chunk => {
				body.push(chunk);
			});
	
			res.on("end", _ => {
				body = String(body);

				const promisify = value => {
					return new Promise(resolve => {
						resolve(value);
					});
				};
				
				resolve({
					headers: res.headers,
					status: res.statusCode,

					text: _ => {
						return promisify(body);
					},
					json: _ => {
						return promisify(JSON.parse(body));
					}
				});
			});
		});

		body
		&& req.write(body);

		req.on("error", err => {
			reject(err);
		});

		req.end();
	});
};