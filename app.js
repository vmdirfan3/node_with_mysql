const express = require("express");
const app = express();
const port = 8080;
const connection = require("./index");
var multer = require("multer");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const path = require("path");
const ajv = new Ajv();
addFormats(ajv);

const bcrypt = require("bcryptjs");
const passport = require("passport");
const { initializePassport } = require("./passport");
const { generateToken, verifyToken } = require("./generateToken");
const expressSession = require("express-session");
const { error } = require("console");
app.use(express.json());
app.use(
  expressSession({ secret: "secret", saveUninitialized: true, resave: false })
);
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);
// app.use(multer().array())
app.use(function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/getUser", async (req, res) => {
 await verifyToken(req.headers.authorization).then(async (result) => {
    if(result !=null){
      res.status(401).json({message:result})
    }else{
      const [rows, fields] = await connection.query("SELECT * FROM Users");
      res.json(rows);
    }
  })
});

// Configure Multer

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the destination directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});

const upload = multer({ storage: storage });
const uploadsPath = path.join(__dirname, "uploads");
app.use(
  "/uploads",
  (req, res, next) => {
    const fileExtension = path.extname(req.url).toLowerCase();

    // Set the correct content type based on the file extension
    switch (fileExtension) {
      case ".png":
        res.type("image/png");
        break;
      case ".jpg":
      case ".jpeg":
        res.type("image/jpeg");
        break;
      default:
        res.type("application/octet-stream");
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename=image${fileExtension}`
    );

    next();
  },
  express.static(uploadsPath)
);
app.post("/postUser", upload.single("image"), async (req, res) => {
  const Name = req.body.Name;
  const Age = req.body.Age;
  const Education = req.body.Education;
  const MobileNo = req.body.MobileNo;
  const imageUrl = req.get("host") + "/" + req.file.path;
  const schema = {
    type: "object",
    properties: {
      Name: { type: "string", minLength: 3 },
      Education: { type: "string" },
      MobileNo: { type: "string", minimum: 0 },
      Age: { type: "string", minimum: 0, maxLength: 3, maximum: 100 },
    },
    required: ["Name", "Education", "MobileNo", "Age"],
  };
  const validate = ajv.compile(schema);
  const isValid = validate(req.body);
  if (req.file == null) {
    res.send({
      message: "Validation failed",
      error: {
        Error: "Image Is Required",
      },
    });
  } else if (isValid) {
    try {

      const [rows, fields] = await connection.query(
        `INSERT INTO Users (Name, Age, Education, MobileNo,imageUrl) VALUES (?, ?, ?, ?,?)`,
        [Name, parseInt(Age), Education, parseInt(MobileNo), imageUrl]
      );
      const responseObj = {
        comment: "User created successfully",
        requestBody: req.body, // Include the request body in the response
      };
      res.json(responseObj);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.send({
      message: "Validation failed",
      error: validate.errors,
    });
  }
});

app.post("/register", async (req, res) => {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string", minLength: 3 },
      email: { type: "string", format: "email" },
      password: { type: "string", minimum: 0 },
    },
    required: ["name", "email", "password"],
  };
  const validate = ajv.compile(schema);
  const isValid = validate(req.body);
  if (!isValid) {
    res
      .status(400)
      .json({ message: "Validation Failed", error: validate.errors });
  }
  const { name, email, password } = req.body;
  const encrypted = await bcrypt.hash(password, 10);
  try {
    const isUser = await connection.query(
      "SELECT email FROM authUser WHERE email=?",
      [email]
    );
    if (isUser[0][0] == null) {
      try {
        const [rows, fileds] = await connection.query(
          "INSERT INTO authUser (name, email, password) VALUES (?, ?, ?)",
          [name, email, encrypted]
        );
        if (rows.insertId != null) {
          try {
            const token = await generateToken(rows.insertId, name);
            const [updateRows, fileds] = await connection.query(
              "UPDATE authUser SET token =? WHERE id=?",
              [token, rows.insertId]
            );
            req.body.password = undefined;
            req.body.token = token;
            res.json({ message: "User Created Successfully", body: req.body });
          } catch (error) {
            res.json(error);
          }
        }
      } catch (error) {
        res.json(error);
      }
    } else {
      res.status(400).send({ message: "Email Already Exist" });
    }
  } catch (error) {
    res.send(error);
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!user) {
      return res.status(400).json({ message: info.message });
    }
    const token = await generateToken(user.id, user.name);
    const [rows] = await connection.query(
      `UPDATE authUser SET token=? WHERE id=?`,
      [token, user.id]
    );
    return res
      .status(200)
      .json({ message: "Logged in successfully", token: token });
  })(req, res, next);
});

app.listen(process.env.PORT || port, "0.0.0.0", () => {
  console.log("Server Is Live");
});
