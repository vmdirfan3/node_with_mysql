const jwt = require("jsonwebtoken");
const connection = require('./index');
const { json } = require("express");

const secretKey = '&oYu("nFV3VPl0XTo9mBwhTF!+$n}V'
function generateToken(userId,username){
    const token = jwt.sign(
        { id: userId, username: username },
        secretKey,
        {expiresIn: '1h'}
      );
      return token;
}


async function verifyToken(token){
    try {
        const tokenwithoutbearer = token.split(' ')[1];
        const [rows] =await connection.query(`SELECT * from authUser WHERE token=?`,[tokenwithoutbearer])
        if(rows.length !=0){
            const jsonDecoded = jwt.decode(tokenwithoutbearer)
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (jsonDecoded.exp < currentTimestamp) {
                // Token has expired
                return 'Token is Expired'
            }
        }else{
            return 'Invalid Token'
        }
    } catch (error) {
        return error;
    }
}

module.exports = { generateToken, verifyToken};