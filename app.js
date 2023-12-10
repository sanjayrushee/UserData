const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let checkTheUsername = `
  SELECT
  *
  FROM
  user
  WHERE
  username = '${username}';`;
  let userData = await database.get(checkTheUsername);

  if (userData === undefined) {
    let hashedpassword = await bcrypt.hash(password, 10);

    let adduserdata = `INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedpassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newuserData = await database.run(adduserdata);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userdetails = `
    SELECT *
    FROM
    user
    WHERE
    username = '${username}';`;
  const userdatabase = await database.get(userdetails);

  if (userdatabase === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordcheck = await bcrypt.compare(password, userdatabase.password);
    if (passwordcheck === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.post("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userdetails = `
    SELECT 
    *
    FROM
    user
    WHERE
    username = '${username}'
    ;`;
  const user = await database.get(userdetails);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const verifypassword = await bcrypt.compare(oldPassword, user.password);
    if (verifypassword === true) {
      let lengthOfNewpassword = newPassword.length;
      if (lengthOfNewpassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newpasswordencrypt = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
                UPDATE
                user
                SET
                password = '${newpasswordencrypt}'
                WHERE
                username = '${username}';
                `;
        await database.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
