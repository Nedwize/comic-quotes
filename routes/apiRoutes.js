const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const Quote = mongoose.model("quotes");
const User = mongoose.model("users");
const seedData = require("../seedData");
const { isEmpty, checkAPIKey } = require("../helpers/helper");

Quote.createIndexes({ quoteID: 1 });
User.createIndexes({ key: 1 });

Router.get("/:key/quote", async (req, res, next) => {
  const { comic, num } = req.query;
  const key = req.params.key;
  if (await checkAPIKey(key)) {
    if (isEmpty(req.query)) {
      // Query is empty, return 1 random quote
      Quote.aggregate([
        { $sample: { size: 1 } }, // You want to get 1 doc
      ]).exec((err, results) => {
        next(err);
        return res.json(results[0]);
      });
    } else if (!comic && num) {
      //  Query has num, return "num" number of random quotes
      Quote.aggregate([
        { $sample: { size: parseInt(num, 10) } }, // You want to get num docs
      ]).exec((err, results) => {
        next(err);
        return res.json(results);
      });
    } else if (!num && comic) {
      // Query has comic, return 1 quote from "comic"
      Quote.aggregate([
        { $match: { comic } }, // filter the results
        { $sample: { size: 1 } },
      ]).exec((err, results) => {
        next(err);
        return res.json(results);
      });
    } else if (comic && num) {
      // Query has both, num and comic, return "num" number of "comic" quotes
      Quote.aggregate([
        { $match: { comic } }, // filter the results
        { $sample: { size: parseInt(num, 10) } },
      ]).exec((err, results) => {
        next(err);
        return res.json(results);
      });
    } else {
      res.json({ error: "Not a Valid Request" });
    }
  } else {
    return res.json({ error: "Invalid API Key" });
  }
});

Router.get("/:key/quote/:id", async (req, res, next) => {
  const key = req.params.key;
  if (await checkAPIKey(key)) {
    // TODO: Return quote with quoteID: req.params.id
    const quoteID = parseInt(req.params.id, 10);
    try {
      const quote = await Quote.findOne({ quoteID });
      // console.log(quote);
      return res.json(quote);
    } catch (e) {
      console.log(e);
      next(e);
    }
  } else {
    return res.json({ error: "Invalid API Key" });
  }
});

// Method: POST
// Create a new Quote in the DB
Router.post("/quote", async (req, res, next) => {
  const { character, quote, quoteID } = req.body;
  try {
    let newQuote = await new Quote({ character, quote, quoteID }).save();
    console.log(`From the DB: ${newQuote}`);
    res.json(newQuote);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
});

Router.get("/seed", async (req, res, next) => {
  seedData.forEach(async ({ comic, quote, author }, index) => {
    try {
      let newQuote = await new Quote({
        comic,
        quote,
        quoteID: index,
        author,
      }).save();
      console.log(`From the DB: ${newQuote}`);
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  });
  res.json({ msg: "Seeding Data" });
});

module.exports = Router;
