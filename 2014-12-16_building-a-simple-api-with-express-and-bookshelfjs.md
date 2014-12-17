**This article is a continuation from the last one - [Using Node.js with MySQL](/2014/7/21/using-nodejs-with-mysql)**

It's been a long time since my last post, work commitments has kept me very busy - hopefully, next year I'll be able to publish more regularly.

As promised in the previous article, today we are going to be building a simple restful API with Bookshelf.js and Express. We need to install 2 additional modules for our application, namely, `express` - for routing, and `body-parser` - for parsing request variables: 

    npm install express body-parser --save

I prefer defining all my main variables at the top of the file, let's go ahead and do that:

    var _ = require('lodash');
    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    
    // application routing
    var router = express.Router();
    
    // body-parser middleware for handling request variables
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json()); 

Right below the main variables we have also passed the body-parser middleware to be used by our application to handle request variables.

In the last article we ended by creating `Models`, it is also a good idea to create
`Collections` which will give us the ability to perform wholesale operations on our `Models`.

### Collections

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


Next we need to define our API end points - we want to be able to perform basic CRUD operations on the following resources: `users`, `categories`, and `posts`.


### Users

 - `GET    /users`     - fetch all users
 - `POST   /users`     - create a new user
 - `GET    /users/:id` - fetch a single user by id
 - `PUT    /users/:id` - update user
 - `DELETE /users/:id` - delete user


### Categories

 - `GET    /categories`     - fetch all categories
 - `POST   /categories`     - create a new category
 - `GET    /categories/:id` - fetch a single category
 - `PUT    /categories/:id` - update category
 - `DELETE /categories/:id` - delete category


### Posts

 - `GET    /posts`      - fetch all posts
 - `POST   /posts`      - create a new post
 - `GET    /posts/:id`  - fetch a single post by id
 - `PUT    /posts/:id`  - update post
 - `DELETE /posts/:id`  - delete post

 - `GET    /posts/category/:id` - fetch all posts from a single category
 - `GET    /posts/tags/:slug`   - fetch all posts from a single tag us


