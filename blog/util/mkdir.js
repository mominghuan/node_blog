

module.exports = function mkdirSync(url, mode, cb){
    var fs = require('fs');
    var path = require('path'), arr = url.split('/');
    mode = mode || 0755;
    cb = cb || function(){};
    if(arr[0]=="."){//处理 ./aaa
        arr.shift();
    }
    if(arr[0]==".."){
        arr.splice(0,2,arr[0]+"/"+arr[1]);
    }
    function inner(cur){
        if(!path.existsSync(cur)){
           fs.mkdirSync(cur,mode);
        }
        if(arr.length){
            inner((cur+"/"+arr.shift()));
        }else{
            cb();
        }
    }
    arr.length && inner(arr.shift());
}