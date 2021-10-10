const bcrypt        = require('bcryptjs');
const jwt           = require("jsonwebtoken");

const User = require ('../models/User');
const UserVerification = require ('../models/UserVerification');

// email handler
const nodemailer = require("nodemailer");

// unique string
const { v4: uuidv4 } = require("uuid");

// env variables
require("dotenv").config();

// path for static verified page
const path = require("path");

// nodemailer stuff
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
    });

// testing success
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for messages");
        console.log(success);
    }
});

async function register (req, res, next) {

    let { name, role, password, email } = req.body;

    const duplicate = await User.findOne( { email: email } );
    if (duplicate) {
        return res.status(404).send({
            message: "Email " + req.body.email + " has taken"
        });
    }else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered",
        });
    }
    else {
        const saltRounds = 10;
        bcrypt.hash(password,saltRounds,function(err, hashedPassword){
            if(err){
                res.json({
                    error : err
                });
            }
            let UserPost = new User({
                name,
                email,
                role,
                password: hashedPassword,
                verified: false,

            })
            UserPost.save()
            .then(result =>{                
                  // handle account verification
                    sendVerificationEmail(result, res);
            }).catch(err => {
                return res.status(500).send({
                    message: err.message || "Some error occurred while creating the Student."
                });
            });
        })
    }

}

// send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
    // url to be used in the email
    const currentUrl = "http://localhost:3003/";

    const uniqueString = uuidv4() + _id;

    // mail options
    const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours</b>.</p><p>Press <a href=${
        currentUrl + "v1/auth/verify/" + _id + "/" + uniqueString
    }>here</a> to proceed.</p>`,
    };

    // hash the uniqueString
    const saltRounds = 10;
    bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
        // set values in userVerification collection
        const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
        });

        newVerification
        .save()
        .then(() => {
            transporter
            .sendMail(mailOptions)
            .then(() => {
                // email sent and verification record saved
                res.json({
                status: "PENDING",
                message: "Verification email sent",
                });
            })
            .catch((error) => {
                console.log(error);
                res.json({
                status: "FAILED",
                message: "Verification email failed",
                });
            });
        })
        .catch((error) => {
            console.log(error);
            res.json({
            status: "FAILED",
            message: "Couldn't save verification email data!",
            });
        });
    })
    .catch(() => {
        res.json({
        status: "FAILED",
        message: "An error occurred while hashing email data!",
        });
    });
};

function verifyEmail (req, res, next) {
    let { userId, uniqueString } = req.params;

    UserVerification.find({ userId })
        .then((result) => {
        if (result.length > 0) {
            // user verification record exists so we proceed

            const { expiresAt } = result[0];
            const hashedUniqueString = result[0].uniqueString;

            // checking for expired unique string
            if (expiresAt < Date.now()) {
            // record has expired so we delete it
            UserVerification.deleteOne({ userId })
                .then((result) => {
                User.deleteOne({ _id: userId })
                    .then(() => {
                    let message = "Link has expired. Please sign up again.";
                    res.redirect(`/user/verified/error=true&message=${message}`);
                    })
                    .catch((error) => {
                    let message =
                        "Clearing user with expired unique string failed";
                    res.redirect(`/user/verified/error=true&message=${message}`);
                    });
                })
                .catch((error) => {
                console.log(error);
                let message =
                    "An error occurred while clearing expired user verification record";
                res.redirect(`/user/verified/error=true&message=${message}`);
                });
            } else {
            // valid record exists so we validate the user string
            // First compare the hashed unique string

            bcrypt
                .compare(uniqueString, hashedUniqueString)
                .then((result) => {
                if (result) {
                    // strings match

                    User.updateOne({ _id: userId }, { verified: true })
                    .then(() => {
                        UserVerification.deleteOne({ userId })
                        .then(() => {
                            res.sendFile(
                            path.join(__dirname, "../../views/verified.html")
                            );
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                            "An error occurred while finalizing successful verification.";
                            res.redirect(
                            `/user/verified/error=true&message=${message}`
                            );
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                        let message =
                        "An error occurred while updating user record to show verified.";
                        res.redirect(
                        `/user/verified/error=true&message=${message}`
                        );
                    });
                } else {
                    // existing record but incorrect verification details passed.
                    let message =
                    "Invalid verification details passed. Check your inbox.";
                    res.redirect(`/user/verified/error=true&message=${message}`);
                }
                })
                .catch((error) => {
                let message = "An error occurred while comparing unique strings.";
                res.redirect(`/user/verified/error=true&message=${message}`);
                });
            }
        } else {
            // user verification record doesn't exist
            let message =
            "Account record doesn't exist or has been verified already. Please sign up or log in.";
            res.redirect(`/user/verified/error=true&message=${message}`);
        }
        })
        .catch((error) => {
        console.log(error);
        let message =
            "An error occurred while checking for existing user verification record";
        res.redirect(`/user/verified/error=true&message=${message}`);
        });
}

function verified (req, res, next) {
    res.sendFile(path.join(__dirname, "../../views/verified.html"));
}


async function login (req, res, next) {
    
    let { email, password } = req.body;
    try {
        User.findOne({ email: email })
        .then(user =>{
            bcrypt.compare(password,user.password, function(err, result){
                if(err){
                    return res.json({ error: err });
                }
                if(result){
                    let token = jwt.sign(
                            {role:user.role},'secretValue',{expiresIn:'2h'}
                        )
                    return res.json({
                        message: 'Login Success',
                        data: user,
                        token
                    })
                }else{
                    return res.json({
                        message: 'User Not Found'
                    });
                }
            })
        })

    }catch (err){

    };
}


async function logout (req, res, next) {
    delete req.session;
    return res.status(200).json({
        message : 'Your acount has logout',
    });
    res.redirect('/login');
}


module.exports = {
    
    register,
    verifyEmail,
    verified,
    login,
    logout
    
}
