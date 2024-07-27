# Hosting Php with database Mysql

If your application needs to run in conjunction with a database server, you can also start the database server and connect to it from your application. Also, if you need a DBMS web panel to manage your database, it can also be connected as a separate service.

> Check the current version of the `Mysql` container in the [official Mysql repository](https://hub.docker.com/_/mysql/tags)

```yml
name: name-of-project
services:
  php1:
    type: php
    size: mili
    active: true
    version: ${{VERSION}}
    pwd: examples/php-mysql
    exclude:
      - vendor
    command: php-fpm
    ports:
      - port: 3000
        type: http
    depends_on: # Specify that the service should have internal links to
      - mysql0 # mysql0 service
    environment:
      - PORT=3000
      # Next we forward the connection variables
      - MYSQL0_USER=user
      - MYSQL0_PASSWORD=password
      - MYSQL0_DB=db_name
  postgres0:
    type: mysql
    size: mili
    active: true
    version: latest
    environment:
      # Variables for initializing the database
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
      - MYSQL_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - mysql0
```

> The database host will be accessible in the application container by the environment variable `[SERVICE_TYPE]_HOST`, for example for the `mysql` database the name of the host variable will be `MYSQL_HOST`
