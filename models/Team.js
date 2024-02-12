const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // Добавьте другие поля, если нужно
});

module.exports = mongoose.model("Team", teamSchema);
