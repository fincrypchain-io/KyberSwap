import React from "react"
import { connect } from "react-redux"
import { push } from 'react-router-redux'

//import { DropFile } from "../../../components/ImportAccount"
import Dropzone from 'react-dropzone'


import { importNewAccount, throwError } from "../../../../actions/accountActions"
import { verifyKey, anyErrors } from "../../../../utils/validators"
//import { addressFromKey } from "../../../utils/keys"
import { getTranslate } from 'react-localize-redux'
import * as analytics from "../../../../utils/analytics"

@connect((store, props) => {
  var tokens = store.tokens.tokens
  var supportTokens = []
  Object.keys(tokens).forEach((key) => {
    supportTokens.push(tokens[key])
  })
  return {
    account: store.account,
    ethereum: store.connection.ethereum,
    tokens: supportTokens,
    translate: getTranslate(store.locale),
    screen: props.screen
  }
})

export default class ImportAccount extends React.Component {
  addressFromKey = (keystring) => {
    try {
      var keyObj = JSON.parse(keystring)
      var address = keyObj.address
      if (address == undefined || address == "") {
        throw new Error("Invalid keystore format")
      }
      return "0x" + address
    } catch (e) {
      throw new Error("Invalid keystore format")
    }
  }

  lowerCaseKey = (keystring) => {
    return keystring.toLowerCase()
  }

  onDrop = (files) => {
    analytics.trackClickImportAccount("keystore")
    try {
      var _this = this
      var file = files[0]
      var fileReader = new FileReader()
      fileReader.onload = (event) => {
        var keystring = this.lowerCaseKey(event.target.result)
        var errors = {}
        errors["keyError"] = verifyKey(keystring)
        if (anyErrors(errors)) {
          this.props.dispatch(throwError(this.props.translate("error.invalid_json_file") || "Your uploaded JSON file is invalid. Please upload a correct JSON keystore."))
        } else {
          var address = this.addressFromKey(keystring)
          this.props.dispatch(importNewAccount(address,
            "keystore",
            keystring,
            this.props.ethereum,
            this.props.tokens, this.props.screen))
        }

      }
      fileReader.readAsText(file)
    } catch (e) {
      console.log(e)
    }

  }

  render() {
    return (
      // <DropFile id="import_json"
      //   error={this.props.account.error}
      //   onDrop={this.onDrop}
      //   translate={this.props.translate}
      // />

      <Dropzone onDrop={(e) => this.onDrop(e)} disablePreview={true} className="column column-block">
      {({ getRootProps, getInputProps, isDragActive }) => {
        return (
          <div className="import-account__block" {...getRootProps() }>
            <input {...getInputProps() } />          
            <div className="import-account__icon json"/>
            <div className="import-account__name">{this.props.translate("import.json") || "JSON"}</div>
          </div>
        )
      }}
    </Dropzone>
    )
  }
}
