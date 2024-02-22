# Configuration file

> To automatically create a basic configuration file, you can refer to [Project Initialization](./GettingStarted.md#project_initialization)

## Example configuration file

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
