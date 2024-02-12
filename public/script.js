// script.js

// Функция для получения команд с сервера и их отображения в <select>
// script.js

// Функция для получения команд с сервера и их отображения в <select>
function fetchTeams() {
  fetch("/api/teams") // Путь к вашему API для получения списка команд
    .then((response) => response.json())
    .then((teams) => {
      const team1Select = document.getElementById("team1");
      const team2Select = document.getElementById("team2");

      // Заполняем <select> элементы опциями команд
      teams.forEach((team) => {
        team1Select.options[team1Select.options.length] = new Option(
          team.name,
          team._id
        );
        team2Select.options[team2Select.options.length] = new Option(
          team.name,
          team._id
        );
      });
    })
    .catch((error) => {
      console.error("Ошибка при получении команд:", error);
    });
}

// Вызываем функцию fetchTeams при загрузке страницы
document.addEventListener("DOMContentLoaded", fetchTeams);

// Функция для отправки результатов игры на сервер
function submitGameResult(event) {
  event.preventDefault(); // Предотвращаем стандартное поведение формы

  const formData = new FormData(event.target);
  const gameResult = {
    date: formData.get("date"),
    team1: formData.get("team1"),
    team2: formData.get("team2"),
    score1: formData.get("score1"),
    score2: formData.get("score2"),
  };

  fetch("/results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(gameResult),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Результат добавлен:", result);
      fetchResults(); // Это обновит таблицу данными из БД
      fetchWeeklyResults(); // Также обновим недельные результаты
    })
    .catch((error) => {
      console.error("Ошибка при добавлении результата игры:", error);
    });
}

// Функция для добавления результата игры в таблицу на UI
// Функция для добавления результата игры в таблицу на UI
function addResultToTable(result) {
  const resultsTable = document
    .getElementById("resultsTable")
    .getElementsByTagName("tbody")[0];
  resultsTable.innerHTML = ""; // Очистите таблицу перед добавлением новых результатов

  result.forEach((game) => {
    const newRow = resultsTable.insertRow();

    // Форматирование даты
    const date = new Date(game.date);
    const formattedDate = date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Добавление даты
    newRow.insertCell().textContent = formattedDate;

    // Добавление команды Димы и счета
    newRow.insertCell().textContent = game.team1.name;
    newRow.insertCell().textContent = game.score1 + " - " + game.score2;

    // Добавление команды Юли
    newRow.insertCell().textContent = game.team2.name;

    // Определение и добавление победителя
    const winnerCell = newRow.insertCell();
    let winnerText = "Ничья";
    if (game.winner) {
      winnerText = game.winner.name;
      if (game.winner._id === game.team1._id) {
        winnerText += " (Дима)";
        winnerCell.classList.add("winner-dima");
      } else if (game.winner._id === game.team2._id) {
        winnerText += " (Юля)";
        winnerCell.classList.add("winner-yuli");
      }
    }
    winnerCell.textContent = winnerText;
  });
}

// Функция для загрузки и отображения результатов игр из базы данных
function fetchResults() {
  fetch("/results") // Путь к вашему API для получения результатов игр
    .then((response) => response.json())
    .then((results) => {
      addResultToTable(results); // Обновляем таблицу данными из БД
    })
    .catch((error) => {
      console.error("Ошибка при получении результатов:", error);
    });
}

// Вызываем функцию fetchResults при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  fetchTeams(); // Уже существующая функция для загрузки команд
  fetchResults(); // Функция для загрузки результатов игр
});

// Добавляем обработчик события 'submit' для формы
document
  .getElementById("gameResultForm")
  .addEventListener("submit", submitGameResult);

function fetchWeeklyResults() {
  fetch("/weekly-results")
    .then((response) => response.json())
    .then((data) => {
      // Обновляем интерфейс с текущими результатами
      document.getElementById("dimasWins").textContent = data.dimasWins;
      document.getElementById("yulisWins").textContent = data.yulisWins;
      document.getElementById("gamesLeft").textContent = data.gamesLeft;

      // Если earlyWin true, отображаем сообщение о досрочной победе
      if (data.earlyWin) {
        document.getElementById("earlyWinMessage").textContent =
          "У нас уже есть победитель! " + data.winner;
      }
    })
    .catch((error) => {
      console.error("Ошибка при получении еженедельных результатов: ", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Установка текущей даты в поле ввода даты
  const dateInput = document.querySelector('input[type="date"]');
  const today = new Date().toISOString().split("T")[0]; // Получаем сегодняшнюю дату в формате YYYY-MM-DD
  dateInput.value = today; // Устанавливаем значение поля ввода даты сегодняшней датой
  fetchTeams();
  fetchResults();
  fetchWeeklyResults();
});
