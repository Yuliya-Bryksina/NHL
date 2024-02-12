const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  score1: {
    type: Number,
    required: true,
  },
  score2: {
    type: Number,
    required: true,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
});

module.exports = mongoose.model("GameResult", gameResultSchema);
