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

// Init decent
var d = new network(id,args.address,args.port,args.spawn,cache);

// Handle network events
d.events.on('message:send',(node, message, err, res) => {
    console.log(message.type + ' OUT@' + d.node.address + '> ' + node + '> ' + message.payload.message);
    if (message.type=='broadcast') {
        console.log('BROADCAST OUT@' + d.node.address + '> ' + node + '> ' +  message.payload.message);
    }
});
d.events.on('message:received', (message) => {
    console.log(message.type + ' IN@' + d.node.address + '> ' + message.payload.message);
    if (message.type=='broadcast') {
        console.log('BROADCAST IN@' + d.node.address + '> ' + message.payload.message);
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
d.events.on('server:error', (err) => console.log("ERR:"+err));
d.events.on('server:listening', (port) => console.log("Listening at " + port));
d.events.on('ip:changed',(ip) => {
    console.log("Public ip verified: "+ip);
});

d.events.on('upnp:success',() => {
    console.log("UPnP Success.");
    
});

// Handle registry events
d.events.on('node:discover', (node) => { console.log('Discover: ' + node.uuid );  });