#MacMaint

Maintenance goodies for your unixy mac.

#What do?

Runs a bunch of maintenance tasks that I got tired of running manually all the time.

##Included tasks:

* [MacPorts](www.macports.org) ports tree syncing
* MacPorts upgrade outdated
* Cleans installed ports
* Removes inactive ports (saved me almost 2gb!)
* Updates installed ruby gems
* Runs OS X's `periodic` maintenance scripts
	* Daily
	* Weekly
	* Monthly
* Lists available OS X updates


##Usage

```
Usage:
  maint [OPTIONS]

Options: 
  -n, --dryrun BOOLEAN   Dry run. Don't actually perform installs or actions 
  -c, --clean [BOOLEAN]  Clean all installed macports revs (Default is true)
  -g, --gems [BOOLEAN]   Update ruby gems (Default is true)
  -u, --sweep [BOOLEAN]  Remove all inactive ports (Default is true)
  -s, --system [BOOLEAN] Check for system software updates (Default is true)
  -k, --no-color         Omit color from output
      --debug            Show debug information
  -v, --version          Display the current version
  -h, --help             Display help and usage details
```

#How get?

Make sure you have the following isntalled:

* [MacPorts](http://www.macports.org)
* [node](http://github.com/joyent/node)
* [npm](http://github.com/isaacs/npm)

Then clone this repo and either `npm link` it to your global path or install it globally:

**Linking**:

```bash
git clone https://github.com/alampros/MacMaint.git maint
cd maint
npm install
npm link
```

**Global install**:

```bash
git clone https://github.com/alampros/MacMaint.git maint
cd maint
npm -g install .
```

#Make it yours

`maint` uses [step](https://github.com/creationix/step#readme) for flow control. Feel free to modify the stack or insert your own. This needs lots of improvement, and I'm looking into migrating to [`resistance`](https://github.com/jgallen23/resistance) for flow control in the near future. Also, I'd like to come up with a good way to simplify the commands and configuration. If you have any ideas, feel free to let me know or just send a pull request.












