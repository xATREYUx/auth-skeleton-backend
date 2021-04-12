const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
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

    //log the user in
    const token = jwt.sign(
      {
        user: savedUser._id,
      },
      process.env.JWT_SECRET
    );
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
