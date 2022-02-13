const PARSEL = require("../src/module").client;

const api = new PARSEL({
    origin: "http://localhost:9797",
    interval: 250
});


describe("Scheduled request", _ => {
    test("should respond with 200 : 'Success'", _ => {
        api.schedule("/resource/0", {
            method: "get"
        })
        .then(async res1 => {
            value(res1.status).for(200);
            value(await res1.text()).for("Success");
        });
        
        api.complete();
    });
});