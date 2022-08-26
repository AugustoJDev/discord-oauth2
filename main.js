require("dotenv").config();

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { table } = require('table');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.text());

app.use(session({ secret: 'cat keyboard' }))

app.get('/', function(req, res) {
  // getting session login info and checking them
  if(req.session.login) {
    // If have a session saved, continues to "user area"
    const loginInfo = req.session.login;

    const message = [
      [`Type`, 'Result'],
      [`ID`, `${loginInfo.id}`],
      [`Username`, `${loginInfo.username}`],
      [`Avatar`, `${loginInfo.avatar}`],
      [`Avatar Decoration`, `${loginInfo.avatar_decoration}`],
      [`Discriminator`, `${loginInfo.discriminator}`],
      [`Public Flagas`, `${loginInfo.public_flags}`],
      [`Flags`, `${loginInfo.flags}`],
      [`Banner`, `${loginInfo.banner}`],
      [`Banner Color`, `${loginInfo.banner_color}`],
      [`Accent Color`, `${loginInfo.accent_color}`],
      [`Locale`, `${loginInfo.locale}`],
      [`MFA Enabled`, `${loginInfo.mfa_enabled}`]
    ]

    console.log(table(message))

    res.render("home", { title: `Welcome ${loginInfo.username}`, message: `You're logged in ${loginInfo.username}#${loginInfo.discriminator}! Check the console.`, redirect: null })
  } else {
    // If no have any session, redirects you to oauth2 login link
    res.render("home", { title: "No Logged :O", message: "You're not logged :O Please, click here", redirect: process.env.redirect });
  }
});

app.get('/login', async function(req, res) {
  const { code } = req.query;

  if(!code) res.render("home", { title: "An error occurred", message: "Your login code doesn't exist..."})

  try {
  // Config all data required in your .env
  let data = {
    'client_id': process.env.clientId,
    'client_secret': process.env.clientSecret,
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': process.env.redirectURI,
    'scope': 'identify'
  }

  // Transform Object params to String using _encode() function
  params = _encode(data)

  // Send all params to get access token
  const response = await fetch(`https://discordapp.com/api/oauth2/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

  const result = await response.json();
  
  // Send the access token to get user infos
  const infosInJSON = await fetch('https://discord.com/api/users/@me', {
    headers: {
      authorization: `${result['token_type']} ${result['access_token']}`,
    },
  });

  const infos = await infosInJSON.json();

  req.session.login = infos;
  res.redirect('/')

  // Convert the data in url params
  function _encode(obj) {
    let string = "";

      for (const [key, value] of Object.entries(obj)) {
        if (!value) continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }

      return string.substring(1);
    }
  } catch (err) {
    // Render an error page if the code is invalid
    console.log(err)
    res.render("home", { title: "An error occurred", message: "Your login code isn't valid..."})
  }
});

app.listen(process.env.PORT, () => {
    console.log("App listening on port: " + process.env.PORT)
});