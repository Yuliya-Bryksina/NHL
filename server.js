const express = require("express");
const mongoose = require("mongoose");
const Team = require("./models/Team");
const GameResult = require("./models/GameResult");
const PlayerStats = require("./models/PlayerStats"); // Подключаем модель статистики игрока
require("dotenv").config(); // Подключаем библиотеку dotenv для загрузки переменных среды из файла .env

const cron = require("node-cron");

const app = express();
app.use(express.json());

const path = require("path");

// Предполагается, что ваши файлы index.html, style.css и script.js находятся в папке 'public'
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const uri = process.env.MONGODB_URI; // Используем переменную среды MONGODB_URI из файла .env

// MongoDB Connection
mongoose
  .connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post("/results", async (req, res) => {
  try {
    const { team1, team2, score1, score2 } = req.body;
    const winnerId = score1 > score2 ? team1 : score1 < score2 ? team2 : null;

    if (winnerId) {
      const winnerName =
        winnerId.toString() === team1
          ? playerNames.team1Id
          : playerNames.team2Id;
      const loserName =
        winnerId.toString() === team1
          ? playerNames.team2Id
          : playerNames.team1Id;

      console.log(
        `Обновление статистики для: победитель - ${winnerName}, проигравший - ${loserName}`
      );
      await updatePlayerStats(winnerName, loserName);
      console.log("Статистика успешно обновлена");
    }

    const newResult = new GameResult({
      date: req.body.date,
      team1: new mongoose.Types.ObjectId(team1),
      team2: new mongoose.Types.ObjectId(team2),
      score1: score1,
      score2: score2,
      winner: winnerId ? new mongoose.Types.ObjectId(winnerId) : null,
    });

    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    console.error("Ошибка при обработке результатов игры: ", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/results", async (req, res) => {
  try {
    const results = await GameResult.find().populate("team1 team2 winner");
    res.send(results);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/teams", async (req, res) => {
  try {
    const teams = await Team.find({});
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const playerNames = {
  team1Id: "Дима",
  team2Id: "Юля",
};

app.get("/weekly-results", async (req, res) => {
  try {
    // Определяем текущий день и его индекс
    let today = new Date();
    let currentDayOfWeek = today.getDay();
    let monday = new Date(today);
    let friday = new Date(today);

    // Понедельник имеет индекс 1, воскресенье - 0, корректируем даты соответственно
    monday.setDate(
      monday.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1)
    );
    friday.setDate(
      friday.getDate() + (currentDayOfWeek === 0 ? 5 : 5 - currentDayOfWeek)
    );

    // Устанавливаем начальное и конечное время дня
    monday.setHours(0, 0, 0, 0);
    friday.setHours(23, 59, 59, 999);

    // Получаем все игры с понедельника по пятницу
    const games = await GameResult.find({
      date: {
        $gte: monday,
        $lte: friday,
      },
    }).populate("team1 team2 winner");

    // Подсчет очков
    let dimasWins = 0;
    let yulisWins = 0;

    games.forEach((game) => {
      if (game.winner) {
        if (game.winner.toString() === game.team1.toString()) {
          dimasWins++;
        } else if (game.winner.toString() === game.team2.toString()) {
          yulisWins++;
        }
      }
    });

    // Проверяем, есть ли возможность досрочной победы или сыграны все игры
    const gamesPlayed = games.length;
    const gamesLeft = 10 - gamesPlayed;
    let earlyWin = false;

    if (Math.abs(dimasWins - yulisWins) > gamesLeft || gamesPlayed === 10) {
      earlyWin = true;
    }

    if (earlyWin) {
      const winnerName =
        dimasWins > yulisWins ? playerNames.team1Id : playerNames.team2Id;
      if (winnerName) {
        await updateChampionshipStats(winnerName);
      }
      res.json({
        dimasWins,
        yulisWins,
        gamesLeft,
        earlyWin,
        winner: winnerName,
      });
    } else {
      res.json({ dimasWins, yulisWins, gamesLeft, earlyWin });
    }
  } catch (error) {
    console.error("Ошибка при получении результатов: ", error);
    res.status(500).json({
      message: "Произошла ошибка на сервере при получении результатов.",
    });
  }
});

// Обновление статистики игрока после игры
async function updatePlayerStats(winner, loser) {
  // Увеличиваем количество побед для победителя
  await PlayerStats.findOneAndUpdate(
    { playerName: winner },
    { $inc: { wins: 1, matchesPlayed: 1 } },
    { upsert: true, new: true }
  );

  // Увеличиваем количество поражений для проигравшего
  await PlayerStats.findOneAndUpdate(
    { playerName: loser },
    { $inc: { losses: 1, matchesPlayed: 1 } },
    { upsert: true, new: true }
  );
}

// Вызов этой функции после каждой игры с именами победителя и проигравшего
// updatePlayerStats('Дима', 'Юля');

// Обновление статистики чемпионатов в конце недели
async function updateChampionshipStats(winner) {
  // Увеличиваем количество побед в чемпионатах для победителя
  await PlayerStats.findOneAndUpdate(
    { playerName: winner },
    { $inc: { championshipWins: 1 } },
    { upsert: true, new: true }
  );
}

// Планирование задачи на каждую субботу в полдень
cron.schedule("0 12 * * 6", async () => {
  try {
    let today = new Date();
    let monday = new Date(today);
    let friday = new Date(today);

    let currentDayOfWeek = today.getDay();
    monday.setDate(
      monday.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1)
    );
    friday.setDate(
      friday.getDate() + (currentDayOfWeek === 0 ? 5 : 5 - currentDayOfWeek)
    );

    monday.setHours(0, 0, 0, 0);
    friday.setHours(23, 59, 59, 999);

    const games = await GameResult.find({
      date: {
        $gte: monday,
        $lte: friday,
      },
    }).populate("team1 team2 winner");

    let dimasWins = 0;
    let yulisWins = 0;

    games.forEach((game) => {
      if (game.winner) {
        if (game.winner.toString() === game.team1.toString()) {
          dimasWins++;
        } else if (game.winner.toString() === game.team2.toString()) {
          yulisWins++;
        }
      }
    });

    const gamesPlayed = games.length;
    const gamesLeft = 10 - gamesPlayed;
    const earlyWin = Math.abs(dimasWins - yulisWins) > gamesLeft;

    if (gamesPlayed === 10 || earlyWin) {
      const winnerName =
        dimasWins > yulisWins
          ? playerNames.team1Id
          : yulisWins > dimasWins
          ? playerNames.team2Id
          : null;
      if (winnerName) {
        await updateChampionshipStats(winnerName);
      }
    }
  } catch (error) {
    console.error(
      "Ошибка при определении победителя недели и обновлении статистики: ",
      error
    );
  }
});
