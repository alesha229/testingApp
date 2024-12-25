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
  this.maxQuestion = null;
  this.isInit = null;
  this.isLast = false;
}
Object.assign(TestController.prototype, {
  init() {
    this.service.testInit().then((result) => (this.maxQuestion = result));
    this.questionFactory();
  },

  clearQuestion() {
    document.getElementById("questionContainer").innerHTML = null;
    document.getElementById("answerContainer").innerHTML = null;
  },

  questionFactory() {
    //метод для создания новых объектов вопросов в зависимости от типа вопроса,(checkBox,radio). Так же создает родителя question и настраивает наследование
    this.service.getNext(this.currentQuestion).then((data) => {
      if (this.question != undefined) {
        this.clearQuestion();
        this.question = null;
      }
      this.currentQuestion += 1;
      this.question = new Question(data, this);
      this.question.questionInit();
      // this.question.deleteTimer();
    });
  },

  createNextQuestionObject(storyChunk) {
    this.isLast = this.currentQuestion >= this.maxQuestion - 1;
    if (storyChunk) this.story.push(storyChunk);
    if (this.currentQuestion >= this.maxQuestion) {
      this.showResult();
    } else {
      this.questionFactory();
    }
  },
  showResult() {
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
      console.log(element);
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
      Варианты ответа:<br>${element.answers.join("<br>")} <br>
      Ваш ответ:${element.userAnswers} <br>
      Правильный ответ:${element.rightAnswers} <br>
      Правильно:${rightSmile}
      `;
      entryElement.appendChild(paragraph);
      result.appendChild(entryElement);
    });
  },
});

function Question(question, parent) {
  this.questionData = question;
  this.controller = parent;
  console.log(question);
  this.storyAnswer = {
    question: this.questionData.text,
    answers: this.questionData.options,
    rightAnswers: this.questionData.answers,
    userAnswers: [],
    right: null,
  };
}
Object.assign(Question.prototype, {
  questionInit() {
    this.mutateOptions();
    this.mutateAnswers();
    this.createAnswers(this, this.questionData);
    this.createTextAnswer(this.questionData);
    this.timeOut = this.questionData.timeout;
    this.deleteTimer();
    this.createTimer();
  },
  mutateOptions() {
    this.questionData.options = this.questionData.options.split("#;");
  },

  mutateAnswers() {
    this.questionData.answers = this.questionData.answers.split("#;");
  },

  isRadioQuestion() {
    return this.questionData.answers.length > 1 ? true : false;
  },
  createTimer() {
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
  },

  deleteTimer(timerInterval) {
    clearInterval(timerInterval);
    this.timerInterval = null;
    const timer = document.getElementById("timer");
    timer.innerHTML = ``;
  },

  createTextAnswer() {
    this.options = this.questionData.options;
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML = `<div class="questionText mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400 text-center">${this.questionData.text}</div>`;
  },

  createAnswers() {
    console.log(this.controller);
    this.isRadioQuestion(this.questionData)
      ? (this.answer = new CheckBoxQuestion(
          this.questionData.options,
          this.controller.isLast,
          this.questionData,
          this.handleNext,
          this.controller
        ))
      : (this.answer = new RadioQuestion(
          this.questionData.options,
          this.controller.isLast,
          this.questionData,
          this.handleNext,
          this.controller
        ));
    // Object.setPrototypeOf(this.answer, this);
    this.answer.init();
  },

  handleNext() {
    console.log(this.timerInterval);
    this.deleteTimer(this.controller.question.timerInterval);
    const allCorrectSelected = this.storyAnswer.rightAnswers.every((answer) =>
      this.storyAnswer.userAnswers.includes(answer)
    );

    const hasIncorrectSelected = this.storyAnswer.userAnswers.some(
      (answer) => !this.storyAnswer.rightAnswers.includes(answer)
    );

    this.storyAnswer.right = allCorrectSelected && !hasIncorrectSelected;
    this.controller.createNextQuestionObject(this.storyAnswer);
  },
  createNextbutton() {
    console.log(this);
    const answerContainer = document.getElementById("answerContainer");
    const nextButton = document.createElement("button");
    nextButton.classList =
      "absolute self-center top-50 mt-40 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800";
    nextButton.id = "buttonAnswer";
    if (!this.isLast) {
      nextButton.innerHTML = `Следующий вопорос`;
      nextButton.onclick = () => this.handleNext();
    } else {
      nextButton.innerHTML = `Показать результаты`;
      nextButton.onclick = () => this.handleNext();
    }
    answerContainer.appendChild(nextButton);
  },
});

function RadioQuestion(
  options,
  isLast,
  question,
  handleNextCallback,
  controller
) {
  this.question = question;
  Question.call(this, question);
  this.controller = controller;
  this.options = options;
  this.isLast = isLast;
  this.handleNextCallback = handleNextCallback;
}
Object.assign(RadioQuestion.prototype, Question.prototype);
Object.assign(RadioQuestion.prototype, {
  init() {
    this.renderQuestion();
    this.createNextbutton.call(this, this.question, this.questionData);
  },
  handleNext() {
    document.querySelectorAll("input:checked").forEach((input, index) => {
      this.storyAnswer.userAnswers.push(input.parentNode.textContent);
    });
    this.handleNextCallback.call(this, this.storyAnswer);
  },
  renderQuestion() {
    const answerContainer = document.getElementById("answerContainer");
    answerContainer.innerHTML = null;
    answerContainer.classList = "w-1/4 text-left mx-auto flex flex-col";
    this.options.forEach((element, index) => {
      const label = document.createElement("label");
      answerContainer.appendChild(label);
      const entryElement = document.createElement("input");
      entryElement.id = index;
      entryElement.type = "radio";
      entryElement.name = "radio";
      label.appendChild(entryElement);
      label.appendChild(document.createTextNode(element));
    });
  },
});
function CheckBoxQuestion(
  options,
  isLast,
  question,
  handleNextCallback,
  controller
) {
  this.question = question;
  Question.call(this, question);
  this.controller = controller;
  this.options = options;
  this.isLast = isLast;
  this.handleNextCallback = handleNextCallback;
}
Object.assign(CheckBoxQuestion.prototype, Question.prototype);
Object.assign(CheckBoxQuestion.prototype, {
  init() {
    this.renderQuestion();
    this.createNextbutton.call(this, this.question, this.questionData);
  },
  handleNext() {
    document.querySelectorAll("input:checked").forEach((input, index) => {
      this.storyAnswer.userAnswers.push(input.parentNode.textContent);
    });
    this.handleNextCallback.call(this, this.storyAnswer);
  },
  renderQuestion() {
    const answerContainer = document.getElementById("answerContainer");
    answerContainer.innerHTML = null;
    answerContainer.classList = "w-1/4 text-left mx-auto flex flex-col";
    this.options.forEach((element, index) => {
      const label = document.createElement("label");
      answerContainer.appendChild(label);
      const entryElement = document.createElement("input");
      entryElement.id = index;
      entryElement.type = "checkBox";
      entryElement.name = "checkBox";
      label.appendChild(entryElement);
      label.appendChild(document.createTextNode(element));
    });
  },
});

function TestService() {}
Object.assign(TestService.prototype, {
  async testInit() {
    try {
      const response = await fetch("http://localhost:8089/api/Test/TestInit");
      if (response.ok) {
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
  },
  async getNext(index) {
    try {
      const response = await fetch(
        `http://localhost:8089/api/Test/GetNext/${index}`
      );
      if (response.ok) {
        result = await response.json();
        return result;
      } else {
      }
    } catch (error) {
      console.log("error loading test info");
    }
  },
});
//
//
//

