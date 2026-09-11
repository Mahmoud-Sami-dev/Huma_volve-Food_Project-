const express = require("express");
const { summarize } = require("../controllers/gemini.controller");
const router = express.Router();

router.post("/summarize-meal", summarize);

module.exports = router;
