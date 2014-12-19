var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'juliet',
    database: 'nodemysql',
    charset: 'utf8'
  }
});

var Bookshelf = require('bookshelf')(knex);
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require('lodash');




var router = express.Router();

// for forms
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); 


/*
 *   Models
**/

// User model
var User = Bookshelf.Model.extend({
  tableName: 'users'
});
    
// Post model
var Post = Bookshelf.Model.extend({

  tableName: 'posts',

  hasTimestamps: true,

  category: function () {
    return this.belongsTo(Category, 'category_id');
  },

  tags: function () {
    return this.belongsToMany(Tag);
  },

  author: function () {
    return this.belongsTo(User);
  }
});

// Category model
var Category = Bookshelf.Model.extend({

  tableName: 'categories',

  posts: function () {
    return this.hasMany(Post);
  }
});

// Tag model
var Tag = Bookshelf.Model.extend({

  tableName: 'tags',

  posts: function () {
    return this.belongsToMany(Post);
  }
});


/*
Building a simple API with Express and Bookshelf.js



It's been a long time since my last post, work commitment has kept very busy - hopefully next year I'll be able to publish regularly.

This article is a continuation of the last one - Using Node.js with MySQL. Today we are going to be building a simple restful API with Bookshelf.js and Express.

In the last article we ended by defining our models, it is also a good idea to create
`Collections` which will give us the ability to perform wholesale operations our `Models`.

### Collections
**/


var Users = Bookshelf.Collection.extend({
  model: User
});

var Posts = Bookshelf.Collection.extend({
  model: Post
});

var Categories = Bookshelf.Collection.extend({
  model: Category
});

var Tags = Bookshelf.Collection.extend({
  model: Tag
});


/**

Next we need to define our API end points - we need to be able to perform basic CRUD operations on the following resources: `users`, `categories`, and `posts`.


### Users

 - `GET    /users`    - fetch all users
 - `POST   /user`     - create a new user
 - `GET    /user/:id` - fetch a single user
 - `PUT    /user/:id` - update user
 - `DELETE /user/:id` - delete user


### Categories

 - `GET    /categories`   - fetch all categories
 - `POST   /category`     - create a new category
 - `GET    /category/:id` - fetch a single category
 - `PUT    /category/:id` - update category
 - `DELETE /category/:id` - delete category


### Posts

 - `GET    /posts`    - fetch all posts
 - `POST   /post`     - create a new post
 - `GET    /post/:id` - fetch a single post
 - `PUT    /post/:id` - update post
 - `DELETE /post/:id` - delete post

 - `GET    /posts/category/:id` - fetch all posts from a single category
 - `GET    /posts/tags/:slug`   - fetch all posts from a single tag us


All is set, now we can go ahead and start setting up our api routes. First up we'll create a users route, every post created will require a user.
**/


