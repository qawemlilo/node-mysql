So you have been playing around with Node.js writing pretty little programs and marvelling at how awesome it is. You have finally wrapped your brain around this async stuff and feel confident that you can go to callback hell and still find your way back. But then you realise, your newly acquired wizardry isn't that much fun if you cannot collect data, store it in a database, and do something useful with it. So you jump on your broom and start surfing the interwebs in search of a solution.

When you search the internet for a Node.js database solution you will quickly notice how popular NoSQL databases are. As someone who is new to Node.js it is easy to start believing that it only speaks to NoSQL databases or that it doesn't work well with SQL databases. I held this perception for quite a long time. Sometimes a SQL database may be a better solution for you, it is a good fit if you are dealing with a lot of relational data that requires complex queries. Node.js prides itself at being very efficient in performing IO intensive tasks - that includes communicating with both SQL and NoSQL databases. [Ghost](https://github.com/TryGhost/Ghost), one of the most prominent opensource Node projects, uses SQL databases. Today I will share with you how I use MySQL in my Node.js projects.

### Choosing an ORM
The standard way of connecting to a database in most platforms is through an ORM, it provides a nice API to interact with your programs. After doing some research I came across Bookshelf.js, it is described as a JavaScript ORM for Node.js, built on the Knex SQL query builder and designed to work well with PostgreSQL, MySQL, and SQLite3.

