const mongoose = require("mongoose");
const { isEmail } = require('validator');


const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            index: true,
            unique: true,
            lowercase: true,
            required: [true, 'Alamat email mohon diisi'],
            validate: [isEmail, 'Masukan alamat Email dengan benar']
        },
        role: {
            enum: ["basic", "admin"],
            default: "basic",
            trim: true,
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Nama  mohon diisi'],
        },
        password:{
            type : String,
            required: [true, 'Password mohon diisi'],
            minLength: [6, 'Minimal password 6 karakter']    
        },
        verified: Boolean
    },
    {
        strict: true,
        versionKey: false,
        timestamps: true,
    }
);

    const User = mongoose.model('user', UserSchema);

module.exports = User;

