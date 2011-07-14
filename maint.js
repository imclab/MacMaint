#!/usr/bin/env node
var cli = require('cli').enable('version','status'),
	log = require('logging'),
	step = require('step'),
	spawn = require('child_process').spawn,
	clc = require('cli-color');

cli.setApp('maint', "0.0.1");

cli.parse({
	clean:		['c', 'Clean all installed macports revs'],
	gems:		['g', 'Update ruby gems'],
	sweep:		['u', 'Remove all inactive ports'],
	system:		['s', 'Check for system software updates']
});






cli.main(function(args, options) {
	if (options.debug) {
		this.debug('Enabling logging');
	}
	this.debug('Preparing the help...');
	step(
		function() {
			var $DESC = "Syncing the macports ports tree",
				$SHORT_NAME = "MACPORTS",
				stephook = this;
			outlog(clc.yellow.underline.bold("BEGIN:")+" "+clc.bold($DESC));
			// var p = spawn('port', ['-d','sync']);
			var p = spawn('ls');
			cli.spinner('Scienceing...');
			p.stdout.on('data', function (data) {
				outlog(indentLines(data,$SHORT_NAME));
			});
			p.on('exit', function (code) {
				if(code === 0) {
					cli.ok("DONE: "+$DESC);
					cli.spinner('\n',true);
					stephook();
				} else {
					cli.error(clc.red.inverse.bold(' FAILED ')+" "+$DESC);
				}
			});
		},
		function(err) {
			if (err) cli.error(err);
			var $DESC = "Updating installed ports",
				$SHORT_NAME = "PORTUPDATE",
				stephook = this;
			outlog(clc.yellow.underline.bold("BEGIN:")+" "+clc.bold($DESC));
			var p = spawn('port', ['upgrade','outdated']);
			cli.spinner('Scienceing...');
			p.stdout.on('data', function (data) {
				outlog(indentLines(data,$SHORT_NAME));
			});
			p.stderr.on('data', function (data) {
				outlog(clc.red.bold(data));
			});
			p.on('exit', function (code) {
				if(code == 0 || code == 1) {
					cli.ok("DONE: "+$DESC);
					cli.spinner('\n',true);
					stephook();
				} else {
					log(arguments);
					cli.error(clc.red.inverse.bold(' FAILED ')+" "+$DESC);
				}
			});
		}
	)
});

function cleanup() {
	//cleanup
	cli.spinner('\n',true);
	console.log('\u000D');
	cli.exit(0);
}



function indentLines(str,prefix) {
	str = str.toString();
	prefix = clc.cyan("[")+clc.cyan.bold(prefix)+clc.cyan("]") || '';
	var arr = str.toString().split('\n'),
		ind = "–"+prefix+"\t",
		sep = "\n"+ind;
	return ind+stripEmpties(arr).join(sep);
}



function stripEmpties(arr) {
	var ret = [];
	arr.forEach(function(elm,idx){
		if (elm.trim() !== "") ret.push(elm);
	});
	return ret;
}



function outlog(str) {
	cli.native.util.print('\u000D                         \u000D')
	console.log(str);
	cli.native.util.print('\u000D');
}




