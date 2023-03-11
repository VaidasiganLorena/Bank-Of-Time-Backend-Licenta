const checkUserCredentials = async (userLoginInfo, res) => {
  const evosa_mysql = await mysql.createConnection(DATABASE_CREDENTIALS)
  await evosa_mysql.execute(
    `SELECT users_uuid, email, password FROM users WHERE email = '${userLoginInfo.email}'`,
    (dbErr, dbRes) => {
      if (dbErr) {
        res.status(401).send({ response: dbErr.message, status: 401 }).end()
        evosa_mysql.end()
        return
      }
      if (dbRes) {
        // @ts-ignore: Unreachable code error
        if (dbRes.length === 0) {
          res
            .status(401)
            .send({ response: 'This email is not associated with any account.', status: 401 })
            .end()
          evosa_mysql.end()
          return
        } else {
          // @ts-ignore: Unreachable code error
          if (bcrypt.compareSync(userLoginInfo.password, dbRes[0].password)) {
            // @ts-ignore: Unreachable code error
            const authToken = generateAccessToken(dbRes[0].email)

            res
              .status(200)
              .send({
                response: {
                  // @ts-ignore: Unreachable code error
                  users_uuid: dbRes[0].users_uuid,
                  authToken: authToken,
                },
                status: 200,
              })
              .end()
          } else {
            res.status(401).send({ response: 'User & Password incorrect!', status: 401 }).end()
          }
        }
      }
    },
  )
}
