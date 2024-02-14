const LocalStrategy = require('passport-local').Strategy
const connection = require('./index')
const bcryptjs=require('bcryptjs')

exports.initializePassport=(passport)=>{
passport.use(
    new LocalStrategy({usernameField:"email",passwordField:"password"},async(email,password,done)=>{
        try {
            const User =await connection.query(`SELECT * FROM authUser WHERE email=?`,[email])
            if (!User[0][0]) {
                return done(null, false, { message: 'Invalid Email' });
              }
        
              const isPasswordValid = await bcryptjs.compare(password, User[0][0].password);
        
              if (!isPasswordValid) {
                return done(null, false, { message: 'Invalid Password' });
              }
        
              // Authentication successful, return the user
              return done(null, User[0][0]);
        } catch (error) {
            console.log(error)
        }
    })
)
passport.serializeUser(async(user,done)=>{
    done(null,user.id);
})
passport.deserializeUser(async(id,done)=>{
    try {
        const user=await connection.query(`SELECT * FROM authUser WHERE id=?`,[id])
        done(null,user)
    } catch (error) {
        done(error,false)
    }
})
}