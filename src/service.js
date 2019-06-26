"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var amqplib_1 = require("amqplib");
var utils_1 = require("./utils");
var log_1 = require("./log");
var RabbitMQService = /** @class */ (function () {
    function RabbitMQService(options) {
        this.queueRegistry = {};
        this.connected = false;
        this.assertedQueues = new Set(); // Avoid duplicated queues
        this.connectRetry = true;
        this.log = new log_1["default"](true);
        if (options) {
            this.setOptions(options);
        }
    }
    RabbitMQService.prototype.setOptions = function (options) {
        this._options = options;
        this.log = new log_1["default"](options.log);
    };
    RabbitMQService.prototype.sendMessage = function (queue, msg) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createQueue(queue)];
                    case 1:
                        _a.sent();
                        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
                            persistent: true
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RabbitMQService.prototype.registerQueue = function (queueName, cb) {
        if (this.queueRegistry[queueName]) {
            throw new Error("[RabbitMQService] queue " + queueName + " already registered");
        }
        this.queueRegistry[queueName] = {
            cb: cb,
            connected: false
        };
        this.consumeQueue(queueName);
    };
    RabbitMQService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, err_1;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.disconnect();
                        this.connectRetry = true;
                        _c.label = 1;
                    case 1:
                        if (!(!this.connected && this.connectRetry)) return [3 /*break*/, 10];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 7, , 9]);
                        this.log.log('[RabbitMQ] Connecting');
                        _a = this;
                        return [4 /*yield*/, amqplib_1["default"].connect(this.url)];
                    case 3:
                        _a.connection = _c.sent();
                        _b = this;
                        return [4 /*yield*/, this.connection.createChannel()];
                    case 4:
                        _b._channel = _c.sent();
                        return [4 /*yield*/, this.channel.prefetch(this.concurrency)]; // Number of messages to fetch simultaneously
                    case 5:
                        _c.sent(); // Number of messages to fetch simultaneously
                        this.connection.on('close', function () {
                            _this.connection = undefined;
                            _this._channel = undefined;
                            // Unexpected close
                            if (_this.connected) {
                                _this.log.warn('[RabbitMQ] Unexpected Close');
                                _this.connect();
                            }
                        });
                        return [4 /*yield*/, Promise.all(Object.keys(this.queueRegistry).map(function (queue) {
                                return _this.consumeQueue(queue);
                            }))];
                    case 6:
                        _c.sent();
                        this.connected = true;
                        this.log.log('[RabbitMQ] Connected');
                        return [3 /*break*/, 9];
                    case 7:
                        err_1 = _c.sent();
                        this.log.warn('[RabbitMQ] Error Connecting', err_1);
                        return [4 /*yield*/, utils_1.wait(5000)];
                    case 8:
                        _c.sent();
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 1];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    RabbitMQService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, q;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.connected = false;
                        this.connectRetry = false;
                        for (_i = 0, _a = Object.keys(this.queueRegistry); _i < _a.length; _i++) {
                            q = _a[_i];
                            this.queueRegistry[q].connected = false;
                        }
                        if (!this.connection) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.close()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        this.connection = undefined;
                        this._channel = undefined;
                        this.assertedQueues.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(RabbitMQService.prototype, "options", {
        get: function () {
            if (!this._options) {
                throw new Error('[RabbitMQService] Options not initialized');
            }
            return this._options;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RabbitMQService.prototype, "url", {
        get: function () {
            return "amqp://" + this.options.user + ":" + this.options.password + "@" + this.options.url;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RabbitMQService.prototype, "concurrency", {
        get: function () {
            return this.options.messageConcurrency === undefined
                ? 1
                : this.options.messageConcurrency;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RabbitMQService.prototype, "channel", {
        get: function () {
            if (!this._channel) {
                throw new Error('[RabbitMQ] Not Connected');
            }
            else {
                return this._channel;
            }
        },
        enumerable: true,
        configurable: true
    });
    RabbitMQService.prototype.consumeQueue = function (queueName) {
        return __awaiter(this, void 0, void 0, function () {
            var queueData;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queueData = this.queueRegistry[queueName];
                        if (!(this._channel && !queueData.connected)) return [3 /*break*/, 3];
                        queueData.connected = true;
                        return [4 /*yield*/, this.createQueue(queueName)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.channel.consume(queueName, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                                var messageBody, err_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!!msg) return [3 /*break*/, 1];
                                            this.log.error('[RabbitMQ] Message received is null');
                                            return [3 /*break*/, 4];
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            messageBody = JSON.parse(msg.content.toString());
                                            return [4 /*yield*/, this.queueRegistry[queueName].cb(messageBody)];
                                        case 2:
                                            _a.sent();
                                            if (this.channel) {
                                                this.channel.ack(msg); // acks that the message was processed
                                            }
                                            return [3 /*break*/, 4];
                                        case 3:
                                            err_2 = _a.sent();
                                            // Error processing, it will be requeued unless it has already been delivered (1 retry)
                                            this.log.warn('Error Processing Message:', msg.content.toString());
                                            if (err_2) {
                                                this.log.warn(err_2.message);
                                            }
                                            if (this.channel) {
                                                if (msg.fields.redelivered) {
                                                    this.channel.nack(msg, false, false);
                                                }
                                                else {
                                                    this.channel.nack(msg, false, true);
                                                }
                                            }
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }, { noAck: false })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RabbitMQService.prototype.createQueue = function (queueName) {
        return __awaiter(this, void 0, void 0, function () {
            var queueAlreadyExists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queueAlreadyExists = this.assertedQueues.has(queueName);
                        if (!!queueAlreadyExists) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.channel.assertQueue(queueName, { durable: true })]; // Creates the queue if doesn't exists
                    case 1:
                        _a.sent(); // Creates the queue if doesn't exists
                        this.assertedQueues.add(queueName);
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return RabbitMQService;
}());
exports["default"] = RabbitMQService;
