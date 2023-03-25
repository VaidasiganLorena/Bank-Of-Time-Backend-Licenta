import express from 'express'
import mysql from 'mysql2'
import bcrypt from 'bcryptjs'
import bodyParser from 'body-parser'
import { body, validationResult } from 'express-validator'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app = express()
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  }),
)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'bank-of-time-database',
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const generateAccessToken = (email) => {
  return jwt.sign({ email }, `${process.env.SECRET_TOKEN}`, {
    expiresIn: '3600s',
  })
}

app.post(
  '/user/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).send(errors).end()
    } else {
      const userLoginInfo = {
        email: req.body.email,
        password: req.body.password,
      }
      const bank_of_time = db
      bank_of_time.execute(
        `SELECT userUuid, email, password FROM users WHERE email = '${userLoginInfo.email}'`,
        (dbErr, dbRes) => {
          if (dbErr) {
            res.status(401).send({ response: dbErr.message, status: 401 }).end()
          }
          if (dbRes) {
            if (dbRes.length === 0) {
              res
                .status(401)
                .send({ response: 'Acest email nu este asociat cu nici un cont.', status: 401 })
                .end()

              return
            } else {
              if (dbRes[0].email.includes('@bankoftime.ro') === true) {
                res.status(200).send({
                  response: {
                    userUuid: dbRes[0].userUuid,
                    role: 'admin',
                  },
                  status: 200,
                })
              }
              if (bcrypt.compareSync(userLoginInfo.password, dbRes[0].password)) {
                const authToken = generateAccessToken(dbRes[0].email)

                res
                  .status(200)
                  .send({
                    response: {
                      userUuid: dbRes[0].userUuid,
                      authToken: authToken,
                    },
                    status: 200,
                  })
                  .end()
              } else {
                res
                  .status(401)
                  .send({ response: 'Emailul & parola sunt greșite!', status: 401 })
                  .end()
              }
            }
          }
        },
      )
    }
  },
)
app.get('/user/:uuid', (req, res) => {
  const bank_of_time = db
  let tokenValid = true
  // jwt.verify(req.headers.authtoken, process.env.SECRET_TOKEN, (err, decoded) => {
  //   if (err) {
  //     res.status(400).send({ response: 'Token invalid/expired!', status: 400 }).end()
  //   }
  //   if (decoded) {
  //     req.tokenData = decoded
  //     tokenValid = true
  //   }
  // })
  if (tokenValid) {
    const userUuid = req.params.uuid
    bank_of_time.execute(`SELECT * FROM users WHERE userUuid = '${userUuid}'`, (dbErr, dbRes) => {
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
      if (dbRes) {
        res.status(200).send({ response: dbRes, status: 200 }).end()
      }
    })
  }
})
app.put('/user/update/:uuid', (req, res) => {
  const bank_of_time = db
  let tokenValid = true
  jwt.verify(req.headers.authtoken, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      res.status(400).send({ response: 'Token invalid/expired!', status: 400 }).end()
    }
    if (decoded) {
      req.tokenData = decoded
      tokenValid = true
    }
  })
  if (tokenValid) {
    const userUuid = req.params.uuid
    let fieldForUpdate = []
    Object.keys(req.body).map((key) => {
      fieldForUpdate.push(' ' + key + '=' + "'" + req.body[key] + "'")
    })
    const persoQuery = `UPDATE users SET` + fieldForUpdate.join() + `WHERE userUuid = '${userUuid}'`
    bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
      if (dbRes) {
        res.status(200).send({ response: 'User updated with success!', status: 200 }).end()
      }
    })
  }
})
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

      console.log(userInformation)

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
            }
            if (dbRes) {
              console.log(dbRes)
              res.status(200).send({ response: 'User created with success!', status: 200 }).end()
            }
          },
        )
      }
    }
  },
),
  app.get('/gainers', (req, res) => {
    const bank_of_time = db
    const querySelectGainers =
      'SELECT `gainers`.* ,`helpTypes`.* FROM `helpTypes` LEFT JOIN `gainers` ON `gainers`.`helpTypeUuid` = `helpTypes`.`helpTypeUuid` WHERE `gainers`.`helpTypeUuid`= `helpTypes`.`helpTypeUuid`;'
    bank_of_time.execute(querySelectGainers, (dbErr, dbRes) => {
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
      if (dbRes) {
        res.status(200).send({ response: dbRes, status: 200 }).end()
      }
    })
  })
app.get('/gainers/filter', (req, res) => {
  const bank_of_time = db

  const filters = (({ helpTypeUuid, city }) => ({
    helpTypeUuid,
    city,
  }))(req.query)
  const querySelectGainers =
    'SELECT `gainers`.* ,`helpTypes`.* FROM `helpTypes` LEFT JOIN `gainers` ON `gainers`.`helpTypeUuid` = `helpTypes`.`helpTypeUuid` WHERE `gainers`.`helpTypeUuid`= `helpTypes`.`helpTypeUuid`;'

  bank_of_time.execute(querySelectGainers, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: 'Error while reading', status: 400 }).end()
      console.log(dbErr)
    }
    let filteredGainers = dbRes.filter((gainer) => {
      let isValid = true
      for (let key in filters) {
        filters[key] ? (isValid = isValid && gainer[key] == filters[key]) : null
      }
      return isValid
    })
    res.status(200).send({
      response: filteredGainers,
      status: 200,
      count: filteredGainers.length,
    })
  })
})
app.listen('3306')
