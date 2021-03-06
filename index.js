'use strict';
var fs = require('fs');
var irc = require('irc');
var nconf = require('nconf');
var path = require('path');

  nconf.argv()
  .env()
  .file({ file: 'config.json' })
  .defaults({script_directory:'scripts',
    sasl:false,
    irc_server_password:'',
    irc_realname:'ircbotjs',
    irc_username:'ircbotjs',
  });

if(!nconf.get('irc_nickname')){
  console.error("irc_nickname is not defined, exiting!");
  process.exit(1);
}

if(!nconf.get('irc_server')){
  console.error("irc_server is not defined, exiting!");
  process.exit(1);
}


var client = new irc.Client(nconf.get('irc_server'), nconf.get('irc_nickname'), {
  userName: nconf.get('irc_username'),
  realName: nconf.get('irc_realname'),
  port: nconf.get('irc_server_port'),
  channels: nconf.get('irc_channels'),
  sasl: nconf.get('sasl'),
  password: nconf.get('irc_server_password'),
});

client.addListener('error', function(message) {
  console.log('IRC error: ', message);
});

//descriptions of the modules having one (that is, module.exports.description)
var visible_modules = [];

fs.readdir(nconf.get('script_directory'),function(err,files){
  files.forEach(fileName => {

    if(!/.+\.js$/.test(fileName))
      return;

    fs.stat(path.join(nconf.get('script_directory'),fileName),(err,fstat) => {
      if (!fstat.isDirectory()){
        var thisModule = require(path.resolve(path.join('.',nconf.get('script_directory'),fileName)));
        thisModule.main(client);
        if(thisModule.description){
          visible_modules.push(fileName+" "+thisModule.description); 
          console.log("found module "+fileName+" ("+thisModule.description+")");
        }
        else{
          console.log("found module without description "+fileName);
        }
      }
    });
  });
});

client.addListener('message#', function(nick,to,text,message) {
  if(text === '!help'){
    client.say(to,visible_modules.length+" modules visible:");
    visible_modules.forEach((m,i) => {
      setTimeout(() =>{
      client.say(to," * "+m);
      },600*i);
    });
  }
});

client.addListener('error', function(message) {
  console.log('error: ', message);
}); 
