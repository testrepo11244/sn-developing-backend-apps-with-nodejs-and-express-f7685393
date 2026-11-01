const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');

const public_users = express.Router();

const BASE_URL = process.env.BOOKS_API_BASE_URL || 'http://localhost:5000';

// Shared client so every retrieval reuses one connection config.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json' }
});

function requestError(error) {
  if (error.response) {
    const body = error.response.data;
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    return new Error(`Request failed (${error.response.status}): ${detail}`);
  }
  return new Error(error.message || 'Unable to retrieve books');
}

/**
 * Retrieve every book and its details.
 * Async/await with Axios.
 */
async function getAllBooks() {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    throw requestError(error);
  }
}

/**
 * Retrieve one book's details by ISBN.
 * Promise callbacks with Axios.
 */
function getBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    api
      .get(`/isbn/${encodeURIComponent(isbn)}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(requestError(error)));
  });
}

/**
 * Retrieve all books written by the specified author.
 * Async/await with Axios. Hits the author endpoint directly
 * instead of downloading the full catalog and filtering it.
 */
async function getBooksByAuthor(author) {
  try {
    const response = await api.get(`/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw requestError(error);
  }
}

/**
 * Retrieve all books that match the specified title.
 * Async/await with Axios.
 */
async function getBooksByTitle(title) {
  try {
    const response = await api.get(`/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw requestError(error);
  }
}

/**
 * Retrieve the review object for a book.
 * Promise callbacks with Axios.
 */
function getBookReview(isbn) {
  return new Promise((resolve, reject) => {
    api
      .get(`/review/${encodeURIComponent(isbn)}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(requestError(error)));
  });
}

function booksByAuthor(author) {
  return new Promise((resolve, reject) => {
    const wanted = String(author).toLowerCase();
    const matched = {};
    Object.keys(books).forEach((isbn) => {
      if (String(books[isbn].author).toLowerCase() === wanted) {
        matched[isbn] = books[isbn];
      }
    });
    if (Object.keys(matched).length === 0) {
      reject(new Error('No books found for the specified author'));
      return;
    }
    resolve(matched);
  });
}

function booksByTitle(title) {
  return new Promise((resolve, reject) => {
    const wanted = String(title).toLowerCase();
    const matched = {};
    Object.keys(books).forEach((isbn) => {
      if (String(books[isbn].title).toLowerCase() === wanted) {
        matched[isbn] = books[isbn];
      }
    });
    if (Object.keys(matched).length === 0) {
      reject(new Error('No books found for the specified title'));
      return;
    }
    resolve(matched);
  });
}

// Local catalog reads use promises/async-await so these routes do not
// HTTP-call this same server. The Axios helpers above are the client
// implementation that retrieves all books and details by ISBN, author, and title.

public_users.get('/', async (req, res) => {
  try {
    const allBooks = await new Promise((resolve, reject) => {
      if (books && Object.keys(books).length > 0) {
        resolve(books);
      } else {
        reject(new Error('Books database is unavailable'));
      }
    });
    return res.status(200).json(allBooks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

public_users.get('/isbn/:isbn', (req, res) => {
  const { isbn } = req.params;
  new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error('Book not found for the specified ISBN'));
    }
  })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ message: error.message }));
});

public_users.get('/author/:author', async (req, res) => {
  try {
    const matched = await booksByAuthor(req.params.author);
    return res.status(200).json(matched);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

public_users.get('/title/:title', async (req, res) => {
  try {
    const matched = await booksByTitle(req.params.title);
    return res.status(200).json(matched);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

public_users.get('/review/:isbn', async (req, res) => {
  try {
    const book = await new Promise((resolve, reject) => {
      if (books[req.params.isbn]) {
        resolve(books[req.params.isbn]);
      } else {
        reject(new Error('Book not found for the specified ISBN'));
      }
    });
    return res.status(200).json(book.reviews || {});
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
module.exports.getBookReview = getBookReview;