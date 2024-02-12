const mongoose = require("mongoose");
const Team = require("./models/Team"); // Путь к вашей модели Team
const teams = require("./nhlTeams.json"); // Путь к файлу с данными команд

mongoose
  .connect(
    "mongodb+srv://bryksinaiuliia:LFYkEIJXcgV3bkNO@clusternhl.vg3ed3e.mongodb.net/"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const importTeams = async () => {
  try {
    await Team.deleteMany({}); // Очищает коллекцию, если это необходимо
    await Team.insertMany(teams);
    console.log("Teams have been successfully imported!");
  } catch (error) {
    console.error("Error importing teams:", error);
  } finally {
    mongoose.disconnect();
  }
};

importTeams();
