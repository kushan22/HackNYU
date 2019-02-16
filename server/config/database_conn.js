const mysql = require('mysql');

    const con = mysql.createConnection({
        host: "localhost",
        user : "root",
        password:"Coldplay1",
        database: "hacknyu",
        port: 8889,
        //insecureAuth: false
    });

con.connect((err)=>{
    if(err) console.log(err);
    else console.log("Connected");
    
});

module.exports = con;