let prevObj;
let testController = null;
function startTest(user) {
  if (testController)
    testController.question.deleteTimer(testController.question.timerInterval);
  testController = new TestController(user);
  console.log(testController);
  testController.init();
  // testController.testInit();
}

function init() {
  const user = new User();
  startTest(user);
  document.getElementById("restartButton").onclick = () => startTest(user);
  // el.addEventListener('click', () => {
  //   console.log("awdawdawd")
  // })
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

// function Question() {
//   this.method = function () {
//     console.log("hi method");
//   };
//   //это просто переменая в конструкторе в которую мы записали функцию это не метод!! и даже если мы в протоип укажем наш объект то у нас не будет доступа до этого метода
//   //единственное как мы можем использовать этот метод только внутри самого конструктора
//   //Если мы вернем при создании колбек то это будет не Функция конструктор она не возвращает объект а возвращает колбек
//   //В классах такой синтаксис ок но это функции конструкторы!!
//   notMethod = function () {
//     //вообще такой синтаксис делает функцию глобальной
//     console.log("hi notMethod");
//   };
//   // notMethod = function () {
//   //   console.log("hi notMethod");
//   // };
//   notMethod();
//   // return notMethod
// }

// function TypedQuestion() {
//   this.methodTyped = function () {
//     console.log("hi method typed");
//   };
//   // const notMethodTyped = function () {
//   //   console.log("hi notMethod typed");
//   // };
//   TypedQuestion.prototype.notMethodTyped = function () {
//     console.log("hi notMethod typed");
//   };
//   console.dir(this);
// }
// function TypedQuestion1() {
//   this.methodTyped = function () {
//     console.log("hi method typed");
//   };
//   const notMethodTyped = function () {
//     console.log("hi notMethod typed");
//   };
//   // notMethodTyped = function () {
//   //   console.log("hi notMethod typed");
//   // };
//   window.notMethod(); //получили из window
// }

// const question = new Question();
// const typedQuestion = new TypedQuestion();
// const typedQuestion1 = new TypedQuestion1();

// // Object.setPrototypeOf(typedQuestion, question);
// Object.setPrototypeOf(typedQuestion1, Question);
// console.log(question);
// console.log(typedQuestion);
// console.log(typedQuestion1);
