

import * as keystore from "./Keystore"


export function getInstanceWallet(type){
    var instance
    switch(type){
        case "keystore":
            instance = keystore
            break
    }
    return instance
}

module.exports = {
    keystore
}