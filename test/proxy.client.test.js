require("./test-server");

const parsel = require("../src/module").server;

parsel.mediate();

parsel.on("message", message => {
	console.log(`\n\x1b[36m${message}\x1b[0m\n`);
});


require("./client-tests");