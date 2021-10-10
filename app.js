const express               = require("express");
const app                   = express();

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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//End Point Router
app.use('/v1/auth', authRoutes);

//


module.exports = app;
