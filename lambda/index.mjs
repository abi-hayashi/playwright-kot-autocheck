import { checkKot } from "./checkKot.mjs";
import { postSlack } from "./postSlack.mjs";

export const handler = async () => {
    try{

        console.log('==== test Start ====');
        const errorList = await checkKot();
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
};
