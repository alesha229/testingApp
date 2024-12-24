// testController - основной класс для управления процессом тестирования.
// question - общий класс(родитель) для объекта вопроса.
// radioQuestion - класс потомок question для вопросов с одним привильным вариантом ответа.
// checkboxQuestion - класс потомок question для вопросов с несколькими правильными вариантами ответов.

function User() {
  this.getUserName = function () {
    //показываем поле
    //ждем ввода
  };
  this.getUserName();
}

function TestController() {
  this.currentQuestion = 0;
  this.sumResult = 0;
  this.service = new TestService();
  this.story = [];
  this.maxQuestion;
  this.isInit = null;
  this.isLast = false;
  this.init = function () {
    this.maxQuestion = this.service.testInit();
    this.questionFactory();
  };

  clearQuestion = function () {
    document.getElementById("questionContainer").innerHTML = null;
    document.getElementById("answerContainer").innerHTML = null;
  };

  this.questionFactory = function () {
    //метод для создания новых объектов вопросов в зависимости от типа вопроса,(checkBox,radio). Так же создает родителя question и настраивает наследование
    this.service.getNext(this.currentQuestion).then((data) => {
      if (this.question != undefined) {
        this.clearQuestion();
        this.question = null;
      }
      this.question = new Question(data);
      this.question.deleteTimer();
      if (data) this.question.questionInit();
    });
  };

  this.createNextQuestionObject = function (storyChunk) {
    this.isLast = this.currentQuestion >= this.maxQuestion - 1;
    if (storyChunk) this.story.push(storyChunk);
    if (this.currentQuestion >= this.maxQuestion) {
      this.showResult();
    } else {
      this.questionFactory();
    }
  };
}

function Question(question) {
  this.questionData = question;
  this.questionInit = function () {
    mutateOptions();
    mutateAnswers();
    this.createTextAnswer();
    this.createAnswers();
    this.createNextbutton();
    this.storyAnswer = {
      question: this.question.text,
      answers: this.options,
      rightAnswers: this.question.answers,
      userAnswers: [],
      right: null,
    };
    this.timeOut = this.question.timeout;
    this.deleteTimer();
    this.createTimer();
  };
  mutateOptions = function () {
    this.questionData.options = this.questionData.options.split("#;");
  };

  mutateAnswers = function () {
    this.questionData.answers = this.questionData.answers.split("#;");
  };

  isRadioQuestion = function () {
    return this.questionData.answers.length > 1 ? true : false;
  };
  this.createTimer = function () {
    if (this.timeOut != 0) {
      this.timerInterval = setInterval(() => {
        const timer = document.getElementById("timer");
        timer.innerHTML = `Осталось времени: ${this.timeOut} секунд`;
        this.timeOut--;
        if (this.timeOut < 0) {
          this.handleNext();
        }
      }, 1000);
    }
  };

  this.deleteTimer = function () {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    const timer = document.getElementById("timer");
    timer.innerHTML = ``;
  };

  this.createTextAnswer = function () {
    this.question = question;
    this.options = this.question.options;
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML = `<div class="questionText mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400 text-center">${this.question.text}</div>`;
  };

  this.createAnswers = function () {
    this.controller.isRadioQuestion()
      ? (this.answer = new TypedQuestion(this.options, "checkbox"))
      : (this.answer = new TypedQuestion(this.options, "radio"));
    Object.setPrototypeOf(this.answer, this);
  };

  this.handleNext = function () {
    this.deleteTimer();
    document.querySelectorAll("input:checked").forEach((input, index) => {
      this.storyAnswer.userAnswers.push(input.parentNode.textContent);
    });

    const allCorrectSelected = this.storyAnswer.rightAnswers.every((answer) =>
      this.storyAnswer.userAnswers.includes(answer)
    );

    const hasIncorrectSelected = this.storyAnswer.userAnswers.some(
      (answer) => !this.storyAnswer.rightAnswers.includes(answer)
    );

    this.storyAnswer.right = allCorrectSelected && !hasIncorrectSelected;
    this.controller.createNextQuestionObject(this.storyAnswer);
  };

  this.createNextbutton = function () {
    const answerContainer = document.getElementById("answerContainer");
    const nextButton = document.createElement("button");
    nextButton.classList =
      "absolute self-center top-50 mt-40 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800";
    nextButton.id = "buttonAnswer";
    if (!this.controller.isLast) {
      nextButton.innerHTML = `Следующий вопорос`;
      nextButton.onclick = () => this.handleNext();
    } else {
      nextButton.innerHTML = `Показать результаты`;
      nextButton.onclick = () => this.handleNext();
    }
    answerContainer.appendChild(nextButton);
  };
}

