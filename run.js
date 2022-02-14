const fs = require("fs/promises")
const Elliptic= require('.')
var conf={key:process.env.ELLIPTIC_ACCESS, secret:process.env.ELLIPTIC_SECRET }; 

const elliptic=new Elliptic(conf)

const run =  async function(){
  const data = (await fs.readFile("./bb.csv")).toString()
  const infos = data.split('\n').map(x=>x.split(",").slice(0,2))

  for (var tx of infos){
    const score = await elliptic.scoreIncomingAccountTransaction('eth',tx[1],`${tx[0]}-ZBX`)

    try {
      console.log("user: ", tx[0], "score: ", score.risk_score, "value: ", score.blockchain_info.transaction.value.usd)
      if ((score.risk_score) && (Number(score.risk_score) > 0.5)){
        console.log("ALERT ","user:", tx[0] , "score :", score.risk_score, "value :", score.blockchain_info.transaction.value.usd, txid)
    }

  }catch(e){
    console.log(score)
  }
  }

}

run()