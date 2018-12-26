import React from "react";
import { PendingOverlay } from "../../components/CommonElement";
import TermAndServices from "../../containers/CommonElements/TermAndServices";

const PostTransferBtn = (props) => {

  return (
    <div className="exchange-button">
      <div>
        {props.isHaveAccount && !props.isChangingWallet &&
        <div>
          <a className={props.activeButtonClass + " exchange-button__button"} onClick={props.submit} data-open="passphrase-modal">
            <i className="k k-exchange k-3x cur-pointer"></i>
            {props.translate("transaction.transfer") || "Transfer"}
          </a>
          <TermAndServices tradeType="transfer"/>
        </div>
        }
      </div>

      {props.modalPassphrase}
      
      {props.isProcess && (
        <props.walletInstance.components.ProcessTransfer endProcess={props.endProcess} 
        formParams= {props.formParams} 
        runAfterBroadcastTx={props.runAfterBroadcastTx}
        doTxFail={props.doTxFail}/>
      )}

      <PendingOverlay isEnable={props.isConfirming} />
    </div>
  )
}

export default PostTransferBtn
