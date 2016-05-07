
//WB2.oauthData.uid;
var weiboUser;

function wOnUserShow(sResult, bStatus){
    weiboUser = sResult;
}

function wChecklogin(callback) {
  if (WB2.checkLogin()){
    callback();
  } else {
    WB2.login(function() {
      if (WB2.checkLogin()){
        callback();
      }
    });
  }
}


function wAnyWhere(callback) {
  wChecklogin(function(){
    WB2.anyWhere(function(W){
      if (!weiboUser) {
        weiboUser = {};
         W.parseCMD("/users/show.json", wOnUserShow, {uid: WB2.oauthData.uid}, {method: 'get'});
      }
      callback(W);
    });
  });

}

function wOnCallback(rslt, bStatus) {
  var list = [];
  var postData = {'add':list};
  if (weiboUser && weiboUser.screen_name) {
    list.push(weiboUser.screen_name);
    postData['me'] = weiboUser.screen_name;
  }
  if (rslt.users) {
    rslt = rslt.users;
  }
  for (var i in rslt) {
    list.push(rslt[i].screen_name);
  }
  window.parent.postMessage(postData, "*");
}

function wOnAdd2(e){
  window.parent.postMessage({'button':'showLoader'}, "*");
  wAnyWhere(function(W){
     W.parseCMD("/friendships/friends_chain/followers.json", wOnCallback, {uid: WB2.oauthData.uid, count:200}, {method: 'get'});
  });
}
document.getElementById("weiboAdd2").addEventListener("click", wOnAdd2);


function wOnAdd1Callback(rslt, bStatus) {
  function done(){
    wOnCallback(rslt, bStatus);
  }; 
  function onUserShow(sResult, sStatus){
    weiboUser = sResult;
    done();
  }
  if (!weiboUser) {
    WB2.anyWhere(function(W){
      W.parseCMD("/users/show.json", onUserShow, {uid: WB2.oauthData.uid}, {method: 'get'});
    });
  } else {
    done();
  }
}

WB2.anyWhere(function(W){
  W.widget.selector({
    id : "weiboAdd1",
    callback : wOnAdd1Callback
  });
});


function dataURLToBlob(dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    var parts = dataURL.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = decodeURIComponent(parts[1]);

    return new Blob([raw], {type: contentType});
  }

  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], {type: contentType});
};

function hideLoading(){
  window.parent.postMessage({'add':[]}, "*");
}

function weiboShare(img, txt) {
  wAnyWhere(function(W){
    var B = WB2.Cookie.load();

    var formData = new FormData();
    formData.append("status", encodeURIComponent(txt));
    formData.append("access_token", B.access_token);
    formData.append("source", WB2._config.appkey);
    formData.append("pic", dataURLToBlob(img));

    var request = new XMLHttpRequest();
    request.addEventListener("load", hideLoading);
    request.addEventListener("error", hideLoading);
    request.open("POST", "https://api.weibo.com/2/statuses/upload.json");
    request.send(formData);
  });
}