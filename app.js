import express, { response } from "express"
import mysql from "mysql2"
import bcrypt from "bcryptjs"
import bodyParser from "body-parser"
import { body, validationResult } from "express-validator"
import cors from "cors"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import dotenv from "dotenv"
import console from "console"
dotenv.config()
export const app = express()

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  })
)
export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Admin2025",
  database: "mysql",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})
app.listen(8080, () => {
  console.log(`Server running on port 8080`)
})
app.get("/", (req, res) => {
  res.send("Hello from port 8080!")
})
app.use(bodyParser.json({ limit: "50mb" }))
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
)

const generateAccessToken = (email) => {
  return jwt.sign({ email }, `${process.env.SECRET_TOKEN}`, {
    expiresIn: "3600s",
  })
}

app.post(
  "/user/login",
  body("email").isEmail(),
  body("password").isLength({ min: 1 }),
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
        `SELECT userUuid, email, password, role, firstname, lastname FROM users WHERE email = '${userLoginInfo.email}'`,
        (dbErr, dbRes) => {
          if (dbErr) {
            res.status(401).send({ response: dbErr.message, status: 401 }).end()
          }
          if (dbRes) {
            if (dbRes.length === 0) {
              res
                .status(401)
                .send({
                  response: "Acest email nu este asociat cu nici un cont.",
                  status: 401,
                })
                .end()

              return
            } else {
              if (
                bcrypt.compareSync(userLoginInfo.password, dbRes[0].password)
              ) {
                const authToken = generateAccessToken(dbRes[0].email)

                res
                  .status(200)
                  .send({
                    response: {
                      userUuid: dbRes[0].userUuid,
                      authToken: authToken,
                      role: dbRes[0].role,
                      firstName: dbRes[0].firstname,
                      lastName: dbRes[0].lastname,
                    },
                  })
                  .end()
              } else {
                res
                  .status(401)
                  .send({
                    response: "Emailul & parola sunt greșite!",
                    status: 401,
                  })
                  .end()
              }
            }
          }
        }
      )
    }
  }
)
app.get("/user/:uuid", (req, res) => {
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
    bank_of_time.execute(
      `SELECT * FROM users WHERE userUuid = '${userUuid}'`,
      (dbErr, dbRes) => {
        if (dbErr) {
          res.status(400).send({ response: dbErr.message, status: 400 }).end()
        }
        if (dbRes) {
          res.status(200).send({ response: dbRes, status: 200 }).end()
        }
      }
    )
  } else {
    res.status(401).send({ response: "Token invalid", status: 401 }).end()
  }
})
app.put("/user/update/:uuid", (req, res) => {
  const bank_of_time = db

  const userUuid = req.params.uuid
  let fieldForUpdate = []
  Object.keys(req.body).map((key) => {
    fieldForUpdate.push(" " + key + "=" + "'" + req.body[key] + "'")
  })
  const persoQuery =
    `UPDATE users SET` +
    fieldForUpdate.join() +
    `WHERE userUuid = '${userUuid}'`
  bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
    if (dbErr) {
      return res
        .status(400)
        .send({ response: dbErr.message, status: 400 })
        .end()
    }
    if (dbRes) {
      return res
        .status(200)
        .send({
          response: "Utilizatorul a fost actualizat cu succes!",
          status: 200,
        })
        .end()
    }
  })
})
app.put(
  "/user/update/cv/:uuid",
  body("cv").isLength({ min: 1 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send(errors).end()
    } else {
      const bank_of_time = db
      const userUuid = req.params.uuid
      const cv = req.body.cv

      bank_of_time.execute(
        `UPDATE users SET cv = ? WHERE userUuid = ?`,
        [cv, userUuid],
        (dbErr, dbRes) => {
          if (dbErr) {
            return res
              .status(400)
              .send({ response: dbErr.message, status: 400 })
              .end()
          }
          if (dbRes) {
            return res
              .status(200)
              .send({
                response: "CV-ul a fost actualizat cu succes!",
                status: 200,
              })
              .end()
          }
        }
      )
    }
  }
)
app.get("/user/cv/:uuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.uuid

  bank_of_time.execute(
    `SELECT cv FROM users WHERE userUuid = ?`,
    [userUuid],
    (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes && dbRes.length > 0) {
        return res
          .status(200)
          .send({
            response: {
              cv: dbRes[0].cv,
            },
            status: 200,
          })
          .end()
      } else {
        return res
          .status(404)
          .send({
            response: "Utilizatorul nu a fost găsit sau nu are CV!",
            status: 404,
          })
          .end()
      }
    }
  )
})
app.put(
  "/gainer/update/list-of-dates/:gainerUuid",
  body("listOfDates").isLength({ min: 1 }),
  (req, res) => {
    const bank_of_time = db
    const gainerUuid = req.params.gainerUuid
    const listOfDates = req.body.listOfDates
    const persoQuery = `UPDATE gainers SET listOfDates = '${listOfDates}' WHERE gainerUuid = '${gainerUuid}'`
    bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({
            response: "Lista cu date a fost actualizat cu succes!",
            status: 200,
          })
          .end()
      }
    })
  }
)
app.delete("/appointment/delete/:appointmentUuid", (req, res) => {
  const bank_of_time = db
  const appointmentUuid = req.params.appointmentUuid
  bank_of_time.execute(
    `DELETE FROM appointments WHERE appointmentUuid='${appointmentUuid}'`,
    (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({
            response: "Programarea a fost anulată cu succes!",
            status: 200,
          })
          .end()
      }
    }
  )
})
app.put(
  "/appointments/update/status/:appointmentUuid",
  body("status").isLength({ min: 1 }),
  (req, res) => {
    const bank_of_time = db
    const appUuid = req.params.appointmentUuid
    const status = req.body.status

    // First, get the appointment details to check if we need to update countTime
    bank_of_time.execute(
      `SELECT userUuid, timeVolunteering, status FROM appointments WHERE appointmentUuid = ?`,
      [appUuid],
      (dbErr, dbRes) => {
        if (dbErr) {
          return res
            .status(400)
            .send({ response: dbErr.message, status: 400 })
            .end()
        }
        if (!dbRes || dbRes.length === 0) {
          return res
            .status(404)
            .send({ response: "Programarea nu a fost găsită!", status: 404 })
            .end()
        }

        const appointment = dbRes[0]
        const wasCompleted = appointment.status === "finalizat"
        const willBeCompleted = status === "finalizat"

        // Update the appointment status
        bank_of_time.execute(
          `UPDATE appointments SET status = ? WHERE appointmentUuid = ?`,
          [status, appUuid],
          (dbErr, dbRes) => {
            if (dbErr) {
              return res
                .status(400)
                .send({ response: dbErr.message, status: 400 })
                .end()
            }
            if (dbRes) {
              // If status is being changed to "finalizat" and it wasn't completed before
              if (
                willBeCompleted &&
                !wasCompleted &&
                appointment.timeVolunteering > 0
              ) {
                // Update user's countTime
                bank_of_time.execute(
                  `UPDATE users SET countTime = countTime + ? WHERE userUuid = ?`,
                  [appointment.timeVolunteering, appointment.userUuid],
                  (dbErr, dbRes) => {
                    if (dbErr) {
                      return res
                        .status(400)
                        .send({ response: dbErr.message, status: 400 })
                        .end()
                    }
                    if (dbRes) {
                      return res
                        .status(200)
                        .send({
                          response:
                            "Status-ul a fost actualizat cu succes și orele de voluntariat au fost adăugate!",
                          status: 200,
                        })
                        .end()
                    }
                  }
                )
              } else {
                return res
                  .status(200)
                  .send({
                    response: "Status-ul a fost actualizat cu succes!",
                    status: 200,
                  })
                  .end()
              }
            }
          }
        )
      }
    )
  }
)
app.put(
  "/users/update/time-volunteering/:userUuid",
  body("timeVolunteering").isNumeric(),
  (req, res) => {
    const bank_of_time = db
    const userUuid = req.params.userUuid
    const timeVolunteering = parseInt(req.body.timeVolunteering) || 0

    bank_of_time.execute(
      `SELECT countTime FROM users WHERE userUuid = ?`,
      [userUuid],
      (dbErr, dbRess) => {
        if (dbErr) {
          return res
            .status(400)
            .send({ response: dbErr.message, status: 400 })
            .end()
        }
        if (dbRess && dbRess.length > 0) {
          const currentCountTime = parseInt(dbRess[0].countTime) || 0
          const counter = currentCountTime + timeVolunteering

          bank_of_time.execute(
            `UPDATE users SET countTime = ? WHERE userUuid = ?`,
            [counter, userUuid],
            (dbErr, dbRes) => {
              if (dbErr) {
                return res
                  .status(400)
                  .send({ response: dbErr.message, status: 400 })
                  .end()
              }
              if (dbRes) {
                return res
                  .status(200)
                  .send({
                    response:
                      "Statusul orelor de voluntariat a fost actualizat cu succes!",
                    status: 200,
                  })
                  .end()
              }
            }
          )
        } else {
          return res
            .status(404)
            .send({ response: "Utilizatorul nu a fost găsit!", status: 404 })
            .end()
        }
      }
    )
  }
)
app.post(
  "/user/register",
  body("firstName").isLength({ min: 1 }),
  body("lastName").isLength({ min: 1 }),
  body("email").isEmail(),
  body("phoneNumber").isLength({ min: 1 }),
  body("password").isLength({ min: 1 }),
  body("city").isLength({ min: 1 }),
  body("gender").isIn(["male", "female", "other"]),
  body("photo").isLength({ min: 1 }),
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
        photo: req.body.photo,
      }

      const bank_of_time = db
      const hashedPw = bcrypt.hashSync(userInformation.password, 10)
      if (hashedPw) {
        bank_of_time.execute(
          `INSERT INTO users (firstname, lastname, email, phoneNumber, password, city, gender, userUuid, photo, cv, countTime, role) VALUES (?, ?, ?, ?, ?, ?, ?, uuid(), ?, ?, ?, ?)`,
          [
            userInformation.firstname,
            userInformation.lastname,
            userInformation.email,
            userInformation.phoneNumber,
            hashedPw,
            userInformation.city,
            userInformation.gender,
            userInformation.photo,
            NULL,
            0, // countTime as number
            "user",
          ],
          (dbErr, dbRes) => {
            if (dbErr) {
              return res
                .status(400)
                .send({ response: dbErr.message, status: 400 })
                .end()
            }
            if (dbRes) {
              return res
                .status(200)
                .send({
                  response: "Utilizatorul a fost creat cu succes!",
                  status: 200,
                })
                .end()
            }
          }
        )
      }
    }
  }
),
  app.delete("/gainer/:gainerUuid", (req, res) => {
    const bank_of_time = db
    const gainerUuid = req.params.gainerUuid
    bank_of_time.execute(
      `DELETE FROM gainers WHERE gainerUuid='${gainerUuid}'`,
      (dbErr, dbRes) => {
        if (dbErr) {
          return res
            .status(400)
            .send({ response: dbErr.message, status: 400 })
            .end()
        }
        if (dbRes) {
          return res
            .status(200)
            .send({
              response: "Beneficiarul a fost șters cu succes!",
              status: 200,
            })
            .end()
        }
      }
    )
  })
