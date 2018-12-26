import React from "react"
import { gweiToEth, stringToBigNumber, calculateGasFee, roundingNumber } from "../../../../utils/converter";
import { FeeDetail, Modal } from "../../../../components/CommonElement";
import { connect } from "react-redux"


import * as converters from "../../../../utils/converter"

import { prePareBroadcast } from "../../../../actions/transferActions"

import { getTranslate } from 'react-localize-redux';
import * as analytics from "../../../../utils/analytics"
import * as web3 from "../utils/web3"
import * as data from "../../Common/data"
import * as helper from "../../Common/helper"

@connect((store, props) => {
    var sourceTokenSymbol = store.exchange.sourceTokenSymbol
    var tokens = store.tokens.tokens
    var sourceBalance = 0
    var sourceDecimal = 18
    var sourceName = "Ether"
    var sourceIcon = "eth.svg"

    var rateSourceToEth = 0
    if (tokens[sourceTokenSymbol]) {
        sourceBalance = tokens[sourceTokenSymbol].balance
        sourceDecimal = tokens[sourceTokenSymbol].decimals
        sourceName = tokens[sourceTokenSymbol].name
        sourceIcon = sourceTokenSymbol + '.svg';
        rateSourceToEth = tokens[sourceTokenSymbol].rate
    }

    var destTokenSymbol = store.exchange.destTokenSymbol
    var destBalance = 0
    var destDecimal = 18
    var destName = "Kybernetwork"
    var destIcon = "knc.svg"
    if (tokens[destTokenSymbol]) {
        destBalance = tokens[destTokenSymbol].balance
        destDecimal = tokens[destTokenSymbol].decimals
        destName = tokens[destTokenSymbol].name
        destIcon = destTokenSymbol + '.svg';
    }

    return {
        form: {
            ...store.exchange, sourceBalance, sourceDecimal, destBalance, destDecimal,
            sourceName, destName, sourceIcon, destIcon, rateSourceToEth
        },
        snapshot: store.exchange.snapshot,
        account: store.account.account,
        ethereum: store.connection.ethereum,
        tokens: store.tokens,
        keyService: props.keyService,
        translate: getTranslate(store.locale),

        formParams: { ...props.formParams },
        endProcess: props.endProcess,
        runAfterBroadcastTx: props.runAfterBroadcastTx,
        doTxFail: props.doTxFail
    };

})

export default class ProcessExchange extends React.Component {

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
        // var ethereum = this.props.ethereum
        // var fromAddr = this.props.account.address
        // var destAddress = this.props.transfer.destAddress
        // var tokenSymbol = this.props.transfer.tokenSymbol
        // var tokenAddr = this.props.transfer.tokenAddr
        // var tokenDecimal = this.props.form.decimals
        // var sourceAmount = this.props.transfer.amount

        // var gas = await helper.calculateGasUseExchange(ethereum, fromAddr, destAddress, tokenSymbol, tokenAddr, tokenDecimal, sourceAmount)
        // this.setState({
        //     gas: gas,
        //     isFetchingGas: false
        // })

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
        
