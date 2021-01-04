# Work in progress

For real.

# Development setup

Install node.js lts

clone this repo

enter folder

```npm install```

Start node 1. Decent tries to open the needed port to the public using UPNP when ```-u``` is supplied.

```node decene-gui --init -u --port 47474```

Start node 2, use node 1 as spawn point to establish a network

```node decene-gui --init -u --port 47475 --spawn=localhost:47474```
