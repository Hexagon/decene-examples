var { network, encryption } = require("decene"),
    args = require("../common/cli"),
    fs = require('fs'),
    id;

// Create new identity?
if(args.init !== false) {
    id = encryption.newIdentity(args.identity);
    console.log("New identity generated and stored at " + args.identity);
}

// Try to load identity
id = id || encryption.loadIdentity(args.identity);
if (!id) {
    console.log("Could not load identity, run with --init or see --help\n");
    process.exit(0);
} 

// Try to load cache
var cache;
try {
    cache = JSON.parse(fs.readFileSync(args.cache, 'utf8'));
} catch (err) {
    console.error('Warning: Could not load cache.');
}

// Init decene
var d = new network(id,args.address,args.port,args.spawn,cache);

// Use UPnP
if (args.upnp !== false) {
    d.tryUpnp();
}

// Handle network events
d.events.on('message:reply',(socket, message) => console.log("REPL:"+(socket.node.uuid || socket.remoteAddress) +">"+message.type));
d.events.on('message:send',(node, message, err, res) => console.log("SEND:"+(node.uuid || "spawn")+">"+message.type));
d.events.on('message:received', (message, socket,uuid) => {
    console.log("RECV:"+(socket.node.uuid || socket.remoteAddress)+">"+message.type);
    if (message.type=='broadcast') {
        console.log('BROADCAST  IN@' + socket.remoteAddress + '> ' + message.payload.message);
    }
});

/*d.events.on('resource:providing',(err,stat) => {
    if (err) {
        console.log("Error occurred while providing file: "+err);
    } else {
        console.log("Providing resource '" + stat.resourceId + "' from '" + stat.resourcePath);
    }
});*/

d.events.on('state:changed',(prevState,curState) => {
    console.log("State changed: "+prevState+" -> "+curState);
});
d.events.on('server:error', (err) => console.log("Server error:"+err));
d.events.on('socket:error', (err) => console.log("Client error:"+err));
d.events.on('error', (err) => console.log("Communication error:"+err));
d.events.on('server:listening', (port) => console.log("Listening at " + port));
d.events.on('ip:changed',(ip) => {
    console.log("Public ip verified: "+ip);
});

d.events.on('upnp:success',() => {
    console.log("UPnP Success.");
    
});

// Handle registry events
d.events.on('node:discover', (node) => { console.log('Discover: ' + node.uuid );  });

// Handle registry cache
d.events.on('registry:batch', (node) => {

    console.log('Registry batch updated.'); 

    fs.writeFile(args.cache, JSON.stringify(d.reg.serialize()), err => {
      if (err) {
        console.log("Registry cache flush failed: " + err);
        return;
      } else {
        console.log("Registry cache flushed to disc");
      }
    })
});