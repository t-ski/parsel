const { readdirSync, copyFileSync } = require("fs");
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
        const passed = (testMeta.failed == 0);
        const total = testMeta.passed + testMeta.failed;

        log(`\n${highlight.badge("Complete", [255, 255, 255], passed ? [0, 200, 75] : [255, 0, 0])}${testMeta.passed}/${total} test${(total > 1) ? "s" : ""} passed.\n`);
        
        process.exit(passed ? 0 : 1);
    }, testMeta.timeout);
});


function highlightSequence(str, fg, bg, spec) {
    return `${fg ? `\x1b[38;2;${fg[0]};${fg[1]};${fg[2]}m`: ""}${bg ? `\x1b[48;2;${bg[0]};${bg[1]};${bg[2]}m`: ""}${spec || ""}${str}\x1b[0m`;
};

const highlight = {
    sequence: highlightSequence,

    badge: (str, fg, bg) => {
        return `\n${highlightSequence(` ${str.toUpperCase()} `, fg, bg, "\x1b[1m")} `;
    },

    type: val => {
        if(typeof(val) == "string" || val instanceof String) {
            return highlightSequence(`"${val.slice(0, 25)}${(val.length > 25) ? "..." : ""}"`, [249, 160, 16]);
        }   
        if(typeof(val) == "number" || val instanceof Number) {
            return highlightSequence(val, [18, 68, 206], null, "\x1b[2m");
        }
        
        return highlightSequence(JSON.stringify(val), [133, 151, 213]);
    }
};


function log(message, indentLevel = 0) {
    const groupWrap = (close = false) => {
        for(let i = 0; i < indentLevel; i++) {
            console[`group${close ? "End" : ""}`]();
        }
    };

    groupWrap();

    console.log(message);

    groupWrap(true);
}


const logMessageStack = [];

global.test = function(descriptor, body) {
    testMeta.passed++;

    body(_ => {
        log(`${highlight.badge("Test", null, [255, 175, 215])}${highlight.sequence(descriptor, null, null, "\x1b[1m")}\n`, 1);
        
        logMessageStack.forEach(message => {
            log(message);
        });
        logMessageStack.length = 0;
    });
};

global.value = function(evaledValue) {
    return {
        for: expectedValue => {
            const passed = (evaledValue === expectedValue);

            logMessageStack.push(`${passed ? highlight.sequence("✓", [0, 200, 75]) : highlight.sequence("✗", [255, 0, 0])} Expected ${highlight.type(expectedValue)}, got ${highlight.type(evaledValue)}!`);

            if(passed) {
                return;
            }

            testMeta.passed--;
            testMeta.failed++;
        }
    };
};