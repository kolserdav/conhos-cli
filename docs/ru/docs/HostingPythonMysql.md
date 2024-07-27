# Хостинг Python с базой данных Mysql

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

> Актуальную версию `Mysql` контейнера уточнить в [официальном репозитории Mysql](https://hub.docker.com/_/mysql/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: latest
    pwd: examples/python-mysql
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - mysql0 # сервис mysql0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
      - MYSQL_DB=db_name
  mysql0:
    type: mysql
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
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

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `mysql` название переменной хоста будет `MYSQL_HOST`
