const { readFileSync } = require("fs");
const { join } = require("path");

const express = require("express");


const app = express();

app.use(express.json());

// ROUTES

app.get("/resource/:id", (_, res) => {  
	res.send("Success");  
});

app.post("/resource", (req, res) => {
	res.send({
		...req.body,
		
		b: 2
	});
});

const serveFile = name => {
	return String(readFileSync(join(__dirname, name)));
};

app.get("/client", (_, res) => {
	res.send(serveFile("./test-browser-client.html"));
});
app.use("/parsel.min.js", (_, res) => {
	res.send(serveFile("../src/client-browser.js"));
});


process.on("exit", _ => {
	console.log("> API test server stopped.");
});


module.exports = new Promise(resolve => {
	app.listen(9797, _ => {
		console.log("> API test server started.");

		resolve(app);
	});
});