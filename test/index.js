import co from 'co'
import koa from 'koa'
import fs from 'co-fs'
import assert from 'assert'
import logger from '../dist'
import request from 'supertest'

describe('logger', () => {
    var opts = {
        "appenders" : [
            {
                "backups" : 4,
                "type" : "file",
                "category" : "error",
                "maxLogSize" : 10485760,
                "filename" : "error.log"
            },
            {
                "backups" : 4,
                "type" : "file",
                "category" : "access",
                "maxLogSize" : 10485760,
                "filename" : "access.log"
            }
        ]
    }

    it('access log', (done) => {
        var app = koa()

        app.use(logger(app, opts))
        app.use(function *(next){
            this.body = 'logger'
        })

        request(app.listen())
            .get('/')
            .expect(200)
            .end((err, res) => {
                if (err) throw err
                co(function *(){
                    let content = yield fs.readFile('logs/access.log')
                    assert.notEqual(content.length, 0)
                    done()
                })
            })
    })

    it('error log', (done) => {
        var app = koa()

        app.use(logger(app, opts))
        app.use(function *(next){
            try{
                yield fs.readFile('test')
            }catch(err){
                this.logger(err)
            }
        })

        request(app.listen())
            .get('/')
            .expect(404)
            .end((err, res) => {
                if(err) throw err
                co(function *(){
                    let content = yield fs.readFile('logs/error.log')
                    assert.notEqual(content.length, 0)
                    done()
                })
            })
    })
})
