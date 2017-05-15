   var data = {};
   var setPrice = function (p,i){
    data.price = p;
    data.id = i;
   }
   var errMsg = function(e){
    var m = '';
    for(var i=0; i < e.length; i++){
     m += e[i].ShortMessage+" ";
     if(i+1 == e.length)
      return m;
    }
   }
   var update = function (){
    console.log(data);
    var update, sMsg = '';
    var req = new XMLHttpRequest();
    req.open("POST","/update");
    req.setRequestHeader("Content-Type", "application/JSON;charset=UTF-8");
    req.onreadystatechange = function(){
     if(req.readyState == 4){
      console.log(typeof req.response, req.response);
      update = JSON.parse(req.response);
      
      if(update.Errors) sMsg = update.Errors.length  ? errMsg(update.Errors) : update.Errors.ShortMessage;
      document.getElementById(update.ItemID).innerHTML = update.code ? update.code : update.Ack+"! "+sMsg;
      document.getElementsByName(update.ItemID)[0].innerHTML = "AU $"+data.price;
     }
    }
    req.send(JSON.stringify(data));
   }
