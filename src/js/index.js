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
  //   this.testInit = testInit;
  this.mutateOptions = function () {
    this.question.options = this.question.options.split(";");
  };
  this.loadQuestionData = async function () {
    try {
      const response = await fetch("http://localhost:8089/api/Test/TestInit");
      if (response.ok) {
        const data = await response.json();

        try {
          const response = await fetch(
            `http://localhost:8089/api/Test/GetNext/${data - 1}`
          );
          if (response.ok) {
            const dataInner = await response.json();
            // const question = Object.create(TestController.prototype);
            // Question.call(question);
            new Question(dataInner);
          }
        } catch (error) {
          console.log("error loading test info");
        }
      }
    } catch (error) {
      console.log("error loading id test");
    }
  };
  //проверяет все ли вопросы показаны если да то выводим результат, иначе грузим новый вопрос
  //http://localhost:8089/api/Test/TestInit - получает айди случайного теста и запускает этот тест через testController
  this.questionFactory = function () {
    //метод для создания новых объектов вопросов в зависимости от типа вопроса,(checkBox,radio). Так же создает родителя question и настраивает наследование
    this.loadQuestionData();
  };
}
function Question(question) {
  //Брать из прототипа(из контролера)
  console.log(this);
  this.question = question;
  const questionContainer = document.getElementById("questionContainer");
  questionContainer.innerHTML = `
                    <div class="questionText">${this.question.text}</div>`;
  //Создает Dom вопроса при создании
  //Выводит текст вопроса
  this.mutateOptions();
  console.log(this.question);
  this.isRadioQuestion = function () {
    return this.question.answers.lenght > 1 ? true : false;
  };
  this.isRadioQuestion()
    ? new RadioQuestion(this.question.options)
    : new CheckBoxQuestion(this.question.options);
  //общий конструктор для CheckBoxQuestion и RadioQuestion при создании в их прототип указывать его.
}
function CheckBoxQuestion() {
  //Выводит варианты ответов чекбоксами
}
function RadioQuestion() {
  //Выводит варианты ответов радио-кнопками
}
function TestService() {}
function startTest(user) {
  const controller = new TestController(user);
  controller.questionFactory();
}
function init() {
  const user = new User();

  startTest(user);
}
init();
