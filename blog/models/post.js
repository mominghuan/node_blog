var mongodb = require('./db');

markdown = require('markdown').markdown;

function Post(userName, title, tags, post) {
    this.userName = userName;
    this.title = title;
    this.tags = tags;
    this.post = post;
}
module.exports = Post;
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
    };
    var post = {
        userName: this.userName,
        time: time,
        tags: this.tags,
        title: this.title,
        post: this.post,
        isShow: '',
        comments: [],
        pv: 0
    };
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, {safe: true}, function (err, post) {
                mongodb.close();
                callback(null);
            });
        });
    });
};
Post.getTen = function (userName, page, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                return callback(err);
            }
            var query = {};
            if (userName) query.userName = userName;
            collection.find(query).count(function (err, total) {
                collection.find(query, {skip: (page - 1) * 5, limit: 5}).sort({time: -1}).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);

                });
            });
        });
    });
};

Post.getOne = function (userName, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {"userName": userName, "time.day": day, "title": title};

            collection.findOne(query, function (err, doc) {

                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                if (doc) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }
                callback(null, doc);
            });
            collection.update(query, {$inc: {"pv": 1}},{ w: 0 }); //不知道为什么要加个{w:0}   不加还出错Cannot use a writeConcern without a provided callback
        });
    });
};

Post.getArchive = function (callback) {//返回所有文章
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //返回只包含 name、time、title 的文档组成的数组
            collection.find({}, {"userName": 1, "time": 1, "title": 1}).sort({
                time: -1
            }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, docs);
                });
        });
    });
};

Post.getTags = function (userName, callback) {//返回所有标签
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (userName) query.userName = userName;
            //distinct 用来找出给定键的所有不同值 查询当前用户下所有的标签   userName为空，查询所有用户的所有标签
            collection.distinct("tags.tag", query, function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });

    });

};

Post.getTag = function (tag, callback) {//返回含有特定标签的所有文章
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //通过 tags.tag 查询并返回只含有 name、time、title 键的文档组成的数组
            collection.find({"tags.tag": tag}, {"userName": 1, "time": 1, "title": 1}).sort({
                time: -1
            }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, docs);
                });
        });
    });
};
Post.getSearch = function (keyword, page, callback) {
    mongodb.open(function (err, db) {
        if (err) return callback(err);
        db.collection("posts", function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*" + keyword + ".*$", 'i');
            var query = {"title": pattern};
            var querystr = {"userName": 1, "time": 1, "title": 1, "tags": 1, "comments": 1};

            collection.find(query, querystr).count(function (err, total) {
                collection.find(query, querystr, {skip: (page - 1) * 5, limit: 5})
                    .sort({time: -1}).toArray(function (err, docs) {
                        mongodb.close();
                        if (err) callback(err, null);
                        console.log(keyword + " and " + page);
                        callback(null, docs, total);
                    });
            });

        });

    });
};

/*Post.getUpdatePv = function(callback){
    mongodb.open(function(err, db){
        if(err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection){
            if(err) return callback(err);
            collection.update(query, {$inc: {"pv": 1}},{ w: 0 });
        });
    });
}*/



