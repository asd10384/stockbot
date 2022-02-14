# 설정

## 타입 스크립트 npm 기본 설치
  * npm install -g ts-node
  * npm i --save-dev --force typescript ts-node ts-node-dev

  * npm i --save-dev --force ts-cleaner nodemon @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise

## package.json 모듈 업데이트
  * npm i -g npm-check-updates

  * ncu -u
  * npm install --force

## @discordjs/voice 와 함께 설치해야하는 모듈
  * npm i @discordjs/voice --save --force
  * npm i sodium --ignore-scripts --save --force
  * npm i prism-media --save --force
  * npm i @discordjs/opus --save --force
  * npm i opusscript --save --force
  * npm i libsodium-wrappers --save --force
  * npm i tweetnacl --save --force


## 한번에 설치

### 기본
```
npm install -g ts-node && npm i -g npm-check-updates && npm i sodium --ignore-scripts --save --force && npm i --save-dev --force typescript ts-node ts-node-dev && npm i --save-dev --force ts-cleaner nodemon @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise && npm i --force discord.js fs dotenv mongoose path && ncu -u && npm install --force
```

### @discordjs/voice 필요할때
```
npm install -g ts-node && npm i -g npm-check-updates && npm i sodium --ignore-scripts --save --force && npm i --save-dev --force typescript ts-node ts-node-dev && npm i --save-dev --force ts-cleaner nodemon @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise && npm i @discordjs/voice --save --force && npm i prism-media --save --force && npm i @discordjs/opus --save --force && npm i opusscript --save --force && npm i libsodium-wrappers --save --force && npm i tweetnacl --save --force && npm i --force discord.js fs dotenv mongoose path && npm i --force ffmpeg && npm i --force ffmpeg-static && ncu -u && npm install --force
```