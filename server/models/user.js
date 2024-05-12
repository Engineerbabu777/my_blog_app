const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{type:String,required:true,min:5,unique: true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true,},
});

const UserModel = mongoose.model('user',userSchema);

module.exports = UserModel;