const express = require('express');
//require('dotenv/config');
require("dotenv").config();
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

// instantiations
const app = express();
const port = process.env.PORT || 8000;
const pool = new Pool({
	connectionString: process.env.ELEPHANT_SQL_CONNECTION_STRING,
})


// usage
app.use(express.json());
app.use(cors());

const baseUrl = "https://api.themoviedb.org/3";
const API_KEY = process.env.API_KEY;

/* get API data */
app.get('/api/movies', async (req, res) => {
	try {
	const response = await axios.get(`${baseUrl}/movie/popular?api_key=${API_KEY}`);
	const movies = response.data.results;
		//console.log(movies);
	// Save the movie data to the database
	for (const movie of movies) {
		await pool.query(
		"INSERT INTO movies (id, title, director, year, rating, poster, description) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		[movie.id, movie.title, "Ben Sth", movie.release_date, movie.vote_average, movie.poster_path, movie.overview]
		);
	}

	res.json(movies);
	} catch (error) {
	console.error("Error fetching data: ", error);
	res.status(500).json({ error: "Failed to fetch movie data" });
}
});




/* -------- DATA --------- */
// 1) GET ALL MOVIES
app.get('/api/moviesdb', (req,res) =>{
	pool
		.query('SELECT * FROM movies;')
		.then(data => {
			return res.json(data.rows)
		})
		.catch(e => {
			res.status(500).json( {message : e.message})
		});
});

// 2) GET SINGLE MOVIE
app.get(`/api/moviesdb/:id`, (req,res) =>{
	const { id }= req.params;
	const query = 'SELECT * FROM movies WHERE id=$1';
	pool
		.query(query, [id])
		.then(data => {
			if ( data.rowCount === 0 ){
				res.status(404).json( {message: 'Movie not found'})
			}else{
				res.json(data.rows[0])
			}
		})
		.catch(e => {
			res.status(500).json( {message: e.message})
		});
});

// 3) POST
app.post('/api/moviesdb', (req,res) => {
	const { title, director, year, rating, poster, description } = req.body;
	const query = 'INSERT INTO movies (title, director, year, rating, poster, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
	pool
		.query(query, [title, director, year, rating, poster, description])
		.then(data => res.status(201).json(data.rows[0]))
		.catch( e => res.status(500).json({message: e.message}));
});

// 4) PUT
app.put('/api/moviesdb/:id', (req, res) => {
	const { id } = req.params;
	const { title, director, year, rating, poster, description } = req.body;
	const query = 'UPDATE movies SET title =$1, director=$2, year=$3, rating=$4, poster=$5, description=$6 WHERE id=$7 RETURNING *';
	pool
		.query(query, [title, director, year, rating, poster, description, id])
		.then(data => res.status(202).json(data.rows[0]))
		.catch(e => res.status(500).json({message:e.message}));
})

app.delete('/api/moviesdb/:id', (req, res) => {
	const { id } = req.params;
	const query = 'DELETE FROM movies WHERE id=$1 RETURNING *;'
	pool
		.query(query, [id])
		.then( data => {
			if (data.rows.length === 0) {
				res.status(404).json({ message: 'Movie not found' });
			}else{

				res.status(204).json(data.rows[0])
			}}
		)
		.catch(e => res.status(500).json({message: e.message}));
})

app.listen(port, () =>{
	console.log(`server listening ${port}`);
})