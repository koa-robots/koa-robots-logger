'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (app) {
    let opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    let path, errorLog, accessLog;

    opts = clone(opts);
    path = (0, _path.normalize)((0, _path.resolve)('./logs'));

    _mkdirp2.default.sync(path);
    adjustFilename(path, opts);
    _log4js2.default.configure(opts);

    errorLog = _log4js2.default.getLogger('error');
    accessLog = _log4js2.default.getLogger('access');
    errorLog.setLevel('INFO');
    accessLog.setLevel('INFO');

    app.context.logger = function (err) {
        errorLog.error.apply(errorLog, formatErrorMessage(this.url, err, getErrorInfo()));
    };

    return function* (next) {
        yield next;

        accessLog.info(this.ip, this.method, this.url, `${ this.protocol.toUpperCase() }/${ this.req.httpVersion }`, this.status, this.length || null, this.get('referrer'), this.header['user-agent']);
    };
};

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getErrorInfo() {
    let details = extractErrorDetails(new Error().stack.split('\n').slice(3)[0]);

    if (details && details.length === 5) {
        return {
            method: details[1],
            path: details[2],
            line: details[3],
            pos: details[4],
            file: (0, _path.basename)(details[2])
        };
    }
}

function extractErrorDetails(errorInfo) {
    let rule1, rule2;

    rule1 = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    rule2 = /at\s+()(.*):(\d*):(\d*)/gi;

    return rule1.exec(errorInfo) || rule2.exec(errorInfo);
}

function formatErrorMessage(url, exception, errorInfo) {
    return [url, `(${ errorInfo.file }:${ errorInfo.line }:${ errorInfo.method })`, exception];
}

function adjustFilename(path, opts) {
    for (let item of opts.appenders) {
        if (item.type === 'file') {
            item.filename = (0, _path.join)(path, item.filename);
        }
    }
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}