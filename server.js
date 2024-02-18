const express = require('express');
const app = express();
const port = 3000;

const userRoute=require("./routes/user");
app.use('/user',userRoute);

const movieRoute=require("./routes/movie");
app.use('/movie',movieRoute);

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.listen(port, () => console.log(`Server is ready at http://localhost:${port}`));
