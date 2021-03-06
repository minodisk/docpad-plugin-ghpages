// Generated by CoffeeScript 1.6.3
(function() {
  var TaskGroup, pathUtil, rimraf, safefs, safeps,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  safeps = require('safeps');

  rimraf = require('rimraf');

  pathUtil = require('path');

  safefs = require('safefs');

  TaskGroup = require('taskgroup').TaskGroup;

  module.exports = function(BasePlugin) {
    var GhpagesPlugin, _ref;
    return GhpagesPlugin = (function(_super) {
      __extends(GhpagesPlugin, _super);

      function GhpagesPlugin() {
        this.consoleSetup = __bind(this.consoleSetup, this);
        this.deployToGithubPages = __bind(this.deployToGithubPages, this);
        _ref = GhpagesPlugin.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GhpagesPlugin.prototype.name = 'ghpages';

      GhpagesPlugin.prototype.config = {
        deployRemote: 'origin',
        deployBranch: 'gh-pages',
        environment: 'static',
        ignores: []
      };

      GhpagesPlugin.prototype.deployToGithubPages = function(next) {
        var config, docpad, opts, outPath, rootPath, tasks, _ref1;
        docpad = this.docpad;
        config = this.getConfig();
        _ref1 = docpad.getConfig(), outPath = _ref1.outPath, rootPath = _ref1.rootPath;
        opts = {};
        docpad.log('info', 'Deployment to GitHub Pages starting...');
        tasks = new TaskGroup().once('complete', next);
        tasks.addTask(function(complete) {
          var err;
          if (outPath === rootPath) {
            err = new Error("Your outPath configuration has been customised. Please remove the customisation in order to use the GitHub Pages plugin");
            return next(err);
          }
          opts.outGitPath = pathUtil.join(outPath, '.git');
          return complete();
        });
        tasks.addTask(function(complete) {
          var err, _ref2;
          if (_ref2 = config.environment, __indexOf.call(docpad.getEnvironments(), _ref2) < 0) {
            err = new Error("Please run again using: docpad deploy-ghpages --env " + config.environment);
            return next(err);
          }
          return complete();
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Removing old ./out/.git directory..');
          return rimraf(opts.outGitPath, complete);
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Performing static generation...');
          return docpad.action('generate', complete);
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Disabling jekyll...');
          return safefs.writeFile(pathUtil.join(outPath, '.nojekyll'), '', complete);
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Ignoring config.ignores directory...');
          return safefs.writeFile(pathUtil.join(outPath, '.gitignore'), config.ignores.join('\n'), complete);
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', "Fetching the URL of the {config.deployRemote} remote...");
          return safeps.spawnCommand('git', ['config', "remote." + config.deployRemote + ".url"], {
            cwd: rootPath
          }, function(err, stdout, stderr) {
            if (err) {
              return complete(err);
            }
            opts.remoteRepoUrl = stdout.replace(/\n/, "");
            return complete();
          });
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Fetching log messages...');
          return safeps.spawnCommand('git', ['log', '--oneline'], {
            cwd: rootPath
          }, function(err, stdout, stderr) {
            if (err) {
              return complete(err);
            }
            opts.lastCommit = stdout.split('\n')[0];
            return complete();
          });
        });
        tasks.addTask(function(complete) {
          var gitCommands;
          docpad.log('debug', 'Performing push...');
          gitCommands = [['init'], ['add', '--all'], ['commit', '-m', opts.lastCommit], ['push', '--quiet', '--force', opts.remoteRepoUrl, "master:" + config.deployBranch]];
          return safeps.spawnCommands('git', gitCommands, {
            cwd: outPath,
            stdio: 'inherit'
          }, function(err) {
            if (err) {
              return complete(err);
            }
            docpad.log('info', 'Deployment to GitHub Pages completed successfully');
            return complete();
          });
        });
        tasks.addTask(function(complete) {
          docpad.log('debug', 'Removing new ./out/.git directory..');
          return rimraf(opts.outGitPath, complete);
        });
        tasks.run();
        return this;
      };

      GhpagesPlugin.prototype.consoleSetup = function(opts) {
        var commander, config, consoleInterface, docpad;
        docpad = this.docpad;
        config = this.getConfig();
        consoleInterface = opts.consoleInterface, commander = opts.commander;
        commander.command('deploy-ghpages').description("Deploys your " + config.environment + " website to the " + config.deployRemote + "/" + config.deployBranch + " branch").action(consoleInterface.wrapAction(this.deployToGithubPages));
        return this;
      };

      return GhpagesPlugin;

    })(BasePlugin);
  };

}).call(this);
