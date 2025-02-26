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

> If your project files are in a Git repository, then installing the utility is not necessary, since you can run the project from the browser.

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md#introduction) to install.

## 2. Create a configuration file

> If your project files are in a Git repository, you can create a configuration file from your browser.

Configuration file for creating the `Golang` service in Container Hosting. More details in [Configuration File](./ConfigFile.md#example_configuration_file).

> Check the current version of the `Golang` container in the [official Golang repository](https://hub.docker.com/_/golang/tags)

```yml
name: my-golang-project
services:
  golang0:
    image: golang
    size: mili
    active: true
    pwd: examples/golang
    exclude:
      - vendor
    version: latest
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: proxy
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

[Hosting Golang Mongo <<<](./HostingGolangMongo.md) | [>>> Hosting Golang Redis](./HostingGolangRedis.md)
