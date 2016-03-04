'use strict';

let cli = require('heroku-cli-util');
let _ = require('lodash');
let process = require('process');
let child_process = require ('child_process');

function runLocal(context, heroku) {
  heroku.apps(context.app).configVars().info()
    .then(config => {
      _.forEach(config, (v, k) => {
	if (!_.includes(['PATH', 'LD_LIBRARY_PATH'], k)) {
	  process.env[k] = v
	}
      })
      let cmd = context.args.join(' ')
      if (cmd.length == 0) {
	cli.error("Usage: heroku run:local COMMAND")
	return
      }
      child_process.execSync(cmd, { stdio: [0, 1, 2] })
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
};
