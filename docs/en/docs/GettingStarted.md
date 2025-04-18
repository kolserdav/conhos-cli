# Getting started with the Container Hosting service

## Introduction [![anchor](https://conhos.ru/images/icons/link.svg)](#intro)

The **conhos** utility is an open source program that is the official client of the **Container Hosting** service.

> Installation of the utility is required only if you want to download files from your device. If your project is in a Git repository, then **you can manage the project through the browser**.

## System requirements [![anchor](https://conhos.ru/images/icons/link.svg)](#requirements)

To work with the utility, you will need to install **Node.js** version **22** and higher on your computer. Official Node.js download page: https://nodejs.org or use the **Node Version Manager** https://github.com/nvm-sh/nvm.

## Installation [![anchor](https://conhos.ru/images/icons/link.svg)](#install)

Install **conhos** globally on the system:

```sh
npm i -g conhos
```

We check the installation with the command:

```sh
conhos -v
```

If the installation was successful, you will see the program version.

## Login [![anchor](https://conhos.ru/images/icons/link.svg)](#login)

To interact with the service using the **conhos** utility, you must first log in through your browser.
To start the authorization procedure, run in the console:

```sh
conhos login
```

Then, in the browser window that opens, enter your credentials from the conhos.ru service, then you will see a message in the console about successful authorization.

To restrict access to your account through the utility from your computer by other people, you can encrypt the authorization token with a password.
To do this, run the **login** command with the **-с** flag

```sh
# Optional
conhos login -c
```

Additionally, you will need to enter the token encryption password, and in the future, each time you use the token, you will need to enter the encryption password.

## Project Initialization [![anchor](https://conhos.ru/images/icons/link.svg)](#init)

To do this, in the console, go to the folder of the project that you want to run in the cloud:

```sh
cd /my/project/path
```

And run the command to initialize the new config:

```sh
conhos init
```

The program will ask you clarifying questions, allowing which it will be able to create a configuration file for you **conhos.yml**

To speed up the initialization process and create the base **conhos.yml** file, run the **init** command with the **-y** flag:

```sh
# Optional
conhos init -y
```

> More information about the configuration file can be found in [Configuration File](./ConfigFile.md#example_configuration_file)

## Launching a project in the cloud [![anchor](https://conhos.ru/images/icons/link.svg)](#deploy)

After the configuration file is configured, you can upload the project files to the cloud and launch all the necessary services.
To do this, run the command:

```sh
conhos deploy
```

---

<div style="display: flex; justify-content: center; margin-top: 2rem;">
  <a href="/dashboard"><button class="button-global">Start using</button></a>
</div>
