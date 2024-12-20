import { expect } from "@playwright/test";

// TODO: エラー投げたり空の配列returnするところを修正
export async function checkKot({ page }){
    /*
        KOTの未申請の打刻エラーを確認し、文字列のリストを返します
        打刻エラーが存在する場合：
            [氏名, 日付, エラー理由]
        打刻エラーが存在しない場合：
            空のリスト
    */
    try{
        // KOTの初回表示ガイドが表示されないようにする
        console.log('==== checkKot Start ====');
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
        console.log('==== ログイン完了 ====')
        
        // 勤怠管理ボタンの出現を待つ
        await page.waitForSelector("button#button_50");
        
        // 勤怠管理ボタンをクリックすると表示されるconfirmダイアログを通過する
        page.on("dialog", (dialog) => dialog.accept());
        
        // 勤怠管理ボタンクリック
        const kintaiKanriBtn = await page.$("button#button_50");
        expect(kintaiKanriBtn).not.toBeNull();
        await kintaiKanriBtn?.click();
        await page.waitForLoadState("domcontentloaded");
        console.log('==== 勤怠管理画面遷移完了 ====')
        
        // 左上の「対応が必要な処理」の出現を待機
        await page.waitForSelector("h3.htTopTitle");
        
        const errorKinmu = await page.$("li#in_complete_working > a");
        // await errorKinmu?.isVisible(); を使用すると
        // errorKinmuがNullの場合undefinedが返り打刻エラー勤務画面遷移完了してから
        // 再評価されて"打刻エラーはありません"となり処理が中断されてしまうことがある
        let errorKinmuVisible = false;
        if(errorKinmu){
            errorKinmuVisible = await errorKinmu.isVisible();
            if (!errorKinmuVisible) {
            console.log("打刻エラーはありません");
            return [];
            }
        }else{
            console.log("打刻エラーはありません");
            return [];
        }
        
        // 打刻エラー勤務のリンクをクリック
        await errorKinmu?.click();
        await page.waitForLoadState("domcontentloaded");
        console.log('==== 打刻エラー勤務画面遷移完了 ====')
        
        // 右上の表示ボタンの出現を待機
        await page.waitForSelector("input#display_button");
        
        const dispBtn = await page.$("input#display_button");
        await dispBtn?.click();
        await page.waitForLoadState("domcontentloaded");
        
        // 打刻エラーの一覧の枠のdivが表示されるまで待機
        const errorKinmuDiv = await page.$("div.htBlock-adjastableTableF_inner")
        // 月初など打刻エラーが存在しない場合はdivが表示されないことがある
        if(!errorKinmuDiv){
            console.log("打刻エラーはありません");
            return [];
        }
        
        const trList = await page.$$(
            "div.htBlock-adjastableTableF_inner > table > tbody > tr"
        );

        let errorList: string[][] = [];
        let lineArr: string[] = [];
        for (const tr of trList) {
            const tdList = await tr.$$("td");
        
            const name = (await tdList[2].textContent()) as string;
            const dt = (await tdList[6].textContent()) as string;
            const errorReason = (await tdList[9].textContent()) as string;
        
            // 申請有無判定
            const shinseiIcon = await tdList[9].$("span.specific-requested");
            if (shinseiIcon) {
                // 申請済みの場合はスキップ
                console.log('==== 申請済みのためスキップ ====');
                continue;
            }
        
            lineArr = [name.trim(), dt.trim(), errorReason.trim()];
            console.log(lineArr.join(" "));
            errorList.push(lineArr)
        }

        // 打刻なし/スケジュールありのaタグを取得
        const noStampingATag = await page.$(
            "div.htBlock-tab li:nth-child(2) a"
        );
        await noStampingATag.click();

        console.log('==== 打刻なし/スケジュールあり画面遷移完了 ====')
        // 打刻なし/スケジュールありの一覧の枠のdivが表示されるまで待機
        const noStampingDiv = await page.$("div.htBlock-adjastableTableF_inner")
        // 月初など打刻エラーが存在しない場合はdivが表示されないことがある
        if(!noStampingDiv){
            console.log("打刻エラーはありません");
            return [];
        }

        let noStampingTrList = await page.$$(
            "div.htBlock-adjastableTableF_inner > table > tbody > tr"
        );
        let passEmployeeIds: string[] = [];
        if(process.env.KOT_PASS_EMPLOYEE_IDS !== undefined){
            passEmployeeIds = process.env.KOT_PASS_EMPLOYEE_IDS.split(',');
        }
        console.log(passEmployeeIds);
        // ほんとはnoStampingTrListでfor文を回したいが、
        // for文内で画面遷移する関係でcontextでエラーとなってしまう
        for (let i = 0; i < noStampingTrList.length; i++) {
            const tr = noStampingTrList[i];
            const tdList = await tr.$$("td");
        
            const name = (await tdList[2].textContent()) as string;
            const timeCardButton = await tdList[3].$(
                "form > p > button.htBlock-buttonTimecard.htBlock-buttonTimecard_fill"
            );
            const noStampingDt = (await tdList[6].textContent()) as string;

            if(passEmployeeIds.includes(name.trim().substring(0,5))){
                console.log(`==== ${name.trim()} ${noStampingDt.trim()} 休職中の社員のためスキップ ====`);
                continue;
            }

            // 各個人のタイムカードをクリック
            await timeCardButton?.click();

            // ナビゲーションが完了するまで待機
            // await page.waitForNavigation();

            const timeCardTrList = await page.$$(
                "div.htBlock-adjastableTableF_inner > table > tbody > tr"
            );

            for(const timeCardTr of timeCardTrList){
                const timeCardTdList = await timeCardTr.$$("td");
                const dt = (await timeCardTdList[1].textContent()) as string;
                if(compareDates(noStampingDt,dt)){
                    const scheduleShinseiIcon = await timeCardTdList[4].$("span.specific-requested");
                    const shukkinShinseiIcon = await timeCardTdList[6].$("span.specific-requested");
                    const taikinShinseiIcon = await timeCardTdList[7].$("span.specific-requested");
                    if(scheduleShinseiIcon || shukkinShinseiIcon || taikinShinseiIcon){
                        console.log('==== 申請済みのためスキップ ====');
                        continue;
                    }
                    lineArr = [name.trim(), noStampingDt.trim(), "打刻データがありません。".trim()];
                    console.log(lineArr.join(" "));
                    errorList.push(lineArr)
                    break;
                }else{
                    // console.log('==== タイムカード 日付が一致しません ====');
                    continue;
                }
            }
            await page.goBack();
            // 画面Aに戻ってきた後に noStampingTrList を再取得
            noStampingTrList = await page.$$(
                "div.htBlock-adjastableTableF_inner > table > tbody > tr"
            );
        }
        return errorList;
    }catch(error){
        console.error('checkKot Error:',error);
    }finally{
        console.log('==== checkKot End ====');
    }
}

function compareDates(date1: string, date2: string): boolean {
    // yyyy-mm-dd 形式の日付から mm と dd を抽出
    const [year, month1, day1] = date1.split('-');

    // mm/dd（曜日） 形式の日付から mm と dd を抽出
    const [month2, day2] = date2.trim().split('/');

    // mm と dd を比較
    return month1 === month2 && day1 === day2.substring(0, 2);
}