My decision to pick [Bookshelf.js](http://bookshelfjs.org) was influenced by the following reasons:

 - It has good documentation
 - It extends the Model and Collection patterns of Backbone.js - which I was already familiar with.
 - It is used by the [Ghost](https://github.com/TryGhost/Ghost) project - while reading the project's code base I found it quite intuitive.
 - It uses promises which makes handling callbacks less painful
 - It has a large community following and is actively maintained

### Getting started
To get up and running you need to install [Bookshelf.js](http://bookshelfjs.org) and its dependencies.

    npm install bookshelf mysql knex --save

Making a database connection is pretty straight forward, let's do it in `app.js`:

### app.js

    var knex = require('knex')({
        client: 'mysql',
        connection: {
            host     : '127.0.0.1',
            user     : 'your_database_user',
            password : 'your_database_password',
            database : 'myapp_test',
            charset  : 'utf8'
      }
    });

    var Bookshelf = require('bookshelf')(knex);

We need to be able to reuse the same connection throughout our application, make sure it is accessible globally.


### Using Bookshelf
The example that I am going to use to demonstrate how Bookshelf works is that of a blog post. We will create a blog post that includes author, category, and tags metadata.

Firstly, we need to create database tables, let's create a separate file and name it `schema.js`. This file contains the schema for our database tables.

### schema.js
    var Schema = {
      users: {
        id: {type: 'increments', nullable: false, primary: true},
        email: {type: 'string', maxlength: 254, nullable: false, unique: true},
        name: {type: 'string', maxlength: 150, nullable: false}
      },
    
    
      categories: {
        id: {type: 'increments', nullable: false, primary: true},
        name: {type: 'string', maxlength: 150, nullable: false}
      },
    
      posts: {
        id: {type: 'increments', nullable: false, primary: true},
        user_id: {type: 'integer', nullable: false, unsigned: true},
        category_id: {type: 'integer', nullable: false, unsigned: true},
        title: {type: 'string', maxlength: 150, nullable: false},
        slug: {type: 'string', maxlength: 150, nullable: false, unique: true},
        html: {type: 'text', maxlength: 16777215, fieldtype: 'medium', nullable: false},
        created_at: {type: 'dateTime', nullable: false},
        updated_at: {type: 'dateTime', nullable: true}
      },
      
      
      tags: {
        id: {type: 'increments', nullable: false, primary: true},
        slug: {type: 'string', maxlength: 150, nullable: false, unique: true},
        name: {type: 'string', maxlength: 150, nullable: false}
      },
      
      
      posts_tags: {
        id: {type: 'increments', nullable: false, primary: true},
        post_id: {type: 'integer', nullable: false, unsigned: true},
        tag_id: {type: 'integer', nullable: false, unsigned: true}
      }
    };
    
    module.exports = Schema;


**Pro Tip:** Promises will save you a lot of time and headaches when dealing with databases in Node, my preferred flavour is [when](https://github.com/cujojs/when). Also install a utility library for doing common tasks, `lodash` is one of the best.

    npm install when lodash --save

We need another file for the code that creates our tables, let's call it `migrate.js`. It requires `knex` so let's copy the code that we wrote earlier and place it at the beginning of the file.

### migrate.js
I also copied the `createTable` function from the [Ghost](https://github.com/TryGhost/Ghost) project, it accepts a `tableName` string and returns a promise.

    var knex = require('knex')({
        client: 'mysql',
        connection: {
            host     : 'localhost',
            user     : 'your_database_user',
            password : 'your_database_password',
            database : 'myapp_test',
            charset  : 'utf8'
      }
    });
    
    var Schema = require('./schema');
    var sequence = require('when/sequence');
    var _ = require('lodash');


    function createTable(tableName) {
    
      return knex.schema.createTable(tableName, function (table) {
    
        var column;
        var columnKeys = _.keys(Schema[tableName]);
    
        _.each(columnKeys, function (key) {
          if (Schema[tableName][key].type === 'text' && Schema[tableName][key].hasOwnProperty('fieldtype')) {
            column = table[Schema[tableName][key].type](key, Schema[tableName][key].fieldtype);
          }
          else if (Schema[tableName][key].type === 'string' && Schema[tableName][key].hasOwnProperty('maxlength')) {
            column = table[Schema[tableName][key].type](key, Schema[tableName][key].maxlength);
          }
          else {
            column = table[Schema[tableName][key].type](key);
          }
    
          if (Schema[tableName][key].hasOwnProperty('nullable') && Schema[tableName][key].nullable === true) {
            column.nullable();
          }
          else {
            column.notNullable();
          }
    
          if (Schema[tableName][key].hasOwnProperty('primary') && Schema[tableName][key].primary === true) {
            column.primary();
          }
    
          if (Schema[tableName][key].hasOwnProperty('unique') && Schema[tableName][key].unique) {
            column.unique();
          }
    
          if (Schema[tableName][key].hasOwnProperty('unsigned') && Schema[tableName][key].unsigned) {
            column.unsigned();
          }
    
          if (Schema[tableName][key].hasOwnProperty('references') && Schema[tableName][key].hasOwnProperty('inTable')) {
            //check if table exists?
            column.references(Schema[tableName][key].references);
            column.inTable(Schema[tableName][key].inTable);
          }
    
          if (Schema[tableName][key].hasOwnProperty('defaultTo')) {
            column.defaultTo(Schema[tableName][key].defaultTo);
          }
        });
      });
    }


    function createTables () {
      var tables = [];
      var tableNames = _.keys(Schema);
    
      tables = _.map(tableNames, function (tableName) {
        return function () {
          return createTable(tableName);
        };
      });
    
      return sequence(tables);
    }


    createTables()
    .then(function() {
      console.log('Tables created!!');
      process.exit(0);
    })
    .otherwise(function (error) {
      throw error;
    });

Run the file from the command-line `node migrate`. If everything went well you will see the text `Tables created!!`.

**Another Pro Tip:** [Ghost](https://github.com/TryGhost/Ghost) is an amazing piece of software, its code is clean and well written. When you get stuck with Bookshelf and cannot find an answer on Google, just dig through the code base and look at how Bookshelf is used. I find myself constantly referring to it for solutions.

Now back to `app.js` - I only use Bookshelf in data structures, i.e, in my Models and Collections. Let's go ahead and create a few Models:

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
            return this.hasMany(Tag);
        },

        author: function () {
            return this.belongsTo(User);
        }
    });

    // Category model
    var Category = Bookshelf.Model.extend({
    
        tableName: 'categories',
    
        posts: function () {
           return this.belongsToMany(Post, 'category_id');
        }
    });

    // Tag model
    var Tag = Bookshelf.Model.extend({
        tableName: 'tags',

        posts: function () {
           return this.belongsToMany(Post);
        }
    });

Bookshelf is heavily influenced by Eloquent ORM and handles one-to-one, one-to-many, and many-to-many associations by defining relationships on Models.
What is important to know is how Bookshelf handles these relationships under the hood. Let us look at some of the special properties and methods.

### hasTimestamps
Defining a `hasTimestamps` property in a model and assigning a value of `true` has special effects. Upon creation or when updating, Bookshelf will automatically insert values for the `created_at` and `updated_at` columns.

### hasMany
The `hasMay` method tells the current model that it has a one-to-many relationship with the model contained in its arguments.

### belongsTo
The `belongsTo` method  tells the current model that it has a one-to-one or one-to-many relationship with the model contained in its arguments.

### belongsToMay
The `belongsToMay` method  tells the current model that it has a many-to-many relationship with the model contained in its arguments. This type of a relationship is joined through another table. In our example, the `Post` model has a many-to-many relationship with the `Tags` model. Bookshelf will assume that there is a table named `posts_tags` -  it joins the two table names with an underscore. This is all done under the hood, all you have to do is create the table and Bookshelf will do the rest.

In other relationships Bookshelf assumes that table names are plurals and that the foreignkey is the singular post-fixed with `_id`. It uses the following format:`<TableNameSingular>_id`. In our example,  the `author` method in the `Post` model will be mapped to the `User` model (where the table name is `users`) through the foreignkey `user_id` (substring `user` is the singular of table name `users`).

If your foreignkey and table name do not conform to the above convention you need to specify the foreignkey as a second argument like we did for the relationship between `Posts` and `Categories`.

Phew, hope that makes sense, if not leave a comment.

In the next post we will create a small API that uses our Models. Stay tuned.