/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer: createHttpServer } = require('http')
const { createServer: createHttpsServer } = require('https')
const fs = require('fs')
const next = require('next')

const dev = false
const app = next({ dev })
const handle = app.getRequestHandler()

const hostname = '0.0.0.0'
const httpPort = 3030
const httpsPort = 3443

app.prepare().then(() => {
  createHttpServer((req, res) => {
    handle(req, res)
  }).listen(httpPort, hostname, () => {
    console.log(`HTTP  listening on http://${hostname}:${httpPort}`)
  })

  createHttpsServer(
    {
      key: fs.readFileSync('/etc/letsencrypt/live/aiapi.kogrobo.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/aiapi.kogrobo.com/fullchain.pem'),
    },
    (req, res) => {
      handle(req, res)
    }
  ).listen(httpsPort, hostname, () => {
    console.log(`HTTPS listening on https://${hostname}:${httpsPort}`)
  })
})
