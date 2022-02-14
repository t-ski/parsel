require("./test-server");

const PARSEL = require("../src/module").client;

const api = new PARSEL({
    origin: "http://localhost:9797",
    interval: 250
});


// SCHEDULE REQUESTS

test("SCHEDULE GET should respond with 200 : 'Success'", done => {
    api.schedule("/resource/0", {
        method: "get"
    })
    .then(async res => {
        value(res.status).for(200);
        value(await res.text()).for("Success");

        done();
    });
});

test("SCHEDULE POST should respond with 200 : [object]", done => {
    api.schedule("/resource", {
        method: "post",
        body: {
            b: 1
        }
    })
    .then(async res => {
        value(res.status).for(200);
        value(await res.json()).for({ a: 1, b: 2 });

        done();
    });
});

test("SCHEDULE GET should respond with 404", done => {
    api.schedule("/missing/0", {
        method: "get"
    })
    .then(res => {
        value(res.status).for(404);
        
        done();
    });
});

test("SCHEDULE POST should respond with 404", done => {
    api.schedule("/missing", {
        method: "post",
        body: {}
    })
    .then(res => {
        value(res.status).for(404);
        
        done();
    });
});

api.complete();


// INTERVAL REQUESTS

test("INTERVAL GET should respond with 200 : 'Success'", done => {
    api.interval("/resource/0", {
        method: "get"
    })
    .then(async res => {
        value(res.status).for(200);
        value(await res.text()).for("Success");

        done();
    });
});

test("INTERVAL GET should respond with 404", done => {
    api.interval("/missing/0", {
        method: "get"
    })
    .then(res => {
        value(res.status).for(404);
        
        done();
    });
});