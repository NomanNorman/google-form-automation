import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const googleFormUrl = process.env.FORM_URL; // Set your Google Form URL in .env file

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

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

// Function to clean and normalize text by removing serial numbers, asterisks, and parentheses
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
            const cleanText = (text) => {
                return text.trim();
            };

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
                    } else {
                        console.log(`Comparing "${cleanedLabelText}" with "${cleanedAnswer}"`);
                    }
                });
            }
            return selected;
        }, questionIndex, cleanedAnswer);

        if (!wasSelected) {
            console.error(`Error: Answer "${cleanedAnswer}" could not be selected. Available options: ${options.join(', ')}`);
        }
    } else {
        console.error(`No answer generated for question`);
    }
}

// Main function to fill the Google Form
async function fillGoogleForm() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto(googleFormUrl, { waitUntil: 'networkidle0' });
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

    console.log("Please review the form before submission. Press Ctrl+C to exit.");
}

// Start automation endpoint
app.post('/start-automation', async (req, res) => {
    try {
        await fillGoogleForm();
        res.json({ message: 'Automation started successfully!' });
    } catch (error) {
        console.error(`Error starting automation: ${error.message}`);
        res.status(500).json({ message: 'Failed to start automation' });
    }
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