        var account = this.props.account.address
        var ethereum = this.props.ethereum
        var sourceToken = this.props.form.sourceToken
        var destToken = this.props.form.destToken
        var destAddress = this.props.account.address
        var maxDestAmount = this.props.formParams.maxDestAmount
        var minConversionRate = this.props.formParams.minConversionRate
        var throwOnFailure = this.props.formParams.blockNo
        var nonce = this.props.formParams.nonce
        var gas = this.state.gas
        var gasPrice = this.state.gasPrice
        if (this.props.form.sourceTokenSymbol === "ETH"){
            txObject = await data.etherToOthersFromAccount(ethereum, account, sourceToken, sourceAmount,
                destAddress, maxDestAmount, minConversionRate,
                throwOnFailure, nonce, gas, gasPrice)
        }else{

            // txObject = await data.etherToOthersFromAccount(ethereum, account, sourceToken, sourceAmount, destToken,
            //     destAddress, maxDestAmount, minConversionRate,
            //     throwOnFailure, nonce, gas, gasPrice)
            
            //check approve
            var remainStr =  await ethereum.call("getAllowanceAtLatestBlock", sourceToken, address)
            var remain = converter.hexToBigNumber(remainStr)
            var sourceAmountBig = converter.hexToBigNumber(sourceAmount)
            if (!remain.isGreaterThanOrEqualTo(sourceAmountBig) && !isApproveTxPending()) {
                
            }
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
    createRecap = () => {
        //if (!this.props.snapshot || !Object.keys(this.props.snapshot).length) return

        var sourceAmount = this.props.form.snapshot.sourceAmount.toString();
        var destAmount = this.props.form.snapshot.destAmount.toString()
        var sourceTokenSymbol = this.props.form.snapshot.sourceTokenSymbol
        var destTokenSymbol = this.props.form.snapshot.destTokenSymbol
        var sourceIcon = this.props.form.sourceIcon
        var destIcon = this.props.form.destIcon

        var minRate = this.props.form.snapshot.minConversionRate
        var offeredRate = this.props.form.snapshot.offeredRate
        if (converters.compareRate(minRate, offeredRate) === 1) {
            return (
                <div className="confirm-exchange-modal">
                    <div className="modal-title message">
                        <div>{this.props.translate("transaction.your_wallet") || "Your Wallet"}</div>
                        <div>{this.props.account.address}</div>
                    </div>
                    <div className="amount">
                        <div className="amount-item amount-left">
                            <div className="d-flex">
                                <div className="item-icon">
                                    <img src={getAssetUrl(`tokens/${sourceIcon}`)} />
                                </div>
                                <div className="cell medium-9 small-12">
                                    <div className="amount-detail">
                                        <span>
                                            {sourceAmount.slice(0, 7)}{sourceAmount.length > 7 ? '...' : ''}
                                        </span>
                                        <span>
                                            {sourceTokenSymbol}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space"><img src={require("../../../../../assets/img/exchange/arrow-right-orange.svg")} /></div>
                        <div className="amount-item amount-right">
                            {this.props.form.snapshot.isFetchingRate ?
                                <img src={require('../../../../../assets/img/waiting-white.svg')} />
                                :
                                <div className="d-flex">
                                    <div className="item-icon">
                                        <img src={getAssetUrl(`tokens/${destIcon}`)} />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    {!this.state.isFetchingRate &&
                        <div className="description error">
                            <span className="error-text">
                                {this.props.translate("error.min_rate_greater_expected_rate") || "Your configured minimal exchange rate is higher than what is recommended by KyberNetwork. Your exchange has high chance to fail"}
                            </span>
                        </div>
                    }
                </div>
            )
        } else {
            var slippagePercent = converters.calculatePercentRate(minRate, offeredRate)
            return (
                <div className="confirm-exchange-modal">
                    <div className="title-description">
                        {/* {this.props.translate("transaction.about_to_swap") || "You are about to swap"} */}
                        <div>{this.props.translate("transaction.your_wallet") || "Your Wallet"}</div>
                        <div>{this.props.account.address}</div>
                    </div>
                    <div className="amount">
                        <div className="amount-item amount-left">
                            <div className={"rc-label"}>From</div>
                            <div className={"rc-info"}>{sourceAmount} {sourceTokenSymbol}</div>
                        </div>
                        <div className="space"><img src={require("../../../../../assets/img/exchange/arrow-right-orange.svg")} /></div>
                        <div className="amount-item amount-right">
                            <div>
                                <div className={"rc-label"}>To</div>
                                <div className={"rc-info"}>
                                    {this.state.isFetchingGas ? <img src={require('../../../../..//assets/img/waiting-white.svg')} /> : destAmount} {destTokenSymbol}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

    }

    contentConfirm = () => {
        var gasPrice = stringToBigNumber(gweiToEth(this.state.gasPrice))
        var totalGas = +calculateGasFee(this.state.gasPrice, this.state.gas)
        return (
            <div >
                <a className="x" onClick={this.closeModal}>&times;</a>
                <div className="content with-overlap">
                    <div className="title">{this.props.translate('modal.confirm_swap') || "Confirm Swap"}</div>
                    <div className="row">
                        <div>
                            <div>
                                {this.createRecap()}
                                <FeeDetail
                                    translate={this.props.translate}
                                    gasPrice={this.state.gasPrice}
                                    gas={this.state.gas}
                                    isFetchingGas={this.state.isFetchingGas}
                                    totalGas={totalGas}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overlap">
                    <div className={!!this.state.passwordError ? "error password-input" : "password-input"}>
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
                            <a className={"button process-submit " + (this.isFetchingGas ? "waiting" : "next")}
                                onClick={(e) => submitTransaction(e)}>
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

