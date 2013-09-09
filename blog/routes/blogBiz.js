var crypto = require('crypto'),
    mkdirSync = require('../util/mkdir.js'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports.index = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('blog/index', {
            title: 'Blog',
            user: req.session.user,
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 5 + posts.length) == total,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
//显示注册的页面
module.exports.getReg = function (req, res) {
    res.render('blog/reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()

    });

};
//处理注册的逻辑
module.exports.postReg = function (req, res) {


    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!');
        return res.redirect('/reg');
    }
    //生成密码的散列值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (user) {
            err = '用户已存在!';
        }
        if (err) {
            req.flash('error', err);
            return res.redirect('/reg');
        }
        //如果不存在则新增用户
        newUser.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            req.session.user = newUser;//用户信息存入session
            req.flash('success', '注册成功!');
            //创建用来存放图片的文件夹。会在当前注册的用户下创建一个default目录
            mkdirSync('./public/uploads/'+newUser.name /*+ "/default"*/,0, function(e){
                if(e) console.log("创建目录出错");
                else console.log('创建成功');
            });
            res.redirect('/');
        });
    });
};
//显示登录的页面
module.exports.getLogin = function (req, res) {
    res.render('blog/login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });

};

//处理登录的逻辑
module.exports.postLogin = function (req, res) {
    var md5 = crypto.createHash('md5'),

        password = md5.update(req.body.password).digest('hex');
    //查询用户信息
    User.get(req.body.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        if (user.password != password) {
            req.flash('error', '密码错误');
            return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success', '登录成功');
        res.redirect('/');
    });
};

//显示文章发表的页面
module.exports.getArticle = function (req, res) {
    res.render('blog/post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()

    });

};

//处理发表文章的逻辑

module.exports.postArticle = function (req, res) {
    var currentUser = req.session.user,
        tags = [
        ],
        post = new Post(currentUser.name, req.body.title, tags, req.body.content);
    var tag = req.body.tag;
    var ts = tag.split(',');
    ts.forEach(function (t, index) {
        tags[index] = {"tag": t};
    });
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', "发布成功");
        res.redirect('/');
    });
};
//显示用户的文章
module.exports.getUserArticle = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/');
        }
        Post.getTen(user.name, page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            Post.getTags(user.name, function (err, tags) {
                if (err) tags = [];
                res.render('blog/user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    tags: tags,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 5 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });

        });
    });
};
//留言
module.exports.getComment = function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        /*var data = {"post":post};
         res.end(JSON.stringify(data));*/
        res.render('blog/article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });

    });
};

module.exports.postComment = function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes(),
        comment = {"name": req.body.name, "email": req.body.email, "website": req.body.website, "time": time, "content": req.body.content};
    var newComment = new Comment(req.params.userName, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '留言成功!');
        res.redirect('back');
    });
};
//archive

module.exports.archive = function (req, res) {
    Post.getArchive(function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('blog/archive', {
            title: '存档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });

    });
};
/*           //tags
 module.exports.tags = function(req,res){
 Post.getTags(function(err, posts){
 if(err){
 req.flash('error',err);
 return res.redirect('/');
 }
 res.render('blog/tags',{
 title: '标签',
 posts: posts,
 user: req.session.user,
 success: req.flash('success').toString(),
 error: req.flash('error').toString()
 });
 });
 };*/

//tag
module.exports.tag = function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('blog/tag', {
            title: 'TAG:' + req.params.tag,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });

    });
};
exports.getSearch = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    var keyword = req.query.keyword ? req.query.keyword : req.query.keyword;
    Post.getSearch(req.query.keyword, page, function (err, posts, total) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('blog/search', {
            title: "SEARCH:" + req.query.keyword,
            posts: posts,
            page: page,
            keyword: keyword,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 5 + posts.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};


/*exports.updatePv = function(req, res){
 Post.getUpdatePv();
 };*/
exports.get404 = function (req, res) {
    res.render("blog/404");
};