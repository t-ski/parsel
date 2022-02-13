const { readdirSync } = require("fs");
const { join } = require("path");


const testMeta = {
    passed: 0,
    failed: 0,
    timeout: 2500
};


const testDirPath = join(__dirname, "../test");

require(join(testDirPath, "test-server.js"))
.then(_ => {
    readdirSync(testDirPath, {
        withFileTypes: true
    })
    .filter(dirent => dirent.isFile())
    .filter(dirent => {
        return /\.test\.js$/.test(dirent.name);
    })
    .forEach(dirent => {
        require(join(testDirPath, dirent.name));
    });

    setTimeout(_ => {
        log(`Complete: ${testMeta.passed}/${testMeta.passed + testMeta.failed} tests passed.`);
        
        process.exit((testMeta.failed > 0) ? 1 : 0);
    }, testMeta.timeout);
});


const _log = console.log;

console.log = message => {
    _log(`[internal]: ${message}`);
};

function log(message) {
    _log(message);
}


global.describe = function(descriptor, body) {
    log(descriptor);
    
    global.test = function(descriptor, body) {
        console.group();
        log(descriptor);
        console.groupEnd();

        testMeta.passed++;
        
        global.value = function(evaledValue) {
            return {
                for: expectedValue => {
                    const passed = (evaledValue === expectedValue);

                    console.group();
                    console.group();
                    log(`Expected ${expectedValue}, got ${evaledValue}!`);
                    console.groupEnd();
                    console.groupEnd();

                    if(passed) {
                        return;
                    }

                    testMeta.passed--;
                    testMeta.failed++;
                }
            };
        };

        body();
    };

    body();
};