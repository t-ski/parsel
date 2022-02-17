/**
 * Node based fetch() shim.
 * Resembles the fetch request-response functionality in a Promise based manner.
 * @param {String} url Request URL
 * @param {Object} * Request options 
 * @returns {Promise} Promise resolving upon response with meta information and data stream interface
 */
module.exports = function(url, { body, ...options }) {
	url = new URL(url);
	return new Promise((resolve, reject) => {
		const req = require(url.protocol
			.replace(/:$/, "").toLowerCase())
			.request({
				...options,
		
				hostname: url.hostname,
				port: url.port,
				path: `${url.pathname}${url.hash || ""}${url.query || ""}`, 
				
				headers: {
					...(options.headers || {}),
		
					"Content-Type": "application/json"
				}
			}, res => {
				resolve({
					headers: res.headers,
					status: res.statusCode,
					
					/**
					 * Resolve response payload as text.
					 */
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
					/**
					 * Resolve response payload as object.
					 */
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