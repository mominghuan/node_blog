var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports.home = function(req, res){
    res.render('admin/blog/home', {title:"后台管理"});
};
