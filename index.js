const crypto = require('crypto')
const fetch = require('node-fetch')
const inspect = require("util").inspect

function Elliptic (config) {
  this.key = config.key
  this.secret = config.secret
  this.environnment = config.environnment
  this.url = 'https://aml-api.elliptic.co'
  //this.url = 'http://localhost:8001'
}

Elliptic.prototype.get_signature = function (secret, time_of_request, http_method, http_path, payload) {
  // create a SHA256 HMAC using the supplied secret, decoded from base64
  const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'base64'))

  // concatenate the request text to be signed
  const request_text = time_of_request + http_method + http_path.toLowerCase() + payload

  // update the HMAC with the text to be signed
  hmac.update(request_text)

  // output the signature as a base64 encoded string
  return hmac.digest('base64')
}
Elliptic.prototype.fetch = async function(method, path, payload){


  const body = JSON.stringify(payload)
  const timestamp = Date.now()
  const signature = this.get_signature(this.secret, timestamp, method, path, body)
  const headers = {
    'Content-Type': 'application/json',
    'x-access-key':this.key,
    'x-access-sign':signature,
    'x-access-timestamp':timestamp
  }
  const request =await fetch(this.url+path, {
    method: method.toLowerCase(),
    body: body,
    headers:headers
  })
  return request.json();
}


Elliptic.prototype.scoreOutgoingAddress = async function(asset, address, userid){
  const path = '/v2/wallet/synchronous'
  const method = 'POST'
  
  const payload = {
    subject: {
      asset: asset,
      type: "address",
      hash: address
    },
    type: "wallet_exposure",
    customer_reference: userid
  }
  return this.fetch(method, path, payload)

}



Elliptic.prototype.scoreIncomingTransaction = async function(asset, txid,addr, userid){

  const AccountBasedAssets = ['ETH','ERC20', 'XRP' ]
  if (AccountBasedAssets.indexOf(asset) !== -1){
    return this.scoreIncomingAccountTransaction(asset, txid, userid)
  
  }
  else{
   return this.scoreIncomingUtxoTransaction(asset, txid, addr,userid)
  
  }

}


Elliptic.prototype.scoreIncomingAccountTransaction = async function(asset, txid, userid){
  const path = '/v2/analyses/synchronous'
  const method = 'POST'
  const payload = {
    subject: {
      asset: asset.toUpperCase(),
      type: "transaction",
      hash: txid,
    },
    type: "source_of_funds",
    customer_reference: userid

  }
  return this.fetch(method, path, payload)


}


Elliptic.prototype.scoreIncomingUtxoTransaction = async function(asset, txid,addr, userid){
  const path = '/v2/analyses/synchronous'
  const method = 'POST'
  const payload = {
    subject: {
      asset: asset.toUpperCase(),
      type: "transaction",
      hash: txid,
      output_type:"address",
      output_address:addr
    },
    type: "source_of_funds",
    customer_reference: userid

  }
  return this.fetch(method, path, payload)
}



module.exports=Elliptic
