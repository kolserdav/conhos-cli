# Hosting Golang

## Links

- [Golang with database Redis](./HostingGolangRedis.md)  
- [Golang with database Postgres](./HostingGolangPostgres.md)  
- [Golang with database Mysql](./HostingGolangMysql.md)  
- [Golang with database Mariadb](./HostingGolangMariadb.md)  
- [Golang with database Mongo](./HostingGolangMongo.md)  
- [Golang with database Rabbitmq](./HostingGolangRabbitmq.md)  


To host an application on Container Hosting `Golang`, you must complete the following three steps.

## 1. Installing the project management utility

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md) to install.

## 2. Create a configuration file

Configuration file for creating the `Golang` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Golang` container in the [official Golang repository](https://hub.docker.com/_/golang/tags)

```yml
name: my-awesome-project
services:
  golang0:
    type: golang
    size: mili
    active: true
    pwd: examples/golang
    exclude:
      - vendor
    version: latest
    command: go build -o main && ./main
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

<div style="margin-top: 4rem;"></div>

Continue studying

<div style="display: flex; flex-direction: row; justify-content: space-around;"><span>[Hosting Golang Mongo <<<](./HostingGolangMongo.md)</span> <span>|</span> <span>[>>> Hosting Golang Redis](./HostingGolangRedis.md)</span></div>
