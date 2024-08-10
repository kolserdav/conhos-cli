# Hosting Node

## Links

- [Node with database Redis](./HostingNodeRedis.md)  
- [Node with database Postgres](./HostingNodePostgres.md)  
- [Node with database Mysql](./HostingNodeMysql.md)  
- [Node with database Mariadb](./HostingNodeMariadb.md)  
- [Node with database Mongo](./HostingNodeMongo.md)  
- [Node with database Rabbitmq](./HostingNodeRabbitmq.md)  


To host an application on Container Hosting `Node`, you must complete the following three steps.

## 1. Installing the project management utility

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md) to install.

## 2. Create a configuration file

Configuration file for creating the `Node` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Node` container in the [official Node repository](https://hub.docker.com/_/node/tags)

```yml
name: my-awesome-project
services:
  node0:
    type: node
    size: mili
    active: true
    pwd: examples/node
    exclude:
      - node_modules
    version: latest
    command: npm i && npm run start
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
```

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

---

Continue studying

[Hosting Node Mongo <<<](./HostingNodeMongo.md) | [>>> Hosting Node ](./HostingNode.md)
