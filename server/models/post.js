const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    ownerId: {type:mongoose.Schema.Types.ObjectId , ref:"user"},
    title: {type:String , required: true},
    summary: {type:String , required: true},
    file: {type:String , required: true},
    details: {type:String , required: true},
},{
    timestamps: true,
});


const postModel = mongoose.model('blog', postSchema);

module.exports = postModel;