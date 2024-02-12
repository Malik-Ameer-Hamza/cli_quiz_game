#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import showBanner from "node-banner";
import { createSpinner } from "nanospinner";


// Interface for Question data from API
interface Question {
    type: "boolean" | "multiple",
    difficulty: "easy" | "medium" | "hard",
    category: string,
    question: string,
    correct_answer: string,
    incorrect_answers: string[]

};


// Wait for a specific time 
let delay = (time = 2000) => new Promise((r) => setTimeout(r, time));


// Display introductory banner
let displayBanner = async () => {
    await showBanner(
        "Quiz",
        "You can choose number of MCQs, Category and difficulty level"
    )
}


// Prompt user for their name
async function getUserName(): Promise<string> {
    let { userName } = await inquirer.prompt([{
        name: "userName",
        type: "input",
        message: "Enter your name: "
    }])

    return userName;
}

// Prompt user for desired difficulty level
async function difficultyLevel(): Promise<string> {
    let { difficulty } = await inquirer.prompt([{
        name: "difficulty",
        type: "rawlist",
        choices: ["Easy", "Medium", "Hard"]
    }]);

    return difficulty.toLowerCase();
}

// Prompt user for desired number of questions
async function noOfQuestions(): Promise<number> {
    let { questionsNumber } = await inquirer.prompt([{
        name: "questionsNumber",
        type: "number",
        message: "Enter number of questions (Max 50) : ",
        validate: (input) => {
            if (isNaN(input)) {
                console.log(`Please enter a number not ${input}`);
            } else if (input < 1 || input > 50) {
                console.log(`Please enter a number between 1 and 50`)
            } else {
                return true;
            }
        }
    }]);

    return questionsNumber;
}


// Select category from a list
async function selectCategory(): Promise<{ userCategory: number, categoryName: string }> {

    let categories = [
        { name: "General Knowledge", value: 9 },
        { name: "History", value: 23 },
        { name: "Entertainment: Books", value: 10 },
        { name: "Entertainment: Music", value: 12 },
        { name: "Entertainment: Video Games", value: 15 },
        { name: "Entertainment: Science & Nature", value: 17 },
        { name: "Computers", value: 18 },
        { name: "Mathematics", value: 19 },
        { name: "Sports", value: 21 },
        { name: "Animals", value: 27 }
    ];

    let { userCategory } = await inquirer.prompt([{
        name: "userCategory",
        type: "list",
        choices: categories,
        message: "Select your category"
    }]);

    const selectedCategory = categories.find((category) => category.value === userCategory);

    let categoryName = selectedCategory?.name;

    if (!categoryName) {
        categoryName = "Unknow Category"
    }

    return { userCategory, categoryName };
}


// Fetch quiz questions from API
async function dataFetching(questions: number, category: number, difficultyConsole: string): Promise<Question[]> {
    let data = await fetch(`https://opentdb.com/api.php?amount=${questions}&category=${category}&difficulty=${difficultyConsole}&type=multiple`)
        .then((data) => data.json())
        .then((quiz) => quiz.results)
        .catch((error) => console.log(`Error During fetching data : \n ${error}`));

    return data;
}


// Conduct the quiz, asking questions and tracking score
async function startQuiz(data: Question[], questions: number): Promise<number> {
    let userCorrectAnswer: number = 0;
    for (let i = 0; i < questions; i++) {
        console.log(`\n`);
        console.log(chalk.bgRgb(112, 92, 1).whiteBright(`Question ${i + 1}/${questions}: `))

        let userQuestions = data[i].question
        console.log(userQuestions);

        let random = Math.floor(Math.random() * 3)

        let incorrectAnswers = data[i].incorrect_answers
        let correcAnswer = data[i].correct_answer;

        // pushing correct and incorrect answers into a single array
        let userOptions = incorrectAnswers.slice();
        userOptions.splice(random, 0, correcAnswer);

        let { mcqs } = await inquirer.prompt([{
            name: "mcqs",
            type: "rawlist",
            choices: userOptions,
            message: "Choose Correct Option: "
        }]);

        let userAnswer = await mcqs;

        if (userAnswer === correcAnswer) {
            userCorrectAnswer++
        }
    };

    return userCorrectAnswer
};


// Display quiz results
async function showResult(correcAnswer: number, userName: string, questionsNo: number, category: string, difficultyConsole: string) {
    let percentage = Math.floor((correcAnswer / questionsNo) * 100);
    let person = percentage >= 50 ? "Champion" : "Loser"
   
    console.log(`\n`);
    console.log(chalk.bgRed.whiteBright(`                 Your Scorecard                `))
    console.log(`\t      Scorecard of a ${person}: `);
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Name : ${chalk.whiteBright(userName)}`))
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Category : ${chalk.whiteBright(category)}`));
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Difficulty : ${chalk.whiteBright(difficultyConsole)}`))
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Total MCQs : ${chalk.whiteBright(questionsNo)}`))
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Correct Answers : ${chalk.whiteBright(correcAnswer + " out of " + questionsNo)}`))
    console.log(chalk.whiteBright(`--------------------------------------`))
    console.log(chalk.rgb(255, 142, 133)(` Percentage : ${chalk.whiteBright(percentage +"% out of 100%" )}`))
    console.log(chalk.whiteBright(`--------------------------------------`))


}


// execute the entire quiz flow asynchronously.
(async () => {
    await displayBanner();
    await delay(1000);

    let userName = await getUserName();
    let { userCategory, categoryName } = await selectCategory();
    let difficultyConsole = await difficultyLevel();
    let questionsNo = await noOfQuestions();

    let spinner = createSpinner("Loading MCQs...").start();
    let data = await dataFetching(questionsNo, userCategory, difficultyConsole);
    await delay(1000);
    spinner.success({ text: 'MCQs Loaded' });

    let userCorrectAnswer = await startQuiz(data, questionsNo);
    await showResult(userCorrectAnswer, userName, questionsNo, categoryName, difficultyConsole);

})();