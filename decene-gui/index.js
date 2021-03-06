var {network, encryption } = require("decene"),

    gui = require("./gui"),
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
var d = new network(id, args.address,args.port,args.spawn, cache);

// Use UPnP
if (args.upnp !== false) {
    d.tryUpnp();
}

// Console GUI
function setTitle(d) {
    gui.setTitle(d.state, d.node.uuid, d.connectivity, d.reg.count('alive'), d.reg.count());
}

// Handle network events
d.events.on('message:reply',(socket, message) => gui.log.log("REPL:"+(socket.node.uuid || socket.remoteAddress) +">"+message.type));
d.events.on('message:send',(node, message, err, res) => gui.log.log("SEND:"+(node.uuid || "spawn")+">"+message.type));
d.events.on('message:received', (message, socket,uuid) => {
    gui.log.log("RECV:"+(socket.node.uuid || socket.remoteAddress)+">"+message.type);
    if (message.type=='broadcast') {
        gui.history.log('BROADCAST  IN@' + socket.remoteAddress + '> ' + message.payload.message);
    }
    gui.screen.render();
});

d.events.on('server:error', (err) => gui.log.log("ERR:"+err));
d.events.on('socket:error', (err) => gui.log.log("ERR:"+err));
d.events.on('error', (err) => gui.log.log("ERR:"+err));

d.events.on('server:listening', (port) => gui.log.log("Listening at "+port));
d.events.on('ip:changed',(ip) => {gui.log.log("Public ip changed by public demand:"+ip);});

d.events.on('upnp:trying',() => {
    gui.log.log("Trying to open public port by UPnP.");
    setTitle(d);
});
d.events.on('upnp:success',() => {
    gui.log.log("UPnP Success.");
    setTitle(d);
});
d.events.on('upnp:fail',(err) => {
    gui.log.log("UPnP Failure: ", err);
    setTitle(d);
});

// Handle registry events
d.events.on('node:invalidate', () => gui.updateTable(d.node, d.reg.r));
d.events.on('node:dead', () => gui.updateTable(d.node, d.reg.r));
d.events.on('node:discover', (node) => {gui.updateTable(d.node, d.reg.r); gui.log.log('Discover: ' + node.uuid ); setTitle(d); });
d.events.on('node:update', (node) => {gui.updateTable(d.node, d.reg.r); ; gui.log.log('Update: ' + node.uuid ); setTitle(d); });
d.events.on('registry:batch', (node) => {

    gui.updateTable(d.node, d.reg.r); 
    gui.log.log('Registry batch updated.'); 

    fs.writeFile(args.cache, JSON.stringify(d.reg.serialize()), err => {
      if (err) {
        gui.log.log("Registry cache flush failed: " + err);
        return;
      } else {
        gui.log.log("Registry cache flushed to disc");
      }
    })
});

// Handle GUI events
gui.events.on('gui:input', (i) => {
    var inText = i;
    if(d.broadcast(inText)) {
        gui.history.log('BROADCAST OUT@['+d.node.uuid+']> ' +inText);
    } else {
        gui.history.log('BROADCAST OUT@[void}> ' +i);
        gui.history.log("Broadcast failed, not recipients in range.");
    }
})
