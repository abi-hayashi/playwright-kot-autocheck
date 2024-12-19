# playwright-kot-autocheck

KING OF TIME の打刻エラーチェックを自動化します

### 事前準備

Node.js 20 LTS を事前インストールしておいてください

### インストール

```shell
cd playwright-kot-autocheck
npm install
npx playwright install
```

### KOT ログイン情報の設定

.env ファイルに記載されたログイン ID, パスワードを編集して正しい値を設定してください

以下を編集

```
KOT_LOGIN_ID=dcieit3XXXXX
KOT_LOGIN_PASSWORD="your_password"
```

### ローカルでのテスト実行

```shell
npx playwright test
```

### AWS Lambdaへの移行

ランタイムは Node.js 20.x じゃないとエラる

設定にて下記を更新
* タイムアウト: 2mほど
* メモリサイズ: 512MB

下記レイヤーを設定
* ~~arn:aws:lambda:ap-northeast-1:409979564664:layer:slack-web-api:1~~
  * slack web api用
  * →lambda/layerフォルダのlambda-layer-playwright.zipを用いてレイヤーを自作する
* arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:49
  * 下記サイトから拝借、playwright chromium用
    * https://github.com/shelfio/chrome-aws-lambda-layer
~~* arn:aws:lambda:ap-northeast-1:409979564664:layer:playwright-layer:1~~
  * その他ライブラリ用
  * →lambda/layerフォルダのlambda-layer-slack.zipを用いてレイヤーを自作する

環境変数を設定

`lambda`配下の下記ファイルを関数に配置
  * checkKot.mjs
  * index.mjs
  * postSlack.mjs
