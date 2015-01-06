
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
var Schema = require('./schema');
var sequence = require('when/sequence');
var _ = require('lodash');


function createTable(tableName) {

  return knex.schema.createTable(tableName, function (table) {

    var column;
    var columnKeys = _.keys(Schema[tableName]);

    _.each(columnKeys, function (key) {
      // creation distinguishes between text with fieldtype, string with maxlength and all others
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

      if (Schema[tableName][key].hasOwnProperty('references')) {
        //check if table exists?
        column.references(Schema[tableName][key].references);
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

  console.log('Creating tables...');

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