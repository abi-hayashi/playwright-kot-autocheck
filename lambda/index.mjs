import { checkKot } from "./checkKot.mjs";
import { postSlack } from "./postSlack.mjs";

export const handler = async () => {
    try{

        console.log('==== test Start ====');
        let errorList = []
        const loginIds = process.env.KOT_LOGIN_ID.split(',');
        const loginPasswords = process.env.KOT_LOGIN_PASSWORD.split(',');
        for (let i = 0; i < loginIds.length; i += 1) {
          const result = await checkKot(loginIds[i],loginPasswords[i]);
          if(result){
            errorList = errorList.concat(result);
          }else{
            throw new Error("checkKot result is undefined")
          }
        }
        await postSlack(errorList);
    
      }catch(error){
        console.error('test Error:',error);
      }finally{
        console.log('==== test End ====');
      }
};
