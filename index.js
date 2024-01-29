const mySql=require('mysql')

const connection= mySql.createConnection({
    host: 'beuz5pq8yn5vtuhvn3hs-mysql.services.clever-cloud.com',
    user: 'ui6hplpt7ro0kuck',
    password:'0NBl9FNCHZDunri6ikXp',
    database:'beuz5pq8yn5vtuhvn3hs',
})

connection.connect(function (err) {
    if (err) {
        console.log("Error in the connection")
        console.log(err)
    }
    else {
        console.log(`Database Connected`)
        
    }
})

module.exports = connection