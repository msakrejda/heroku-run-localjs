'use strict'

const cli = require('heroku-cli-util')
const _ = require('lodash')
const process = require('process')
const childProcess = require('child_process')

function runLocal (context, heroku) {
  return heroku.apps(context.app).configVars().info()
    .then(config => {
      _.forEach(config, (v, k) => {
        if (!_.includes(['PATH', 'LD_LIBRARY_PATH'], k)) {
          process.env[k] = v
        }
      })
      if (context.args.length === 0) {
        cli.error('Usage: heroku run:local COMMAND')
        return
      }
      let [ cmd, args ] = [ context.args[0], context.args.slice(1) ]
      let p = childProcess.spawn(cmd, args, { stdio: 'inherit', shell: true })

      const signals = [ 'SIGINT', 'SIGWINCH', 'SIGPIPE' ]
      _.forEach(signals, (signal) => {
        process.on(signal, () => {
          p.kill(signal)
        })
      })

      return new Promise((resolve, reject) => {
        p.on('error', (err) => {
          reject(err)
        })
        p.on('exit', (code, signal) => {
          // Theoretically we could warn if a signal terminated the
          // process, but this seems to get weird: e.g., if we run an
          // interactive psql session and interrupt a long-running
          // query with Ctrl-C, the signal when we eventually exit
          // (even if we run other queries in the session) seems to be
          // SIGINT. Rather than try to make sense of this, we ignore
          // it for now.
          process.exit(code)
        })
      })
    })
}

module.exports = {
  topic: 'run',
  command: 'local',
  description: 'run commands locally with the config vars of your app',
  help: `
run:local COMMAND

Run a command locally with the config vars of a heroku
  app in your environment. Note: if your command
  directly includes environment variable references;
  you must quote these or they will be interpreted
  by your shell before being passed to 'heroku run:local'.

Example:

$ heroku run:local psql '$DATABASE_URL'
Pager usage (pager) is off.
  psql (9.4beta2, server 9.3.5)
SSL connection (protocol: TLSv1.2, cipher: DHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

d6i28tbalesa80=>
  `,

  variableArgs: true,
  needsAuth: true,
  needsApp: true,

  run: cli.command(runLocal)
}
