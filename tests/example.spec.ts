import { test } from "@playwright/test";
import { checkKot } from "./checkKot";
import { postSlack } from "./postSlack";

test("KOT打刻エラー確認とslack送信", async ({ page }) => {
  /*
    想定されるテストケース
      1. そもそも打刻エラー一覧のdivが存在しない打刻エラーなし
        月初など
      2. 打刻エラー一覧が存在し、全て申請済みのため打刻エラーなし
      3. 打刻エラーあり
      4. その他エラーケース
  */
  try{

    console.log('==== test Start ====');
    const errorList = await checkKot({ page });
    if(errorList){
      await postSlack(errorList);
    }else{
      throw new Error("checkKot errorList is undefined")
    }

  }catch(error){
    console.error('test Error:',error);
  }finally{
    console.log('==== test End ====');
  }
});

