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
  let hashedpassword = await bcrypt.hash(password, 10);

  let checkTheUsername = `
  SELECT
  *
  FROM
  user
  WHERE
  username = '${username}';`;
  let userData = await database.get(checkTheUsername);

  if (userData === undefined) {
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
      response.send("User created successfuly");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { userName, password } = request.body;
  const userdetails = `
    SELECT *
    FROM
    user
    WHERE
    username = ${userName};`;
  const user = await database.get(userdetails);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let passwordcheck = await bcrypt.compare(password, database.password);
    if (passwordcheck === true) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
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
    const verifypassword = bcrypt.compare(oldPassword, database.password);
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
        response.send("password update");
      }
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
module.exports = app;