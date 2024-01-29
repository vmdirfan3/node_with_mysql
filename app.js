// const http = require('http')
// const port = 8080
// const connection = require('./index')

// // Create a server object:
// const server = http.createServer(function (req, res) {
//     console.log(req.url)

//     // Write a response to the client
//    const data = connection.query(`select * from Users`,
//             function (err, result) {
//                 if (err)
//                     console.log(`Error executing the query - ${err}`)
//                 else
//                     console.log("Result: ", JSON.stringify(result))
//             })

//             res.write('Hello World')
//             // res.write('Hello World')
//     // End the response
//     res.end()
// })

// // Set up our server so it will listen on the port
// server.listen(port, function (error) {

//     // Checking any error occur while listening on port
//     if (error) {
//         console.log('Something went wrong', error);
//     }
//     // Else sent message of listening
//     else {
//         console.log('Server is listening on port' + port);
//     }
// })

const express = require("express");
const app = express();
const port = 8080;
const connection = require("./index");
var multer = require("multer");
const Ajv = require('ajv');
const ajv = new Ajv();
var upload = multer();
app.use(upload.array());
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/getUser", (req, res) => {
  connection.query(`select * from Users`, function (err, result) {
    if (err) {
      res.send("Somthing went wrong");
    } else {
      res.send(JSON.stringify(result));
    }
  });
});

app.post("/postUser", (req, res) => {
  const Name = req.body.Name;
  const Age = req.body.Age;
  const Education = req.body.Education;
  const MobileNo = req.body.MobileNo;
  const schema = {
    type: 'object',
    properties: {
        Name: { type: 'string', minLength: 3 },
        Education: { type: 'string',},
        MobileNo: { type: 'string',minimum:0},
        Age: { type: 'string', minimum: 0,maxLength:3,maximum:100},
    },
    required: ['Name', 'Education','MobileNo','Age'],
};
    const validate = ajv.compile(schema);
    const isValid = validate(req.body)
    if(isValid){
        connection.query(
            `INSERT INTO Users (Name, Age, Education, MobileNo) VALUES (?, ?, ?, ?)`,
            [Name, parseInt(Age), Education, parseInt(MobileNo)],
            (err, response) => {
              if (err) {
                console.log(err);
                res.send(JSON.stringify(err));
              } else {
                const responseObj = {
                  comment: "User created successfully",
                  requestBody: req.body, // Include the request body in the response
                };
                res.send(JSON.stringify(responseObj));
              }
            }
          );
    }else{
        res.send({
            message:'Error',
            error: validate.errors
        })
    }
 
});
app.listen(port, () => {
  console.log("Server Is Live");
});
