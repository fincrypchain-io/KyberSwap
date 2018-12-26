import React from "react"
import { gweiToEth, stringToBigNumber, calculateGasFee, roundingNumber } from "../../../../utils/converter";
import { FeeDetail, Modal } from "../../../../components/CommonElement";
import { connect } from "react-redux"

import { prePareBroadcast } from "../../../../actions/transferActions"

import { getTranslate } from 'react-localize-redux';
import * as analytics from "../../../../utils/analytics"
import * as web3 from "../utils/web3"
import * as data from "../../Common/data"
import * as helper from "../../Common/helper"

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
        translate: getTranslate(store.locale),

        formParams: { ...props.formParams },
        endProcess: props.endProcess,
        runAfterBroadcastTx: props.runAfterBroadcastTx,
        doTxFail: props.doTxFail
    };

})

export default class ProcessTransfer extends React.Component {

    constructor() {
        super()
        this.state = {
            isOpen: true,
            passwordError: "",
            isSendTx: false,
            isFetchingGas: false,
            gas: 0,
            gasPrice: 0
        }
    }

    componentDidMount = () => {
        this.setState({
            gas: this.props.form.gas,
            gasPrice: this.props.formParams.gasPrice
        })
        this.initModa()
    }


    closeModal = () => {
        this.setState({
            isOpen: false
        })
        this.props.endProcess()
    }

    submit = (e) => {

    }

    async initModa() {
        this.setState({
            isFetchingGas: true
        })
        var ethereum = this.props.ethereum
        var fromAddr = this.props.account.address
        var destAddress = this.props.transfer.destAddress
        var tokenSymbol = this.props.transfer.tokenSymbol
        var tokenAddr = this.props.transfer.tokenAddr
        var tokenDecimal = this.props.form.decimals
        var sourceAmount = this.props.transfer.amount

        var gas = await helper.calculateGasUseTransfer(ethereum, fromAddr, destAddress, tokenSymbol, tokenAddr, tokenDecimal, sourceAmount)
        this.setState({
            gas: gas,
            isFetchingGas: false
        })

    }

    async processTx(password) {
        var web3Instance
        try {
            var password = document.getElementById('passphrase').value
            web3Instance = web3.setProvider(this.props.account.keystring, password)
        } catch (e) {
            console.log(e)
            this.setState({
                passwordError: this.props.translate("error.passphrase_error") || "Key derivation failed"
            })
            return
        }
        this.setState({ isSendTx: true })
        var txObject = {}

        try {
            const params = this.props.formParams
            var account = this.props.account
            var ethereum = this.props.ethereum
            console.log(params)
            txObject = await data.sendFromAccount(ethereum, account.address,
                params.token, params.amount,
                params.destAddress, params.nonce, this.state.gas,
                this.state.gasPrice)
        } catch (e) {
            console.log(e)
            this.setState({
                passwordError: e
            })
        }
        this.props.dispatch(prePareBroadcast())
        web3Instance.eth.sendTransaction(txObject, (err, txHash) => {
            if (err) {
                console.log(err)
                this.props.doTxFail(err)
            } else {
                console.log(txHash)
                this.closeModal()
                this.props.runAfterBroadcastTx(txHash)
            }
        })
    }



    toggleShowPw = () => {
        let input = document.getElementById('passphrase')
        if (input.classList.contains('security')) {
            input.classList.remove('security')
            input.parentElement.classList.add('unlock')
            analytics.trackClickShowPassword("show")
        } else if (input.type == 'text') {
            input.classList.add('security')
            input.parentElement.classList.remove('unlock')
            analytics.trackClickShowPassword("hide")
        }
    }
    contentConfirm = () => {
        var gasPrice = stringToBigNumber(gweiToEth(this.props.form.snapshot.gasPrice))
        var totalGas = +calculateGasFee(this.state.gasPrice, this.state.gas)
        var form = this.props.form;
        var amount = form.amount.toString();
        var destAddress = form.destAddress;
        var tokenSymbol = form.tokenSymbol;
        return (
            <div >
                <a className="x" onClick={this.closeModal}>&times;</a>
                <div className="content with-overlap">
                    <div className="row">
                        <div>
                            <div>
                                <div>
                                    <div className="recap-sum-up">
                                        {this.props.translate("transaction.about_to_transfer") || "You are about to transfer"}
                                    </div>
                                    <div className="recap-transfer">
                                        <div>
                                            <strong>
                                                {amount.slice(0, 7)}{amount.length > 7 ? '...' : ''} {tokenSymbol}
                                            </strong>
                                        </div>
                                        <div>{this.props.translate("transaction.to") || "to"}</div>
                                        <div>
                                            <strong>
                                                {destAddress.slice(0, 7)}...{destAddress.slice(-5)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <FeeDetail
                                    translate={this.props.translate}
                                    gasPrice={this.props.form.gasPrice}
                                    gas={this.props.form.gas}
                                    isFetchingGas={this.state.isFetchingGas}
                                    totalGas={totalGas}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overlap">
                    <div className={!!this.state.passwordError ? "error password-input" : "password-input"}>
                        {/* <div class="type-password">{props.translate("transaction.type_pass_before_progress") || "Type a password before progressing"}</div> */}
                        <div class="type-password">{this.props.translate("transaction.type_pass_to_sign") || "Enter your password/passphrase to sign and broadcast"}</div>
                        <div className="input-reveal">
                            <input className="text-center security" id="passphrase" type="text"
                                autoComplete="off" spellCheck="false"
                                onFocus={(e) => { analytics.trackClickInputPasswordWithJSON() }}
                                autoFocus onKeyPress={(e) => this.submit(e)} />
                            <a className="toggle" onClick={() => this.toggleShowPw()}></a>
                            <a className="tootip"></a>
                        </div>
                        <div className="input-confirm grid-x">
                            <a className={"button process-submit cancel-process"} onClick={(e) => this.closeModal()}>Cancel</a>
                            <a className={"button process-submit " + (this.props.form.isConfirming || this.props.form.isFetchingGas || this.props.form.isFetchingRate ? "waiting" : "next")}
                                onClick={(e) => this.processTx(e)}>
                                {this.props.translate("modal.confirm").toLocaleUpperCase() || "Confirm".toLocaleUpperCase()}</a>
                        </div>
                        {!!this.state.passwordError &&
                            <span className="error-text">{this.state.passwordError}</span>
                        }
                    </div>

                </div>
            </div>
        )
    }

    render() {

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

