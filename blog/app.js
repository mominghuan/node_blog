var express = require('express')
    , routes = require('./routes')
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , path = require('path')
    , fs = require('fs')
    , MongoStore = require('connect-mongo')(express)
    , settings = require('./settings')
    , flash = require('connect-flash')
    , ejs = require('ejs')
    , upload = require('jquery-file-upload-middleware');

io.set('log level', 1);
upload.configure({
    tmpDir: __dirname + '/public/tmp'
});
//注意点：为了在ejs中能使用.html，以下这句是关键，app.register()不能用了
app.engine('html', require('ejs').renderFile);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
//app.register('html', ejs); //同时支持html的设置
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));  //图标
app.use(express.logger('dev'));

//app.use(express.bodyParser());
//开这个登录可以，上传文件就不可以
//app.use(express.bodyParser({uploadDir: './public/uploads'}));
//开这两个，上传文件跟登录都可以
app.use(express.json());
app.use(express.urlencoded());


app.use(express.methodOverride());
// app.set("view cache", true); //上线开启模板缓存
//cookie
app.use(express.cookieParser());
app.use(express.session({
    secret: settings.cookieSecret,
    key: settings.db,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
    store: new MongoStore({
        db: settings.db
    })
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
//聊天
var users = [];//存储在线用户列表
app.get('/chat', function (req, res) {
    users.forEach(function (user, index) {
        if ((user == req.cookies.user) || req.cookies.user != null) {
            return res.redirect('/chat/signin');
        }
    });
    res.sendfile('views/chat/index.html');
});
app.get('/chat/signin', function (req, res) {
    res.sendfile('views/chat/signin.html');
});
app.post('/chat/signin', function (req, res) {
    //检测该用户名是否已经存在于 users 数组中
    if (users.indexOf(req.body.name) != -1) {
        //存在，则不允许登陆
        res.redirect('/chat/signin');
    } else {
        //不存在，把用户名存入 cookie 并跳转到主页
        res.cookie("user", req.body.name, {maxAge: 1000 * 60 * 60 * 24 * 30});
        res.redirect('/chat');
    }
});


io.on('connection', function (socket) {
    //有人上线
    socket.on('online', function (data) {
        //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
        socket.name = data.user;
        //数组中不存在该用户名则插入该用户名
        if (users.indexOf(data.user) == -1) {
            users.unshift(data.user);
        }
        //向所有用户广播该用户上线信息
        io.sockets.emit('online', {users: users, user: data.user});
    });
    //有人发话
    socket.on('say', function (data) {
        if (data.to == 'all') {
            //向其他所有用户广播该用户发话信息
            socket.broadcast.emit('say', data);
        } else {
            //向特定用户发送该用户发话信息
            //clients 为存储所有连接对象的数组
            var clients = io.sockets.clients();
            //遍历找到该用户
            clients.forEach(function (client) {
                if (client.name == data.to) {
                    //触发该用户客户端的 say 事件
                    client.emit('say', data);
                }
            });
        }
    });

    //有人下线
    socket.on('disconnect', function () {
        //若 users 数组中保存了该用户名
        if (users.indexOf(socket.name) != -1) {
            //从 users 数组中删除该用户名
            users.splice(users.indexOf(socket.name), 1);
            //向其他所有用户广播该用户下线信息
            socket.broadcast.emit('offline', {users: users, user: socket.name});
        }
    });
});

routes(app);