const express               = require("express");
const app                   = express();
const logger                = require("morgan");
const path                  = require("path");
const methodOverride        = require("method-override");

const mongoose  = require("mongoose");
const dotenv    = require("dotenv")
const cors      = require('cors');

// const base_URL = '' ;

var corsOptions = {
    origin: '*',
    credentials : true,
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}
app.use(cors(corsOptions));

//* Call Routes
const authRoutes = require('./src/routes/auth');

//*End

const port = 3003;
dotenv.config();
mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    app.listen(port, () => console.log(`Connection Success at  http://localhost:${port}`));
    }).catch(err => console.log(err));
// Setup Method override
app.use(methodOverride('_method'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(function (req, res, next) {	
    res.setHeader('Access-Control-Allow-Origin', '*');    
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');   
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Content-Type", "application/x-www-form-urlencoded");
    next();
})
//End Point Router
app.use('/v1/auth', authRoutes);

//


module.exports = app;
