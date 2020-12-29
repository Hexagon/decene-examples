# Work in progress

For real.

# Development setup

Install node.js lts

clone this repo

enter folder

```npm install```

Start node 1 with new identity

```node decent-gui --init --port 47474```

Start node 2 with new identity, use node 1 as spawn point to establish a network

```node decent-gui --init --port 47475 --spawn=localhost:47474```