app.post(
  "/volunteer-document",
  body("eventName").isLength({ min: 1 }),
  body("organization").isLength({ min: 1 }),
  body("dateFrom").isLength({ min: 1 }),
  body("dateTo").isLength({ min: 1 }),
  body("role").isLength({ min: 1 }),
  body("responsabilities").isLength({ min: 1 }),
  body("validation").isLength({ min: 1 }),
  body("skills").isLength({ min: 1 }),
  body("hours").isNumeric(),
  body("fileName").isLength({ min: 1 }),
  body("extractText").isLength({ min: 1 }),
  body("urlDoc").isLength({ min: 1 }),
  body("userUuid").isLength({ min: 1 }),

  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send(errors).end()
    } else {
      const {
        eventName,
        organization,
        dateFrom,
        dateTo,
        role,
        responsabilities,
        validation,
        skills,
        hours,
        urlDoc,
        userUuid,
        fileName,
        extractText,
      } = req.body
      const volunteerDocumentInformation = {
        eventName: eventName,
        organization: organization,
        dateFrom: dateFrom,
        dateTo: dateTo,
        role: role,
        responsabilities: responsabilities,
        validation: validation,
        skills: skills,
        hours: parseInt(hours) || 0,
        urlDoc: urlDoc,
        fileName: fileName,
        extractText: extractText,
        userUuid: userUuid,
      }

      const bank_of_time = db
      bank_of_time.execute(
        `INSERT INTO volunteerDocuments (uuidDoc, eventName, organization, dateFrom, dateTo, role, responsabilities, validation, skills, hours,fileName, extractText, urlDoc,  userUuid) VALUES (
           uuid(), '${volunteerDocumentInformation.eventName}', '${volunteerDocumentInformation.organization}', '${volunteerDocumentInformation.dateFrom}', '${volunteerDocumentInformation.dateTo}', '${volunteerDocumentInformation.role}', '${volunteerDocumentInformation.responsabilities}', '${volunteerDocumentInformation.validation}', '${volunteerDocumentInformation.skills}', ${volunteerDocumentInformation.hours}, '${volunteerDocumentInformation.fileName}', '${volunteerDocumentInformation.extractText}', '${volunteerDocumentInformation.urlDoc}', '${volunteerDocumentInformation.userUuid}');`,
        (dbErr, dbRes) => {
          if (dbErr) {
            return res
              .status(400)
              .send({ response: dbErr.message, status: 400 })
              .end()
          }
          if (dbRes) {
            bank_of_time.execute(
              `UPDATE users SET countTime = countTime + ? WHERE userUuid = ?`,
              [volunteerDocumentInformation.hours, userUuid],
              (dbErr, dbRes) => {
                if (dbErr) {
                  return res
                    .status(400)
                    .send({ response: dbErr.message, status: 400 })
                    .end()
                }
                if (dbRes) {
                  return res
                    .status(200)
                    .send({
                      response: "Documentul voluntar a fost adăugat cu succes!",
                      status: 200,
                    })
                    .end()
                }
              }
            )
          }
        }
      )
    }
  }
),
  app.get("/volunteer-document", (req, res) => {
    const bank_of_time = db
    const userUuid = req.query.userUuid

    let querySelectVolunteerDocuments = "SELECT * FROM volunteerDocuments"
    const queryParams = []

    if (userUuid) {
      querySelectVolunteerDocuments += " WHERE userUuid = ?"
      queryParams.push(userUuid)
    }

    bank_of_time.execute(
      querySelectVolunteerDocuments,
      queryParams,
      (dbErr, dbRes) => {
        if (dbErr) {
          return res.status(400).send({
            response: "Eroare în timpul citirii documentelor voluntarului!",
            error: dbErr,
            status: 400,
          })
        }

        res.status(200).send({
          response: dbRes,
          status: 200,
          count: dbRes.length || 0,
        })
      }
    )
  })
