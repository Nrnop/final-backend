const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors());
app.use(cors({
    origin: 'http://localhost:5173' // Adjust this to match your React app's origin
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const userRoute=require("./routes/user");
app.use('/users',userRoute);

const movieRoute=require("./routes/movie");
app.use('/movies',movieRoute);

const adminRoute=require("./routes/admin");
app.use('/admin',adminRoute);


app.listen(port, () => console.log(`Server is ready at http://localhost:${port}`));
