const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  console.log("New User Creation Initiated");
  try {
    const { email, password, passwordVerify } = req.body;
    console.log(email);
    if (!email || !password || !passwordVerify)
      return res
        .status(400)
        .json({ errorMessage: "Please enter all required fields." });
    if (password.length < 6)
      return res.status(400).json({
        errorMessage: "Please enter a password of at least 6 charachters long.",
      });
    if (password != passwordVerify)
      return res
        .status(400)
        .json({ errorMessage: "Please enter the same password twice." });

    const existingUser = await User.findOne({
      email: email,
    });
    if (existingUser)
      return res.status(400).json({
        errorMessage: "An account with this email already exists.",
      });
    console.log("existingUser", existingUser);

    //hash the password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    console.log("passwordHash", passwordHash);

    //create new user
    const newUser = new User({
      email: email,
      passwordHash: passwordHash,
    });

    const savedUser = await newUser.save();

    //sign token
    const token = jwt.sign(
      {
        user: savedUser._id,
      },
      process.env.JWT_SECRET
    );

    // send token in http only cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// login

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password)
      return res
        .status(400)
        .json({ errorMessage: "Please enter all required fields." });

    const existingUser = await User.findOne({ email: email });
    if (!existingUser)
      return res.status(401).json({ errorMessage: "Wrong email or password" });

    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );
    if (!passwordCorrect)
      return res.status(401).json({ errorMessage: "Wrong email or password" });

    //sign token
    const token = jwt.sign(
      {
        user: existingUser._id,
      },
      process.env.JWT_SECRET
    );

    // send token in http only cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === "development"
            ? "lax"
            : process.env.NODE_ENV === "production" && "none",
        secure:
          process.env.NODE_ENV === "development"
            ? false
            : process.env.NODE_ENV === "production" && true,
      })
      .send();
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }

  router.get("/logout", (req, res) => {
    try {
      res
        .cookie("token", "", {
          httpOnly: true,
          sameSite:
            process.env.NODE_ENV === "development"
              ? "lax"
              : process.env.NODE_ENV === "production" && "none",
          secure:
            process.env.NODE_ENV === "development"
              ? false
              : process.env.NODE_ENV === "production" && true,
          expires: new Date(0),
        })
        .send();
    } catch (err) {
      console.log("err", err);
    }
  });
});

router.get("/loggedIn", (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json(false);
    jwt.verify(token, process.env.JWT_SECRET);
    res.send(true);
  } catch (err) {
    console.error(err);
    res.json(false);
  }
});

module.exports = router;
