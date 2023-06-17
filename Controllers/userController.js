import db from 'app.js'
const generateAccessToken = (email) => {
  return jwt.sign({ email }, `${process.env.SECRET_TOKEN}`, {
    expiresIn: '3600s',
  })
}
export const checkUserCredentials = async (userLoginInfo, res) => {
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
            .send({ response: 'Acest email nu este asociat cu nici un cont.', status: 401 })
            .end()

          return
        } else {
          if (bcrypt.compareSync(userLoginInfo.password, dbRes[0].password)) {
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
            res.status(401).send({ response: 'Emailul & parola sunt greșite!', status: 401 }).end()
          }
        }
      }
    },
  )
}
export const getUserInfo = (req, res) => {
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
}
export const changeUserInformation = () => {
  const bank_of_time = db
  let tokenValid = true
  // jwt.verify(req.headers.authtoken, 'fIb4H7blh0TH4qvrKMZAcWnFVC7FEW00dxb5yBrO', (err, decoded) => {
  //   if (err) {
  //     return res.status(400).send({ response: 'Token invalid/expired!', status: 400 }).end()
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
      fieldForUpdate.push(' ' + key + '=' + "'" + req.body[key] + "'")
    })
    const persoQuery = `UPDATE users SET` + fieldForUpdate.join() + `WHERE userUuid = '${userUuid}'`
    bank_of_time.execute(persoQuery, (dbErr, dbRes) => {
      if (dbErr) {
        return res.status(400).send({ response: dbErr.message, status: 400 }).end()
      }
      if (dbRes) {
        return res
          .status(200)
          .send({ response: 'Utilizatorul a fost actualizat cu succes!', status: 200 })
          .end()
      }
    })
  }
}
