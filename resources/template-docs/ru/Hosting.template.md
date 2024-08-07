# Хостинг ${{NAME}}

## Ссылки

${{LINKS}}

Чтобы разместить на Контейнерном хостинге `${{NAME}}` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `${{NAME}}`. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `${{NAME}}` контейнера уточнить в [официальном репозитории ${{NAME}}](${{HUB}}${{TYPE}}/tags)

```yml
name: my-awesome-project
services:
  ${{TYPE}}0:
    type: ${{TYPE}}
    size: mili
    active: true
    pwd: examples/${{TYPE}}
    exclude:
      - ${{EXCLUDE}}
    version: latest
    command: ${{COMMAND}}
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
```

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

[${{BACK_LINK_NAME}} <<<](${{BACK_LINK}}) | [>>> ${{FORWARD_LINK_NAME}}](${{FORWARD_LINK}})
