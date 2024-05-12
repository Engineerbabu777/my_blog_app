const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const cookieParser = require('cookie-parser');
var cookie = require('cookie');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
// const sendtransport = require('nodemailer-sendgrid-transport');
const multer = require('multer');
const fs = require('fs');
const SecretKey = "ghfhdywgedv";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads",express.static(__dirname+"/uploads"));

app.use(cors({
    credentials: true,
    origin: "http://localhost:3000",
}))

const multerMiddleware = multer({ dest: 'uploads/' });

// const transporter = nodemailer.createTransport(sendtransport({

// }))

app.get('/', (req, res) => {
    res.json({ success: true });
})

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const passwordHash = bcryptjs.hashSync(password, 12);
    try {
        const UserDoc = await User.create({
            username, email, password: passwordHash,
        })
        res.status(200).json({ result: "Account Created successfully" });
    } catch (err) {
        const Userexists = await User.findOne({ email, username });
        if (Userexists) {
            res.status(404).json({ user: true });
            res.end();
        } else {
            res.status(404).json({ message: err.message });
        }
        res.end();
    }
    res.end();
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const LoginUserDoc = await User.findOne({ email });

    if (!LoginUserDoc) {
        res.status(400).json({ message: "User not found" })
        res.end();
    } else {
        const PasswordMatchDoc = bcryptjs.compareSync(password, LoginUserDoc.password)
        if (PasswordMatchDoc) {
            const Token = jwt.sign({ password, email, username: LoginUserDoc.username, Id: LoginUserDoc._id }, SecretKey);
            res.status(200).cookie("token", Token).json({ result: "Login successfully", username: LoginUserDoc.username, id: LoginUserDoc._id });
            res.end();
        } else {
            res.status(400).json({ message: "Password incorrect" });
            res.end();
        }
    }
    res.end();
});

app.post('/post', multerMiddleware.single('file'), async (req, res) => {
    const { token } = req.cookies;
    const { title, detail, summary } = req.body;
    const file = req?.file;
    const currentUser = jwt.verify(token, SecretKey);
    let newPath = null;
    if (file) {
        const { originalname } = file;
        const parts = originalname.split(".");
        const ext = parts[parts.length - 1];
        const { path } = file;
        const newpath = `${path}.${ext}`;
        fs.renameSync(path, newpath);
        newPath = newpath;
    }
    const postDoc = await Post.create({
        file: newPath, title, details: detail, summary, ownerId: currentUser.Id
    })
    res.status(200).json({ postDoc });
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    try {
        const currentUser = jwt.verify(token, SecretKey);
        res.status(200).json(currentUser);
    } catch (e) {
        res.status(201).json({ success: false })
    }
});

app.get('/posts', async (req, res) => {
    const blogs = await Post.find({}).populate('ownerId',['username']).sort({createdAt:-1}).limit(20);
    res.json({ blogs });
    res.end();
});

app.get("/post/:id",async(req,res)=> {
    const {id} = req.params;
    const blogs = await Post.findById(id).populate('ownerId',['username']);
    res.json({blogs});
  res.end();
});

app.put("/post/:id",multerMiddleware.single('file'),async(req,res)=> {
    const { token } = req.cookies;
    const {id} = req.params;
    const file = req.file;
    let newPath = null;
     const {title,summary,detail} = req.body;
    if (file) {
        const { originalname } = file;
        const parts = originalname.split(".");
        const ext = parts[parts.length - 1];
        const { path } = file;
        const newpath = `${path}.${ext}`;
        fs.renameSync(path, newpath);
        newPath = newpath;
    }
    const {username} = jwt.verify(token, SecretKey);
    const postDoc = await Post.findById(id).populate('ownerId');
    const userVerify = (username == postDoc.ownerId.username);
    if(userVerify){
        const updatedData = await Post.updateOne({_id:id},{title,summary,details:detail,file:newPath?newPath:postDoc.file});
        res.status(200).json({"success":true});
        res.end();
    }else{
        res.status(401).json({"success":false});
        res.end();
    }
});

app.delete("/delete/:id",async(req,res)=> {
    const { token } = req.cookies;
    const {id} = req.params;
    const {username} = jwt.verify(token, SecretKey);
    const postDoc = await Post.findById(id).populate('ownerId');
    const userVerify = (username == postDoc.ownerId.username);
    if(userVerify){
        const deletedData = await Post.deleteOne({_id:id});
        res.status(200).json({"success":true});
        res.end();
    }else{
        res.status(401).json({"success":false});
        res.end();
    }
})

app.get('/logout', (req, res) => {
    const { token } = req.cookies;
    res.cookie("token", "");
    res.json({success:true});
})

app.listen(7544);