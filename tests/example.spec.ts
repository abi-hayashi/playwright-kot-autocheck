import { test, expect } from "@playwright/test";

test("KOT打刻エラー確認", async ({ page }) => {
  // KOTの初回表示ガイドが表示されないようにする
  await page.context().addInitScript(() => {
    // @ts-ignore
    window.localStorage.setItem("intro", "checked");
  });

  // KOT勤怠管理のログイン画面表示
  await page.goto("https://s2.ta.kingoftime.jp/admin");

  // HTMLタイトルの確認
  await expect(page).toHaveTitle(/KING OF TIME/);

  // ログインID入力
  const loginId = await page.$("input#login_id");
  expect(loginId).not.toBeNull();
  loginId?.fill(process.env.KOT_LOGIN_ID as string);

  // パスワード入力
  const loginPassword = await page.$("input#login_password");
  expect(loginPassword).not.toBeNull();
  loginPassword?.fill(process.env.KOT_LOGIN_PASSWORD as string);

  // ログインボタンクリック
  const loginButton = await page.$("input#login_button");
  expect(loginButton).not.toBeNull();
  await loginButton?.click();

  await page.waitForLoadState("domcontentloaded");

  // 勤怠管理ボタンの出現を待つ
  await page.waitForSelector("button#button_50");

  // 勤怠管理ボタンをクリックすると表示されるconfirmダイアログを通過する
  page.on("dialog", (dialog) => dialog.accept());

  // 勤怠管理ボタンクリック
  const kintaiKanriBtn = await page.$("button#button_50");
  expect(kintaiKanriBtn).not.toBeNull();
  await kintaiKanriBtn?.click();
  await page.waitForLoadState("domcontentloaded");

  // 左上の「対応が必要な処理」の出現を待機
  await page.waitForSelector("h3.htTopTitle");

  const errorKinmu = await page.$("li#in_complete_working > a");
  if (!errorKinmu || (await errorKinmu?.isVisible()) === false) {
    console.log("打刻エラーはありません");
    return;
  }

  // 打刻エラー勤務のリンクをクリック
  await errorKinmu?.click();
  await page.waitForLoadState("domcontentloaded");

  // 右上の表示ボタンの出現を待機
  await page.waitForSelector("input#display_button");

  const dispBtn = await page.$("input#display_button");
  await dispBtn?.click();
  await page.waitForLoadState("domcontentloaded");

  // 打刻エラーの一覧の枠のdivが表示されるまで待機
  await page.waitForSelector("div.htBlock-adjastableTableF_inner");

  const trList = await page.$$(
    "div.htBlock-adjastableTableF_inner > table > tbody > tr"
  );

  for (const tr of trList) {
    const tdList = await tr.$$("td");

    const name = (await tdList[2].textContent()) as string;
    const dt = (await tdList[6].textContent()) as string;
    const errorReason = (await tdList[9].textContent()) as string;

    // 申請有無判定
    const shinseiIcon = await tdList[9].$("span.specific-requested");
    if (shinseiIcon) {
      // 申請済みの場合はスキップ
      continue;
    }

    const lineArr: string[] = [name.trim(), dt.trim(), errorReason.trim()];
    console.log(lineArr.join(" "));
  }
});

