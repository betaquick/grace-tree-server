# README #

Grace Tree Services...

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

Node Environment
```SH
export DB_USERNAME='<mysql_user_name>'
export DB_PASSWORD='<mysql_user_password>''
export DEBUG='*'
```
or create `.env` in _project directory_ with the above keys specified

Install local
> `npm run install-local`

Run server
> `npm run start`

Install knex DB migrations
> `npm install knex -g`

Migrating database
> `knex migrate:latest`
or
> `knex migrate:latest --env development`

Seed the database
> `knex seed:run`

* Summary of set up
* Configuration
* Dependencies
* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###


* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact
