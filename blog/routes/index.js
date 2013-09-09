var blogBiz = require('./blogBiz.js'),
    blogAdmin = require('./blogAdmin.js'),
    upload = require('jquery-file-upload-middleware'),
    fs = require('fs');
module.exports = function (app) {

    app.get('/', blogBiz.index);

    app.get('/reg', checkNotLogin);
    app.get('/reg', blogBiz.getReg);

    app.post('/reg', checkNotLogin);
    app.post('/reg', blogBiz.postReg);

    app.get('/login', checkNotLogin);
    app.get('/login', blogBiz.getLogin);

    app.post('/login', checkNotLogin);
    app.post('/login', blogBiz.postLogin);

    app.get('/post', checkLogin);
    app.get('/post', blogBiz.getArticle);

    app.post('/post', checkLogin);
    app.post('/post', blogBiz.postArticle);

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });
    app.get('/search', blogBiz.getSearch); //搜索

    app.get('/u/:name', blogBiz.getUserArticle);

    app.get('/u/:name/:day/:title', blogBiz.getComment);

    app.post('/u/:name/:day/:title', blogBiz.postComment);

    app.get('/archive', blogBiz.archive);
//    app.get('/tags', blogBiz.tags);

    app.get('/tags/:tag', blogBiz.tag);
   // '/thumbnail',
    app.get('/files/:thumbnail?/:filename', function (req, res, next) {
        var thumbnail = req.params.thumbnail? '/' + req.params.thumbnail:'';
        upload.fileManager().getFiles(thumbnail,function (files) {
            var filename = req.params.filename;
            if (files[filename]) {
                var path = files[filename].path;
                var type = filename.split('.')[1];
                fs.readFile(path, "binary", function (error, file) {
                    if (!error) {
                        res.writeHead(200, {"Content-Type": "image/" + type});
                        res.end(file, "binary");
                    } else {
                        res.writeHead(500, {"Content-Type": "text/plain"});
                        res.end(error + "\n");
                    }
                });
            } else {
                res.writeHead(404, {"Content-Type": "text/html"});
                res.end("no such file?\n");
            }
        });
    });
    //相册
    app.get('/:u/album',function(req,res,next){
        var user = req.params.u;
        var folders = [];
        var path = './public/uploads/'+ req.session.user.name;
        var arr = fs.readdirSync(path);//读取path目录下所有的文件及文件夹
        arr.forEach(function(stat,index){
            var ds = fs.statSync(path + '/' + stat);
            if(ds.isDirectory()){
                folders.unshift(stat);//收集目录
            }
        });
        res.render('blog/album',{folders:folders,user:req.session.user})
    });
    app.get('/upload/upload.html', checkLogin);
    app.get('/upload/upload.html', function (req, res, next) {
       // var album = req.params.album;

        upload.fileHandler({
            uploadDir:function(){
                return   './public/uploads/'+ req.session.user.name// + '/' + album;
            }

        });
        res.render('blog/uploadImage',{user: req.session.user});
    });
    app.get('/upload', checkLogin);
    app.use('/upload', function(req,res,next){
     //   var album = req.params.album;
        upload.fileHandler({
            uploadDir:function(){
                return   './public/uploads/'+ req.session.user.name// + '/' +album;
            },
            uploadUrl:function(){
                return '/files';
            }
        })(req,res,next);
    });//上传



    //admin管理员
    app.get('/admin/', blogAdmin.home);

 /*   app.all('*', function(req, res){
        res.send('what???', 404);
    });*/
    // app.all('*', blogBiz.get404);



    //聊天室






};
//验证是否登录
function checkLogin(req, res, next) {
    //var get_url = url.parse(req.url);
    //console.log(get_url)
    if (!req.session.user) {
        req.flash('error', '未登录');
        return res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        return res.redirect('/');
    }
    next();

}