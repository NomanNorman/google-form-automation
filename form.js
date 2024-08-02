import puppeteer from 'puppeteer'; // Import Puppeteer for headless browser automation
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import the Google Generative AI SDK
import dotenv from 'dotenv'; // Import dotenv for environment variables

dotenv.config(); // Load environment variables from .env file

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const googleFormUrl = process.env.FORM_URL; // Set your Google Form URL in .env file

// Function to fetch answers from Gemini API in batches
async function fetchAnswersFromGeminiBatch(questionsWithOptions) {
    try {
        // Construct a prompt that asks for the correct answer options only
        const prompt = questionsWithOptions.map(({ question, options }) => 
            `For the following question, please provide only the correct answer option without any explanation:\n\nQuestion: "${question}"\nOptions: ${options.join(', ')}`
        ).join('\n\n'); // Join prompts with double newlines

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);

        // Directly return the raw response text without processing
        return result.response.text().split('\n'); // Return the raw response split by lines
    } catch (error) {
        console.error(`Error fetching answers from Gemini API: ${error.message}`);
        return []; // Return an empty array in case of an error
    }
}

// Function to clean and normalize text by removing serial numbers, asterisks, and parentheses
function cleanText(text) {
    return text
        .replace(/^\d+\.\s*|\s*\d+\s*|\s*[\d]+\.\s*/g, '') // Remove serial numbers
        .replace(/[\*\(\)]/g, '') // Remove asterisks and parentheses
        .trim(); // Trim leading and trailing whitespace
}

// Function to fill a single question in the Google Form
async function fillSingleQuestion(page, questionIndex, question, options, answer) {
    // Clean the answer by trimming whitespace
    const cleanedAnswer = cleanText(answer); // Use the cleanText function

    if (cleanedAnswer) {
        console.log(`Generated answer for question: ${cleanedAnswer}`);

        // Automatically select the correct option based on the cleaned answer
        const wasSelected = await page.$$eval('div.geS5n', (nodes, questionIndex, cleanedAnswer) => {
            const cleanText = (text) => {
                return text.trim();
            };

            let selected = false;
            if (nodes[questionIndex]) {
                const node = nodes[questionIndex];
                const optionElements = node.querySelectorAll('div.AB7Lab.Id5V1'); // Use the provided selector
                optionElements.forEach(optionElement => {
                    const label = optionElement.closest('label'); // Find the label element
                    const cleanedLabelText = cleanText(label.innerText); // Clean the label text
                    if (label && cleanedLabelText === cleanedAnswer) { // Check if the label text matches the cleaned answer
                        label.click(); // Select the correct option
                        console.log(`Selected answer: ${cleanedAnswer}`);
                        selected = true; // Mark as selected
                    } else {
                        console.log(`Comparing "${cleanedLabelText}" with "${cleanedAnswer}"`);
                    }
                });
            }
            return selected; // Return whether the answer was selected
        }, questionIndex, cleanedAnswer);

        if (!wasSelected) {
            console.error(`Error: Answer "${cleanedAnswer}" could not be selected. Available options: ${options.join(', ')}`);
        }
    } else {
        console.error(`No answer generated for question`);
    }
}

// Main function to fill the Google Form
async function fillGoogleForm(formUrl) {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to false for visible browser operation
    const page = await browser.newPage();
    
    await page.goto(formUrl, { waitUntil: 'networkidle0' });

    // Wait for form to load
    await page.waitForSelector('form');

    // Extract questions and their options
    const questions = await page.$$eval('div.geS5n', nodes => 
        nodes.map(node => {
            const questionElement = node.querySelector('div[role="heading"] span.M7eMe');
            const options = Array.from(node.querySelectorAll('div[role="radiogroup"] label div.YEVVod span.aDTYNe')).map(option => option.innerText);
            return { question: questionElement ? questionElement.innerText : '', options };
        })
    );

    console.log('Questions:', questions);

    // Fetch answers in batch
    const generatedAnswers = await fetchAnswersFromGeminiBatch(questions);
    
    // Adjust for answer offset (start from the first answer)
    const adjustedAnswers = [''] // Add a placeholder for index 0
        .concat(generatedAnswers); // Prepend an empty string to shift answers

    // Now, select the correct options based on adjusted answers one by one
    for (let i = 0; i < questions.length; i++) {
        const { question, options } = questions[i];
        const answer = adjustedAnswers[i + 1]; // Get the corresponding answer (shifted by 1 due to added placeholder)
        
        // Fill in the answer for the current question
        await fillSingleQuestion(page, i, question, options, answer);
    }

    console.log("Please review the form before submission. Press Ctrl+C to exit.");
    // The form will remain open until you manually close it

    // Uncomment this if you want to auto-submit after manual review
    // const submitSelector = 'div[role="button"][aria-label="Submit"]'; // Adjust selector for the submit button
    // await page.waitForSelector(submitSelector);
    // await page.click(submitSelector);
    // console.log("Form submitted successfully!");
}

// Get the form URL from the query parameters
const urlParams = new URLSearchParams(window.location.search);
const formLink = urlParams.get('formLink');

if (formLink) {
    fillGoogleForm(formLink).catch(error => console.error(`Error in filling the form: ${error.message}`));
} else {
    console.error('No form link provided.');
}
