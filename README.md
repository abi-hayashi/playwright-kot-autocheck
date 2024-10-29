# playwright-kot-autocheck

KING OF TIME の打刻エラーチェックを自動化します

### 事前準備

Node.js 20 LTS を事前インストールしておいてください

### インストール

```shell
cd playwright-kot-autocheck
npm install
```

### KOT ログイン情報の設定

.env ファイルに記載されたログイン ID, パスワードを編集して正しい値を設定してください

以下を編集

```
KOT_LOGIN_ID=dcieit3XXXXX
KOT_LOGIN_PASSWORD="your_password"
```

### 実行

```shell
npx playwright test
```