app.delete("/volunteer-document/:uuidDoc", (req, res) => {
  const bank_of_time = db
  const uuidDoc = req.params.uuidDoc
  bank_of_time.execute(
    `SELECT hours, userUuid FROM volunteerDocuments WHERE uuidDoc = ?`,
    [uuidDoc],
    (dbErr, dbRess) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (!dbRess || dbRess.length === 0) {
        return res
          .status(404)
          .send({
            response: "Documentul voluntar nu a fost găsit!",
            status: 404,
          })
          .end()
      }

      const counter = dbRess[0].hours
      const userUuid = dbRess[0].userUuid

      bank_of_time.execute(
        `UPDATE users SET countTime = countTime - ? WHERE userUuid = ?`,
        [counter, userUuid],
        (dbErr, dbRes) => {
          if (dbErr) {
            return res
              .status(400)
              .send({ response: dbErr.message, status: 400 })
              .end()
          }
          if (dbRes) {
            bank_of_time.execute(
              `DELETE FROM volunteerDocuments WHERE uuidDoc='${uuidDoc}'`,
              (dbErr, dbRes) => {
                if (dbErr) {
                  return res
                    .status(400)
                    .send({ response: dbErr.message, status: 400 })
                    .end()
                }
                if (dbRes) {
                  return res
                    .status(200)
                    .send({
                      response: "Documentul voluntar a fost șters cu succes!",
                      status: 200,
                    })
                    .end()
                }
              }
            )
          }
        }
      )
    }
  )
})
app.post(
  "/newgainer",
  body("nameGainer").isLength({ min: 1 }),
  body("dateOfBirth"),
  body("phoneNumberGainer").isLength({ min: 1 }),
  body("adress").isLength({ min: 1 }),
  body("cityGainer").isLength({ min: 1 }),
  body("genderGainer").isLength({ min: 1 }),
  body("photoGainer").isLength({ min: 1 }),
  body("listOfDates").isLength({ min: 1 }),
  body("description").isLength({ min: 1 }),
  body("helpTypeUuid").isLength({ min: 1 }),

  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send(errors).end()
    } else {
      const gainerInformation = {
        nameGainer: req.body.nameGainer,
        dateOfBirth: req.body.dateOfBirth,
        phoneNumberGainer: req.body.phoneNumberGainer,
        adress: req.body.adress,
        cityGainer: req.body.cityGainer,
        genderGainer: req.body.genderGainer,
        photoGainer: req.body.photoGainer,
        listOfDates: req.body.listOfDates,
        description: req.body.description,
        helpTypeUuid: req.body.helpTypeUuid,
      }

      const bank_of_time = db
      bank_of_time.execute(
        `INSERT INTO gainers (
          gainerUuid, 
          nameGainer, 
          adress, 
          phoneNumberGainer, 
          dateOfBirth, 
          cityGainer, 
          genderGainer, 
          description, 
          photoGainer, 
          listOfDates, 
          helpTypeUuid
        ) VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gainerInformation.nameGainer,
          gainerInformation.adress,
          gainerInformation.phoneNumberGainer,
          gainerInformation.dateOfBirth,
          gainerInformation.cityGainer,
          gainerInformation.genderGainer,
          gainerInformation.description,
          gainerInformation.photoGainer,
          gainerInformation.listOfDates,
          gainerInformation.helpTypeUuid,
        ],
        (dbErr, dbRes) => {
          if (dbErr) {
            return res
              .status(400)
              .send({ response: dbErr.message, status: 400 })
              .end()
          }
          if (dbRes) {
            return res
              .status(200)
              .send({
                response: "Beneficiarul a fost adăugat cu succes!",
                status: 200,
              })
              .end()
          }
        }
      )
    }
  }
),
  app.put("/gainer/update/:gainerUuid", (req, res) => {
    const bank_of_time = db
    const gainerUuid = req.params.gainerUuid
    let fieldForUpdate = []
    Object.keys(req.body).map((key) => {
      fieldForUpdate.push(" " + key + "=" + "'" + req.body[key] + "'")
    })
    const persoQuery =
      `UPDATE gainers SET` +
      fieldForUpdate.join() +
      `WHERE gainerUuid = '${gainerUuid}'`
    bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({
            response: "Beneficiarul a fost actualizat cu succes!",
            status: 200,
          })
          .end()
      }
    })
  }),
  app.get("/gainers", (req, res) => {
    const bank_of_time = db

    const helpType = req.query.helpTypeUuid
    const city = req.query.city
    const dateInterval = req.query.dateInterval

    let querySelectGainers =
      "SELECT `gainers`.* ,`helpType`.* FROM `helpType` LEFT JOIN `gainers` ON `gainers`.`helpTypeUuid` = `helpType`.`helpTypeUuid` WHERE `gainers`.`helpTypeUuid`= `helpType`.`helpTypeUuid`"

    if (helpType) {
      querySelectGainers += " AND `gainers`.helpTypeUuid = '" + helpType + "'"
    }
    if (city) {
      querySelectGainers += " AND `gainers`.cityGainer = '" + city + "'"
    }
    let interval
    if (dateInterval) {
      interval = dateInterval.split(",")
    }
    bank_of_time.execute(querySelectGainers, (dbErr, dbRes) => {
      if (dbErr) {
        console.log(dbErr)
        res
          .status(400)
          .send({
            response: "Eroare în timpul citirii!",
            error: dbErr,
            status: 400,
          })
          .end()
      } else {
        if (interval && interval.length > 1) {
          const updatedDbRes = []
          dbRes.forEach((elem) => {
            const elemDates = elem.listOfDates.split(",")
            elemDates.forEach((date) => {
              if (
                new Date(date) > new Date(interval[0]) &&
                new Date(date) < new Date(interval[1])
              ) {
                updatedDbRes.push(elem)
              }
            })
          })
          res.status(200).send({
            response: updatedDbRes,
            status: 200,
            count: updatedDbRes.length || 0,
          })
        } else {
          res.status(200).send({
            response: dbRes,
            status: 200,
            count: dbRes.length || 0,
          })
        }
      }
    })
  })

app.delete("/user/:uuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.uuid
  bank_of_time.execute(
    `DELETE FROM users WHERE userUuid='${userUuid}'`,
    (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({
            response: "Utilizatorul a fost șters cu succes!",
            status: 200,
          })
          .end()
      }
    }
  )
})
app.put("/user/change-password/:uuid", (req, res) => {
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
    let fieldForUpdate = []

    Object.keys(req.body).map((key) => {
      fieldForUpdate.push(
        " " + key + "=" + "'" + bcrypt.hashSync(req.body[key], 10) + "'"
      )
    })

    const persoQuery =
      `UPDATE users SET` +
      fieldForUpdate.join() +
      `WHERE userUuid = '${userUuid}'`
    bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
      if (dbErr) {
        return res
          .status(400)
          .send({ response: dbErr.message, status: 400 })
          .end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({ response: "Parola a fost schimbată cu succes!", status: 200 })
          .end()
      }
    })
  } else {
    res.status(401).send({ response: "Token invalid", status: 401 }).end()
  }
})

//appointments
app.post(
  "/appointment",
  body("userUuid").isLength({ min: 1 }),
  body("gainerUuid").isLength({ min: 1 }),
  body("dateOfAppointment").isLength({ min: 1 }),
  body("status").isLength({ min: 1 }),
  body("timeVolunteering").isNumeric(),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).send(errors).end()
    } else {
      const appointment = {
        userUuid: req.body.userUuid,
        gainerUuid: req.body.gainerUuid,
        dateOfAppointment: req.body.dateOfAppointment,
        status: req.body.status,
        timeVolunteering: parseInt(req.body.timeVolunteering) || 0,
      }

      const bank_of_time = db

      bank_of_time.execute(
        `INSERT INTO appointments (userUuid, gainerUuid, dateOfAppointment, status, timeVolunteering) VALUES (?, ?, ?, ?, ?)`,
        [
          appointment.userUuid,
          appointment.gainerUuid,
          appointment.dateOfAppointment,
          appointment.status,
          appointment.timeVolunteering,
        ],
        (dbErr, dbRes) => {
          if (dbErr) {
            return res
              .status(400)
              .send({ response: dbErr.message, status: 400 })
              .end()
          }
          if (dbRes) {
            return res
              .status(200)
              .send({ response: "Programare înregistrată!", status: 200 })
              .end()
          }
        }
      )
    }
  }
)
app.get("/appointment/:uuid", (req, res) => {
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
    const querySelectGainers = `SELECT * FROM gainers LEFT OUTER JOIN appointments ON appointments.gainerUuid = gainers.gainerUuid WHERE appointments.gainerUuid = gainers.gainerUuid AND userUuid = '${userUuid}';`
    bank_of_time.execute(querySelectGainers, (dbErr, dbRes) => {
      if (dbRes) {
        res
          .status(200)
          .send({
            response: dbRes,
            status: 200,
          })
          .end()
      }
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
    })
  } else {
    res.status(401).send({ response: "Token invalid", status: 401 }).end()
  }
})
app.get("/gainer-appointments/:gainerUuid", (req, res) => {
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
    const gainerUUuid = req.params.gainerUuid
    const querySelectGainers = `SELECT * FROM appointments LEFT OUTER JOIN users ON users.userUuid = appointments.userUuid WHERE gainerUuid = '${gainerUUuid}' ORDER BY dateOfAppointment DESC;`
    bank_of_time.execute(querySelectGainers, (dbErr, dbRes) => {
      if (dbRes) {
        res.status(200).send({ response: dbRes, status: 200 }).end()
      }
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
    })
  } else {
    res.status(401).send({ response: "Token invalid", status: 401 }).end()
  }
})
app.get("/appointments", (req, res) => {
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
    const queryAppoiments = `SELECT * FROM gainers LEFT OUTER JOIN appointments ON appointments.gainerUuid = gainers.gainerUuid LEFT OUTER JOIN users ON users.userUuid = appointments.userUuid ;`
    bank_of_time.execute(queryAppoiments, (dbErr, dbRes) => {
      if (dbErr) {
        res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
      if (dbRes) {
        res.status(200).send({ response: dbRes, status: 200 }).end()
      }
    })
  } else {
    res.status(401).send({ response: "Token invalid", status: 401 }).end()
  }
})
app.get("/appointments-complete/:userUuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.userUuid
  const queryAppoiments = `SELECT count(*) as completeAppointment FROM appointments WHERE status='finalizat' AND userUuid='${userUuid}' ; `
  bank_of_time.execute(queryAppoiments, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: dbErr.message, status: 400 }).end()
    }
    if (dbRes) {
      res
        .status(200)
        .send({ response: dbRes[0].completeAppointment, status: 200 })
        .end()
    }
  })
})
app.get("/appointments-all/:userUuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.userUuid
  const queryAppoiments = `SELECT count(*) as allAppointment FROM appointments WHERE userUuid='${userUuid}' ; `
  bank_of_time.execute(queryAppoiments, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: dbErr.message, status: 400 }).end()
    }
    if (dbRes) {
      res
        .status(200)
        .send({ response: dbRes[0].allAppointment, status: 200 })
        .end()
    }
  })
})
app.get("/appointments-cancel/:userUuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.userUuid
  const queryAppoiments = `SELECT count(*) as cancelAppointment FROM appointments WHERE status='anulat' AND userUuid='${userUuid}' ; `
  bank_of_time.execute(queryAppoiments, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: dbErr.message, status: 400 }).end()
    }
    if (dbRes) {
      res
        .status(200)
        .send({ response: dbRes[0].cancelAppointment, status: 200 })
        .end()
    }
  })
})
app.get("/future-appointments/:userUuid", (req, res) => {
  const bank_of_time = db
  const userUuid = req.params.userUuid
  const queryAppoiments = `SELECT * FROM appointments LEFT OUTER JOIN gainers ON appointments.gainerUuid = gainers.gainerUuid WHERE appointments.userUuid='${userUuid}' AND appointments.status='În procesare'; `
  bank_of_time.execute(queryAppoiments, (dbErr, dbRes) => {
    if (dbErr) {
      res.status(400).send({ response: dbErr.message, status: 400 }).end()
    }
    if (dbRes) {
      res.status(200).send({ response: dbRes, status: 200 }).end()
    }
  })
})
app.post(
  "/mailAppointment",
  body("emailTo").isLength({ min: 1 }),
  body("firstName").isLength({ min: 1 }),
  body("nameGainer").isLength({ min: 1 }),
  body("adress").isLength({ min: 1 }),
  body("cityGainer").isLength({ min: 1 }),
  body("dateOfAppointment").isLength({ min: 1 }),

  (req, res) => {
    const mailData = {
      from: "bankoftimero@gmail.com",
      to: "vaida.lorena1702@gmail.com",
      subject: `Programare, Banca Timpului!`,
      text: `Programarea!`,
      html: `<h1></h1>
      <p>Bună ${req.body.firstName},</p>
      <p>Suntem foarte încântați că ai ales să îți ajuți comunitatea.  <b>${req.body.nameGainer}</b> este persoana pe care urmează să o ajutați în data de <b>${req.body.dateOfAppointment}</b>.</p>
      <p>Aici este adresa <b>${req.body.adress} ${req.body.cityGainer}</b> unde trebuie să mergi.</p>
      <p>Te rugăm, să vă notezi în calendar pentru a nu uita.
      <p>Dacă ai întrebări sau comentarii, nu ezita să ne contactezi.</p>
      <p>Mulțumim,<br>Echipa Banca Timpului</p>
      `,
    }
    nodemailer
      .createTransport({
        port: 587,
        host: "smtp.gmail.com",
        auth: {
          user: "bankoftimero@gmail.com",
          pass: "mscjfohfuephgsia",
        },
        secure: false,
      })
      .sendMail(mailData, (err, res) => {
        if (err) {
          return console.log(err)
        }
        if (dbRes) {
          return console.log(res)
        }
      })
    res.status(200).send({ message: "Mailul a fost trimis!" })
  }
)
app.post("/forgotPassword", body("email").isLength({ min: 1 }), (req, res) => {
  const bank_of_time = db
  var newPassword = Math.random().toString(36)

  const mailData = {
    from: "bankoftimero@gmail.com",
    to: `${req.body.email}`,
    subject: `Parola resetată, cont Banca Timpului!`,
    text: `Parola resetată cu succes!`,
    html: `<h1></h1>
      <p>Bună!</p>
      <p>Ai solicitat resetarea parolei, aici este noua parolă:<br><b>${newPassword}</b></br></p>
      <p>Pentru o securitate mai mare te rugăm să îți schimbi parola cu una mai puternică</p>
      <p>Dacă ai întrebări sau comentarii, nu ezita să ne contactezi.</p>
      <p>Mulțumim,<br>Echipa Banca Timpului</p>
      `,
  }

  nodemailer
    .createTransport({
      port: 587,
      host: "smtp.gmail.com",
      auth: {
        user: "bankoftimero@gmail.com",
        pass: "mscjfohfuephgsia",
      },
      secure: false,
    })
    .sendMail(mailData, (err, res) => {
      if (err) {
        return console.log(err)
      }
      if (dbRes) {
      }
    })
  const hashedPw = bcrypt.hashSync(newPassword, 10)

  if (hashedPw) {
    bank_of_time.execute(
      `UPDATE users SET password = '${hashedPw}' WHERE email = '${req.body.email}'`,
      (dbErr, dbRes) => {
        if (dbErr) {
          return res
            .status(400)
            .send({ response: dbErr.message, status: 400 })
            .end()
        }
        if (dbRes) {
        }
      }
    )
  }
  res.status(200).send({ message: "Mailul a fost trimis!" })
})

app.listen("3006")
