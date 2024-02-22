# Файл конфигурации

> Для автоматического создания базового файла конфигурации вы можете обратиться к [Инициализация проекта](./GettingStarted.md#инициализация_проекта)

## Пример файла конфигурации

```yml
project: my-awesome-project
services:
  node0:
    type: node
    size: mili
    active: true
    public: true
    version: 21-alpine3.18
    command: npm i && npm run start
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
exclude:
  - node_modules
  - dist
```
