import React from "react"
import { connect } from "react-redux"
import {ExchangeBody} from "../Exchange"
import { getTranslate } from 'react-localize-redux'
import * as converter from "../../utils/converter"
import * as validators from "../../utils/validators"
import * as exchangeActions from "../../actions/exchangeActions"
import {setIsChangingPath} from "../../actions/globalActions"
import { clearSession } from "../../actions/globalActions"
import {HeaderTransaction} from "../TransactionCommon"
import * as analytics from "../../utils/analytics"
import * as common from "../../utils/common"

@connect((store, props) => {
  const account = store.account.account
  const translate = getTranslate(store.locale)
  const tokens = store.tokens.tokens
  const exchange = store.exchange
  const ethereum = store.connection.ethereum

  return {
    translate, exchange, tokens, account, ethereum,
    params: {...props.match.params},

  }
})

export default class Exchange extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      isAnimation: false
    }
  }

  setAnimation = () => {
    this.setState({isAnimation: true})
  }

  componentDidMount = () =>{
    // get last token 
    var sourceSymbol = this.props.params.source.toLowerCase()
    var sourceToken = common.getAddressFromSymbol(sourceSymbol, this.props.tokens)
    var destSymbol = this.props.params.dest.toLowerCase()
    var destToken = common.getAddressFromSymbol(destSymbol, this.props.tokens)

    if ((sourceToken.toLowerCase() !== this.props.exchange.sourceToken.toLowerCase()) ||
      (destToken.toLowerCase() !== this.props.exchange.destToken.toLowerCase()) ){

      sourceSymbol = this.props.params.source.toUpperCase()
      sourceToken =  common.getAddressFromSymbol(sourceSymbol, this.props.tokens)

      destSymbol = this.props.params.dest.toUpperCase()
      destToken = common.getAddressFromSymbol(destSymbol, this.props.tokens)

      this.props.dispatch(exchangeActions.selectTokenAsync(sourceSymbol, sourceToken, "source", this.props.ethereum))
      this.props.dispatch(exchangeActions.selectTokenAsync(destSymbol, destToken, "des", this.props.ethereum))
    }
  }

  render() {
    return (
      <div className={"exchange-container"}>
        <HeaderTransaction page="exchange"/>
        <ExchangeBody/>
      </div>
    )
  }
}
