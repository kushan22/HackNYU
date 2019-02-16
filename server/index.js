const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');

const app = new express();


app.set('view engine','ejs');
if (app.get('env') === 'development'){
    app.locals.pretty = true;
}
app.set('views',path.join(__dirname,'./views'));

const options = {
    host: "localhost",
    user : "root",
    password:"Coldplay1",
    database: "hacknyu",
    port: 8889, 

};

var connection = mysql.createConnection(options);

if(!connection){
    console.log("ERROR");
}
// Setting Mysql Session
const sessionStore = new MySQLStore({},connection);

app.use(session({
    key:'hacknyu_cookie',
    secret:'Dogs are Love',
    store:sessionStore,
    resave: false,
    saveUninitialized:false,
}));

app.use(bodyParser.urlencoded({extended:true}));
app.use("/",routes());

app.use(express.static('public'));
app.get('/favicon.ico',(req,res,next) => {
    return res.sendStatus(204);
});


const PORT = process.env.PORT || 5000; 
app.listen(PORT); 
