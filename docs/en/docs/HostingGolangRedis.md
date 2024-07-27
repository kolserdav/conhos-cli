# Hosting Golang with database Redis

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

> Check the current version of the `Redis` container in the [official Redis repository](https://hub.docker.com/_/redis/tags)

```yml
name: name-of-project
services:
  golang1:
    type: golang
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/golang-redis
    exclude:
      - vendor
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - redis0 # redis0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - REDIS0_USER=user
      - REDIS0_PASSWORD=password
      - REDIS0_DB=db_name
  postgres0:
    type: redis
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - REDIS_USER=user
      - REDIS_PASSWORD=password
      - REDIS_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - redis0
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `redis` database the name of the host variable will be `REDIS_HOST`
