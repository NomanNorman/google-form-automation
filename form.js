import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const googleFormUrl = ''; // This will be set dynamically later

// Function to fetch answers from Gemini API in batches
async function fetchAnswersFromGeminiBatch(questionsWithOptions) {
    try {
        const prompt = questionsWithOptions.map(({ question, options }) => 
            `For the following question, please provide only the correct answer option without any explanation:\n\nQuestion: "${question}"\nOptions: ${options.join(', ')}`
        ).join('\n\n');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);

        return result.response.text().split('\n');
    } catch (error) {
        console.error(`Error fetching answers from Gemini API: ${error.message}`);
        return [];
    }
}

// Function to clean and normalize text
function cleanText(text) {
    return text
        .replace(/^\d+\.\s*|\s*\d+\s*|\s*[\d]+\.\s*/g, '')
        .replace(/[\*\(\)]/g, '')
        .trim();
}

// Function to fill a single question in the Google Form
async function fillSingleQuestion(page, questionIndex, question, options, answer) {
    const cleanedAnswer = cleanText(answer);
    if (cleanedAnswer) {
        console.log(`Generated answer for question: ${cleanedAnswer}`);
        const wasSelected = await page.$$eval('div.geS5n', (nodes, questionIndex, cleanedAnswer) => {
            let selected = false;
            if (nodes[questionIndex]) {
                const node = nodes[questionIndex];
                const optionElements = node.querySelectorAll('div.AB7Lab.Id5V1');
                optionElements.forEach(optionElement => {
                    const label = optionElement.closest('label');
                    const cleanedLabelText = cleanText(label.innerText);
                    if (label && cleanedLabelText === cleanedAnswer) {
                        label.click();
                        console.log(`Selected answer: ${cleanedAnswer}`);
                        selected = true;
                    }
                });
            }
            return selected;
        }, questionIndex, cleanedAnswer);

        if (!wasSelected) {
            console.error(`Error: Answer "${cleanedAnswer}" could not be selected.`);
        }
    } else {
        console.error(`No answer generated for question`);
    }
}

// Main function to fill the Google Form
async function fillGoogleForm(formUrl) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto(formUrl, { waitUntil: 'networkidle0' });

    await page.waitForSelector('form');

    const questions = await page.$$eval('div.geS5n', nodes => 
        nodes.map(node => {
            const questionElement = node.querySelector('div[role="heading"] span.M7eMe');
            const options = Array.from(node.querySelectorAll('div[role="radiogroup"] label div.YEVVod span.aDTYNe')).map(option => option.innerText);
            return { question: questionElement ? questionElement.innerText : '', options };
        })
    );

    console.log('Questions:', questions);

    const generatedAnswers = await fetchAnswersFromGeminiBatch(questions);
    
    const adjustedAnswers = [''].concat(generatedAnswers);

    for (let i = 0; i < questions.length; i++) {
        const { question, options } = questions[i];
        const answer = adjustedAnswers[i + 1];
        await fillSingleQuestion(page, i, question, options, answer);
    }

    console.log("Please review the form before submission.");
}

// Function to extract the form link from the URL and start filling
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formLink = urlParams.get('formLink');
    if (formLink) {
        await fillGoogleForm(formLink);
    }
});