All is set, now we can go ahead and start setting up our API routes. First up we'll create users routes, every post created will require a `user_id`.

    router.route('/users')
      // fetch all users
      .get(function (req, res) {
        Users.forge()
        .fetch()
        .then(function (collection) {
          res.json({error: false, data: collection.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
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
          res.json({error: true, data: {message: err.message}});
        }); 
      });
    
    router.route('/users/:id')
      // fetch user
      .get(function (req, res) {
        Users.forge({id: req.params.id})
        .fetch()
        .then(function (user) {
          res.json({error: false, data: user.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      })

      // update user details
      .put(function (req, res) {
        User.forge({id: req.params.id})
        .fetch()
        .then(function (user) {
          user.save({
            name: req.body.name || user.get('name'),
            email: req.body.email || user.get('email')
          })
          .then(function () {
            res.json({error: false, data: {message: 'User details updated'}});
          })
          .otherwise(function (err) {
            res.json({error: true, data: {message: err.message}});
          });
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      })
    
      // delete a user
      .delete(function (req, res) {
        User.forge({id: req.params.id})
        .fetch()
        .then(function (user) {
          user.destroy()
          .then(function () {
            res.json({error: true, data: {message: 'User successfully deleted'}});
          })
          .otherwise(function (err) {
            res.json({error: true, data: {message: err.message}});
          });
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      });


The `forge` method is a simple helper function to instantiate a new Model without the need of using the `new` keyword. 

Categories have a one-to-many relation with posts so it is also a good idea to define their routes next.

    router.route('/categories')
      // fetch all categories
      .get(function (req, res) {
        Categories.forge()
        .fetch()
        .then(function (collection) {
          res.json({error: false, data: collection.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
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
          res.json({error: true, data: {message: err.message}});
        }); 
      });

    router.route('/categories/:id')
      // fetch all categories
      .get(function (req, res) {
        Category.forge({id: req.params.id})
        .fetch()
        .then(function (category) {
          res.json({error: false, data: category.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      })   

      // update a category
      .put(function (req, res) {
        Category.forge({id: req.params.id})
        .fetch()
        .then(function (category) {
          category.save({name: req.body.name || category.get('name')})
          .then(function () {
            res.json({error: false, data: {message: 'Category updated'}});
          })
          .otherwise(function (err) {
            res.json({error: true, data: {message: err.message}});
          });
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      })
    
      // delete a category
      .delete(function (req, res) {
        Category.forge({id: req.params.id})
        .fetch()
        .then(function (category) {
          category.destroy()
          .then(function () {
            res.json({error: true, data: {message: 'Category successfully deleted'}});
          })
          .otherwise(function (err) {
            res.json({error: true, data: {message: err.message}});
          });
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      });


The main purpose of this application is to provide an API for creating and reading blog posts, which brings us to the crux of this article - creating posts routes.

    router.route('/posts')
      // fetch all posts
      .get(function (req, res) {
        Posts.forge()
        .fetch()
        .then(function (collection) {
          res.json({error: false, data: collection.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      });
    
    router.route('/posts/:id')
      // fetch a post by id
      .get(function (req, res) {
        Post.forge({id: req.params.id})
        .fetch({withRelated: ['categories', 'tags']})
        .then(function (post) {
          res.json({error: false, data: post.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        });
      });


The above `GET` routes provide the ability to fetch all posts or a single one.

Creating new posts is a bit complicated because we have update 3 tables, the `posts` table, the `tags` table, and the `posts_tags` table. 
Here is what we are going to do - firstly, we'll collect all post variables and then parse the tags to create an array, secondly, save the post, thirdly, save the related tags, and lastly, attach the tags to the newly created post.

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
              res.json({error: true, data: {message: err.message}});
            });
          })
          .otherwise(function (err) {
            res.json({error: true, data: {message: err.message}}); 
          });      
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
        }); 
      });


The sole purpose of the `saveTags` function is saving tags - it accepts an array of tags when called and returns a promise which resolves with their table ids. 

    function saveTags(tags) {
      // create tag objects
      var tagObjects = tags.map(function (tag) {
        return {
          name: tag,
          slug: tag.replace(/ /g, '-').toLowerCase()
        };
      });
    
      return Tags.forge()
      // fetch tags that already exist
      .query('whereIn', 'slug', _.pluck(tagObjects, 'slug'))
      .fetch()
      .then(function (existingTags) {
        var doNotExist = [];
    
        existingTags = existingTags.toJSON();
        
        // filter out existing tags
        if (existingTags.length > 0) {
          var existingSlugs = _.pluck(existingTags, 'slug');
    
          doNotExist = tagObjects.filter(function (t) {
            return existingSlugs.indexOf(t.slug) < 0;
          });
        }
        else {
          doNotExist = tagObjects;
        }
        
        // save tags that do not exist
        return new Tags(doNotExist).mapThen(function(model) {
          return model.save()
          .then(function() {
            return model.get('id');
          });
        })
        // return ids of all passed tags
        .then(function (ids) {
          return _.union(ids, _.pluck(existingTags, 'id'));
        });
      });
    }

This function uses a simple algorhythm:

  1. Before saving tags, check which ones already exist
  2. Filter the existing tags out and only save the new ones
  3. Get the ids of newly created tags and combine them with ids of existing ones 
  4. Resolve the promise. 


The hard part is done but we would also like to query our posts using categories and tags.

    router.route('/posts/category/:id')
      .get(function (req, res) {
        Category.forge({id: req.params.id})
        .fetch({withRelated: ['posts']})
        .then(function (category) {
          var posts = category.related('posts');
    
          res.json({error: false, data: posts.toJSON()});
        })
        .otherwise(function (err) {
          res.json({error: true, data: {message: err.message}});
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
          res.json({error: true, data: {message: err.message}});
        });
      });


The `/posts/category/:id` route will allow us to only fetch posts from a particular category while the `/posts/tag/:slug` route will only fetch posts from a particular tag.

That's it, our API is done! Let's wrap up by adding the routes to the main appliction and creating a server.

    app.use('/api', router);
    
    app.listen(3000, function() {
      console.log("✔ Express server listening on port %d in %s mode", 3000, app.get('env'));
    });


If you were following the article closely you would have noticed that I left out the `PUT /posts/:id` and `DELETE /posts/:id` routes - that's your homework, implement the 2 routes to complete your API.

[Postman](https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm?hl=en) is a great Google Chrome extension for communicating with restful APIs - install it if you don't already have it and start testing your API.

You can download all the code used in this article and the previous one from Github: [github.com/qawemlilo/node-mysql](https://github.com/qawemlilo/node-mysql).


