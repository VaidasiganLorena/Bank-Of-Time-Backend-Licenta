const express = require("express");
const mysql = require("mysql");

const app = express();

//conexiunea
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: 'bank-of-time-database'
});

// conectare baze de date
db.connect((err) => {
  if (err) {
    throw err;
  }
  
});

 //creez db
// app.get("/createbd",(req,res)=> {
//     let sql="CREATE DATABASE bank-of-time-database"
//     db.query(sql,(err,result)=>{
//         if (err) throw err;
//         console.log("Conexiunea reusita!");
//         res.send("Baza de date este creata!");
//     });
//     });
    
// creez tabele
// app.get("/login", (req, res) => {
//     let sql =
//       "CREATE TABLE users(id int AUTO_INCREMENT, firstName VARCHAR(255), lastName VARCHAR(255),email VARCHAR(255), password VARCHAR(255), PRIMARY KEY(id))";
//     db.query(sql, (err, result) => {
//       if (err) throw err;
//       console.log("result");
//       res.send("Users table crated");
//     });
//   });
  //insert user
  app.get("/users", (req, res) => {
    const q = "SELECT * FROM users";
    db.query(q, (err, data) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }
      return res.json(data);
    });
  });

 
app.listen("5000");
