#!/usr/bin/env node
var cli = require('cli').enable('version','status'),
	step = require('step'),
	spawn = require('child_process').spawn,
	clc = require('cli-color');

cli.setApp('maint', "0.0.1");

cli.parse({
	dryrun:		['n', 'Dry run. Don\'t actually perform installs or actions','boolean',false],
	clean:		['c', 'Clean all installed macports revs','boolean',true],
	gems:		['g', 'Update ruby gems','boolean',true],
	sweep:		['u', 'Remove all inactive ports','boolean',true],
	system:		['s', 'Check for system software updates','boolean',true]
});


var runProcess = function(confObj) {
	if(!confObj) throw "No config object supplied.";
	if(!"hook" in confObj) throw "Need a hook to the step context.";
	
	settings = {};
	settings.cmd		= {cmd:'ls',args:['-al']};
	settings.DESC		= "";
	settings.SHORT_NAME	= "";
	settings.onExit		= function(code) {
								if(code < 2) {
									cli.spinner(clc.yellow.inverse.bold('DONE:')+' '+settings.DESC+'\n',true);
									settings.hook();
								} else {
									cli.error(clc.red.inverse.bold(' FAILED ')+" "+settings.DESC);
									cleanup();
								}
							};
	settings.onOutData	= function(data) {
								outlog(indentLines(data,settings.SHORT_NAME));
							};
	settings.onErrData	= function(data) {
								outlog(clc.red(data));
							}
	
	for (var attr in confObj) {
		settings[attr] = confObj[attr];
	}
	outlog('\n');
	outlog(clc.white.underline('                                        '));
	outlog('\n');
	outlog(clc.yellow.underline.bold("BEGIN:")+" "+clc.bold(settings.DESC));
	var p = spawn(settings.cmd.cmd, settings.cmd.args);
	cli.spinner('Scienceing...');
	p.stdout.on('data', settings.onOutData);
	p.stderr.on('data', settings.onErrData);
	p.on('exit', settings.onExit);
}



cli.main(function(args, options) {
	if (options.debug) {
		this.debug('Logging Enabled');
	}
	this.debug('Preparing the help...');
	step(
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Syncing the macports ports tree",
				SHORT_NAME	: "MACPORTS",
				hook		: stephook,
				cmd			: {cmd:"port",args:['-d','sync']}
			}
			if(options.debug) syncPorts.cmd.args.unshift('-d');
			if(options.dryrun) syncPorts.cmd.args.unshift('-y');
			// syncPorts.cmd = {cmd:"ls",args:['-la']}
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Updating installed ports",
				SHORT_NAME	: "PORTUPDATE",
				hook		: stephook,
				cmd			: {cmd:"port",args:['upgrade','outdated']}
			}
			if(options.debug) syncPorts.cmd.args.unshift('-d');
			if(options.dryrun) syncPorts.cmd.args.unshift('-y');
			runProcess(syncPorts);
		},
		function() {
			if(!options.clean) return this;
			var stephook = this;
			var syncPorts = {
				DESC		: "Cleaning macports",
				SHORT_NAME	: "PORTS",
				hook		: stephook,
				cmd			: {cmd:"port",args:['clean','--all','installed']}
			}
			if(options.debug) syncPorts.cmd.args.unshift('-d');
			if(options.dryrun) syncPorts.cmd.args.unshift('-y');
			runProcess(syncPorts);
		},
		function() {
			if(!options.sweep) return this;
			var stephook = this;
			var syncPorts = {
				DESC		: "Uninstalling innactive ports",
				SHORT_NAME	: "PORTS",
				hook		: stephook,
				cmd			: {cmd:"port",args:['-f','uninstall','inactive']}
			}
			if(options.debug) syncPorts.cmd.args.unshift('-d');
			if(options.dryrun) syncPorts.cmd.args.unshift('-y');
			runProcess(syncPorts);
		},
		function() {
			if(!options.gems) return this;
			var stephook = this;
			var syncPorts = {
				DESC		: "Updating ruby gems",
				SHORT_NAME	: "GEMS",
				hook		: stephook,
				cmd			: {cmd:"gem",args:['update']}
			}
			if(options.dryrun) {
				syncPorts.DESC = "Outdated ruby gems:";
				syncPorts.cmd.args = ['outdated'];
			}
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Periodic Daily maintenance scripts",
				SHORT_NAME	: "OSX",
				hook		: stephook,
				cmd			: {cmd:"periodic",args:['daily']}
			}
			if(options.dryrun) syncPorts.cmd = {cmd:'echo',args:['"Dry Run"']};
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Periodic Weekly maintenance scripts",
				SHORT_NAME	: "OSX",
				hook		: stephook,
				cmd			: {cmd:"periodic",args:['weekly']}
			}
			if(options.dryrun) syncPorts.cmd = {cmd:'echo',args:['"Dry Run"']};
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Periodic Monthly maintenance scripts",
				SHORT_NAME	: "OSX",
				hook		: stephook,
				cmd			: {cmd:"periodic",args:['Monthly']}
			}
			if(options.dryrun) syncPorts.cmd = {cmd:'echo',args:['"Dry Run"']};
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Listing OS X Software Updates - LIST ONLY",
				SHORT_NAME	: "OSX",
				hook		: stephook,
				onErrData	: function(){},
				cmd			: {cmd:"softwareupdate",args:['-l']}
			}
			if(options.dryrun) syncPorts.cmd = {cmd:'echo',args:['"Dry Run"']};
			runProcess(syncPorts);
		},
		function() {
			cleanup();
		}
	)
});


// cli.parse({
// 	clean:		['c', 'Clean all installed macports revs'],
// 	gems:		['g', 'Update ruby gems'],
// 	sweep:		['u', 'Remove all inactive ports'],
// 	system:		['s', 'Check for system software updates']
// });

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






