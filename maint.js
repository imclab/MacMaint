#!/usr/bin/env node
var cli = require('cli').enable('version','status'),
	log = require('logging');
	processStack = [];

cli.setApp('maint', "0.0.1");

cli.parse({
	clean:		['c', 'Clean all installed macports revs'],
	gems:		['g', 'Update ruby gems'],
	sweep:		['u', 'Remove all inactive ports'],
	system:		['s', 'Check for system software updates']
});

var proc = function(procObj) {
	this.description = procObj.description;
	this.process = procObj.process;
}

processStack.push(new proc({
	description		: "Updating the macports ports tree",
	process			: function(nextProc) {
		cli.info('hello from inside the process stack proc.');
		cli.exec('port search nodejs', function(){
			log(arguments);
		});
	}
}));
processStack.push(new proc({
	description		: "Syncing macports",
	process			: function(nextProc) {
		cli.info('hello from inside the process stack proc.');
	}
}));










cli.main(function(args, options) {
	if (options.debug) {
		this.debug('Enabling logging');
	}
	this.debug('Preparing the help...');
	cli.spinner('Sciencing...');
	processStack.forEach(function(proc,idx,allprocs){
		cli.ok(proc.description);
		proc.process(allprocs[idx+1] || false);
	})
	cli.spinner('Done!',true);
});
