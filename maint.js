#!/usr/bin/env node
var cli = require('cli').enable('version','status'),
	step = require('step'),
	spawn = require('child_process').spawn,
	clc = require('cli-color');

var PORTS_NUM_INSTALLED = 0,
	PORTS_NUM_OUTDATED = 0;
	

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
									cli.spinner(clc.yellow.inverse.bold('DONE')+'\n',true);
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
	hr();
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
			syncPorts.onErrData = function(data) {};
			// syncPorts.cmd = {cmd:"ls",args:['-al']};
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Calculating outdated ports",
				SHORT_NAME	: "MACPORTS",
				hook		: stephook,
				cmd			: {cmd:"port",args:['echo','outdated']}
			}
			syncPorts.onOutData	= function(data) {
				var ports = [];
				var portsArr = data.toString().split("\n");
				for (var i=0; i < portsArr.length; i++) {
					var m = portsArr[i].match(/([^\s]*)\s+@/);
					if(m) {
						ports.push(m[1]);
					}
				};
				PORTS_NUM_OUTDATED += ports.length;
			};
			syncPorts.onExit = function(code) {
				if(code < 2) {
					if(PORTS_NUM_OUTDATED) {
						outlog(indentLines('Outdated ports: '+clc.magenta.bold(PORTS_NUM_OUTDATED),syncPorts.SHORT_NAME));
					} else {
						outlog(clc.green('No ports are outdated. Huzzah!'));
					}
					cli.spinner(clc.yellow.inverse.bold('DONE')+' '+settings.DESC+'\n',true);
					syncPorts.hook();
				} else {
					cli.error(clc.red.inverse.bold(' FAILED ')+" "+settings.DESC);
					cleanup();
				}
			};
			runProcess(syncPorts);
		},
		function() {
			var stephook = this;
			var syncPorts = {
				DESC		: "Counting installed Ports",
				SHORT_NAME	: "MACPORTS",
				hook		: stephook,
				cmd			: {cmd:"port",args:['echo','installed']}
			}
			syncPorts.onOutData	= function(data) {
				var ports = [];
				var portsArr = data.toString().split("\n");
				for (var i=0; i < portsArr.length; i++) {
					var m = portsArr[i].match(/([^\s]*)\s+@/);
					if(m) {
						ports.push(m[1]);
					}
				};
				PORTS_NUM_INSTALLED += ports.length;
			};
			syncPorts.onExit = function(code) {
				if(code < 2) {
					outlog(indentLines('Installed ports: '+clc.magenta.bold(PORTS_NUM_INSTALLED),syncPorts.SHORT_NAME));
					cli.spinner(clc.yellow.inverse.bold('DONE')+'\n',true);
					syncPorts.hook();
				} else {
					cli.error(clc.red.inverse.bold(' FAILED ')+" "+settings.DESC);
					cleanup();
				}
			};
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
			if(!PORTS_NUM_OUTDATED) {
				hr();
				outlog(clc.green.inverse('SKIP:')+clc.green(' No ports require updating. Yay!'));
				this();
			} else {
				if(options.debug) syncPorts.cmd.args.unshift('-d');
				if(options.dryrun) syncPorts.cmd.args.unshift('-y');
				runProcess(syncPorts);
			}
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
			var cleancounter = 0;
			syncPorts.onOutData = function(data) {
				cleancounter ++;// data.toString().split("\n").length;
				var progstr='\u000D\t\t\tCleaning '+clc.magenta(cleancounter)+' of '+clc.magenta(PORTS_NUM_INSTALLED)+' ports... ';
				cli.native.util.print(progstr);
			};
			syncPorts.onExit = function(code) {
				if(code < 2) {
					cli.native.util.print('\n');
					cli.spinner(clc.yellow.inverse.bold('DONE')+'\n',true);
					syncPorts.hook();
				} else {
					cli.error(clc.red.inverse.bold(' FAILED ')+" "+syncPorts.DESC);
					cleanup();
				}
			};
			syncPorts.onErrData = function(){};
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

function hr() {
	outlog(clc.white.underline('                                               '));
}




