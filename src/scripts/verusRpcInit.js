// scripts/verusRpcInit.js

import { VerusdRpcInterface } from 'verusd-rpc-ts-client';
    

const verusdClient = new VerusdRpcInterface("VRSCTEST","https://api.verustest.net");


export async function listCurrencies() {
  try {
      console.log("listCurrencies")
      const res = await verusdClient.listCurrencies();
      console.log(res.result)
      return res.result
  } catch (error){
      console.log("listCurrencies error")
  }
}

export async function sendCrossChain({ fromChain, toChain, amount, toAddress }) {
  try {
    const result = await verusdClient.sendRawTransaction({
      fromChain,
      toChain,
      amount,
      toAddress,
    });
    return result;
  } catch (error) {
    console.error("Transaction error:", error);
  }
}