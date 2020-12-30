var { network, encryption } = require("decent"),
    args = require("../common/cli"),
    id;

// Create new identity?
if(args.init !== false) {
    id = encryption.newIdentity(args.identity);
    console.log("New identity generated and stored at " + args.identity);
    process.exit(0);
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
d.events.on('state:changed',(prevState,curState) => {
    console.log("State changed: "+prevState+" -> "+curState);
});
d.events.on('server:error', (err) => console.log("ERR:"+err));
d.events.on('server:listening', (port) => console.log("Listening at " + port));
d.events.on('ip:changed',(ip) => {
    console.log("Public ip verified: "+ip);
});

// Handle registry events
d.events.on('node:discover', (node) => { console.log('Discover: ' + node.uuid );  });