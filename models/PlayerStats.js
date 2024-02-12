const mongoose = require("mongoose");

// Схема для статистики игрока
const playerStatsSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
  },
  matchesPlayed: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  championshipWins: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("PlayerStats", playerStatsSchema);
