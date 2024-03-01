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
router.delete('/del-movie/:id', async (request, response) => {
    const {id} = request.params;

    try {
        await sql`
          DELETE FROM movies_stars WHERE movie_id = ${id};
        `;
        await sql`
          DELETE FROM movies_tags WHERE movie_id = ${id};
        `;
        await sql`
          DELETE FROM users_movies WHERE movie_id = ${id};
        `;
        const deleteResponse = await sql`
          DELETE FROM Movies WHERE id = ${id} RETURNING *;
        `;

        if (deleteResponse.length === 0) {
            response.status(404).send('Movie Not Found');
        } else {
            response.status(200).send(deleteResponse[0]);
        }
    } catch (error) {
        console.error('Error deleting movie:', error);
        response.status(500).send('Internal Server Error');
    }
});
router.put('/update-movie/:id', async (request, response) => {
    const {id} = request.params;
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

    try {
        await sql.begin(async sql => {
            const updatedMovie = await sql`
                UPDATE Movies
                SET movie_name = ${movie_name},
                    director = ${director},
                    rate = ${rate},
                    background_image_url = ${background_image_url},
                    poster_image_url = ${poster_image_url},
                    year = ${year},
                    duration_minutes = ${duration_minutes},
                    description = ${description}
                WHERE id = ${id}
                RETURNING *;
            `;

            if (updatedMovie.count === 0) {
                throw new Error('Movie not found');
            }

            const [currentStars, currentTags] = await Promise.all([
                sql`SELECT star_id FROM movies_stars WHERE movie_id = ${id};`,
                sql`SELECT tag_id FROM movies_tags WHERE movie_id = ${id};`
            ]);

            const currentStarIds = currentStars.map(row => row.star_id);
            const currentTagIds = currentTags.map(row => row.tag_id);

            const starsToAdd = stars.filter(starId => !currentStarIds.includes(starId));
            const starsToRemove = currentStarIds.filter(starId => !stars.includes(starId));
            const tagsToAdd = tags.filter(tagId => !currentTagIds.includes(tagId));
            const tagsToRemove = currentTagIds.filter(tagId => !tags.includes(tagId));

            // Remove stars and tags
            await Promise.all([
                ...starsToRemove.map(starId =>
                    sql`DELETE FROM movies_stars WHERE movie_id = ${id} AND star_id = ${starId};`
                ),
                ...tagsToRemove.map(tagId =>
                    sql`DELETE FROM movies_tags WHERE movie_id = ${id} AND tag_id = ${tagId};`
                )
            ]);

            // Add new stars and tags
            await Promise.all([
                ...starsToAdd.map(starId =>
                    sql`INSERT INTO movies_stars (movie_id, star_id) VALUES (${id}, ${starId});`
                ),
                ...tagsToAdd.map(tagId =>
                    sql`INSERT INTO movies_tags (movie_id, tag_id) VALUES (${id}, ${tagId});`
                )
            ]);

            response.send({message: 'Movie updated successfully', movie: updatedMovie[0]});
        });
    } catch (error) {
        console.error('Error updating movie:', error);
        response.status(500).send({message: 'Server error'});
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
    } catch (error) {
        console.error('Error creating actor:', error);
        res.status(500).send({success: false, message: 'Internal server error'});
    }
});
router.put('/edit-actor/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const {name} = req.body;
        const result = await sql`
            UPDATE stars SET name = ${name}        
           WHERE star_id = ${id}
            RETURNING *;`;
        res.send(result);
    } catch (error) {
        console.error('Error creating actor:', error);
        res.status(500).send({success: false, message: 'Internal server error'});
    }
});

router.delete('/del-actor/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const response = await sql`DELETE FROM stars WHERE star_id = ${id} RETURNING *`;
        if (response.length === 0) {
            res.status(404).send('Actor Not Found');
        } else {
            res.status(200).send(response[0]);
        }
    } catch (error) {
        console.error('Error Deleting Actor:', error);
    }
});

router.put('/change-role/:id', async (req, res) => {
    const userId = req.params.id;
    const {role} = req.body;
    try {
        const response = await sql`
            UPDATE users
            SET role = ${role}
            WHERE id = ${userId}
            RETURNING *;
        `;
        if (response.count === 0) {
            return res.status(404).send({message: "User not found."});
        }
        const updatedData = response[0];
        res.send(updatedData);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Server error');
    }
});

router.post('/search-actor', async (req, res) => {
    try {
        const {search} = req.body;
        if (!search) {
            return res.status(400).send('A search value is required');
        }
        const star = await sql`
            SELECT * FROM stars 
            WHERE name ILIKE ${'%' + search + '%'} 
        `;
        res.json(star);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
router.post('/search-user', async (req, res) => {
    try {
        const {search} = req.body;
        if (!search) {
            return res.status(400).send('A search value is required');
        }
        const user = await sql`
            SELECT * FROM users 
            WHERE first_name ILIKE ${'%' + search + '%'} 
            OR last_name ILIKE ${'%' + search + '%'}
            OR username ILIKE ${'%' + search + '%'}
        `;
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;