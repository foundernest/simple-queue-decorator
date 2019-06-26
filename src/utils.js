"use strict";
exports.__esModule = true;
function wait(ms) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, ms);
    });
}
exports.wait = wait;