router.route('/users')
  // fetch all users
  .get(function (req, res) {
    Users.forge()
    .fetch()
    .then(function (collection) {
      res.json({error: false, data: collection.toJSON()});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })

  // create a user
  .post(function (req, res) {
    User.forge({
      name: req.body.name,
      email: req.body.email
    })
    .save()
    .then(function (user) {
      res.json({error: false, data: {id: user.get('id')}});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    }); 
  });

router.route('/users/:id')
  // fetch user
  .get(function (req, res) {
    User.forge({id: req.params.id})
    .fetch()
    .then(function (user) {
      if (!user) {
        res.status(404).json({error: true, data: {}});
      }
      else {
        res.json({error: false, data: user.toJSON()});
      }
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })

  // update user details
  .put(function (req, res) {
    User.forge({id: req.params.id})
    .fetch({require: true})
    .then(function (user) {
      user.save({
        name: req.body.name || user.get('name'),
        email: req.body.email || user.get('email')
      })
      .then(function () {
        res.json({error: false, data: {message: 'User details updated'}});
      })
      .otherwise(function (err) {
        res.status(500).json({error: true, data: {message: err.message}});
      });
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })

  // delete a user
  .delete(function (req, res) {
    User.forge({id: req.params.id})
    .fetch({require: true})
    .then(function (user) {
      user.destroy()
      .then(function () {
        res.json({error: true, data: {message: 'User successfully deleted'}});
      })
      .otherwise(function (err) {
        res.status(500).json({error: true, data: {message: err.message}});
      });
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });


router.route('/categories')
  // fetch all categories
  .get(function (req, res) {
    Categories.forge()
    .fetch()
    .then(function (collection) {
      res.json({error: false, data: collection.toJSON()});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })

  // create a new category
  .post(function (req, res) {
    Category.forge({name: req.body.name})
    .save()
    .then(function (category) {
      res.json({error: false, data: {id: category.get('id')}});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    }); 
  });

router.route('/categories/:id')
  // fetch all categories
  .get(function (req, res) {
    Category.forge({id: req.params.id})
    .fetch()
    .then(function (category) {
      if(!category) {
        res.status(404).json({error: true, data: {}});
      }
      else {
        res.json({error: false, data: category.toJSON()});
      }
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })   

  // update a category
  .put(function (req, res) {
    Category.forge({id: req.params.id})
    .fetch({require: true})
    .then(function (category) {
      category.save({name: req.body.name || category.get('name')})
      .then(function () {
        res.json({error: false, data: {message: 'Category updated'}});
      })
      .otherwise(function (err) {
        res.status(500).json({error: true, data: {message: err.message}});
      });
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  })

  // delete a category
  .delete(function (req, res) {
    Category.forge({id: req.params.id})
    .fetch({require: true})
    .then(function (category) {
      category.destroy()
      .then(function () {
        res.json({error: true, data: {message: 'Category successfully deleted'}});
      })
      .otherwise(function (err) {
        res.status(500).json({error: true, data: {message: err.message}});
      });
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });


function saveTags(tags) {
  var tagObjects = tags.map(function (tag) {
    return {
      name: tag,
      slug: tag.replace(/ /g, '-').toLowerCase()
    };
  });

  return Tags.forge()
  .query('whereIn', 'slug', _.pluck(tagObjects, 'slug'))
  .fetch()
  .then(function (existingTags) {
    var doNotExist = [];

    existingTags = existingTags.toJSON();

    if (existingTags.length > 0) {
      var existingSlugs = _.pluck(existingTags, 'slug');

      doNotExist = tagObjects.filter(function (t) {
        return existingSlugs.indexOf(t.slug) < 0;
      });
    }
    else {
      doNotExist = tagObjects;
    }

    return new Tags(doNotExist).mapThen(function(model) {
      return model.save()
      .then(function() {
        return model.get('id');
      });
    })
    .then(function (ids) {
      return _.union(ids, _.pluck(existingTags, 'id'));
    });
  });
}


router.route('/posts')
  // fetch all posts
  .get(function (req, res) {
    Posts.forge()
    .fetch()
    .then(function (collection) {
      res.json({error: false, data: collection.toJSON()});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });

router.route('/posts/:id')
  // fetch a post by id
  .get(function (req, res) {
    Post.forge({id: req.params.id})
    .fetch({withRelated: ['categories', 'tags']})
    .then(function (post) {
      if (!post) {
        res.status(404).json({error: true, data: {}});
      }
      else {
        res.json({error: false, data: post.toJSON()});
      }
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });



router.route('/posts')

  .post(function (req, res) {
    var tags = req.body.tags;
   
   // parse tags variable
    if (tags) {
      tags = tags.split(',').map(function (tag){
        return tag.trim();
      });
    }
    else {
      tags = ['uncategorised'];
    }
    
    // save post variables
    Post.forge({
      user_id: req.body.user_id,
      category_id: req.body.category_id,
      title: req.body.title,
      slug: req.body.title.replace(/ /g, '-').toLowerCase(),
      html: req.body.post
    })
    .save()
    .then(function (post) {
      
      // post successfully saved
      // save tags
      saveTags(tags)
      .then(function (ids) {

        post.load(['tags'])
        .then(function (model) {
         
          // attach tags to post
          model.tags().attach(ids);

          res.json({error: false, data: {message: 'Tags saved'}});
        })
        .otherwise(function (err) {
          res.status(500).json({error: true, data: {message: err.message}});
        });
      })
      .otherwise(function (err) {
        res.status(500).json({error: true, data: {message: err.message}}); 
      });      
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    }); 
  });


router.route('/posts/category/:id')
  .get(function (req, res) {
    Category.forge({id: req.params.id})
    .fetch({withRelated: ['posts']})
    .then(function (category) {
      var posts = category.related('posts');

      res.json({error: false, data: posts.toJSON()});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });

router.route('/posts/tag/:slug')
  .get(function (req, res) {
    Tag.forge({slug: req.params.slug})
    .fetch({withRelated: ['posts']})
    .then(function (tag) {
      var posts = tag.related('posts');

      res.json({error: false, data: posts.toJSON()});
    })
    .otherwise(function (err) {
      res.status(500).json({error: true, data: {message: err.message}});
    });
  });


app.use('/api', router);

app.listen(3002, function() {
  console.log("✔ Express server listening on port %d in %s mode", 3002, app.get('env'));
});