function TypedQuestion(options, type) {
  this.options = options;
  const answerContainer = document.getElementById("answerContainer");
  answerContainer.innerHTML = null;
  answerContainer.classList = "w-1/4 text-left mx-auto flex flex-col";
  this.options.forEach((element, index) => {
    const label = document.createElement("label");
    answerContainer.appendChild(label);

    const entryElement = document.createElement("input");
    entryElement.id = index;
    entryElement.type = type;
    entryElement.name = "radio";
    label.appendChild(entryElement);
    label.appendChild(document.createTextNode(element));
  });
}

function TestService() {
  this.testInit = async function () {
    try {
      const response = await fetch("http://localhost:8089/api/Test/TestInit");
      if (response.ok) {
        this.currentQuestion = 0;
        const data = await response.json();
        // Question.prototype = Object.create(this);
        // Question.prototype.constructor = Question;
        // TestController.prototype = Object.create(this);
        return data;
      } else {
      }
    } catch (error) {
      console.log("error loading id test " + error);
    }
  };
  this.getNext = async function (index) {
    try {
      const response = await fetch(
        `http://localhost:8089/api/Test/GetNext/${index}`
      );
      if (response.ok) {
        this.currentQuestion += 1;
        result = await response.json();
        return result;
      } else {
      }
    } catch (error) {
      console.log("error loading test info");
    }
  };
  this.showResult = function () {
    const result = document.getElementById("answerContainer");
    result.innerHTML = null;
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML = null;
    let rightSmile;
    result.classList = "flex flex-col items-center";
    const rightAnswers = this.story.filter((item) => item.right).length;
    const rightAnswersContainer = document.createElement("div");
    rightAnswersContainer.innerHTML = `Правильных ответов : ${rightAnswers} из ${this.story.length}`;
    result.appendChild(rightAnswersContainer);

    this.story.forEach((element) => {
      if (element.right) {
        this.sumResult += 1;
        rightSmile = '<span style="color: green;">✓</span>';
      } else {
        rightSmile = '<span style="color: red;">&#10005;</span>';
      }
      const entryElement = document.createElement("div");
      entryElement.classList =
        "mb-3 text-gray-500 dark:text-gray-400 w-2/4 border-2 border-black-600 rounded p-6";
      const paragraph = document.createElement("p");
      paragraph.innerHTML = `
      Текст вопроса:${element.question} <br>
      Варианты ответа:${element.answer} <br>
      Ваш ответ:${element.userAnswers} <br>
      Правильный ответ:${element.rightAnswers} <br>
      Правильно:${rightSmile}
      `;
      entryElement.appendChild(paragraph);
      result.appendChild(entryElement);
    });
  };
}

//
//
//

let prevObj;
let testService = null;
function startTest(user) {
  // if (testService) testService.controller.question.deleteTimer();
  testController = new TestController(user);
  testController.init();
  // testController.testInit();
}

function init() {
  const user = new User();
  startTest(user);
  document.getElementById("restartButton").onclick = () => startTest(user);
}

init();

// Array.prototype.first = function () {
//   return this[0];
// };
// Array.prototype.last = function () {
//   return this[this.length - 1];
// };
// Array.prototype.random = function () {
//   return this[
//     Math.round(Math.round(Math.random() * (10 * (this.length - 1))) / 10)
//   ];
// };
// console.log([2, 5, 5, 3, 2, 4].first());
// console.log([2, 5, 5, 3, 2, 4].last());
// console.log(
//   [
//     2, 5, 5, 3, 2, 4, 211252315, 228, 15454353454354345, 424, 4325, 65436, 7437,
//     347, 3457, 347, 37454, 73457, 73547, 533,
//   ].random()
// );
