<<<<<<< HEAD
import express from 'express'
import { Router } from 'express'
import mysql from 'mysql2'
import bcrypt from 'bcryptjs'
import bodyParser from 'body-parser'
import { body, validationResult } from 'express-validator'

const app = express()

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'bank-of-time-database',
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/user/login', (req, res) => {
  const bank_of_time = db
  bank_of_time.execute(`SELECT * FROM users `, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: dbErr.message, status: 400 }).end()
      bank_of_time.end()
      return
    }
    if (dbRes) {
      res.status(200).send({ response: dbRes, status: 200 })
      bank_of_time
      return
    }
  })
}),
  app.post(
    '/user/register',
    body('firstName').isLength({ min: 1 }),
    body('lastName').isLength({ min: 1 }),
    body('email').isEmail().normalizeEmail(),
    body('phoneNumber').isLength({ min: 1 }),
    body('password').isLength({ min: 1 }),
    body('city').isLength({ min: 1 }),
    body('gender').isLength({ min: 1 }),
    (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).send(errors).end()
      } else {
        const userInformation = {
          firstname: req.body.firstName,
          lastname: req.body.lastName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          password: req.body.password,
          city: req.body.city,
          gender: req.body.gender,
        }

        const bank_of_time = db
        const hashedPw = bcrypt.hashSync(userInformation.password, 10)
        if (hashedPw) {
          bank_of_time.execute(
            `INSERT INTO users (firstname, lastname, email, phoneNumber, password, city, gender, userUuid) VALUES (
      '${userInformation.firstname}','${userInformation.lastname}','${userInformation.email}' ,'${userInformation.phoneNumber}', '${hashedPw}' ,
      '${userInformation.city}','${userInformation.gender}', uuid());`,
            (dbErr, dbRes) => {
              if (dbErr) {
                res.status(400).send({ response: dbErr.message, status: 400 }).end()
                bank_of_time.end()
                return
              }
              if (dbRes) {
                console.log(dbRes)
                res.status(200).send({ response: 'User created with success!', status: 200 }).end()
                bank_of_time
                return
              }
            },
          )
        }
      }
    },
  ),
  app.listen('3306')
=======
const express = require("express");
const mysql = require("mysql");
const cors = require('cors')
const app = express();

 app.use(express.urlencoded({extended: true}))
 app.use(cors())
//conexiunea
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bank-of-time-database",
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
app.get("/users",cors,async (req, res) => {
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
>>>>>>> f94410864b183d235fccd69ceeaf7e44d302ec00
