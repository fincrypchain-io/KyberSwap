import React from "react"
import { gweiToEth, stringToBigNumber, calculateGasFee, roundingNumber } from "../../../../utils/converter";
import { FeeDetail } from "../../../CommonElement";
import { connect } from "react-redux"

@connect((store, props) => {
    const tokens = store.tokens.tokens
    const tokenSymbol = store.transfer.tokenSymbol
    var balance = 0
    var decimals = 18
    var tokenName = "kyber"
    if (tokens[tokenSymbol]) {
      balance = tokens[tokenSymbol].balance
      decimals = tokens[tokenSymbol].decimals
      tokenName = tokens[tokenSymbol].name
    }
    return {
        account: store.account.account,
        transfer: store.transfer,
        tokens: store.tokens,
        form: { ...store.transfer, balance, decimals, tokenName },
        ethereum: store.connection.ethereum,
        keyService: props.keyService,
        translate: getTranslate(store.locale)
    };
  
  })

class ProcessTransfer extends React.Component {

    constructor() {
        super()
        this.state = {
            isOpen: false
        }
    }

    startProcess = () =>{
        this.setState({
            isOpen: true
        })
        //process fetching gas
        
    }

    closeModal = () => {
        this.setState({
            isOpen: false
        })
    }


    contentConfirm = () => {
        <div>
            <a className="x" onClick={(e) => this.props.onCancel(e)}>&times;</a>
            <div className="content with-overlap">
                <div className="row">
                    <div>
                        <div>
                            <div className="title">{this.props.title}</div>
                            {this.props.recap}
                            <FeeDetail
                                translate={this.props.translate}
                                gasPrice={this.props.gasPrice}
                                gas={this.props.gas}
                                isFetchingGas={this.props.isFetchingGas}
                                totalGas={totalGas}
                            />
                        </div>
                        {this.errorHtml()}
                    </div>
                </div>
            </div>
            <div className="overlap">
                <div className="input-confirm grid-x">
                    <a className={"button process-submit cancel-process"} onClick={(e) => this.props.onCancel(e)}>Cancel</a>
                    <a className={"button process-submit " + (this.props.isConfirming || this.props.isFetchingGas || this.props.isFetchingRate ? "waiting" : "next")} onClick={(e) => this.props.onExchange(e)}>{this.props.translate("modal.confirm").toLocaleUpperCase() || "Confirm".toLocaleUpperCase()}</a>
                </div>
            </div>
        </div>
    }

    render() {
        var gasPrice = stringToBigNumber(gweiToEth(this.props.form.snapshot.gasPrice))
        var totalGas = +calculateGasFee(this.props.form.snapshot.gasPrice, this.props.form.snapshot.gas)
        return (
            <Modal
                className={{
                    base: 'reveal medium confirm-modal',
                    afterOpen: 'reveal medium confirm-modal'
                }}
                isOpen={this.state.isOpen}
                onRequestClose={this.closeModal}
                contentLabel="confirm modal"
                content={this.contentConfirm()}
                size="medium"
            />

        )
    }
}

export default ConfirmTransferModal
