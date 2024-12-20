class User {
  constructor(name) {
    this.name = name;
  }
}
class TestService {
  constructor(user) {
    this.sumResult = 0;
    this.controller = null;
    this.maxQuestion = null;
    this.currentQuestion = 0;
  }

  async testInit() {
    try {
      const response = await fetch("http://localhost:8089/api/Test/TestInit");
      if (response.ok) {
        const data = await response.json();
        this.maxQuestion = data;

        // Question.prototype = Object.create(this);
        // Question.prototype.constructor = Question;
        // TestController.prototype = Object.create(this);
        this.controller = new TestController();

        this.controller.createNextQuestionObject();
      } else {
      }
    } catch (error) {
      console.log(error);
    }
  }

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
  }
}

class TestController extends TestService {
  constructor() {
    super();

    this.story = [];
    this.isInit = null;
    this.isLast = false;
    // this.currentQuestion = null;
    this.questionData = null;
    this.question = null;
    console.log(this);
  }
  mutateOptions() {
    this.question.questionData.options =
      this.question.questionData.options.split("#;");
  }

  mutateAnswers() {
    this.question.questionData.answers =
      this.question.questionData.answers.split("#;");
  }

  funcisRadioQuestiontion() {
    return this.question.questionData.answers.length > 1 ? true : false;
  }

  clearQuestion() {
    document.getElementById("questionContainer").innerHTML = null;
    document.getElementById("answerContainer").innerHTML = null;
  }

  async loadQuestionData() {
    console.log(this.currentQuestion);
    try {
      const response = await fetch(
        `http://localhost:8089/api/Test/GetNext/${this.currentQuestion}`
      );
      if (response.ok) {
        this.currentQuestion += 1;
        result = await response.json();
        return result;
      } else {
        this.createNextQuestionObject();
      }
    } catch (error) {
      console.log("error loading test info");
    }
  }

  questionFactory() {
    // метод для создания новых объектов вопросов в зависимости от типа вопроса,(checkBox,radio). Так же создает родителя question и настраивает наследование
    this.loadQuestionData().then((data) => {
      if (this.question != undefined) {
        this.clearQuestion();
        this.question = null;
      }
      this.questionData = data;
      this.question = new Question(this.questionData);
      this.mutateOptions();
      this.mutateAnswers();
      this.question.deleteTimer();
      if (data) this.question.questionInit();
    });
  }

  createNextQuestionObject(storyChunk) {
    this.isLast = this.currentQuestion >= this.maxQuestion - 1;
    console.log(this.maxQuestion);
    console.log(this.currentQuestion);
    if (storyChunk) this.story.push(storyChunk);
    if (this.currentQuestion >= this.maxQuestion) {
      this.showResult();
    } else {
      this.questionFactory();
    }
  }
}

class Question extends TestController {
  constructor(question) {
    super();
    this.questionData = question;
  }

  questionInit() {
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
  }

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
  }

  deleteTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    const timer = document.getElementById("timer");
    timer.innerHTML = ``;
  }

  createTextAnswer() {
    this.question = question;
    this.options = this.question.options;
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML = `<div class="questionText mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400 text-center">${this.question.text}</div>`;
  }

  createAnswers() {
    this.controller.isRadioQuestion()
      ? (this.answer = new TypedQuestion(this.options, "checkbox"))
      : (this.answer = new TypedQuestion(this.options, "radio"));
    Object.setPrototypeOf(this.answer, this);
  }

  handleNext() {
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
  }

  createNextbutton() {
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
  }
}

class TypedQuestion extends Question {
  constructor(options, type) {
    super();
    this.options = options;
    this.initInputs();
  }
  initInputs() {
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
}

//
//
//

let prevObj;
let testService = null;
function startTest(user) {
  //   if (testService) testService.controller.question.deleteTimer();
  console.log(testService);
  testService = new TestService(user);
  testService.testInit();
}

function init() {
  const user = new User();
  startTest(user);
  document.getElementById("restartButton").onclick = () => startTest(user);
}

init();
