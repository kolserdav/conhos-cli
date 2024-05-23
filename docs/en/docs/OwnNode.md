# Run a node on your server

## System requirements

1. Public IP address and open `80` and `443` incoming ports
2. Installed `Docker` with the `compose` plugin

## Download

To download, go to https://conhos.ru/partner/downloads and download the executable file for your processor architecture and
operating system families.

## Installation

For a Linux-based OS, you will need to change the rules for accessing the file to make it executable:

```sh
cnmod +x ./conhos-node_conhos-node_x86_64-unknown-linux-gnu
```

Create a folder for the program's working files and move the executable file there:

```sh
mkdir conhos-node && move ./conhos-node_conhos-node_x86_64-unknown-linux-gnu ./conhos-node/conhos-node
```

## Settings

1. Go to the program’s working folder:

```sh
cd conhos-node
```

2. Create a `.env` configuration file:

```ini
DATA_DIR="/home/user/data" # Path to the folder with service files [$PWD/data]
NODE_NAME=local-node # Node name
API_KEY=394ffd3a290dfc8a47ccdf27fef5225e # Node access token to the central server
ADMIN_EMAIL=email@email.com # Administrator's email
```

> To obtain an access token, follow https://conhos.ru/en-US/partner/nodes

## Start

Run in the console:

```sh
./conhos-node
```

The program will launch the necessary Docker containers and shut down.
