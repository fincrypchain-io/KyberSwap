import * as constants from '../services/constants';
import * as bowser from 'bowser'

export function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


export function getActiveLanguage(langs){
    for (var i = 0; i< langs.length; i++){
      if (langs[i].active){
        return langs[i].code
      }
    }
    return "en"
}


export function getPath(path, listParams){
    var index = 0
    listParams.map(param => {
        var value = getParameterByName(param.key)
        if (!value) return

        if (value === param.default) return

        if (index === 0) {
            path += `?${param.key}=${value}`
            index ++
            return
        }

        path += `&${param.key}=${value}`
    })
    return path
}


export var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

export var checkBrowser = {
    isFirefox: function() {
        return !!bowser.firefox
    },
    isChrome: function() {
        return !!bowser.chrome
    },
    isSafari: function() {
        return !!bowser.safari
    },
    isNotFCSBrowser: function() {
        return !this.isFirefox && !this.isChrome && !this.isSafari;
    }
}

export function getAssetUrl(uri = "") {
  return constants.ASSET_URL + uri.toLowerCase();
}


export function isUserEurope(){
    var isEurope = getCookie("is_europe")
    return isEurope === true || isEurope === 'true'
}

export function setCookie(cname, cvalue, exdays) {
  if (!exdays) {
    exdays = 5 * 365
  }
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');    
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

export function timeout(ms, promise) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(new Error("timeout"))
        }, ms)
        promise.then(resolve, reject)
    })
}


export function getTokenBySymbol(tokens, symbol){
    for (var i = 0; i< tokens.length; i++){
      if (tokens[i].symbol === symbol){
        return tokens[i]
      }
    }
    return false
  }


  export function addScriptTag(src){
    var script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.body.appendChild(script);
  }