import co from 'co'
import _log4js from 'log4js'
import mkdirp from 'co-mkdirp'
import {join, basename} from 'path'

let log4js = {
    logger : null,
    configure(options) {
        _log4js.configure(options)
        return this
    },
    getLogger(category) {
        this.logger = _log4js.getLogger(category)
        return this
    },
    setLevel(level) {
        this.logger.setLevel(level)
        return this
    }
}

export default function(app, opts = {}){
    app.context.logger = {}

    return co(function *(){
        yield createLogFile('./logs', opts)

        log4js.configure({
            replaceConsole: !opts.enable,
            appenders: opts.enable ? opts.appenders : [{type: 'console'}]
        }).getLogger(opts.enable ? 'normal' : '').setLevel('INFO')

        for (let item of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']){
            app.context.logger[item] = function(err){
                log4js.logger[item].apply(log4js.logger, formatErrorMessage(this.url, err, getErrorInfo()))
            }.bind(app.context)
        }
    })
}

function getErrorInfo(){
    let details = extractErrorDetails((new Error()).stack.split('\n').slice(3)[0])

    if (details && details.length === 5) {
        return {
            method: details[1],
            path: details[2],
            line: details[3],
            pos: details[4],
            file: basename(details[2])
        }
    }
}

function extractErrorDetails(errorInfo){
    let rule1, rule2

    rule1 = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
    rule2 = /at\s+()(.*):(\d*):(\d*)/gi

    return rule1.exec(errorInfo) || rule2.exec(errorInfo)
}

function formatErrorMessage(url, exception, errorInfo){
    return [url, `(${errorInfo.file}:${errorInfo.line}:${errorInfo.method})`, exception]
}

function *createLogFile(path, opts){
    yield mkdirp(path = join(process.cwd(), './logs'))

    opts.appenders.forEach((item) => {
        if(item.type === 'file'){
            item.filename = join(path, item.filename)
        }
    })
}
