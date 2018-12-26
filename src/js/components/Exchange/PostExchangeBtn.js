import React from "react";
import { PendingOverlay } from "../../components/CommonElement";
import TermAndServices from "../../containers/CommonElements/TermAndServices";

const PostExchangeBtn = (props) => {
  return (
    <div className="exchange-button">
      <div>
        {props.isHaveAccount && !props.isChangingWallet &&
          <div>
            <a className={props.activeButtonClass + " exchange-button__button"} onClick={props.submit} data-open="passphrase-modal">
              <i className="k k-exchange k-3x cur-pointer"></i>
              {props.translate("transaction.swap") || "Swap"}
            </a>
            <TermAndServices tradeType="swap"/>
          </div>
        }
      </div>

      {props.modalExchange}

      {props.isProcess && (
        <props.walletInstance.components.ProcessExchange endProcess={props.endProcess} 
        formParams= {props.formParams} 
        runAfterBroadcastTx={props.runAfterBroadcastTx}
        doTxFail={props.doTxFail}/>
      )}

      <PendingOverlay isEnable={props.isConfirming || props.isApproving}/>
    </div>
  )
}

export default PostExchangeBtn
