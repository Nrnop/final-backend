const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());

PGHOST='ep-super-shadow-47901102.us-east-2.aws.neon.tech'
PGDATABASE='FinalProject'
PGUSER='nuranabipour'
PGPASSWORD='OlFpt25LeZDM'
ENDPOINT_ID='ep-super-shadow-47901102'

const sql = postgres({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: 'require',
    connection: {
        options: `project=${ENDPOINT_ID}`,
    },
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.get('/users', async (req, res) => {
    try {
        const response = await sql`select * from users`;
        res.send(response);
    } catch (error) {
        console.error('Error Fetching Users:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/users/:id', async (req, res) => {
    const userID = req.params.id;
    try {
        const response = await sql`select * from users where id = ${userID}`;
        if (response.length === 0) {
            res.status(404).send('User not found');
        } else {
            const result = response[0];
            res.send(result);
        }
    } catch (error) {
        console.error('Error Fetching User:', error);
    }
});
app.get('/users/username', async (req, res) => {
    const { username, password } = req.query;
    try {
        const response = await sql`
            SELECT * FROM users WHERE username = ${username} AND password = ${password}
        `;
        if (response.length === 0) {
            res.status(404).send('User not found');
        } else {
            const result = response[0];
            res.send(result);
        }
    } catch (error) {
        console.error('Error Fetching User:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/users/create', async (req, res) => {
    try {
        const {firstName,lastName, username,password} = req.body;
        const response = await sql`insert into users (first_name, last_name, username,password, role) values (${firstName}, ${lastName},${username},${password},'USER') returning *`;
        const newUser = response[0];
        res.send(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

app.listen(port, () => console.log(`Server is ready at http://localhost:${port}`));
