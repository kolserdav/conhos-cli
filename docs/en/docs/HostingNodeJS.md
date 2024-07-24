# Node.js hosting

To host an application on Container Hosting `Node.js`, you must complete the following three steps.

## 1. Installing the project management utility

If you installed the [conhos](https://www.npmjs.com/package/conhos) utility earlier, then simply proceed to the next step. If not installed, then use [Instructions](./GettingStarted.md) to install.

## 2. Create a configuration file

> Check the current version of the `Node.js` container in the [official Node.js repository](https://hub.docker.com/_/node/tags)

```yml
project: name-of-project # Project name
services:
 node1:
 type: node # Node.js runtime
 size: mili # Service size (affects price)
 active: true # Service started
 public: true # Service has external ports
 version: 22-alpine3.19 # Container version [specify]
 pwd: examples/postgres # Path to the working folder (files and folders from this path will be uploaded to the cloud)
 exclude: # Exclude files and folders (path relative to root "pwd")
 - tmp
 - node_modules
 command: npm i && npm run start # Command to start the container
 ports: # List of external ports
 - port: 3000
 type: http
 environment: # Environment variables
 - PORT=3000
```

### 3. Launching a project in the cloud

To upload files to the cloud and run services in containers, run the command:

```sh
conhos deploy
```

### Database

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

> Check the current version of the `Postgres` container in the [official Postgres repository](https://hub.docker.com/_/postgres/tags)

```yml
project: name-of-project
services:
  node1:
    type: node
    size: mile
    active: true
    public: true
    version: 22-alpine3.19
    pwd: examples/postgres
    exclude:
      - tmp
      - node_modules
    command: npm i && npm run start
    ports:
    - port: 3000
    type: http
    depends_on: # Specify that the service should have internal links to
      - postgres0 # postgres0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=postgres_db
  postgres0:
    type: postgres
    size: mile
    active: true
    public: false
    version: 17beta2-alpine3.19
    environment:
      # Variables for initializing the database
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=postgres_db
  adminer0:
    type: admin
    size: mile
    active: true
    public: true
    version: 4.8.1-standalone
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `postgres` database the name of the host variable will be `POSTGRES_HOST`