"use strict";
exports.__esModule = true;
var Logs = /** @class */ (function () {
    function Logs(active) {
        if (active === void 0) { active = true; }
        this.active = active;
    }
    Logs.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.active) {
            console.log.apply(console, args);
        }
    };
    Logs.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.active) {
            console.warn.apply(console, args);
        }
    };
    Logs.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.active) {
            console.error.apply(console, args);
        }
    };
    return Logs;
}());
exports["default"] = Logs;
