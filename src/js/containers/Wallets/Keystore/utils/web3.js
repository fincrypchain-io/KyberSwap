import * as data from "../../Common/data"
import EthereumTx from "ethereumjs-tx"
//import { unlock } from "../../utils/keys"

import * as ethUtil from 'ethereumjs-util'
import scrypt from 'scryptsy'
import crypto from 'crypto'
import Web3 from "web3"
import BLOCKCHAIN_INFO from "../../../../../../env"

function decipherBuffer(decipher, data) {
  return Buffer.concat([decipher.update(data), decipher.final()])
}

var utils = {
  unlock : (input, password, nonStrict) => {
    var json = (typeof input === 'object') ? input : JSON.parse(nonStrict ? input.toLowerCase() : input)
    if (json.version !== 3) {
        throw new Error('Not a V3 wallet')
    }
    var derivedKey
    var kdfparams
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams
        derivedKey = scrypt(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)
    } else if (json.crypto.kdf === 'pbkdf2') {
        kdfparams = json.crypto.kdfparams
        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2')
        }
        derivedKey = crypto.pbkdf2Sync(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256')
    } else {
        throw new Error('Unsupported key derivation scheme')
    }
    var ciphertext = new Buffer(json.crypto.ciphertext, 'hex')
    var mac = ethUtil.keccak256(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
    if (mac.toString('hex') !== json.crypto.mac) {
        throw new Error('Key derivation failed - possibly wrong password')
    }
    var decipher = crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), new Buffer(json.crypto.cipherparams.iv, 'hex'))

    var seed = Buffer.concat([decipher.update(ciphertext), decipher.final()])

    //var seed = decipherBuffer(decipher, ciphertext, 'hex')
    while (seed.length < 32) {
        var nullBuff = new Buffer([0x00]);
        seed = Buffer.concat([nullBuff, seed]);
    }
    return seed
  }
}

// var eth = {
//   sendTransaction = 
// }

var setProvider = (keystring, password) => {
  var privateKey = utils.unlock(keystring, password)
  //get all prune node
  var nodes = []
  BLOCKCHAIN_INFO.connections.http.map(val => {
    if (val.type === "prune"){
      nodes.push(val.endPoint)
    }
  })
  var web3 = new Web3(new Web3.providers.HttpProvider(nodes[0]))    
  //web3.eth.accounts.wallet.add("0x" + privateKey);
  web3.eth.sendTransaction = (txObject, callback) => {
    var tx = new EthereumTx(txObject)    
    tx.sign(privateKey)
    var stx = tx.serialize();
    web3.eth.sendSignedTransaction('0x' + stx.toString('hex'), (err, hash) => {
      callback(err, hash)
    });
  }
  console.log(web3)
  return web3
}

//export default class KeyStore {

  // export function callSignTransaction (funcName, ...args){
  //   return new Promise((resolve, reject) => {
  //       data[funcName](...args).then(result => {
  //       const { txParams, keystring, password } = result
  //       try {
  //         const tx = this.sealTx(txParams, keystring, password)
  //         resolve(tx)
  //       }catch(e) {
  //         console.log(e)
  //         reject(e)
  //       }
  //     })
  //   })
  // }

  // export function sealTx (txParams, keystring, password) {
  //   const tx = new EthereumTx(txParams)
  //   const privKey = unlock(keystring, password, true)
  //   tx.sign(privKey)
  //   return tx
  // }

//}


module.exports = {
  utils, setProvider
}