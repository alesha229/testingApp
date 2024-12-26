// testController - основной класс для управления процессом тестирования.
// question - общий класс(родитель) для объекта вопроса.
// radioQuestion - класс потомок question для вопросов с одним привильным вариантом ответа.
// checkboxQuestion - класс потомок question для вопросов с несколькими правильными вариантами ответов.

//Не используется т.к неясно для каких целей нужен
function User() {
  this.getUserName = function () {
    //показываем поле
    //ждем ввода
  };
  this.getUserName();
}

function TestController() {
  //конструктор контроллера
  this.currentQuestion = 0;
  this.sumResult = 0;
  this.service = new TestService();
  this.story = [];
  this.maxQuestion = null;
  this.isInit = null;
  this.isLast = false;
}

Object.assign(TestController.prototype, {
  //Записываем методы в прототип функции конструктора, аналогично работе классов при создании экземпляра поля будут инициализированы в конструкторе
  //при вызове методов они беруться из прототипа

  //Инициализация контроллера
  init() {
    this.service.testInit().then((result) => (this.maxQuestion = result));
    this.questionFactory();
  },

  //Очистка контейнеров
  clearQuestion() {
    document.getElementById("questionContainer").innerHTML = null;
    document.getElementById("answerContainer").innerHTML = null;
  },

  questionFactory() {
    //Метод для создания новых объектов вопроса используя сервис передаём туда текущий порядковый номер вопроса .then ждём разрешения промиса
    this.service.getNext(this.currentQuestion).then((data) => {
      //Если объёкт вопроса не пустой удаляем содержимое по ссылке, очищаем DOM
      if (this.question != undefined) {
        this.clearQuestion();
        this.question = null;
      }
      //При удачной загрузке текущий вопрос +1, сервис сам по себе обрабатывает ошибки.
      this.currentQuestion += 1;
      //Создаем объект Question и записываем в контекст контроллера, передаем объект вопроса который нам вернул сервер, и ссылку на себя.
      this.question = new Question(data, this);
      //Инициализируем объект вопроса.
      this.question.questionInit();
    });
  },

  createNextQuestionObject(storyChunk) {
    //Метод который записывает результат ответа на вопрос и показывает результаты или же запсукает фабрику в зависимости от окончания тестов

    //Используется в другом месте для рендера кнопки(показать результаты)
    this.isLast = this.currentQuestion >= this.maxQuestion - 1;

    //Пушим текущий чанк истории в общий массив с ответами пользователя и всей остальной инфой.
    if (storyChunk) this.story.push(storyChunk);

    //В случае если у нас последний вопрос то в зависимости от этого показываем результаты или же запускаем фабрику
    if (this.currentQuestion >= this.maxQuestion) {
      this.showResult();
    } else {
      this.questionFactory();
    }
  },

  showResult() {
    //Метод который рендерит результаты из истории ответов ничего интересного просто работа с DOM деревом.
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
  //Конструктор Question
  this.questionData = question; //Записываем в контекст инфо полученное от сервера.
  this.controller = parent; //Ссылка на контроллер
  this.storyAnswer = {
    //Инициализация чанка истории, т.к получили от сервера поля question, answers, rightAnswers то можем удобно записать эти поля в конструкторе и позже дополнить.
    question: this.questionData.text,
    answers: this.questionData.options,
    rightAnswers: this.questionData.answers,
    userAnswers: [],
    right: null,
  };
}
Object.assign(Question.prototype, {
  questionInit() {
    //Метод инициализации
    this.mutateOptions();
    this.mutateAnswers();
    this.createAnswers(this, this.questionData);
    this.createTextAnswer(this.questionData);
    this.timeOut = this.questionData.timeout;
    this.deleteTimer();
    this.createTimer();
  },
  mutateOptions() {
    //Мутируем строку с вариантами ответов в массив
    this.questionData.options = this.questionData.options.split("#;");
  },

  mutateAnswers() {
    //Мутируем строку с ответами в массив
    this.questionData.answers = this.questionData.answers.split("#;");
  },

  isRadioQuestion() {
    //В зависимости от того больше 1 элемента в массиве, возвращаем true/false
    return this.questionData.answers.length > 1 ? true : false;
  },

  createTimer() {
    //Метод создания таймера
    if (this.timeOut != 0) {
      //Если время таймера для вопроса !=0 то создаем таймер. Он там живет своей жизнью в замыкании
      this.timerInterval = setInterval(() => {
        const timer = document.getElementById("timer");
        timer.innerHTML = `Осталось времени: ${this.timeOut} секунд`;
        this.timeOut--;
        if (this.timeOut < 0) {
          //Если время вышло то переходим к следующему вопросу
          this.handleNext();
        }
      }, 1000);
    }
  },

  deleteTimer(timerInterval) {
    //Удаление таймера
    clearInterval(timerInterval);
    this.timerInterval = null;
    const timer = document.getElementById("timer");
    timer.innerHTML = ``;
  },

  createTextAnswer() {
    //Ничего интересного просто рендер текста вопроса в DOM
    this.options = this.questionData.options;
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML = `<div class="questionText mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400 text-center">${this.questionData.text}</div>`;
  },

  createAnswers() {
    //Метод isRadioQuestion возвращает true/false в зависимости от того несколько вариантов ответа или же один.
    //Далее при помощи тернарного оператора выбираем какой тип объекта создать CheckBox или же Radio
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

    //Инициализируем варианты ответов(рендер)
    this.answer.init();
  },

  handleNext() {
    //Оригинальный handleNext Question который мы позже переопределим в ребенке

    //Если переходим дальше очищаем таймер
    this.deleteTimer(this.controller.question.timerInterval);

    //Все ли вопросы правильные
    const allCorrectSelected = this.storyAnswer.rightAnswers.every((answer) =>
      this.storyAnswer.userAnswers.includes(answer)
    );

    //Если есть 1 неправильный
    const hasIncorrectSelected = this.storyAnswer.userAnswers.some(
      (answer) => !this.storyAnswer.rightAnswers.includes(answer)
    );

    //Оба должны быть true
    this.storyAnswer.right = allCorrectSelected && !hasIncorrectSelected;

    //При помощи ссылки вызываем уже описаный метод
    this.controller.createNextQuestionObject(this.storyAnswer);
  },

  createNextbutton() {
    //Отрисовываем кнопку. Интересно что вызываем позже и дочернего элемента с указанием контекста.
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
  //Входные параметры конструктора
  options,
  isLast,
  question,
  handleNextCallback,
  controller
) {
  //Инициализация конструтктора, конструктор делает нам контекст из входных параметров
  this.question = question;
  //super() //Инициализируем конструктор Question
  Question.call(this, question, controller);
  //Вызов функции конструктора не означает вызов методов или создания нового объекта, он просто "Добавляет" контекст к нашему
  //Можем просто посмотреть что делает функция конструктор Question просто в .this записывает значения которые мы ему передали и у .this(контекста) RadioQuestion контекст расширен конструктором Question
  this.options = options;
  this.isLast = isLast;
  this.handleNextCallback = handleNextCallback; //при создании вопроса передали ссылку на метод handleNext
}
Object.assign(RadioQuestion.prototype, Question.prototype); //берем два прототипа и мержим в один итог в первый аргумент записывается
Object.assign(RadioQuestion.prototype, {
  //аналогично только методы записываем как есть
  init() {
    //инициализация типизированого вопроса
    this.renderQuestion();
    this.createNextbutton.call(this, this.question, this.questionData);
  },

  handleNext() {
    //переопределенный метод handleNext
    document.querySelectorAll("input:checked").forEach((input, index) => {
      this.storyAnswer.userAnswers.push(input.parentNode.textContent);
    });
    //Вызываем метод родителя
    Question.prototype.handleNext.call(this, this.storyAnswer);
    //Вызываем через колбек родительский одноименный метод handleNext
    // this.handleNextCallback.call(this, this.storyAnswer);
  },

  renderQuestion() {
    //Реднер вариантов ответа
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
  Question.call(this, question, controller);
  this.options = options;
  this.isLast = isLast;
  this.handleNextCallback = handleNextCallback;
}
Object.assign(CheckBoxQuestion.prototype, Question.prototype); //берем два прототипа и мержим в один итог в первый аргумент записывается
Object.assign(CheckBoxQuestion.prototype, {
  //аналогично только методы записываем как есть
  init() {
    this.renderQuestion();
    this.createNextbutton.call(this, this.question, this.questionData);
  },
  handleNext() {
    document.querySelectorAll("input:checked").forEach((input, index) => {
      this.storyAnswer.userAnswers.push(input.parentNode.textContent);
    });
    //в классах могли бы использовать super.handleNext(this.storyAnswer)
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

function TestService() {} //idk плохо ли что конструктор пустой но мы делаем по аналогии с классами и у класса конструктор может быть пустой

Object.assign(TestService.prototype, {
  //Методы сервиса отвечают только за работу с бэком, возвращают значение и не делают никаких побочных эффектов.
  async testInit() {
    try {
      const response = await fetch("http://localhost:8089/api/Test/TestInit");
      if (response.ok) {
        const data = await response.json();
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

let testController = null; //глобально храним не в замыкании функции startTest
function startTest(user) {
  if (testController)
    testController.question.deleteTimer(testController.question.timerInterval); //удаляем таймер т.к он существует в замыкании(если сущесвует)
  testController = new TestController(user); //создаём новый контроллер при запуске/перезапуске теста
  testController.init();
}

function init() {
  const user = new User(); //useless
  startTest(user); //инициализация первоначальная
  document.getElementById("restartButton").onclick = () => startTest(user); //перезапуск теста
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
