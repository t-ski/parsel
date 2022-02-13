const { readFileSync, writeFileSync, statSync, watch } = require("fs");
const { join, dirname } = require("path");


const runOnce = process.argv.slice(2).includes("--once");
const detectionFrequency = 2000;

const watchHandlers = [];


global[`set${runOnce ? "Immediate" : "Interval"}`](_ => {
    watchHandlers.forEach(handler => handler());
}, detectionFrequency);


function modificationHandler(path, modCallback) {
    const check = time => {
        return (Math.abs(time - Date.now()) < detectionFrequency);
    };

    path = join(__dirname, path);

    watchHandlers.push(_ => {
        const { birthtimeMs, mtimeMs } = statSync(path);
        
        if(check(birthtimeMs)
        || check(mtimeMs)) {
            modCallback(path);

            console.log(`Change handled - ${path}`);
        }
    });

    modCallback(path);  // Initial
}


modificationHandler("../src/client.js", path => {    
    const code = String(readFileSync(path));

    // Browser client
    writeFileSync(join(dirname(path), "client-browser.js"), `
    const PARSEL = (_ => {
        const module = { exports: {} };
        ${code}
        return module.exports;
    })();
    `);

    // Node client
    writeFileSync(join(dirname(path), "client-node.js"), `
    const fetch = require("./node-fetch");
    ${code}
    `);
});


console.log(runOnce
    ? "> Source build completed."
    : "> Watching source file changes for build..."
);