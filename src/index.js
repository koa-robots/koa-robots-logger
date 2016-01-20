import log4js from 'log4js'
import mkdirp from 'mkdirp'
import {join, basename, normalize, resolve} from 'path'

export default function(app, opts = {}){
    let path, errorLog, accessLog

    opts = clone(opts)
    path = normalize(resolve('./logs'))

    mkdirp.sync(path)
    adjustFilename(path, opts)
    log4js.configure(opts)

    errorLog = log4js.getLogger('error')
    accessLog = log4js.getLogger('access')
    errorLog.setLevel('INFO')
    accessLog.setLevel('INFO')

    app.context.logger = function(err){
        errorLog.error.apply(errorLog, formatErrorMessage(this.url, err, getErrorInfo()))
    }

    return function *(next){
        yield next

        accessLog.info(this.ip, this.method, this.url, `${this.protocol.toUpperCase()}/${this.req.httpVersion}`,
            this.status, this.length || null, this.get('referrer'), this.header['user-agent'])
    }
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

function adjustFilename(path, opts){
    for(let item of opts.appenders){
        if(item.type === 'file'){
            item.filename = join(path, item.filename)
        }
    }
}

function clone(obj){
    return JSON.parse(JSON.stringify(obj))
}
