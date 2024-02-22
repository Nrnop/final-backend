const express = require('express');
const router = express.Router();
const postgres = require('postgres');
PGHOST = 'ep-super-shadow-47901102.us-east-2.aws.neon.tech'
PGDATABASE = 'FinalProject'
PGUSER = 'nuranabipour'
PGPASSWORD = 'OlFpt25LeZDM'
ENDPOINT_ID = 'ep-super-shadow-47901102'

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


router.get('/', async (req, res) => {
    try {
        const response = await sql`select * from users`;
        res.send(response);
    } catch (error) {
        console.error('Error Fetching Users:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

router.get('/:id', async (req, res) => {
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


router.post('/sign-up', async (req, res) => {
    try {

        const {firstName, lastName, username, password} = req.body;
        const response = await sql`insert into users (first_name, last_name, username,password, role) values (${firstName}, ${lastName},${username},${password},'USER') returning *`;
        const newUser = response[0];
        res.send(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
    }
});
router.post('/login', async (req, res) => {

    const {username, password} = req.body;
    const foundUser = await sql`select * from users where username =${username} and password =${password}`;
    if (foundUser && foundUser.length > 0) {
        res.send({
            user: {
                id: foundUser[0].id,
                username: foundUser[0].username,
                first_name: foundUser[0].first_name,
                last_name: foundUser[0].last_name,
                role: foundUser[0].role
            }
        });
    } else {
        res.send({error: true, message: 'Wrong Username and/or Password'});
    }

});

router.get('/:id/watchlist', async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await sql`
            SELECT movies.* 
            FROM movies
            JOIN users_movies ON movies.id = users_movies.movie_id
            WHERE users_movies.user_id = ${userId}
        `;

        if (response.length === 0) {
            res.status(404).send('No movies found in watchlist');
        } else {
            res.json(response);
        }
    } catch (error) {
        console.error('Error Fetching Watchlist:', error);
        res.status(500).send('Server error');
    }
});



module.exports = router;