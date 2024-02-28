const express = require('express');
const router = express.Router();
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PORT,
    ssl: process.env.SSL,
    connection: {
        options: `project=${process.env.ENDPOINT_ID}`,
    },
});


router.post('/add-movie', async (request, response) => {
    try {
        const {
            movie_name,
            director,
            rate,
            background_image_url,
            poster_image_url,
            year,
            duration_minutes,
            description,
            stars,
            tags
        } = request.body;

        // Insert the new movie
        const newMovie = await sql`
      INSERT INTO Movies (movie_name, director, rate, background_image_url, poster_image_url, year, duration_minutes, description)
      VALUES (${movie_name},${director}, ${rate}, ${background_image_url}, ${poster_image_url} , ${year}, ${duration_minutes},${description})
      RETURNING *;`;

        if (newMovie && newMovie.length > 0) {
            const movieID = newMovie[0].id;

            const insertedStars = [];
            const insertedTags = [];
            for (const starID of stars) {
                const insertedStarResult = await sql`
            INSERT INTO movies_stars (movie_id, star_id)
            VALUES (${movieID}, ${starID})
            RETURNING *;`;
                insertedTags.push(insertedStarResult[0]);
            }
            for (const tagID of tags) {
                const insertedTagResult = await sql`
            INSERT INTO movies_tags (movie_id, tag_id)
            VALUES (${movieID}, ${tagID})
            RETURNING *;`;
                insertedTags.push(insertedTagResult[0]);
            }

            response.send({movie: newMovie[0], stars: insertedStars, genres: insertedTags});
        } else {
            response.send({success: false, message: 'Failed to Add Movie'});
        }
    } catch (error) {
        console.error('Error creating movie:', error);
        response.send({success: false, message: 'Internal server error'});
    }
});
router.post('/add-actor', async (req, res) => {
    try {
        const {name} = req.body;
        const result = await sql`
            INSERT INTO stars (name)  
            VALUES (${name})
            RETURNING *;`;
            res.send(result);
     }
     catch (error) {
        console.error('Error creating actor:', error);
        res.status(500).send({success: false, message: 'Internal server error'});
    }
});

module.exports = router;