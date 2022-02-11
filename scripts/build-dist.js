const { rmdirSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const UglifyJS = require("uglify-js");


const signature = String(readFileSync(join(__dirname, "code-signature")));


function build(srcName, distName = srcName) {
    const path = (dirName, fileName) => {
        return join(__dirname, `../${dirName}`, `${fileName}.js`);
    };

    let code = String(readFileSync(path("src", srcName)));

    code = UglifyJS.minify(code).code
    .replace(/\n+/g, "")
    .replace(/\s+/g, " ");
    
    // Insert signature at top of each code file
    code = `${signature}\n${code}`;

    writeFileSync(path("dist", distName), code);
}

rmdirSync(join(__dirname, "../dist"), {
    recursive: true,
    force: true
});
mkdirSync(join(__dirname, "../dist"));

build("module");
build("node-fetch");
build("server");
build("client-node");
build("client-browser", "parsel.min");


console.log("> Distribution build completed.");