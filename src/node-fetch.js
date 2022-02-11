module.exports = function(url, options) {
	const modOptions = {
		hostname: url.hostname,
		port: url.port,
		path: `${url.pathname}${url.hash || ""}${url.query || ""}`,
        
		...options
	};
	modOptions.body = JSON.stringify(modOptions.body);
    
	return new Promise((resolve, reject) => {
		const req = require(url.protocol
			.replace(/:$/, "").toLowerCase())
			.request(modOptions, res => {
				res.on("data", data => {
					resolve({
						headers: res.headers,
						status: res.statusCode,
						message: String(data)
					});
				});
			});

		req.on("error", err => {
			reject(err);
		});

		req.end();
	});
};