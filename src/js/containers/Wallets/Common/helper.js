import * as converter from "../../../utils/converter"
import { store } from "../../../store"

// async function fetchGasSnapshot(){
//     var state = store.getState()
//     var transfer = state.transfer
//     var tokens = state.tokens.tokens
  
//     var decimals = 18
//     var tokenSymbol = transfer.tokenSymbol
//     if (tokens[tokenSymbol]) {
//       decimals = tokens[tokenSymbol].decimals
//     }
  
//     var account = state.account.account
//     var fromAddr = account.address
  
  
  
//     var gasRequest = yield call(common.handleRequest, calculateGasUse, fromAddr, tokenSymbol, transfer.token, decimals, transfer.amount)
//     if (gasRequest.status === "success"){
//       const gas = gasRequest.data
//       yield put(actions.setGasUsedSnapshot(gas))
//     }
//     if ((gasRequest.status === "timeout") || (gasRequest.status === "fail")){
//       // var state = store.getState()
//       // var transfer = state.transfer
//       var gasLimit = yield call(getMaxGasTransfer)
//       yield put(actions.setGasUsedSnapshot(gasLimit))
//     }
  
//     //yield call(calculateGasUse, fromAddr, tokenSymbol, transfer.token, decimal, transfer.amount)
//     yield put(actions.fetchSnapshotGasSuccess())
//   }

function getMaxGasTransfer(){
    var state = store.getState()
    const transfer = state.transfer
    if (transfer.tokenSymbol !== 'DGX') {
      return transfer.gas_limit
    }else{
      return 250000
    }
  }

export  async function calculateGasUseTransfer(ethereum, fromAddr, destAddress,tokenSymbol, tokenAddr, tokenDecimal, sourceAmount){
    // var state = store.getState()
    // var ethereum = state.connection.ethereum
    // var transfer = state.transfer
    const amount = converter.stringToHex(sourceAmount, tokenDecimal)
    var gasLimit = getMaxGasTransfer()
    // var gas = 0
    var internalAdrr = "0x3cf628d49ae46b49b210f0521fbd9f82b461a9e1"
    var txObj
    if (tokenSymbol === 'ETH'){
      var destAddr = destAddress !== "" ? destAddress : internalAdrr
      txObj = {
        from : fromAddr,
        value: amount,
        to:destAddr
      }
      try{
        gas = await ethereum.call("estimateGas", txObj)
        if(gas > 21000){
          gas = Math.round(gas * 120 / 100)
        }
        return gas
      //  yield put(actions.setGasUsed(gas))
      }catch(e){
        console.log(e.message)
        return gasLimit
        //yield put(actions.setGasUsed(gasLimit))
      }
    }else{
      try{
        var destAddr = transfer.destAddress !== "" ? transfer.destAddress : internalAdrr
        var data = await ethereum.call("sendTokenData", tokenAddr, amount, destAddr)
        txObj = {
          from : fromAddr,
          value:"0",
          to:tokenAddr,
          data: data
        }
        gas = await ethereum.call("estimateGas", txObj)
        gas = Math.round(gas * 120 / 100)
        return gas
        //return gas
      //  yield put(actions.setGasUsed(gas))
      }catch(e){
        console.log(e.message)
        return gasLimit
        //return gasLimit
        //yield put(actions.setGasUsed(gasLimit))
      }
    }
}