# Хостинг ${{NAME}} с базой данных ${{DATABASE_NAME}}

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

> Актуальную версию `${{DATABASE_NAME}}` контейнера уточнить в [официальном репозитории ${{DATABASE_NAME}}](${{HUB}}${{DATABASE}}/tags)

```yml
name: name-of-project
services:
  ${{TYPE}}1:
    type: ${{TYPE}}
    size: mili
    active: true
    version: latest
    pwd: examples/${{TYPE}}-${{DATABASE}}
    exclude:
      - ${{EXCLUDE}}
    command: ${{COMMAND}}
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - ${{DATABASE}}0 # сервис ${{DATABASE}}0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - ${{DATABASE_UPPERCASE}}_USER=user
      - ${{DATABASE_UPPERCASE}}_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}_DB=db_name
  ${{DATABASE}}0:
    type: ${{DATABASE}}
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - ${{DATABASE_UPPERCASE}}_USER=user
      - ${{DATABASE_UPPERCASE}}_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - ${{DATABASE}}0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `${{DATABASE}}` название переменной хоста будет `${{DATABASE_UPPERCASE}}_HOST`
