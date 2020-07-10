#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const { exit } = require("process");
const fs = require('fs');

const wkDir = ".tmp"
const cd = process.cwd()
const pubOptions = ["--silent", "--ignore-scripts", "--dry-run"];

let packToPub = process.argv.slice(2);
let listToPub = new Set();

prepWS();

packToPub.forEach(pack => listToPub.add(pack));
try {
    // list all packages dependencies
    listToPub.forEach(pack => {  
        let depJson = execSync(`npm v ${pack} dependencies --json`);
        if (depJson.toString() != "") {
            let dependencies = JSON.parse(execSync(`npm v ${pack} dependencies --json`));
            for (let dep in dependencies) {
                listToPub.add(dep);
            }
        }
    });
} catch (error) {
    console.error(error)
    delWS();
    exit(1);
}
console.log(`${listToPub.size-packToPub.length} dependencies have been found.`);
console.log(`${listToPub.size} packages will now be downloaded.`);

// download all packages
if (`npm pack ${Array.from(listToPub).join(" ")} --quiet`.toString().length > 8000) console.warn("The number of packages may be too high.")
let tarToPub
try {
    tarToPub = execSync(`npm pack ${Array.from(listToPub).join(" ")} --quiet`).toString().split('\n');    
} catch (error) {
    console.error(`${error}`);
    delWS();
}
console.log(`Downloaded packages : \n\t${tarToPub.join("\n\t")}`);
tarToPub.forEach(tarball => {
    try {
        execSync(`npm publish ${tarball} ${pubOptions.join(" ")}`);
        console.log(tarball, "--> published")
    } catch (error) {
        console.warn(`${error}`);
        tarToPub.splice(tarToPub.indexOf(tarball),1,"")
    }
});
tarToPub = tarToPub.filter(elem => elem != "")
if (tarToPub.length > 0) console.log("List of all publish packages :", tarToPub)
else console.log("No package published")
delWS()

function prepWS() {
    if (!fs.existsSync(wkDir)) {
        fs.mkdirSync(wkDir, true);
    }
    process.chdir(wkDir);
}
function delWS() {
    try {
        process.chdir(cd);
    }
    catch (err) {
        console.log('chdir: ' + err);
    }
    delFoldRec(wkDir)
}

// Found at : https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
function delFoldRec(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            let curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                delFoldRec(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};