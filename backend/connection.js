const mongoose = require('mongoose');
const ConnectDb = async () =>{

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI )    
        console.log("Connected", conn.connection.host .red.bold )

    } catch (error) {
        console.log("connection error : ",error)        
    }


}

module.exports = ConnectDb