// LifeSync Frontend MVP - Vanilla JavaScript

// --- DOM Elements ---
const mainContainer = document.getElementById('mainContainer');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.main-section');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');
const languageSwitcher = document.getElementById('languageSwitcher');

// Assessment Elements
const assessmentSection = document.getElementById('assessmentSection');
const loadingQuestions = document.getElementById('loadingQuestions');
const assessmentContent = document.getElementById('assessmentContent');
const questionCounter = document.getElementById('questionCounter');
const progressBar = document.getElementById('progressBar');
const questionText = document.getElementById('questionText');
const questionInputArea = document.getElementById('questionInputArea');
const cumulativeFeedback = document.getElementById('cumulativeFeedback');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const completeAssessmentBtn = document.getElementById('completeAssessmentBtn');
const assessmentError = document.getElementById('assessmentError');

// Report Elements
const reportSection = document.getElementById('reportSection');
const loadingReport = document.getElementById('loadingReport');
const reportContent = document.getElementById('reportContent');
const reportSummaryText = document.getElementById('reportSummaryText');
const userAnswersList = document.getElementById('userAnswersList');
const reportError = document.getElementById('reportError');
const reportErrorMessage = document.getElementById('reportErrorMessage');
const guestReportNavLink = document.querySelector('.nav-link[data-section="2"]'); // Guest Report nav link

// --- State Variables ---
let currentSectionIndex = 0;
let guestQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = []; // Store answers for the guest assessment
// Placeholder for cumulative score/feedback from backend
let currentCumulativeFeedback = '';

// --- Configuration ---
// IMPORTANT: Replace with your actual backend API URL when deployed
const API_BASE_URL = 'YOUR_BACKEND_API_URL'; // e.g., 'https://api.salatiso.com/lifesync/api'

// --- Navigation Logic ---

/**
 * Navigates to a specific section by index.
 * @param {number} sectionIndex - The index of the section to navigate to (0-based).
 */
function navigateToSection(sectionIndex) {
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
        // Calculate the translation percentage based on the number of sections
        const totalSections = sections.length;
        const translatePercentage = -(sectionIndex * 100 / totalSections);
        mainContainer.style.transform = `translateX(${translatePercentage}%)`;
        currentSectionIndex = sectionIndex;

        // Update active navigation link style
        navLinks.forEach(link => link.classList.remove('text-ls-primary', 'font-semibold'));
        navLinks.forEach(link => {
            if (parseInt(link.dataset.section) === sectionIndex) {
                link.classList.add('text-ls-primary', 'font-semibold');
            }
        });

        // Hide mobile menu if open
        mobileMenu.classList.add('hidden');

        // Hide report section nav link if not on report section
        if (sectionIndex !== 2) {
             guestReportNavLink.style.display = 'none';
        } else {
             guestReportNavLink.style.display = 'block'; // Show if navigating to it directly (e.g., via URL token)
        }

        // Scroll the current section to the top (important for sections with overflow)
        sections[currentSectionIndex].scrollTop = 0;
    }
}

// Add click listeners to navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Ensure we get the data-section from the closest ancestor with the class nav-link
        const sectionIndex = parseInt(e.target.closest('.nav-link').dataset.section);
        navigateToSection(sectionIndex);
    });
});

// --- Mobile Menu Toggle ---
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// --- Modal Logic ---

/**
 * Opens a modal.
 * @param {string} modalId - The ID of the modal element to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Prevent background scroll when modal is open
        // We use 'hidden' on body for horizontal scroll, so no change needed here unless modals stack
        // For simplicity, we'll just keep body overflow hidden.
        // document.body.style.overflow = 'hidden';
    }
}

/**
 * Closes a modal.
 * @param {string} modalId - The ID of the modal element to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Restore body overflow if no other modals are open
        // const anyModalOpen = Array.from(document.querySelectorAll('.modal')).some(m => m.style.display === 'flex');
        // if (!anyModalOpen) {
        //     document.body.style.overflow = 'hidden'; // Keep main page overflow hidden for horizontal scroll
        // }
    }
}

// Close modal if clicked outside content
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        // const anyModalOpen = Array.from(document.querySelectorAll('.modal')).some(m => m.style.display === 'flex');
        // if (!anyModalOpen) {
        //     document.body.style.overflow = 'hidden';
        // }
    }
}

/**
 * Displays a custom message modal.
 * @param {string} title - The title of the message.
 * @param {string} message - The body message.
 * @param {string} [iconClass='fas fa-info-circle'] - Font Awesome icon class (e.g., 'fas fa-check-circle', 'fas fa-exclamation-triangle').
 * @param {string} [iconColorClass='text-ls-info'] - Tailwind text color class for the icon (e.g., 'text-ls-success', 'text-ls-danger').
 */
function showMessageModal(title, message, iconClass = 'fas fa-info-circle', iconColorClass = 'text-ls-info') {
    const messageModal = document.getElementById('messageModal');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalBody = document.getElementById('messageModalBody');
    const messageModalIcon = document.getElementById('messageModalIcon');

    messageModalTitle.textContent = title;
    messageModalBody.textContent = message;
    messageModalIcon.className = iconClass + ' ' + iconColorClass; // Set icon class and color
    openModal('messageModal');
}


// --- Guest Assessment Logic ---

/**
 * Fetches guest questions from the backend API.
 */
async function fetchGuestQuestions() {
    loadingQuestions.style.display = 'block';
    assessmentContent.style.display = 'none';
    assessmentError.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/guest/questions`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        guestQuestions = data.questions;
        userAnswers = new Array(guestQuestions.length).fill(null); // Initialize answers array
        currentQuestionIndex = 0;

        if (guestQuestions.length > 0) {
            loadingQuestions.style.display = 'none';
            assessmentContent.style.display = 'block';
            renderCurrentQuestion();
        } else {
            loadingQuestions.style.display = 'none';
            assessmentError.style.display = 'block';
             assessmentError.querySelector('p').textContent = translate('assessment.no_questions', 'No questions available.');
        }

    } catch (error) {
        console.error('Error fetching guest questions:', error);
        loadingQuestions.style.display = 'none';
        assessmentError.style.display = 'block';
         assessmentError.querySelector('p').textContent = translate('assessment.error', 'Failed to load assessment. Please try again later.');
    }
}

/**
 * Renders the current question and its input area.
 */
function renderCurrentQuestion() {
    if (currentQuestionIndex < guestQuestions.length) {
        const question = guestQuestions[currentQuestionIndex];

        // Update question counter and progress bar
        questionCounter.textContent = translate('assessment.question_counter', `Question ${currentQuestionIndex + 1} of ${guestQuestions.length}`);
        const progress = ((currentQuestionIndex + 1) / guestQuestions.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Update question text
        questionText.textContent = question.text;

        // Render input area based on question type
        questionInputArea.innerHTML = ''; // Clear previous input
        cumulativeFeedback.style.display = 'none'; // Hide previous feedback

        switch (question.type) {
            case 'text':
                questionInputArea.innerHTML = `
                    <textarea id="currentAnswerInput" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ls-primary" rows="4" placeholder="${translate('assessment.placeholder.text', 'Type your answer here...')}"></textarea>
                `;
                break;
            case 'radio':
                let radioHtml = '<div class="space-y-2">';
                question.options.forEach((option, index) => {
                    radioHtml += `
                        <div>
                            <input type="radio" id="option${index}" name="answer" value="${option.value}" class="mr-2 text-ls-primary focus:ring-ls-primary">
                            <label for="option${index}" class="text-gray-700">${option.text}</label>
                        </div>
                    `;
                });
                radioHtml += '</div>';
                questionInputArea.innerHTML = radioHtml;
                break;
            case 'scale':
                 // Assuming scale questions have min, max, and step in options or question object
                 // For simplicity, let's assume a 1-5 scale for now
                 const min = question.min_value || 1;
                 const max = question.max_value || 5;
                 const step = question.step || 1;
                 questionInputArea.innerHTML = `
                     <div class="flex items-center space-x-4">
                         <span class="text-gray-700">${question.min_label || min}</span>
                         <input type="range" id="currentAnswerInput" min="${min}" max="${max}" step="${step}" value="${Math.round((max + min) / 2)}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg">
                         <span id="scaleValueDisplay" class="font-semibold text-ls-primary">${Math.round((max + min) / 2)}</span>
                         <span class="text-gray-700">${question.max_label || max}</span>
                     </div>
                 `;
                 // Add event listener to update the displayed value for range input
                 const scaleInput = questionInputArea.querySelector('#currentAnswerInput');
                 const scaleValueDisplay = questionInputArea.querySelector('#scaleValueDisplay');
                 if(scaleInput && scaleValueDisplay) {
                     scaleInput.addEventListener('input', (e) => {
                         scaleValueDisplay.textContent = e.target.value;
                     });
                 }
                 break;
            // Add more question types (checkbox, dropdown, etc.) as needed
            default:
                questionInputArea.innerHTML = `<p class="text-ls-warning" data-translate-key="assessment.unsupported_type">Unsupported question type: ${question.type}</p>`;
                nextQuestionBtn.disabled = true; // Disable next if unsupported
        }

        // Show Next button, hide Complete button
        nextQuestionBtn.style.display = 'inline-flex';
        completeAssessmentBtn.style.display = 'none';

    } else {
        // Assessment completed
        showAssessmentCompletion();
    }
}

/**
 * Handles the click on the "Next" button.
 */
async function handleNextQuestion() {
    const currentQuestion = guestQuestions[currentQuestionIndex];
    let answer = null;

    // Capture answer based on input type
    switch (currentQuestion.type) {
        case 'text':
            answer = document.getElementById('currentAnswerInput').value;
            break;
        case 'radio':
            const selectedRadio = questionInputArea.querySelector('input[name="answer"]:checked');
            if (selectedRadio) {
                answer = selectedRadio.value;
            } else {
                 showMessageModal(translate('common.warning', 'Warning'), translate('assessment.select_answer', 'Please select an answer.'), 'fas fa-exclamation-circle', 'text-ls-warning');
                return; // Stop if no answer selected for radio
            }
            break;
        case 'scale':
             answer = document.getElementById('currentAnswerInput').value;
             break;
        default:
            answer = null; // Or handle other types
    }

    // Store the answer
    userAnswers[currentQuestionIndex] = {
        question_id: currentQuestion.id, // Assuming questions have an ID
        answer: answer
    };

    // Send answer to backend for cumulative feedback
    await sendAnswerForFeedback(currentQuestion.id, answer);

    // Move to the next question or complete
    currentQuestionIndex++;
    if (currentQuestionIndex < guestQuestions.length) {
        renderCurrentQuestion();
    } else {
        // Show the Complete button on the last question screen
         questionCounter.textContent = translate('assessment.completed', 'Assessment Completed!');
         progressBar.style.width = '100%';
         questionText.textContent = translate('assessment.ready_to_complete', 'You have answered all the questions.');
         questionInputArea.innerHTML = ''; // Clear input area
         nextQuestionBtn.style.display = 'none';
         completeAssessmentBtn.style.display = 'inline-flex';
    }
}

/**
 * Sends the current answer to the backend for cumulative feedback.
 * @param {string} questionId - The ID of the question answered.
 * @param {*} answer - The user's answer.
 */
async function sendAnswerForFeedback(questionId, answer) {
    try {
        // Mock API call for cumulative feedback
        // In a real app, this would send the answer and receive feedback from the backend
        console.log(`Sending answer for feedback: Question ID ${questionId}, Answer: ${answer}`);

        // Simulate a network request and backend processing
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

        // Mock feedback based on answer (replace with actual backend response)
        let feedbackText = translate('feedback.default', 'Processing your answer...');
        if (answer && typeof answer === 'string' && answer.length > 10) {
             feedbackText = translate('feedback.thoughtful', 'Thoughtful response! This gives us good insight.');
        } else if (answer && (answer === 'Yes' || answer === 'No')) {
             feedbackText = translate('feedback.simple', 'Okay, noted.');
        } else {
             feedbackText = translate('feedback.generic', 'Answer received.');
        }

        currentCumulativeFeedback = feedbackText;
        cumulativeFeedback.textContent = currentCumulativeFeedback;
        cumulativeFeedback.style.display = 'block';

    } catch (error) {
        console.error('Error sending answer for feedback:', error);
        // Display a message to the user without stopping the assessment
        cumulativeFeedback.textContent = translate('feedback.error', 'Could not get instant feedback. Proceeding...');
        cumulativeFeedback.style.display = 'block';
    }
}


/**
 * Handles the completion of the assessment.
 */
async function handleAssessmentCompletion() {
    assessmentContent.style.display = 'none';
    loadingReport.style.display = 'block';
    reportContent.style.display = 'none';
    reportError.style.display = 'none';

    try {
        // Send all answers to backend to complete assessment and get report
        const response = await fetch(`${API_BASE_URL}/api/guest/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers: userAnswers }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reportData = await response.json(); // Expecting { summary: "...", user_answers: [...] }

        // Store report data temporarily (e.g., in session storage) or use a token
        // For this MVP, we'll just use the data directly for display
        // In a real app, the backend would return a token, and the frontend would fetch the report using that token
        // const reportToken = reportData.token;
        // window.location.hash = `report=${reportToken}`; // Navigate to report section with token

        displayGuestReport(reportData);

    } catch (error) {
        console.error('Error completing assessment:', error);
        loadingReport.style.display = 'none';
        reportContent.style.display = 'none';
        reportError.style.display = 'block';
        reportErrorMessage.textContent = translate('report.error', 'Failed to generate report. Please try again.');
        // Optionally navigate back to assessment or home
        // navigateToSection(1);
    }
}

/**
 * Displays the guest report based on provided data.
 * @param {object} reportData - The report data received from the backend.
 */
function displayGuestReport(reportData) {
    loadingReport.style.display = 'none';
    assessmentSection.style.display = 'none'; // Hide assessment section
    reportSection.style.display = 'flex'; // Show report section
    reportContent.style.display = 'block';
    reportError.style.display = 'none';

    // Update report content
    reportSummaryText.textContent = reportData.summary || translate('report.summary_default', 'No summary available.');

    userAnswersList.innerHTML = ''; // Clear previous answers
    if (reportData.user_answers && reportData.user_answers.length > 0) {
        reportData.user_answers.forEach(item => {
            const question = guestQuestions.find(q => q.id === item.question_id); // Find the original question text
            if (question) {
                 const answerElement = document.createElement('div');
                 answerElement.classList.add('report-answer-item');
                 answerElement.innerHTML = `
                     <p><strong>${question.text}</strong></p>
                     <p class="text-gray-700">${item.answer}</p>
                 `;
                 userAnswersList.appendChild(answerElement);
            }
        });
    } else {
         userAnswersList.innerHTML = `<p class="text-gray-600" data-translate-key="report.no_answers">No answers recorded.</p>`;
    }

    // Ensure report section nav link is visible and navigate to report section
     guestReportNavLink.style.display = 'block';
     navigateToSection(2); // Navigate to the report section
}


// Add event listeners for assessment buttons
nextQuestionBtn.addEventListener('click', handleNextQuestion);
completeAssessmentBtn.addEventListener('click', handleAssessmentCompletion);


// --- Translation Logic ---

// Translation object (expand with all required languages)
const translations = {
    en: {
        // English is the default, keys can be added here if needed for clarity
        "nav.title": "LifeSync",
        "nav.home": "Home",
        "nav.guest_assessment": "Guest Assessment",
        "nav.guest_report": "Guest Report",
        "nav.features": "Features",
        "nav.about": "About Us",
        "nav.login": "Log In",
        "nav.signup": "Sign Up",
        "hero.title": "Sync Your Lives, Deepen Your Connection",
        "hero.subtitle": "LifeSync provides structured, data-driven compatibility insights to help couples build stronger, more transparent relationships, navigating crucial topics with confidence.",
        "hero.cta.assessment": "Take Guest Assessment",
        "hero.cta.signup": "Sign Up for Full Access",
        "hero.card.title": "Discover Your Compatibility",
        "hero.card.subtitle": "Explore key areas like values, lifestyle, and finances.",
        "hero.card.cta": "Start Assessment",
        "assessment.title": "Guest Compatibility Assessment",
        "assessment.subtitle": "Answer a few questions to get a glimpse of your compatibility insights. No registration required!",
        "assessment.loading": "Loading questions...",
        "assessment.question_counter": "Question {current} of {total}", // Placeholder for dynamic text
        "assessment.loading_input": "Loading input...",
        "assessment.next": "Next",
        "assessment.complete": "Complete Assessment",
        "assessment.error": "Failed to load assessment. Please try again later.",
        "assessment.no_questions": "No questions available.",
        "assessment.placeholder.text": "Type your answer here...",
        "assessment.select_answer": "Please select an answer.",
        "assessment.unsupported_type": "Unsupported question type: {type}", // Placeholder
        "assessment.completed": "Assessment Completed!",
        "assessment.ready_to_complete": "You have answered all the questions.",
        "report.title": "Your Guest Compatibility Report",
        "report.subtitle": "Here's a summary of your assessment insights. Register to unlock full features and share with a partner.",
        "report.loading": "Loading report...",
        "report.summary_title": "Summary of Insights:",
        "report.summary_placeholder": "Your compatibility summary will appear here based on your answers...",
        "report.your_answers_title": "Your Answers:",
        "report.answers_placeholder": "Your answers will appear here...",
        "report.cta_text": "Ready to explore deeper compatibility with a partner?",
        "report.cta_button": "Sign Up for Full Access",
        "report.expiry_warning": "Your guest report is temporary and will expire after 7 days.",
        "report.error": "Failed to generate report or report expired.",
        "features.title": "Core Features (Coming Soon!)",
        "features.subtitle": "LifeSync offers a suite of powerful features for registered couples to build stronger, more transparent relationships.",
        "features.tile1.title": "In-depth Assessments",
        "features.tile1.desc": "Explore compatibility across finances, values, lifestyle, and more, including culturally relevant topics.",
        "features.tile2.title": "Compatibility Insights",
        "features.tile2.desc": "See detailed analysis of alignment and differences with your partner.",
        "features.tile3.title": "Secure & Private",
        "features.tile3.desc": "Your data is protected with robust security and privacy controls.",
        "features.tile4.title": "Foster Communication",
        "features.tile4.desc": "Insights provide prompts for open and honest discussions.",
        "features.tile5.title": "Track Your Journey",
        "features.tile5.desc": "See how your compatibility evolves over time with ongoing assessments.",
        "features.tile6.title": "Culturally Relevant",
        "features.tile6.desc": "Designed to understand and respect diverse cultural backgrounds, including South African nuances.",
        "about.title": "About LifeSync",
        "about.subtitle": "Our mission is to empower couples with the knowledge and tools to build lasting, transparent relationships.",
        "about.paragraph1": "Founded with the belief that true compatibility goes beyond initial attraction, LifeSync was created to provide a structured way for couples to explore the fundamental aspects of their partnership. We understand that open conversations about topics like finances, values, and family expectations can be challenging, but they are essential for a strong foundation.",
        "about.paragraph2": "We are particularly passionate about addressing the unique dynamics and cultural considerations present in diverse societies, including the rich tapestry of South Africa. Our assessments are designed to be sensitive, inclusive, and relevant, helping couples navigate these important aspects with mutual respect and understanding.",
        "about.paragraph3": "Whether you're just starting out or have been together for years, LifeSync provides the insights you need to deepen your connection and make informed decisions about your future together. Join us on this journey towards more transparent and fulfilling relationships.",
        "auth.login.title": "Login to LifeSync",
        "auth.signup.title": "Create Your LifeSync Account",
        "auth.form.email": "Email",
        "auth.form.password": "Password",
        "auth.login.button": "Log In",
        "auth.signup.button": "Sign Up",
        "auth.login.signup_prompt": "Don't have an account? Sign up",
        "auth.signup.login_prompt": "Already have an account? Log in",
        "auth.form.name": "Your Name",
        "common.warning": "Warning",
        "common.ok": "OK",
        "feedback.default": "Processing your answer...",
        "feedback.thoughtful": "Thoughtful response! This gives us good insight.",
        "feedback.simple": "Okay, noted.",
        "feedback.generic": "Answer received.",
        "feedback.error": "Could not get instant feedback. Proceeding...",
    },
    // Add other languages here following the same structure
    af: {
        "nav.title": "LifeSync",
        "nav.home": "Tuis",
        "nav.guest_assessment": "Gaste Assessering",
        "nav.guest_report": "Gaste Verslag",
        "nav.features": "Kenmerke",
        "nav.about": "Oor Ons",
        "nav.login": "Meld Aan",
        "nav.signup": "Registreer",
        "hero.title": "Sinkroniseer Jul Lewens, Verdiep Jul Verbinding",
        "hero.subtitle": "LifeSync bied gestruktureerde, data-gedrewe versoenbaarheidsinsigte om paartjies te help om sterker, meer deursigtige verhoudings te bou, en belangrike onderwerpe met selfvertroue te navigeer.",
         "hero.cta.assessment": "Neem Gaste Assessering",
        "hero.cta.signup": "Registreer vir Volle Toegang",
         "hero.card.title": "Ontdek Jul Versoenbaarheid",
        "hero.card.subtitle": "Verken sleutelareas soos waardes, lewenstyl en finansies.",
        "hero.card.cta": "Begin Assessering",
        "assessment.title": "Gaste Versoenbaarheidsassessering",
        "assessment.subtitle": "Beantwoord 'n paar vrae om 'n voorsmakie van jul versoenbaarheidsinsigte te kry. Geen registrasie benodig nie!",
        "assessment.loading": "Laai vrae...",
        "assessment.question_counter": "Vraag {current} van {total}",
        "assessment.loading_input": "Laai invoer...",
        "assessment.next": "Volgende",
        "assessment.complete": "Voltooi Assessering",
        "assessment.error": "Kon nie assessering laai nie. Probeer asseblief later weer.",
        "assessment.no_questions": "Geen vrae beskikbaar nie.",
        "assessment.placeholder.text": "Tik jou antwoord hier...",
        "assessment.select_answer": "Kies asseblief 'n antwoord.",
        "assessment.unsupported_type": "Nie-ondersteunde vraagtipe: {type}",
        "assessment.completed": "Assessering Voltooi!",
        "assessment.ready_to_complete": "Jy het al die vrae beantwoord.",
        "report.title": "Jou Gaste Versoenbaarheidsverslag",
        "report.subtitle": "Hier is 'n opsomming van jou assesseringsinsigte. Registreer om volle kenmerke te ontsluit en met 'n maat te deel.",
        "report.loading": "Laai verslag...",
        "report.summary_title": "Opsomming van Insigte:",
        "report.summary_placeholder": "Jou versoenbaarheidsopsomming sal hier verskyn gebaseer op jou antwoorde...",
        "report.your_answers_title": "Jou Antwoorde:",
        "report.answers_placeholder": "Jou antwoorde sal hier verskyn...",
        "report.cta_text": "Gereed om dieper versoenbaarheid met 'n maat te verken?",
        "report.cta_button": "Registreer vir Volle Toegang",
        "report.expiry_warning": "Jou gasteverslag is tydelik en sal na 7 dae verval.",
        "report.error": "Kon nie verslag genereer of verslag verval het nie.",
        "features.title": "Kernkenmerke (Binnekort Beskikbaar!)",
        "features.subtitle": "LifeSync bied 'n reeks kragtige kenmerke vir geregistreerde paartjies om sterker, meer deursigtige verhoudings te bou.",
        "features.tile1.title": "In-diepte Assesserings",
        "features.tile1.desc": "Verken versoenbaarheid oor finansies, waardes, lewenstyl, en meer, insluitend kultureel relevante onderwerpe.",
        "features.tile2.title": "Versoenbaarheidsinsigte",
        "features.tile2.desc": "Sien gedetailleerde analise van ooreenstemming en verskille met jou maat.",
        "features.tile3.title": "Veilig en Privaat",
        "features.tile3.desc": "Jou data word beskerm met robuuste sekuriteit en privaatheidsbeheer.",
        "features.tile4.title": "Bevorder Kommunikasie",
        "features.tile4.desc": "Insigte bied aanwysings vir oop en eerlike gesprekke.",
        "features.tile5.title": "Volg Jul Reis",
        "features.tile5.desc": "Sien hoe jul versoenbaarheid oor tyd ontwikkel met deurlopende assesserings.",
        "features.tile6.title": "Kultureel Relevant",
        "features.tile6.desc": "Ontwerp om diverse kulturele agtergronde te verstaan en respekteer, insluitend Suid-Afrikaanse nuanses.",
        "about.title": "Oor LifeSync",
        "about.subtitle": "Ons missie is om paartjies te bemagtig met die kennis en gereedskap om blywende, deursigtige verhoudings te bou.",
        "about.paragraph1": "Gestig met die oortuiging dat ware versoenbaarheid verder strek as aanvanklike aantrekkingskrag, is LifeSync geskep om 'n gestruktureerde manier te bied vir paartjies om die fundamentele aspekte van hul vennootskap te verken. Ons verstaan dat oop gesprekke oor onderwerpe soos finansies, waardes en familieverwagtings uitdagend kan wees, maar dit is noodsaaklik vir 'n sterk fondament.",
        "about.paragraph2": "Ons is veral passievol oor die aanspreek van die unieke dinamika en kulturele oorwegings wat in diverse samelewings voorkom, insluitend die ryk tapisserie van Suid-Afrika. Ons assesserings is ontwerp om sensitief, inklusief en relevant te wees, en help paartjies om hierdie belangrike aspekte met wedersydse respek en begrip te navigeer.",
        "about.paragraph3": "Of jul nou net begin of al jare saam is, LifeSync bied die insigte wat jul benodig om jul verbinding te verdiep en ingeligte besluite oor jul toekoms saam te neem. Sluit by ons aan op hierdie reis na meer deursigtige en vervullende verhoudings.",
         "auth.login.title": "Meld Aan by LifeSync",
        "auth.signup.title": "Skep Jou LifeSync Rekening",
        "auth.form.email": "E-pos",
        "auth.form.password": "Wagwoord",
        "auth.login.button": "Meld Aan",
        "auth.signup.button": "Registreer",
        "auth.login.signup_prompt": "Het jy nie 'n rekening nie? Registreer",
        "auth.signup.login_prompt": "Het jy reeds 'n rekening? Meld aan",
        "auth.form.name": "Jou Naam",
        "common.warning": "Waarskuwing",
        "common.ok": "OK",
         "feedback.default": "Verwerk jou antwoord...",
        "feedback.thoughtful": "Bedagsame reaksie! Dit gee ons goeie insig.",
        "feedback.simple": "Oké, genoteer.",
        "feedback.generic": "Antwoord ontvang.",
        "feedback.error": "Kon nie kits terugvoer kry nie. Gaan voort...",
    },
    // Add more languages here
    // isiZulu (zu)
    zu: {
        "nav.title": "LifeSync",
        "nav.home": "Ikhaya",
        "nav.guest_assessment": "Ukuhlola Isivakashi",
        "nav.guest_report": "Umbiko Wesivakashi",
        "nav.features": "Izici",
        "nav.about": "Mayelana Nathi",
        "nav.login": "Ngena",
        "nav.signup": "Bhalisa",
        "hero.title": "Hlanganisa Izimpilo Zenu, Jula Ukuxhumana Kwenu",
        "hero.subtitle": "ILifeSync inikeza imininingwane ehlelekile, eqhutshwa idatha mayelana nokuhambisana ukusiza abashadikazi bakhe ubudlelwano obuqinile, obusobala, benqobe izihloko ezibalulekile ngokuzethemba.",
        "hero.cta.assessment": "Thatha Ukuhlola Isivakashi",
        "hero.cta.signup": "Bhalisa Ukuze Uthole Ukufinyelela Okugcwele",
        "hero.card.title": "Thola Ukuhambisana Kwenu",
        "hero.card.subtitle": "Hlola izindawo ezibalulekile njengamavelu, indlela yokuphila, nezimali.",
        "hero.card.cta": "Qala Ukuhlola",
        "assessment.title": "Ukuhlola Ukuhambisana Kwesivakashi",
        "assessment.subtitle": "Phendula imibuzo embalwa ukuze uthole umbono wemininingwane yakho yokuhambisana. Akudingeki ukubhalisa!",
        "assessment.loading": "Iyalayisha imibuzo...",
        "assessment.question_counter": "Umbuzo {current} we-{total}",
        "assessment.loading_input": "Iyalayisha ukufaka...",
        "assessment.next": "Okulandelayo",
        "assessment.complete": "Qedela Ukuhlola",
        "assessment.error": "Yehlulekile ukulayisha ukuhlola. Sicela uzame futhi kamuva.",
        "assessment.no_questions": "Ayikho imibuzo etholakalayo.",
        "assessment.placeholder.text": "Thayipha impendulo yakho lapha...",
        "assessment.select_answer": "Sicela ukhethe impendulo.",
        "assessment.unsupported_type": "Uhlobo lombuzo olungasekelwe: {type}",
        "assessment.completed": "Ukuhlola Kuqedile!",
        "assessment.ready_to_complete": "Usuyphendule yonke imibuzo.",
        "report.title": "Umbiko Wakho Wokuhambisana Kwesivakashi",
        "report.subtitle": "Nansi isifinyezo semininingwane yakho yokuhlola. Bhalisa ukuze uvule izici ezigcwele futhi wabelane nomlingani.",
        "report.loading": "Iyalayisha umbiko...",
        "report.summary_title": "Isifinyezo Semininingwane:",
        "report.summary_placeholder": "Isifinyezo sakho sokuhambisana sizovela lapha ngokusekelwe ezimpendulweni zakho...",
        "report.your_answers_title": "Izimpendulo Zakho:",
        "report.answers_placeholder": "Izimpendulo zakho zizovela lapha...",
        "report.cta_text": "Usulungele ukuhlola ukuhambisana okujulile nomlingani?",
        "report.cta_button": "Bhalisa Ukuze Uthole Ukufinyelela Okugcwele",
        "report.expiry_warning": "Umbiko wakho wesivakashi ungowesikhashana futhi uzophelelwa yisikhathi ngemuva kwezinsuku ezingu-7.",
        "report.error": "Yehlulekile ukukhiqiza umbiko noma umbiko uphelelwe yisikhathi.",
        "features.title": "Izici Eziyinhloko (Kuyeza Maduze!)",
        "features.subtitle": "ILifeSync inikeza iqoqo lezici ezinamandla kubashadikazi ababhalisiwe ukuze bakhe ubudlelwano obuqinile, obusobala.",
        "features.tile1.title": "Ukuhlola Okujulile",
        "features.tile1.desc": "Hlola ukuhambisana ezindaweni zezimali, amavelu, indlela yokuphila, nokuningi, kuhlanganise nezihloko ezihambisana namasiko.",
        "features.tile2.title": "Imininingwane Yokuhambisana",
        "features.tile2.desc": "Bona ukuhlaziywa okuningiliziwe kokuhambisana nomehluko nomlingani wakho.",
        "features.tile3.title": "Kuvikelekile Futhi Kuyimfihlo",
        "features.tile3.desc": "Idatha yakho ivikelekile ngokuphepha okuqinile kanye nezilawuli zobumfihlo.",
        "features.tile4.title": "Khuthaza Ukuxhumana",
        "features.tile4.desc": "Imininingwane inikeza iziphakamiso zezingxoxo ezivulekile nezithembekile.",
        "features.tile5.title": "Landelela Uhambo Lwakho",
        "features.tile5.desc": "Bona ukuthi ukuhambisana kwenu kuguquka kanjani ngokuhamba kwesikhathi ngokuhlola okuqhubekayo.",
        "features.tile6.title": "Kuhambisana Namasiko",
        "features.tile6.desc": "Yakhelwe ukuqonda nokuhlonipha izizinda zamasiko ezihlukahlukene, kuhlanganise nama-nuances aseNingizimu Afrika.",
        "about.title": "Mayelana ne-LifeSync",
        "about.subtitle": "Umsebenzi wethu ukunika amandla abashadikazi ngolwazi namathuluzi okwakha ubudlelwano obuhlala njalo, obusobala.",
        "about.paragraph1": "Yasungulwa ngenkolelo yokuthi ukuhambisana kweqiniso kudlula ukukhanga kokuqala, i-LifeSync yakhelwe ukunikeza indlela ehlelekile yokuthi abashadikazi bahlole izici eziyisisekelo zobudlelwano babo. Siyaqonda ukuthi izingxoxo ezivulekile ngezihloko ezifana nezimali, amavelu, nezilindelo zomndeni zingaba yinselele, kodwa zibalulekile esisekelweni esiqinile.",
        "about.paragraph2": "Sikhathazeke kakhulu ngokubhekana nezimo eziyingqayizivele kanye nezindlela zamasiko ezikhona emiphakathini ehlukahlukene, kuhlanganise nendawo ecebile yaseNingizimu Afrika. Ukuhlola kwethu kwakhelwe ukuba kube nozwelo, kufake wonke umuntu, futhi kufanelekile, kusiza abashadikazi ukuba banqobe lezi zici ezibalulekile ngokuhloniphana nokuqonda.",
        "about.paragraph3": "Noma ngabe nisanda kuqala noma senineminyaka eminingi ndawonye, i-LifeSync inikeza imininingwane eniyidingayo ukuze nijulise ukuxhumana kwenu futhi nithathe izinqumo ezinolwazi mayelana nekusasa lenu ndawonye. Hlanganyelani nathi kulolu hambo oluya ebudlelwaneni obusobala nobugcwalisayo.",
        "auth.login.title": "Ngena ku-LifeSync",
        "auth.signup.title": "Dala I-Akhawunti Yakho Ye-LifeSync",
        "auth.form.email": "I-imeyili",
        "auth.form.password": "Iphasiwedi",
        "auth.login.button": "Ngena",
        "auth.signup.button": "Bhalisa",
        "auth.login.signup_prompt": "Awunayo i-akhawunti? Bhalisa",
        "auth.signup.login_prompt": "Usuvele unayo i-akhawunti? Ngena",
        "auth.form.name": "Igama Lakho",
        "common.warning": "Isexwayiso",
        "common.ok": "Kulungile",
        "feedback.default": "Iyalayisha impendulo yakho...",
        "feedback.thoughtful": "Impendulo ecatshangelwe! Lokhu kusinika umbono omuhle.",
        "feedback.simple": "Kulungile, kuqaphele.",
        "feedback.generic": "Impendulo itholakele.",
        "feedback.error": "Ayikwazanga ukuthola impendulo esheshayo. Iyaqhubeka...",
    },
    // isiXhosa (xh)
    xh: {
        "nav.title": "LifeSync",
        "nav.home": "Ekhaya",
        "nav.guest_assessment": "Uvavanyo Lweendwendwe",
        "nav.guest_report": "Ingxelo Yeendwendwe",
        "nav.features": "Iimpawu",
        "nav.about": "Ngeethu",
        "nav.login": "Ngena",
        "nav.signup": "Bhalisa",
        "hero.title": "Dibanisa Ubomi Bakho, Yenza Unxibelelwano Lwakho Luzinzile",
        "hero.subtitle": "ILifeSync ibonelela ngolwazi olucwangcisiweyo, oluqhutywa yidatha malunga nokuhambelana ukunceda izibini zakhe ubudlelwano obuqinileyo, obusobala, benqobe izihloko ezibalulekileyo ngokuzithemba.",
        "hero.cta.assessment": "Thatha Uvavanyo Lweendwendwe",
        "hero.cta.signup": "Bhalisa Ukuze Ufumane Ukufikelela Okupheleleyo",
        "hero.card.title": "Fumanisa Ukuhambelana Kwakho",
        "hero.card.subtitle": "Hlola iindawo eziphambili ezifana namaxabiso, indlela yokuphila, kunye nezimali.",
        "hero.card.cta": "Qala Uvavanyo",
        "assessment.title": "Uvavanyo Lokuhambelana Kweendwendwe",
        "assessment.subtitle": "Phendula imibuzo embalwa ukuze ufumane umbono wolwazi lwakho lokuhambelana. Akukho kubhalisa kufunekayo!",
        "assessment.loading": "Iyalayisha imibuzo...",
        "assessment.question_counter": "Umbuzo {current} we-{total}",
        "assessment.loading_input": "Iyalayisha ukufaka...",
        "assessment.next": "Okulandelayo",
        "assessment.complete": "Gqibezela Uvavanyo",
        "assessment.error": "Ayikwazanga ukulayisha uvavanyo. Nceda uzame kwakhona kamva.",
        "assessment.no_questions": "Ayikho imibuzo ekhoyo.",
        "assessment.placeholder.text": "Chwetheza impendulo yakho apha...",
        "assessment.select_answer": "Nceda ukhethe impendulo.",
        "assessment.unsupported_type": "Uhlobo lombuzo olungaxhaswanga: {type}",
        "assessment.completed": "Uvavanyo Lugqityiwe!",
        "assessment.ready_to_complete": "Uphendule yonke imibuzo.",
        "report.title": "Ingxelo Yakho Yokuhambelana Kweendwendwe",
        "report.subtitle": "Nantsi isishwankathelo solwazi lwakho lokuvavanya. Bhalisa ukuze uvule iimpawu ezipheleleyo kwaye wabelane nomlingane.",
        "report.loading": "Iyalayisha ingxelo...",
        "report.summary_title": "Isishwankathelo Solwazi:",
        "report.summary_placeholder": "Isishwankathelo sakho sokuhambelana siya kuvela apha ngokusekelwe kwiimpendulo zakho...",
        "report.your_answers_title": "Iimpendulo Zakho:",
        "report.answers_placeholder": "Iimpendulo zakho ziya kuvela apha...",
        "report.cta_text": "Ukulungele ukuphonononga ukuhambelana okunzulu nomlingane?",
        "report.cta_button": "Bhalisa Ukuze Ufumane Ukufikelela Okupheleleyo",
        "report.expiry_warning": "Ingxelo yakho yeendwendwe yeyexeshana kwaye iya kuphelelwa lixesha emva kweentsuku ezisi-7.",
        "report.error": "Ayikwazanga ukwenza ingxelo okanye ingxelo iphelelwe lixesha.",
        "features.title": "Iimpawu Eziphambili (Kuyeza Kungekudala!)",
        "features.subtitle": "ILifeSync ibonelela ngoluhlu lweempawu ezinamandla kwizibini ezibhalisiweyo ukwakha ubudlelwano obuqinileyo, obusobala.",
        "features.tile1.title": "Uvavanyo Olunzulu",
        "features.tile1.desc": "Hlola ukuhambelana kwezimali, amaxabiso, indlela yokuphila, kunye nokunye, kubandakanya izihloko ezifanelekileyo ngokwenkcubeko.",
        "features.tile2.title": "Ulwazi Lokuhambelana",
        "features.tile2.desc": "Bona uhlalutyo oluneenkcukacha zokuhambelana kunye nomahluko nomlingane wakho.",
        "features.tile3.title": "Ikhuselekile Kwaye Iyimfihlo",
        "features.tile3.desc": "Idatha yakho ikhuselwe ngokhuseleko oluqinileyo kunye nolawulo lwangasese.",
        "features.tile4.title": "Khuthaza Unxibelelwano",
        "features.tile4.desc": "Ulwazi lubonelela ngeengcebiso zokuxoxa ngokuvulelekileyo nangokunyanisekileyo.",
        "features.tile5.title": "Landelela Uhambo Lwakho",
        "features.tile5.desc": "Bona ukuba ukuhambelana kwakho kuguquka njani ngokuhamba kwexesha ngovavanyo oluqhubekayo.",
        "features.tile6.title": "Ifanelekile Ngokwenkcubeko",
        "features.tile6.desc": "Yenzelwe ukuqonda nokuhlonipha imvelaphi eyahlukeneyo yenkcubeko, kubandakanywa neentsingiselo zaseMzantsi Afrika.",
        "about.title": "Nge LifeSync",
        "about.subtitle": "Umsebenzi wethu kukunika izibini amandla ngolwazi kunye nezixhobo zokwakha ubudlelwano obuhlala ixesha elide, obusobala.",
        "about.paragraph1": "Yasekwa ngenkolelo yokuba ukuhambelana okwenene kungaphaya kokutsala kokuqala, i-LifeSync yadalwa ukunikeza indlela ecwangcisiweyo yokuba izibini zihlole izinto ezisisiseko zobudlelwano babo. Siyaqonda ukuba iingxoxo ezivulekileyo malunga nezihloko ezifana nezimali, amaxabiso, kunye nezinto ezilindelweyo kwintsapho zingaba ngumngeni, kodwa zibalulekile kwisiseko esomeleleyo.",
        "about.paragraph2": "Sithanda ngokukodwa ukujongana nezinto ezizodwa kunye nokuqwalaselwa kwenkcubeko okukhoyo kwimibutho eyahlukeneyo, kubandakanywa neengxaki ezininzi zaseMzantsi Afrika. Uvavanyo lwethu luyilwe ukuba lube novakalelo, lubandakanye wonke umntu, kwaye lube lufanelekile, luncede izibini ukuba zihambe kwezi zinto zibalulekileyo ngokuhloniphana nokuqonda.",
        "about.paragraph3": "Nokuba usandula ukuqalisa okanye sele nineminyaka kunye, i-LifeSync ibonelela ngolwazi oludingayo ukwenza unxibelelwano lwakho luzinzile kwaye wenze izigqibo ezinolwazi malunga nekamva lakho kunye. Sijoyine kolu hambo olusingise kubudlelwano obusobala nobugcwalisayo.",
        "auth.login.title": "Ngena kwi-LifeSync",
        "auth.signup.title": "Yenza Iakhawunti Yakho Ye-LifeSync",
        "auth.form.email": "I-imeyile",
        "auth.form.password": "Iphasiwedi",
        "auth.login.button": "Ngena",
        "auth.signup.button": "Bhalisa",
        "auth.login.signup_prompt": "Awunayo iakhawunti? Bhalisa",
        "auth.signup.login_prompt": "Sele unayo iakhawunti? Ngena",
        "auth.form.name": "Igama Lakho",
        "common.warning": "Isilumkiso",
        "common.ok": "Kulungile",
        "feedback.default": "Iyalayisha impendulo yakho...",
        "feedback.thoughtful": "Impendulo ecatshangelwe! Oku kusinika umbono omuhle.",
        "feedback.simple": "Kulungile, kuqaphele.",
        "feedback.generic": "Impendulo ifunyenwe.",
        "feedback.error": "Ayikwazanga ukufumana ingxelo yangoku. Iyaqhubeka...",
    },
    // Sesotho (st)
    st: {
        "nav.title": "LifeSync",
        "nav.home": "Lehae",
        "nav.guest_assessment": "Tekolo ea Moeti",
        "nav.guest_report": "Tlaleho ea Moeti",
        "nav.features": "Likarolo",
        "nav.about": "Mabapi le Rona",
        "nav.login": "Kena",
        "nav.signup": "Ngolisa",
        "hero.title": "Kopanya Bophelo ba Hao, Tebisa Kamano ea Hao",
        "hero.subtitle": "LifeSync e fana ka leseli le hlophisitsoeng, le tsamaisoang ke data mabapi le tšebelisano ho thusa banyalani ho aha likamano tse matla, tse hlakileng, ba tsamaee litaba tsa bohlokoa ka kholiseho.",
        "hero.cta.assessment": "Nka Tekolo ea Moeti",
        "hero.cta.signup": "Ngolisa ho Fumana Tšebeletso e Feletseng",
        "hero.card.title": "Fumana Tšebelisano ea Hao",
        "hero.card.subtitle": "Hlahloba libaka tsa bohlokoa joalo ka litekanyetso, mokhoa oa bophelo, le lichelete.",
        "hero.card.cta": "Qala Tekolo",
        "assessment.title": "Tekolo ea Tšebelisano ea Moeti",
        "assessment.subtitle": "Araba lipotso tse 'maloa ho fumana leseli la tšebelisano ea hau. Ha ho ngoliso e hlokahalang!",
        "assessment.loading": "E laela lipotso...",
        "assessment.question_counter": "Potso ea {current} ho {total}",
        "assessment.loading_input": "E laela ho kenya...",
        "assessment.next": "E latelang",
        "assessment.complete": "Qetella Tekolo",
        "assessment.error": "E hlolehile ho laela tekolo. Ka kopo leka hape hamorao.",
        "assessment.no_questions": "Ha ho lipotso tse fumanehang.",
        "assessment.placeholder.text": "Ngola karabo ea hau mona...",
        "assessment.select_answer": "Ka kopo khetha karabo.",
        "assessment.unsupported_type": "Mofuta oa potso o sa tšehetsoeng: {type}",
        "assessment.completed": "Tekolo e Phethiloe!",
        "assessment.ready_to_complete": "U arabile lipotso tsohle.",
        "report.title": "Tlaleho ea Hao ea Tšebelisano ea Moeti",
        "report.subtitle": "Moná ke kakaretso ea leseli la hau la tekolo. Ngolisa ho notlolla likarolo tse felletseng le ho arolelana le molekane.",
        "report.loading": "E laela tlaleho...",
        "report.summary_title": "Kakaretso ea Leseli:",
        "report.summary_placeholder": "Kakaretso ea hau ea tšebelisano e tla hlaha moná ho latela likarabo tsa hau...",
        "report.your_answers_title": "Likarabo tsa Hao:",
        "report.answers_placeholder": "Likarabo tsa hau li tla hlaha moná...",
        "report.cta_text": "O itokiselitse ho hlahloba tšebelisano e tebileng le molekane?",
        "report.cta_button": "Ngolisa ho Fumana Tšebeletso e Feletseng",
        "report.expiry_warning": "Tlaleho ea hau ea moeti ke ea nakoana 'me e tla felloa ke nako ka mor'a matsatsi a 7.",
        "report.error": "E hlolehile ho hlahisa tlaleho kapa tlaleho e felile.",
        "features.title": "Likarolo tsa Bohlokoa (Ho Tla Haufinyane!)",
        "features.subtitle": "LifeSync e fana ka likarolo tse matla bakeng sa banyalani ba ngolisitsoeng ho aha likamano tse matla, tse hlakileng.",
        "features.tile1.title": "Litlhahlobo tse Tebileng",
        "features.tile1.desc": "Hlahloba tšebelisano ho lichelete, litekanyetso, mokhoa oa bophelo, le tse ling, ho kenyeletsoa litaba tse amanang le setso.",
        "features.tile2.title": "Leseli la Tšebelisano",
        "features.tile2.desc": "Bona tlhahlobo e qaqileng ea tšebelisano le liphapang le molekane oa hau.",
        "features.tile3.title": "E Sireletsehile Ebile ke ea Lekunutu",
        "features.tile3.desc": "Data ea hau e sirelelitsoe ka ts'ireletso e matla le taolo ea lekunutu.",
        "features.tile4.title": "Khothaletsa Puisano",
        "features.tile4.desc": "Leseli le fana ka litlhahiso bakeng sa lipuisano tse bulehileng le tse tšepahalang.",
        "features.tile5.title": "Latela Leeto la Hao",
        "features.tile5.desc": "Bona kamoo tšebelisano ea hau e fetohang ka nako ka litlhahlobo tse tsoelang pele.",
        "features.tile6.title": "E Amanang le Setso",
        "features.tile6.desc": "E entsoe ho utloisisa le ho hlompha mehloli e fapaneng ea setso, ho kenyeletsoa le lintho tse nyane tsa Afrika Boroa.",
        "about.title": "Mabapi le LifeSync",
        "about.subtitle": "Morero oa rona ke ho matlafatsa banyalani ka tsebo le lisebelisoa tsa ho aha likamano tse tšoarellang, tse hlakileng.",
        "about.paragraph1": "E thehiloe ka tumelo ea hore tšebelisano ea 'nete e fetela ka nģ'ane ho ho hohela ha pele, LifeSync e entsoe ho fana ka mokhoa o hlophisitsoeng bakeng sa banyalani ho hlahloba likarolo tsa motheo tsa tšebelisano ea bona. Rea utloisisa hore lipuisano tse bulehileng mabapi le litaba tse kang lichelete, litekanyetso, le litebello tsa lelapa li ka ba thata, empa li bohlokoa bakeng sa motheo o matla.",
        "about.paragraph2": "Re chesehela haholo ho sebetsana le maemo a ikhethang le litlhokomelo tsa setso tse teng lichabeng tse fapaneng, ho kenyeletsoa le lesela le ruileng la Afrika Boroa. Litlhahlobo tsa rona li entsoe ho ba le kutloelo-bohloko, ho kenyelletsa bohle, le ho ba le molemo, ho thusa banyalani ho tsamaea likarolong tsena tsa bohlokoa ka tlhomphano le kutloisiso.",
        "about.paragraph3": "Hore na le sa tsoa qala kapa le se le le hammoho ka lilemo tse ngata, LifeSync e fana ka leseli leo le le hlokang ho tebisa kamano ea lona le ho etsa liqeto tse nang le tsebo mabapi le bokamoso ba lona hammoho. Kopanela le rona leetong lena le lebisang likamanong tse hlakileng le tse phethahatsang.",
        "auth.login.title": "Kena ho LifeSync",
        "auth.signup.title": "Theha Akhaonto ea Hao ea LifeSync",
        "auth.form.email": "I-imeile",
        "auth.form.password": "Lekunutu",
        "auth.login.button": "Kena",
        "auth.signup.button": "Ngolisa",
        "auth.login.signup_prompt": "Ha u na akhaonto? Ngolisa",
        "auth.signup.login_prompt": "U se u ntse u na le akhaonto? Kena",
        "auth.form.name": "Lebitso la Hao",
        "common.warning": "Tlhokomeliso",
        "common.ok": "Ho Lokile",
        "feedback.default": "E laela karabo ea hau...",
        "feedback.thoughtful": "Karabo e nahanne! Sena se re fa leseli le letle.",
        "feedback.simple": "Ho lokile, hlokometse.",
        "feedback.generic": "Karabo e amohetsoe.",
        "feedback.error": "E hlolehile ho fumana karabo hang-hang. E tsoela pele...",
    },
     // Setswana (tn) - Basic placeholders
    tn: {
        "nav.title": "LifeSync",
        "nav.home": "Lekae",
        "nav.guest_assessment": "Tekolo ya Moeti",
        "nav.guest_report": "Pego ya Moeti",
        "nav.features": "Dikarolo",
        "nav.about": "Ka Rona",
        "nav.login": "Tsena",
        "nav.signup": "Kwadisetsa",
        "hero.title": "Kopanya Matshelo a Lona, Tsweletsa Kamano ya Lona",
        "hero.subtitle": "LifeSync e tlamelana ka tshedimosetso e e rulagantsweng, e e theilweng mo datha mabapi le tirisanommogo go thusa banyalani go aga dikamano tse di nonofileng, tse di pepeneneng, ba tsamaya ditlhogo tsa botlhokwa ka tshepo.",
        "hero.cta.assessment": "Dirisa Tekolo ya Moeti",
        "hero.cta.signup": "Kwadisetsa go Bona Tshedimosetso Yotlhe",
        "hero.card.title": "Sengwa Tirisanommogo ya Lona",
        "hero.card.subtitle": "Lekola mafelo a botlhokwa jaaka boleng, tsela ya botshelo, le ditšhelete.",
        "hero.card.cta": "Simolola Tekolo",
        "assessment.title": "Tekolo ya Tirisanommogo ya Moeti",
        "assessment.subtitle": "Araba dipotso di le mmalwa go bona sengwe sa tshedimosetso ya tirisanommogo ya gago. Ga go tlhokafale go kwadisetsa!",
        "assessment.loading": "E laela dipotso...",
        "assessment.question_counter": "Potso {current} ya {total}",
        "assessment.loading_input": "E laela go tsenya...",
        "assessment.next": "E latelang",
        "assessment.complete": "Fetsa Tekolo",
        "assessment.error": "Ga e kgone go laela tekolo. Tswee-tswee leka gape moragonyana.",
        "assessment.no_questions": "Ga go na dipotso tse di leng teng.",
        "assessment.placeholder.text": "Type karabo ya gago fa...",
        "assessment.select_answer": "Tswee-tswee tlhopha karabo.",
        "assessment.unsupported_type": "Mofuta wa potso o o sa tshegetsweng: {type}",
        "assessment.completed": "Tekolo e Fedile!",
        "assessment.ready_to_complete": "O arabile dipotso tsotlhe.",
        "report.title": "Pego ya Gago ya Tirisanommogo ya Moeti",
        "report.subtitle": "Ena ke kakaretso ya tshedimosetso ya tekolo ya gago. Kwadisetsa go bona dikarolo tsotlhe le go abelana le molekane.",
        "report.loading": "E laela pego...",
        "report.summary_title": "Kakaretso ya Tshedimosetso:",
        "report.summary_placeholder": "Kakaretso ya gago ya tirisanommogo e tla tlhagelela fa go ya ka dikarabo tsa gago...",
        "report.your_answers_title": "Dikarabo tsa Gago:",
        "report.answers_placeholder": "Dikarabo tsa gago di tla tlhagelela fa...",
        "report.cta_text": "O ipaakanyeditse go lekola tirisanommogo e e boteng le molekane?",
        "report.cta_button": "Kwadisetsa go Bona Tshedimosetso Yotlhe",
        "report.expiry_warning": "Pego ya gago ya moeti ke ya nakwana mme e tla fela morago ga malatsi a supa.",
        "report.error": "Ga e kgone go dira pego kgotsa pego e fedile.",
        "features.title": "Dikarolo tsa Botlhokwa (E Tla Tla Gaufinyana!)",
        "features.subtitle": "LifeSync e tlamelana ka dikarolo tse di nonofileng go banyalani ba ba kwadisitsweng go aga dikamano tse di nonofileng, tse di pepeneneng.",
        "features.tile1.title": "Ditlhahlobo tse di Boteng",
        "features.tile1.desc": "Lekola tirisanommogo mo ditšheleteng, boleng, tsela ya botshelo, le tse dingwe, go akaretsa ditlhogo tse di amanang le setso.",
        "features.tile2.title": "Tshedimosetso ya Tirisanommogo",
        "features.tile2.desc": "Bona tlhatlhobo e e feletseng ya tirisanommogo le dipharologanyo le molekane wa gago.",
        "features.tile3.title": "E Sireletsegile Ebile ke ya Lekunutu",
        "features.tile3.desc": "Datha ya gago e sireleditswe ka tshireletso e e nonofileng le taolo ya lekunutu.",
        "features.tile4.title": "Rotloetsa Puisano",
        "features.tile4.desc": "Tshedimosetso e tlamelana ka ditlhagiso tsa dipuisano tse di bulegileng le tse di ikanyegang.",
        "features.tile5.title": "Latela Leeto la Gago",
        "features.tile5.desc": "Bona gore tirisanommogo ya gago e fetoga jang fa nako e ntse e tsamaya ka ditlhahlobo tse di tswelelang pele.",
        "features.tile6.title": "E Amanang le Setso",
        "features.tile6.desc": "E dirilwe go tlhaloganya le go tlotla ditso tse di farologaneng, go akaretsa le dinonofo tsa Afrika Borwa.",
        "about.title": "Ka LifeSync",
        "about.subtitle": "Boikaelelo jwa rona ke go nonotsha banyalani ka kitso le didirisiwa go aga dikamano tse di tswelelang pele, tse di pepeneneng.",
        "about.paragraph1": "E theilwe ka tumelo ya gore tirisanommogo ya nnete e feta kgogedi ya ntlha, LifeSync e ne ya tlholwa go tlamelana ka tsela e e rulagantsweng go banyalani go lekola dikarolo tsa motheo tsa tirisanommogo ya bona. Re tlhaloganya gore dipuisano tse di bulegileng ka ditlhogo jaaka ditšhelete, boleng, le ditebello tsa lelapa di ka nna thata, mme di botlhokwa mo motheong o o nonofileng.",
        "about.paragraph2": "Re kgatlhegela bogolo jang go rarabolola dikarolo tse di ikgethileng le ditlhokomelo tsa setso tse di leng teng mo ditšhabeng tse di farologaneng, go akaretsa le botlhofo jwa Afrika Borwa. Ditlhahlobo tsa rona di dirilwe go nna le kutlwelobotlhoko, go akaretsa botlhe, le go nna le botlhokwa, go thusa banyalani go tsamaya mo dikarolong tsena tsa botlhokwa ka tlotlano le tlhaloganyo.",
        "about.paragraph3": "Go sa kgathalesege gore o sa tswa go simolola kgotsa o ntse o le mmogo ka dingwaga tse dintsi, LifeSync e tlamelana ka tshedimosetso e o e tlhokang go tsweletsa kamano ya gago le go dira ditshwetso tse di theilweng mo tshedimosetsong ka bokamoso jwa gago mmogo. Kopanela le rona mo leetong leno le lebisang mo dikamanong tse di pepeneneng le tse di kgotsofatsang.",
        "auth.login.title": "Tsena mo LifeSync",
        "auth.signup.title": "Dira Akhaonto ya Gago ya LifeSync",
        "auth.form.email": "Imeile",
        "auth.form.password": "Lefoko la Sephiri",
        "auth.login.button": "Tsena",
        "auth.signup.button": "Kwadisetsa",
        "auth.login.signup_prompt": "Ga o na akhaonto? Kwadisetsa",
        "auth.signup.login_prompt": "O setse o na le akhaonto? Tsena",
        "auth.form.name": "Leina la Gago",
        "common.warning": "Tlhokomeliso",
        "common.ok": "Go Siame",
        "feedback.default": "E laela karabo ya gago...",
        "feedback.thoughtful": "Karabo e nahanne! Seno se re naya tshedimosetso e ntle.",
        "feedback.simple": "Go siame, go lemogilwe.",
        "feedback.generic": "Karabo e amogetswe.",
        "feedback.error": "Ga e kgone go bona karabo ka bonako. E tswelela pele...",
    },
     // isiNdebele (nr) - Basic placeholders
    nr: {
        "nav.title": "LifeSync",
        "nav.home": "Ikhaya",
        "nav.guest_assessment": "Ukuhlola Kwesivakatjhi",
        "nav.guest_report": "Umbiko Wesivakatjhi",
        "nav.features": "Izici",
        "nav.about": "Ngeethu",
        "nav.login": "Ngena",
        "nav.signup": "Bhalisa",
        "hero.title": "Hlanganisa Iimphilo Zenu, Julisa Ubuhlobo Benu",
        "hero.subtitle": "ILifeSync inikeza ilwazi elihlelekileko, elisekelwe kulwazi mayelana nokuhambelana ukusiza amahlanganiso akhe ubuhlobo obuqinileko, obusobala, benqobe iintloko ezibalulekileko ngokuzethemba.",
        "hero.cta.assessment": "Thatha Ukuhlola Kwesivakatjhi",
        "hero.cta.signup": "Bhalisa Ukuze Ufumane Ukufikelela Okupheleleko",
        "hero.card.title": "Tjhadlha Ukuhambelana Kwenu",
        "hero.card.subtitle": "Hlola iindawo ezibalulekileko njengamavelu, indlela yokuphila, kunye nemali.",
        "hero.card.cta": "Thoma Ukuhlola",
        "assessment.title": "Ukuhlola Ukuhambelana Kwesivakatjhi",
        "assessment.subtitle": "Phendula imibuzo embalwa ukuze ufumane umbono welwazi lakho lokuhambelana. Akukho kubhalisa okufunekako!",
        "assessment.loading": "Iyalayisha imibuzo...",
        "assessment.question_counter": "Umbuzo {current} we-{total}",
        "assessment.loading_input": "Iyalayisha ukufaka...",
        "assessment.next": "Okulandelako",
        "assessment.complete": "Qedelela Ukuhlola",
        "assessment.error": "Yehlulekile ukulayisha ukuhlola. Nceda uzame godu kamva.",
        "assessment.no_questions": "Ayikho imibuzo ekhona.",
        "assessment.placeholder.text": "Thayipha impendulo yakho lapha...",
        "assessment.select_answer": "Nceda ukhethe impendulo.",
        "assessment.unsupported_type": "Uhlobo lombuzo olungasekelwako: {type}",
        "assessment.completed": "Ukuhlola Kuqedelelwe!",
        "assessment.ready_to_complete": "Uphendule yoke imibuzo.",
        "report.title": "Umbiko Wakho Wokuhambelana Kwesivakatjhi",
        "report.subtitle": "Nasi isifinyezo selwazi lakho lokuhlola. Bhalisa ukuze uvule izici ezipheleleko begodu wabelane nomlingani.",
        "report.loading": "Iyalayisha umbiko...",
        "report.summary_title": "Isifinyezo Selwazi:",
        "report.summary_placeholder": "Isifinyezo sakho sokuhambelana sizokuvela lapha ngokusekelwe eempendulweni zakho...",
        "report.your_answers_title": "Iimpendulo Zakho:",
        "report.answers_placeholder": "Iimpendulo zakho zizokuvela lapha...",
        "report.cta_text": "Ulungile ukuhlola ukuhambelana okunzima nomlingani?",
        "report.cta_button": "Bhalisa Ukuze Ufumane Ukufikelela Okupheleleko",
        "report.expiry_warning": "Umbiko wakho wesivakatjhi ungowesikhatjhana begodu uzokuphelelwa sikhathi ngemva kwamalanga ama-7.",
        "report.error": "Yehlulekile ukukhiqiza umbiko namkha umbiko uphelelwe sikhathi.",
        "features.title": "Izici Eziyintloko (Kuyeza Kungekude!)",
        "features.subtitle": "ILifeSync inikeza iqoqo lezici ezinamandla kumaqhema abhalisiweko ukwakha ubuhlobo obuqinileko, obusobala.",
        "features.tile1.title": "Ukuhlola Okunzima",
        "features.tile1.desc": "Hlola ukuhambelana kwemali, amavelu, indlela yokuphila, nokunye, kuhlanganise neentloko ezihambelana namasiko.",
        "features.tile2.title": "Ilwazi Lokuhambelana",
        "features.tile2.desc": "Bona ukuhlaziywa okuneenkcukacha kokuhambelana nomehluko nomlingani wakho.",
        "features.tile3.title": "Kuvikelekile Begodu Kuyimfihlo",
        "features.tile3.desc": "Ilwazi lakho livikelekile ngokuphepha okuqinileko kunye nezilawuli zobumfihlo.",
        "features.tile4.title": "Khuthaza Ukuthintana",
        "features.tile4.desc": "Ilwazi linikeza iingcebiso zeengxoxo ezivulekileko nezithembekileko.",
        "features.tile5.title": "Landelela Irhatjho Lakho",
        "features.tile5.desc": "Bona bona ukuhambelana kwenu kuguquka njani ngokuhamba kwesikhathi ngokuhlola okuqhubekako.",
        "features.tile6.title": "Kuhambelana Namasiko",
        "features.tile6.desc": "Yakhelwe ukuqonda nokuhlonipha iimvelaphi zamasiko ezihlukahlukileko, kuhlanganise nama-nuances weSewula Afrika.",
        "about.title": "Nge LifeSync",
        "about.subtitle": "Umsebenzi wethu kukunika amaqhema amandla ngelwazi kunye namathulusi wokwakha ubuhlobo obuhlala isikhathi eside, obusobala.",
        "about.paragraph1": "Yasungulwa ngenkolelo yokuthi ukuhambelana kweqiniso kudlula ukukhanga kokuqala, i-LifeSync yakhelwe ukunikeza indlela ehlelekileko yokuthi amaqhema ahlole izici eziyisisekelo zobuhlobo bawo. Siyaqonda ukuthi iingxoxo ezivulekileko ngezihloko ezifana nemali, amavelu, kunye nezilindelo zomndeni zingaba yinselele, kodwa zibalulekile esisekelweni esiqinileko.",
        "about.paragraph2": "Sikhathazeke khulu ngokubhekana nezimo eziyingqayizivele kunye nezindlela zamasiko ezikhona emiphakathini ehlukahlukileko, kuhlanganise nendawo ecebileko yeSewula Afrika. Ukuhlola kwethu kwakhelwe ukuba kube nozwelo, kufake woke umuntu, begodu kufanelekile, kusiza amaqhema ukuba anqobe lezi zici ezibalulekileko ngokuhloniphana nokuqonda.",
        "about.paragraph3": "Noma ngabe nisanda kuqala namkha senineminyaka eminengi ndawonye, i-LifeSync inikeza ilwazi enilidingako ukuze nijulise ubuhlobo benu begodu nithathe izinqumo ezinolwazi mayelana nekusasa lenu ndawonye. Hlanganyelani nathi kulolu irhatjho oluya ebuhlotsheni obusobala nobugcwalisako.",
        "auth.login.title": "Ngena ku-LifeSync",
        "auth.signup.title": "Dala I-Akhawunti Yakho Ye-LifeSync",
        "auth.form.email": "I-imeyili",
        "auth.form.password": "Iphasiwedi",
        "auth.login.button": "Ngena",
        "auth.signup.button": "Bhalisa",
        "auth.login.signup_prompt": "Awunayo i-akhawunti? Bhalisa",
        "auth.signup.login_prompt": "Usuvele unayo i-akhawunti? Ngena",
        "auth.form.name": "Igama Lakho",
        "common.warning": "Isexwayiso",
        "common.ok": "Kulungile",
        "feedback.default": "Iyalayisha impendulo yakho...",
        "feedback.thoughtful": "Impendulo ecatshangelwe! Lokhu kusinika umbono omuhle.",
        "feedback.simple": "Kulungile, kuqaphele.",
        "feedback.generic": "Impendulo itholakele.",
        "feedback.error": "Ayikwazanga ukuthola impendulo esheshayo. Iyaqhubeka...",
    },
     // siSwati (ss) - Basic placeholders
    ss: {
        "nav.title": "LifeSync",
        "nav.home": "Ekhaya",
        "nav.guest_assessment": "Kuhlola Kwesivakashi",
        "nav.guest_report": "Umbiko Wesivakashi",
        "nav.features": "Tici",
        "nav.about": "Ngekwetfu",
        "nav.login": "Ngena",
        "nav.signup": "Bhalisa",
        "hero.title": "Hlanganisa Kuphila Kwenu, Jula Kubumbana Kwenu",
        "hero.subtitle": "I-LifeSync ihlinzeka ngelwati loluhlelekile, lolusekelwe kudatha mayelana nekuhambisana kute kusite labashadzi bakhe budlelwane lobucinile, lobusobala, banqobe tinhloko letibalulekile ngekutiketsemba.",
        "hero.cta.assessment": "Tsatsa Kuhlola Kwesivakashi",
        "hero.cta.signup": "Bhalisa Kute Ufune Kufinyelela Lokuphelele",
        "hero.card.title": "Tfola Kuhambisana Kwenu",
        "hero.card.subtitle": "Hlola tindzawo letibalulekile njengemavelu, indlela yekuphila, kanye netimali.",
        "hero.card.cta": "Calisa Kuhlola",
        "assessment.title": "Kuhlola Kuhambisana Kwesivakashi",
        "assessment.subtitle": "Phendvula imibuto lembalwa kute utfole umbono welwati lwakho lwekuhambisana. Akudzingeki kubhalisa!",
        "assessment.loading": "Iyalayisha imibuto...",
        "assessment.question_counter": "Umbuto {current} we-{total}",
        "assessment.loading_input": "Iyalayisha kufaka...",
        "assessment.next": "Okulandelako",
        "assessment.complete": "Phedzisisa Kuhlola",
        "assessment.error": "Yehlulekile kulayisha kuhlola. Sicela uzame futsi ngemuva kwesikhatsi.",
        "assessment.no_questions": "Ayikho imibuto lekhona.",
        "assessment.placeholder.text": "Thayipha imphendvulo yakho lapha...",
        "assessment.select_answer": "Sicela ukhetse imphendvulo.",
        "assessment.unsupported_type": "Luhlobo lwembuto lolungasekelwa: {type}",
        "assessment.completed": "Kuhlola Kuphedzisiwe!",
        "assessment.ready_to_complete": "Uphendvule yonkhe imibuto.",
        "report.title": "Umbiko Wakho Wekuhambisana Kwesivakashi",
        "report.subtitle": "Nasi sifinyeto selwati lwakho lwekuhlola. Bhalisa kute uvule tici letiphelele futsi wabelane nemlingani.",
        "report.loading": "Iyalayisha umbiko...",
        "report.summary_title": "Sifinyeto Selwati:",
        "report.summary_placeholder": "Sifinyeto sakho sekuhambisana sitovela lapha ngekusita kwetimphendvulo takho...",
        "report.your_answers_title": "Timphendvulo Takho:",
        "report.answers_placeholder": "Timphendvulo takho titovela lapha...",
        "report.cta_text": "Ulungile kuhlola kuhambisana lokujulile nemlingani?",
        "report.cta_button": "Bhalisa Kute Ufune Kufinyelela Lokuphelele",
        "report.expiry_warning": "Umbiko wakho wesivakashi ungowesikhashana futsi utophelelwa sikhatsi ngemuva kwemalanga la-7.",
        "report.error": "Yehlulekile kukhiqiza umbiko noma umbiko uphelelwe sikhatsi.",
        "features.title": "Tici Letibalulekile (Kuyeza Madvutjane!)",
        "features.subtitle": "I-LifeSync ihlinzeka ngeluhla lwetici letinemandla kulabashadzi lababhalisiwe kute bakhe budlelwane lobucinile, lobusobala.",
        "features.tile1.title": "Kuhlola Lokujulile",
        "features.tile1.desc": "Hlola kuhambisana kwetimali, emavelu, indlela yekuphila, kanye nalokunye, kuhlanganise netinhloko letihambisana namasiko.",
        "features.tile2.title": "Lwati Lwekuhambisana",
        "features.tile2.desc": "Bona kuhlatiywa lokuningiliziwe kwekuhambisana nomehluko nemlingani wakho.",
        "features.tile3.title": "Kuvikelekile Futsi Kuyimfihlo",
        "features.tile3.desc": "Idatha yakho ivikelekile ngekuphepha lokucinile kanye netilawuli tebumfihlo.",
        "features.tile4.title": "Khutsata Kukhulumisana",
        "features.tile4.desc": "Lwati luhlinzeka ngemacebiso etingcoco letivulekile netetsembekile.",
        "features.tile5.title": "Landzelela Luhambo Lwakho",
        "features.tile5.desc": "Bona kutsi kuhambisana kwenu kuguquka njani ngekuhamba kwesikhatsi ngekuhlola lokuchubekako.",
        "features.tile6.title": "Kuhambisana Namasiko",
        "features.tile6.desc": "Yakhelwe kucondza nekuhlonipha timvelaphi temasiko letahlukahlukene, kuhlanganise nama-nuances aseNingizimu Afrika.",
        "about.title": "Nge-LifeSync",
        "about.subtitle": "Umgomo wetfu kukunika emandla labashadzi ngelwati kanye netilawuli tekukha budlelwane lobuhlala sikhatsi lesidze, lobusobala.",
        "about.paragraph1": "Yasungulwa ngenkholelo yekutsi kuhambisana kweliciniso kudlula kukhanga kwekucala, i-LifeSync yakhelwa kuhlinzeka ngendlela lehlelile yekutsi labashadzi bahlole tici letisisekelo tebudlelwane babo. Siyacondza kutsi tingcoco letivulekile mayelana netinhloko letifana netimali, emavelu, kanye netilindzelo temndeni tingaba yinselele, kodvwa tibalulekile esisekelweni lesicinile.",
        "about.paragraph2": "Sikhutsateke kakhulu ngekubhekana netimo letingakajwayeleki kanye netilawuli temasiko letikhona emiphakatsini leyehlukahlukene, kuhlanganise nendzawo lecebile yaseNingizimu Afrika. Kuhlola kwetfu kwakhelwe kutsi kube newuzwelo, kufake wonkhe umuntfu, futsi kube kweliciniso, kusite labashadzi banqobe leti tici letibalulekile ngekuhloniphana nekucondza.",
        "about.paragraph3": "Noma ngabe nisanda kucala noma senineminyaka leminyenti ndzawonye, i-LifeSync ihlinzeka ngelwati lenilidzingako kute nijulise kubumbana kwenu futsi nitsatse tincumo letinelwati mayelana nekusasa lenu ndzawonye. Hlanganyelani natsi kuloluhambo loluya kubudlelwane lobusobala lobugcwalisako.",
        "auth.login.title": "Ngena ku-LifeSync",
        "auth.signup.title": "Dala I-Akhawunti Yakho Ye-LifeSync",
        "auth.form.email": "I-imeyili",
        "auth.form.password": "Iphasiwedi",
        "auth.login.button": "Ngena",
        "auth.signup.button": "Bhalisa",
        "auth.login.signup_prompt": "Awunayo i-akhawunti? Bhalisa",
        "auth.signup.login_prompt": "Usuvele unayo i-akhawunti? Ngena",
        "auth.form.name": "Ligama Lakho",
        "common.warning": "Isexwayiso",
        "common.ok": "Kulungile",
        "feedback.default": "Iyalayisha impendulo yakho...",
        "feedback.thoughtful": "Impendulo ecatshangelwe! Lokhu kusinika umbono lomuhle.",
        "feedback.simple": "Kulungile, kuqaphele.",
        "feedback.generic": "Impendulo itfolakele.",
        "feedback.error": "Ayikwazanga kutfola impendulo lesheshako. Iyaqhubeka...",
    },
     // Tshivenda (ve) - Basic placeholders
    ve: {
        "nav.title": "LifeSync",
        "nav.home": "Hayani",
        "nav.guest_assessment": "Ulingo lwa Muengwa",
        "nav.guest_report": "Muvhigo wa Muengwa",
        "nav.features": "Zwithu zwa Ndeme",
        "nav.about": "Nga Rona",
        "nav.login": "Dzhena",
        "nav.signup": "Ḓivhadzisa",
        "hero.title": "Ḓivhanya Vhutshilo Haṋu, Ḓiṱanganedza Vhukonani Haṋu",
        "hero.subtitle": "LifeSync i ṋea vhukonani vhu re na thendelano, vhu shumisaho data u thusa vhavhingani u fhaṱa vhukonani vhu simaho, vhu re khagala, vha kunda thero dza ndeme nga u ḓithemba.",
        "hero.cta.assessment": "Dzhia Ulingo lwa Muengwa",
        "hero.cta.signup": "Ḓivhadzisa u wana vhuḓinnginisi ho fhelelaho",
        "hero.card.title": "Ḓivhanya Vhukonani Haṋu",
        "hero.card.subtitle": "Ḓivhanya fhethu ha ndeme vhu ngaho vhuimo, ndila ya vhutshilo, na tshelede.",
        "hero.card.cta": "Thoma Ulingo",
        "assessment.title": "Ulingo lwa Vhukonani ha Muengwa",
        "assessment.subtitle": "Fhindula mbudziso dzi si gathi u wana vhukonani haṋu. A hu ṱoḓei u ḓivhadzisa!",
        "assessment.loading": "I khou laḓa mbudziso...",
        "assessment.question_counter": "Mbudziso {current} ya {total}",
        "assessment.loading_input": "I khou laḓa u ṅwala...",
        "assessment.next": "I tevhelaho",
        "assessment.complete": "Fhedza Ulingo",
        "assessment.error": "Yo kundelwa u laḓa ulingo. Kha ri lingedze hafhu nga murahu.",
        "assessment.no_questions": "A hu na mbudziso dzi re hone.",
        "assessment.placeholder.text": "Ṅwala phindulo yaṋu fhano...",
        "assessment.select_answer": "Kha ri khethe phindulo.",
        "assessment.unsupported_type": "Mofuta wa mbudziso u sa ṱanganedzwa: {type}",
        "assessment.completed": "Ulingo Ho Fhelela!",
        "assessment.ready_to_complete": "No fhindula mbudziso dzoṱhe.",
        "report.title": "Muvhigo waṋu wa Vhukonani ha Muengwa",
        "report.subtitle": "Ndi heyi mbudziso yaṋu ya ulingo. Ḓivhadzisa u wana zwithu zwo fhelelaho na u ṱanganedza na vhaṅwe.",
        "report.loading": "I khou laḓa muvhigo...",
        "report.summary_title": "Mudzudzanyo wa Vhukonani:",
        "report.summary_placeholder": "Mudzudzanyo waṋu wa vhukonani u ḓo ḓi bvelela fhano u ya nga phindulo dzaṋu...",
        "report.your_answers_title": "Phindulo dzaṋu:",
        "report.answers_placeholder": "Phindulo dzaṋu dzi ḓo ḓi bvelela fhano...",
        "report.cta_text": "No ḓilugisela u ṱoḓisisa vhukonani vhu ṱanḓulukaho na vhaṅwe?",
        "report.cta_button": "Ḓivhadzisa u wana vhuḓinnginisi ho fhelelaho",
        "report.expiry_warning": "Muvhigo waṋu wa muengwa ndi wa tshifhinganyana nahone u ḓo fhela nga murahu ha maḓuvha a 7.",
        "report.error": "Ho kundelwa u vhumba muvhigo kana muvhigo wo fhela.",
        "features.title": "Zwithu zwa Ndeme (Zwi ḓo ḓi ḓa!)",
        "features.subtitle": "LifeSync i ṋea vhavhingani vho ḓivhadzisaho zwithu zwinzhi zwa ndeme u fhaṱa vhukonani vhu simaho, vhu re khagala.",
        "features.tile1.title": "Ulingo vhu ṱanḓulukaho",
        "features.tile1.desc": "Ḓivhanya vhukonani ha tshelede, vhuimo, ndila ya vhutshilo, na zwiṅwe, u katela na thero dza ndeme dza sialala.",
        "features.tile2.title": "Vhukonani ha Vhukonani",
        "features.tile2.desc": "Bona ṱhoḓisiso yo fhelelaho ya vhukonani na phambano na vhaṅwe vhaṋu.",
        "features.tile3.title": "Ho Khidzhisea Nahone Ndi Tshiphiri",
        "features.tile3.desc": "Data yaṋu yo khidzhisea nga u khidzhisea hu simaho na u laula tshiphiri.",
        "features.tile4.title": "Khuthadza Vhuṱanganelani",
        "features.tile4.desc": "Vhukonani vhu ṋea thendelano dza u ṱanganela nga u vulea na nga u thembeka.",
        "features.tile5.title": "Landela Vhuendo Haṋu",
        "features.tile5.desc": "Bona uri vhukonani haṋu vhu khou shanduka hani nga u linga lwa u bvela phanḓa.",
        "features.tile6.title": "Zwi Amanaho Na Sialala",
        "features.tile6.desc": "Zwo itelwa u pfesesa na u ṱhonifha mvelele dzo fhambanaho, u katela na zwiṅwe zwa Afurika Tshiphiri.",
        "about.title": "Nga LifeSync",
        "about.subtitle": "Ndima ya rona ndi u ṋea vhavhingani maanḓa nga nḓivho na zwishumiswa zwa u fhaṱa vhukonani vhu dzulaho, vhu re khagala.",
        "about.paragraph1": "Yo thomiwa nga thendelo ya uri vhukonani vhu re vhuṱukhu vhu fhira u kokomedza ha u thoma, LifeSync yo itwa u ṋea nḓila yo dzudzanywaho ya uri vhavhingani vha ṱoḓisise zwishumiswa zwa vhukonani havho. Ri a pfesesa uri nyambedzano dzi re khagala nga ha thero dzi ngaho tshelede, vhuimo, na ndila ya vhutshilo zwi nga vha zwi konḓaho, fhedzi zwi zwa ndeme kha mutheo wo simaho.",
        "about.paragraph2": "Ri na fhulufhelo vhukuma nga ha u sedzana na vhuimo vhu si ha kale na u sedzana na sialala zwi re hone kha tshishumiswa tsho fhambanaho, u katela na tshishumiswa tsha Afurika Tshiphiri. Ulingo lwa rona lwo dzudzanywa u vha na vhuṱali, u katela vhoṱhe, na u vha na vhuṱali, u thusa vhavhingani u kunda zwishumiswa zwa ndeme nga u ṱhonifhana na u pfesesa.",
        "about.paragraph3": "Naho ni tshi khou thoma kana ni khou ṱanganedza nga miṅwaha minzhi, LifeSync i ṋea nḓivho ye na i ṱoḓa u ṱanḓulukisa vhukonani haṋu na u ita dziphetḽo dzo ḓivhadziswaho nga ha vhumatshelo haṋu vhu re khagala. Ḓiṱanganedzeni na rona kha lwonolu luendo lwa u ya kha vhukonani vhu re khagala na vhu ḓadzaho.",
        "auth.login.title": "Dzhena kha LifeSync",
        "auth.signup.title": "Vhumba Akhaunthu yaṋu ya LifeSync",
        "auth.form.email": "I-imeyili",
        "auth.form.password": "Pasiwede",
        "auth.login.button": "Dzhena",
        "auth.signup.button": "Ḓivhadzisa",
        "auth.login.signup_prompt": "A u na akhaunthu? Ḓivhadzisa",
        "auth.signup.login_prompt": "No no vha na akhaunthu? Dzhena",
        "auth.form.name": "Dzinna ḽaṋu",
        "common.warning": "Tsevho",
        "common.ok": "Zwo Luga",
        "feedback.default": "I khou laḓa phindulo yaṋu...",
        "feedback.thoughtful": "Phindulo yo nahanne! Hezwi zwi ri ṋea nḓivho i re ya ndeme.",
        "feedback.simple": "Zwo luga, zwo ṱoḓisisa.",
        "feedback.generic": "Phindulo yo ṱanganedzwa.",
        "feedback.error": "Ho kundelwa u wana phindulo ya tshifhinganyana. I khou bvela phanḓa...",
    },
    // Xitsonga (ts) - Basic placeholders
    ts: {
        "nav.title": "LifeSync",
        "nav.home": "Muti",
        "nav.guest_assessment": "Nhlahluvo wa Muendzi",
        "nav.guest_report": "Xiviko xa Muendzi",
        "nav.features": "Swihlawulekisi",
        "nav.about": "Hi Hina",
        "nav.login": "Nghena",
        "nav.signup": "Tisayina",
        "hero.title": "Hlanganisa Vutomi Bya Nwina, Enta Xikamano Xa Nwina Xi Tiya",
        "hero.subtitle": "LifeSync yi nyika vukati vutivi lebyi hlelekeke, lebyi sekeriweke eka data mayelana na ku fambisana ku pfuna vatekani ku aka vuxaka lebyi tiyeke, lebyi vonakaka, va hlula tinhloko ta nkoka hi ku tshemba.",
        "hero.cta.assessment": "Tshama Nhlahluvo wa Muendzi",
        "hero.cta.signup": "Tisayina ku kuma Mfikelelo Lowu Hetisekeke",
        "hero.card.title": "Kuma Ku Fambisana Ka Nwina",
        "hero.card.subtitle": "Hlola tindzawo ta nkoka to fana na mintikelo, ndlela ya vutomi, na timali.",
        "hero.card.cta": "Sungula Nhlahluvo",
        "assessment.title": "Nhlahluvo wa Ku Fambisana ka Muendzi",
        "assessment.subtitle": "Hlamula swivutiso swo hlayanyana ku kuma vonelo ra vutivi bya nwina bya ku fambisana. A ku laviwi ku tisayina!",
        "assessment.loading": "Ya layicha swivutiso...",
        "assessment.question_counter": "Xivutiso {current} xa {total}",
        "assessment.loading_input": "Ya layicha ku nghenisa...",
        "assessment.next": "Lendzo leyi landzelaka",
        "assessment.complete": "Hetisa Nhlahluvo",
        "assessment.error": "Yi tsandzekile ku layicha nhlahluvo. Hi kombela u ringeta nakambe endzhaku.",
        "assessment.no_questions": "A ku na swivutiso leswi nga kona.",
        "assessment.placeholder.text": "Tsala nhlamulo ya wena laha...",
        "assessment.select_answer": "Hi kombela u hlawula nhlamulo.",
        "assessment.unsupported_type": "Mofuta wa xivutiso lowu nga sekelwaka: {type}",
        "assessment.completed": "Nhlahluvo Wu Hetisekile!",
        "assessment.ready_to_complete": "U hlamule swivutiso hinkwaswo.",
        "report.title": "Xiviko Xa Nwina Xa Ku Fambisana ka Muendzi",
        "report.subtitle": "Hi lexi xiviko xa vutivi bya nwina bya nhlahluvo. Tisayina ku pfulela swihlawulekisi leswi hetisekeke naswona u avelana na mulamuleri.",
        "report.loading": "Ya layicha xiviko...",
        "report.summary_title": "Nkomiso wa Vutivi:",
        "report.summary_placeholder": "Nkomiso wa nwina wa ku fambisana wutavela laha hi ku sekeriwa eka tinhlamulo ta nwina...",
        "report.your_answers_title": "Tinhlamulo Ta Nwina:",
        "report.answers_placeholder": "Tinhlamulo ta nwina titavela laha...",
        "report.cta_text": "Xana mi lunghekele ku hlola ku fambisana lokukulu na mulamuleri?",
        "report.cta_button": "Tisayina ku kuma Mfikelelo Lowu Hetisekeke",
        "report.expiry_warning": "Xiviko xa nwina xa muendzi i xa xikhashana naswona xitaphela endzhaku ka masiku ya 7.",
        "report.error": "Yi tsandzekile ku endla xiviko kumbe xiviko xi felile.",
        "features.title": "Swihlawulekisi Swankoka (Swita Kuva Swita!)",
        "features.subtitle": "LifeSync yi nyika vatekani lava tisayinileke swihlawulekisi leswi tiyeke ku aka vuxaka lebyi tiyeke, lebyi vonakaka.",
        "features.tile1.title": "Tinhlahluvo Letikulu",
        "features.tile1.desc": "Hlola ku fambisana ka timali, mintikelo, ndlela ya vutomi, na swo tala, ku katsa na tinhloko leti fambelanaka na ndhavuko.",
        "features.tile2.title": "Vutivi Bya Ku Fambisana",
        "features.tile2.desc": "Vona ku hlahluva lokukulu ka ku fambisana na ku hambana na mulamuleri wa wena.",
        "features.tile3.title": "Yi Sireletsekile Naswona Yi Xihundla",
        "features.tile3.desc": "Data ya wena yi sirheleriwile hi nsirhelelo lowu tiyeke na ku lawula xihundla.",
        "features.tile4.title": "Khutaza Ku Vulavurisana",
        "features.tile4.desc": "Vutivi byi nyika switsundzuxo swa tingxoxo leti pfulekeke na leti tshembekeke.",
        "features.tile5.title": "Landzelela Endlelo Ra Nwina",
        "features.tile5.desc": "Vona ndlela leyi ku fambisana ka nwina ku cincaka ha yona hi ku famba ka nkarhi hi ku hlahluva loku yaka emahlweni.",
        "features.tile6.desc": "Yi Fambelanaka Na Ndhavuko",
        "features.tile6.desc": "Yi endleriwe ku twisisa na ku hlonipha mindhavuko leyi hambaneke, ku katsa na swihlawulekisi swa Afrika Dzonga.",
        "about.title": "Hi LifeSync",
        "about.subtitle": "Xikongomelo xa hina i ku nyika vatekani matimba hi vutivi na swibuluka swa ku aka vuxaka lebyi nga heriki, lebyi vonakaka.",
        "about.paragraph1": "Yi simekiwe hi ripfumelo ra leswaku ku fambisana ka ntiyiso ku tlula ku koka ka khale, LifeSync yi endliwe ku nyika ndlela leyi hlelekeke ya leswaku vatekani va hlola swiphemu swa nkoka swa vuxaka bya vona. Ha swi twisisa leswaku tingxoxo leti pfulekeke hi tinhloko to fana na timali, mintikelo, na swilindzelo swa ndyangu swi nga va swi nonoha, kambe swa nkoka eka masungulo yo tiya.",
        "about.paragraph2": "Hi tsakela ngopfu ku vulavula hi swiphemu swo hlawuleka na swilo swa ndhavuko leswi nga kona emixakeni leyi hambaneke, ku katsa na vutomi lebyi fuweke bya Afrika Dzonga. Tinhlahluvo ta hina ti endliwe ku va na vutivi, ku katsa hinkwavo, na ku va ta nkoka, ku pfuna vatekani ku famba eka swiphemu leswi swa nkoka hi ku hloniphana na ku twisisana.",
        "about.paragraph3": "Hambi leswi mi ha ku sungulaka kumbe mi se mi ri swin'we hi malembe yo tala, LifeSync yi nyika vutivi lebyi mi byi lavaka ku tiyisa vuxaka bya nwina na ku endla swiboho leswi sekeriweke eka vutivi hi vumundzuku bya nwina swin'we. Hlanganani na hina eka riendzo leri leri yaka eka vuxaka lebyi vonakaka na lebyi kgotsofaka.",
        "auth.login.title": "Nghena eka LifeSync",
        "auth.signup.title": "Vumba Akhaonto Ya Wena Ya LifeSync",
        "auth.form.email": "I-imeyili",
        "auth.form.password": "Phasiwedi",
        "auth.login.button": "Nghena",
        "auth.signup.button": "Tisayina",
        "auth.login.signup_prompt": "A wu na akhaonto? Tisayina",
        "auth.signup.login_prompt": "Se u na akhaonto? Nghena",
        "auth.form.name": "Vito Ra Nwina",
        "common.warning": "Ntsundzuxo",
        "common.ok": "Swilunghile",
        "feedback.default": "Ya layicha nhlamulo ya wena...",
        "feedback.thoughtful": "Nhlamulo leyi ehleketliweke! Leswi swi hi nyika vutivi lebyi byinene.",
        "feedback.simple": "Swilunghile, swi tsariwile.",
        "feedback.generic": "Nhlamulo yi amukeriwile.",
        "feedback.error": "Yi tsandzekile ku kuma nhlamulo hi ku hatlisa. Ya yisa emahlweni...",
    },
     // French (fr)
    fr: {
        "nav.title": "LifeSync",
        "nav.home": "Accueil",
        "nav.guest_assessment": "Évaluation Invité",
        "nav.guest_report": "Rapport Invité",
        "nav.features": "Fonctionnalités",
        "nav.about": "À Propos",
        "nav.login": "Connexion",
        "nav.signup": "Inscription",
        "hero.title": "Synchronisez Vos Vies, Approfondissez Votre Connexion",
        "hero.subtitle": "LifeSync fournit des informations de compatibilité structurées et basées sur les données pour aider les couples à construire des relations plus solides et transparentes, en abordant les sujets cruciaux avec confiance.",
        "hero.cta.assessment": "Faire l'Évaluation Invité",
        "hero.cta.signup": "S'inscrire pour un Accès Complet",
        "hero.card.title": "Découvrez Votre Compatibilité",
        "hero.card.subtitle": "Explorez des domaines clés comme les valeurs, le style de vie et les finances.",
        "hero.card.cta": "Commencer l'Évaluation",
        "assessment.title": "Évaluation de Compatibilité Invité",
        "assessment.subtitle": "Répondez à quelques questions pour avoir un aperçu de vos informations de compatibilité. Aucune inscription requise !",
        "assessment.loading": "Chargement des questions...",
        "assessment.question_counter": "Question {current} sur {total}",
        "assessment.loading_input": "Chargement de la saisie...",
        "assessment.next": "Suivant",
        "assessment.complete": "Terminer l'Évaluation",
        "assessment.error": "Échec du chargement de l'évaluation. Veuillez réessayer plus tard.",
        "assessment.no_questions": "Aucune question disponible.",
        "assessment.placeholder.text": "Tapez votre réponse ici...",
        "assessment.select_answer": "Veuillez sélectionner une réponse.",
        "assessment.unsupported_type": "Type de question non pris en charge : {type}",
        "assessment.completed": "Évaluation Terminée !",
        "assessment.ready_to_complete": "Vous avez répondu à toutes les questions.",
        "report.title": "Votre Rapport de Compatibilité Invité",
        "report.subtitle": "Voici un résumé de vos informations d'évaluation. Inscrivez-vous pour débloquer toutes les fonctionnalités et partager avec un partenaire.",
        "report.loading": "Chargement du rapport...",
        "report.summary_title": "Résumé des Informations :",
        "report.summary_placeholder": "Votre résumé de compatibilité apparaîtra ici en fonction de vos réponses...",
        "report.your_answers_title": "Vos Réponses :",
        "report.answers_placeholder": "Vos réponses apparaîtront ici...",
        "report.cta_text": "Prêt à explorer une compatibilité plus approfondie avec un partenaire ?",
        "report.cta_button": "S'inscrire pour un Accès Complet",
        "report.expiry_warning": "Votre rapport invité est temporaire et expirera après 7 jours.",
        "report.error": "Échec de la génération du rapport ou rapport expiré.",
        "features.title": "Fonctionnalités Clés (Bientôt Disponibles !)",
        "features.subtitle": "LifeSync offre une suite de fonctionnalités puissantes pour les couples inscrits afin de construire des relations plus solides et transparentes.",
        "features.tile1.title": "Évaluations Approfondies",
        "features.tile1.desc": "Explorez la compatibilité financière, des valeurs, du style de vie, et plus encore, y compris des sujets culturellement pertinents.",
        "features.tile2.title": "Informations de Compatibilité",
        "features.tile2.desc": "Visualisez une analyse détaillée de l'alignement et des différences avec votre partenaire.",
        "features.tile3.title": "Sécurisé et Privé",
        "features.tile3.desc": "Vos données sont protégées par des contrôles de sécurité et de confidentialité robustes.",
        "features.tile4.title": "Favoriser la Communication",
        "features.tile4.desc": "Les informations fournissent des pistes pour des discussions ouvertes et honnêtes.",
        "features.tile5.title": "Suivez Votre Parcours",
        "features.tile5.desc": "Voyez comment votre compatibilité évolue au fil du temps avec des évaluations continues.",
        "features.tile6.title": "Culturellement Pertinent",
        "features.tile6.desc": "Conçu pour comprendre et respecter les divers horizons culturels, y compris les nuances sud-africaines.",
        "about.title": "À Propos de LifeSync",
        "about.subtitle": "Notre mission est de donner aux couples les connaissances et les outils nécessaires pour construire des relations durables et transparentes.",
        "about.paragraph1": "Fondée sur la conviction que la véritable compatibilité va au-delà de l'attraction initiale, LifeSync a été créée pour offrir aux couples un moyen structuré d'explorer les aspects fondamentaux de leur partenariat. Nous comprenons que les conversations ouvertes sur des sujets tels que les finances, les valeurs et les attentes familiales peuvent être difficiles, mais elles sont essentielles à une base solide.",
        "about.paragraph2": "Nous sommes particulièrement passionnés par l'abord des dynamiques uniques et des considérations culturelles présentes dans les sociétés diverses, y compris la riche tapisserie de l'Afrique du Sud. Nos évaluations sont conçues pour être sensibles, inclusives et pertinentes, aidant les couples à naviguer dans ces aspects importants avec respect mutuel et compréhension.",
        "about.paragraph3": "Que vous débutiez ou que vous soyez ensemble depuis des années, LifeSync vous fournit les informations dont vous avez besoin pour approfondir votre connexion et prendre des décisions éclairées sur votre avenir ensemble. Rejoignez-nous dans ce voyage vers des relations plus transparentes et épanouissantes.",
        "auth.login.title": "Connexion à LifeSync",
        "auth.signup.title": "Créer Votre Compte LifeSync",
        "auth.form.email": "Email",
        "auth.form.password": "Mot de passe",
        "auth.login.button": "Connexion",
        "auth.signup.button": "Inscription",
        "auth.login.signup_prompt": "Pas encore de compte ? S'inscrire",
        "auth.signup.login_prompt": "Déjà un compte ? Connexion",
        "auth.form.name": "Votre Nom",
        "common.warning": "Avertissement",
        "common.ok": "OK",
        "feedback.default": "Traitement de votre réponse...",
        "feedback.thoughtful": "Réponse réfléchie ! Cela nous donne un bon aperçu.",
        "feedback.simple": "Ok, noté.",
        "feedback.generic": "Réponse reçue.",
        "feedback.error": "Impossible d'obtenir un retour instantané. Continuer...",
    },
     // Portuguese (pt)
    pt: {
        "nav.title": "LifeSync",
        "nav.home": "Início",
        "nav.guest_assessment": "Avaliação de Convidado",
        "nav.guest_report": "Relatório de Convidado",
        "nav.features": "Funcionalidades",
        "nav.about": "Sobre Nós",
        "nav.login": "Entrar",
        "nav.signup": "Registar",
        "hero.title": "Sincronize Suas Vidas, Aprofunde Sua Conexão",
        "hero.subtitle": "LifeSync fornece insights de compatibilidade estruturados e baseados em dados para ajudar casais a construir relacionamentos mais fortes e transparentes, navegando tópicos cruciais com confiança.",
        "hero.cta.assessment": "Fazer Avaliação de Convidado",
        "hero.cta.signup": "Registar para Acesso Total",
        "hero.card.title": "Descubra Sua Compatibilidade",
        "hero.card.subtitle": "Explore áreas chave como valores, estilo de vida e finanças.",
        "hero.card.cta": "Iniciar Avaliação",
        "assessment.title": "Avaliação de Compatibilidade de Convidado",
        "assessment.subtitle": "Responda a algumas perguntas para ter uma ideia dos seus insights de compatibilidade. Não é necessário registo!",
        "assessment.loading": "A carregar perguntas...",
        "assessment.question_counter": "Pergunta {current} de {total}",
        "assessment.loading_input": "A carregar entrada...",
        "assessment.next": "Próximo",
        "assessment.complete": "Concluir Avaliação",
        "assessment.error": "Falha ao carregar avaliação. Por favor, tente novamente mais tarde.",
        "assessment.no_questions": "Nenhuma pergunta disponível.",
        "assessment.placeholder.text": "Digite sua resposta aqui...",
        "assessment.select_answer": "Por favor, selecione uma resposta.",
        "assessment.unsupported_type": "Tipo de pergunta não suportado: {type}",
        "assessment.completed": "Avaliação Concluída!",
        "assessment.ready_to_complete": "Você respondeu a todas as perguntas.",
        "report.title": "Seu Relatório de Compatibilidade de Convidado",
        "report.subtitle": "Aqui está um resumo dos seus insights de avaliação. Registe-se para desbloquear todas as funcionalidades e partilhar com um parceiro.",
        "report.loading": "A carregar relatório...",
        "report.summary_title": "Resumo dos Insights:",
        "report.summary_placeholder": "Seu resumo de compatibilidade aparecerá aqui com base nas suas respostas...",
        "report.your_answers_title": "Suas Respostas:",
        "report.answers_placeholder": "Suas respostas aparecerão aqui...",
        "report.cta_text": "Pronto para explorar compatibilidade mais profunda com um parceiro?",
        "report.cta_button": "Registar para Acesso Total",
        "report.expiry_warning": "Seu relatório de convidado é temporário e expirará após 7 dias.",
        "report.error": "Falha ao gerar relatório ou relatório expirou.",
        "features.title": "Funcionalidades Principais (Em Breve!)",
        "features.subtitle": "LifeSync oferece um conjunto de funcionalidades poderosas para casais registados construírem relacionamentos mais fortes e transparentes.",
        "features.tile1.title": "Avaliações Detalhadas",
        "features.tile1.desc": "Explore compatibilidade em finanças, valores, estilo de vida e muito mais, incluindo tópicos culturalmente relevantes.",
        "features.tile2.title": "Insights de Compatibilidade",
        "features.tile2.desc": "Veja análise detalhada de alinhamento e diferenças com seu parceiro.",
        "features.tile3.title": "Seguro e Privado",
        "features.tile3.desc": "Seus dados são protegidos com segurança robusta e controlos de privacidade.",
        "features.tile4.title": "Promover a Comunicação",
        "features.tile4.desc": "Insights fornecem sugestões para discussões abertas e honestas.",
        "features.tile5.title": "Acompanhe Sua Jornada",
        "features.tile5.desc": "Veja como sua compatibilidade evolui ao longo do tempo com avaliações contínuas.",
        "features.tile6.title": "Culturalmente Relevante",
        "features.tile6.desc": "Projetado para entender e respeitar diversas origens culturais, incluindo nuances sul-africanas.",
        "about.title": "Sobre o LifeSync",
        "about.subtitle": "Nossa missão é capacitar casais com o conhecimento e as ferramentas para construir relacionamentos duradouros e transparentes.",
        "about.paragraph1": "Fundada com a crença de que a verdadeira compatibilidade vai além da atração inicial, o LifeSync foi criado para fornecer uma maneira estruturada para os casais explorarem os aspectos fundamentais de sua parceria. Entendemos que conversas abertas sobre tópicos como finanças, valores e expectativas familiares podem ser desafiadoras, mas são essenciais para uma base sólida.",
        "about.paragraph2": "Somos particularmente apaixonados por abordar as dinâmicas únicas e as considerações culturais presentes em sociedades diversas, incluindo a rica tapeçaria da África do Sul. Nossas avaliações são projetadas para serem sensíveis, inclusivas e relevantes, ajudando os casais a navegar nesses aspectos importantes com respeito mútuo e compreensão.",
        "about.paragraph3": "Quer você esteja apenas começando ou esteja junto há anos, o LifeSync fornece os insights que você precisa para aprofundar sua conexão e tomar decisões informadas sobre seu futuro juntos. Junte-se a nós nesta jornada em direção a relacionamentos mais transparentes e gratificantes.",
        "auth.login.title": "Entrar no LifeSync",
        "auth.signup.title": "Criar Sua Conta LifeSync",
        "auth.form.email": "Email",
        "auth.form.password": "Palavra-passe",
        "auth.login.button": "Entrar",
        "auth.signup.button": "Registar",
        "auth.login.signup_prompt": "Não tem uma conta? Registar",
        "auth.signup.login_prompt": "Já tem uma conta? Entrar",
        "auth.form.name": "Seu Nome",
        "common.warning": "Aviso",
        "common.ok": "OK",
        "feedback.default": "A processar sua resposta...",
        "feedback.thoughtful": "Resposta atenciosa! Isso nos dá um bom insight.",
        "feedback.simple": "Ok, anotado.",
        "feedback.generic": "Resposta recebida.",
        "feedback.error": "Não foi possível obter feedback instantâneo. A prosseguir...",
    },
     // Shona (sn)
    sn: {
        "nav.title": "LifeSync",
        "nav.home": "Kumba",
        "nav.guest_assessment": "Kuongorora Kwemuenzi",
        "nav.guest_report": "Mushumo Wemuenzi",
        "nav.features": "Zvimiro",
        "nav.about": "Nezvedu",
        "nav.login": "Pinda",
        "nav.signup": "Nyoresa",
        "hero.title": "Batanidza Hupenyu Hwenyu, Simbisa Kubatana Kwenyu",
        "hero.subtitle": "LifeSync inopa ruzivo rwakarongeka, rwakavakirwa padata nezve kuenderana kubatsira vakaroorana kuvaka hukama hwakasimba, huri pachena, vachikurukura misoro yakakosha nechivimbo.",
        "hero.cta.assessment": "Tora Kuongorora Kwemuenzi",
        "hero.cta.signup": "Nyoresa Kuti Uwande Zvakakwana",
        "hero.card.title": "Tsvaga Kuenderana Kwenyu",
        "hero.card.subtitle": "Ongorora nzvimbo dzakakosha sezvinokosha, mararamiro, nemari.",
        "hero.card.cta": "Tanga Kuongorora",
        "assessment.title": "Kuongorora Kuenderana Kwemuenzi",
        "assessment.subtitle": "Pindura mibvunzo mishoma kuti uwane tarisiro yeruzivo rwenyu rwekuenderana. Hapana kunyoresa kunodiwa!",
        "assessment.loading": "Ichirodha mibvunzo...",
        "assessment.question_counter": "Mubvunzo {current} pa {total}",
        "assessment.loading_input": "Ichirodha kupinda...",
        "assessment.next": "Zvinotevera",
        "assessment.complete": "Pedzisa Kuongorora",
        "assessment.error": "Yatadza kurodha kuongorora. Ndapota edza zvakare gare gare.",
        "assessment.no_questions": "Hapana mibvunzo iripo.",
        "assessment.placeholder.text": "Nyora mhinduro yako pano...",
        "assessment.select_answer": "Ndapota sarudza mhinduro.",
        "assessment.unsupported_type": "Rudzi rwembvunzo rusina kutsigirwa: {type}",
        "assessment.completed": "Kuongorora Kwapera!",
        "assessment.ready_to_complete": "Wapindura mibvunzo yose.",
        "report.title": "Mushumo Wenyu Wekuenderana Kwemuenzi",
        "report.subtitle": "Heino pfupiso yeruzivo rwenyu rwekuongorora. Nyoresa kuti muvhure zvose zviri mukati uye mugovane nemumwe wenyu.",
        "report.loading": "Ichirodha mushumo...",
        "report.summary_title": "Pfupiso Yeruzivo:",
        "report.summary_placeholder": "Pfupiso yenyu yekuenderana ichaonekwa pano zvichibva pamhinduro dzenyu...",
        "report.your_answers_title": "Mhinduro Dzenyu:",
        "report.answers_placeholder": "Mhinduro dzenyu dzichaonekwa pano...",
        "report.cta_text": "Wagadzirira kuongorora kuenderana kwakadzama nemumwe wako?",
        "report.cta_button": "Nyoresa Kuti Uwande Zvakakwana",
        "report.expiry_warning": "Mushumo wenyu wemuenzi ndewenguva duku uye uchapera mushure memazuva manomwe.",
        "report.error": "Yatadza kugadzira mushumo kana mushumo wapera.",
        "features.title": "Zvimiro Zvakakosha (Zvichauya Nguva Duku!)",
        "features.subtitle": "LifeSync inopa zvimiro zvine simba kuvakaroorana vakanyoresa kuti vavake hukama hwakasimba, huri pachena.",
        "features.tile1.title": "Kuongorora Kwakadzama",
        "features.tile1.desc": "Ongorora kuenderana kwemari, zvakakosha, mararamiro, nezvimwe, kusanganisira misoro yakakosha yetsika.",
        "features.tile2.title": "Ruzivo Rwekuenderana",
        "features.tile2.desc": "Wona kuongorora kwakadzama kwekuenderana nekusiyana nemumwe wako.",
        "features.tile3.title": "Yakachengeteka Uye Yakavanzika",
        "features.tile3.desc": "Ruzivo rwenyu rwakachengetedzwa nekuchengetedzwa kwakasimba uye kutonga kwakavanzika.",
        "features.tile4.title": "Kukurudzira Kukurukurirana",
        "features.tile4.desc": "Ruzivo runopa zvikurudziro zvekukurukurirana pachena uye nekuvimbika.",
        "features.tile5.title": "Tevedzera Rwendo Rwenyu",
        "features.tile5.desc": "Wona kuti kuenderana kwenyu kunochinja sei nekufamba kwenguva nekuongorora kunoenderera mberi.",
        "features.tile6.desc": "Yakakosha Netsika",
        "features.tile6.desc": "Yakagadzirirwa kunzwisisa nekuremekedza tsika dzakasiyana, kusanganisira zvimiro zveSouth Africa.",
        "about.title": "Nezve LifeSync",
        "about.subtitle": "Basa redu nderekupa vakaroorana simba neruzivo nezvishandiso zvekuvaka hukama hunogara kwenguva refu, huri pachena.",
        "about.paragraph1": "Yakavambwa nechitendero chekuti kuenderana kwechokwadi kunopfuura kukwezva kwekutanga, LifeSync yakagadzirwa kuti ipe nzira yakarongeka yekuti vakaroorana vaongorore zvinhu zvakakosha zveukama hwavo. Tinonzwisisa kuti hurukuro dzakavhurika pamusoro penyaya dzakadai semari, tsika, uye zvakatarisirwa nemhuri zvinogona kunetsa, asi zvakakosha pahwaro hwakasimba.",
        "about.paragraph2": "Isu tinonyanya kuda kubata nehunhu hwakasiyana uye zvakakosha zvetsika zviripo munzanga dzakasiyana, kusanganisira hupfumi hwakawanda hweSouth Africa. Ongororo yedu yakagadzirirwa kuva nehanya, inosanganisira, uye yakakodzera, ichibatsira vakaroorana kufamba muzvinhu izvi zvakakosha neruremekedzo rwakarongeka nekunzwisisa.",
        "about.paragraph3": "Kunyangwe muchangotanga kana kuti makave pamwe kwemakore, LifeSync inopa ruzivo rwamunoda kuti muwedzere kubatana kwenyu uye muite sarudzo dzakarongeka nezve ramangwana renyu pamwe chete. Joinha isu parwendo urwu rweku hukama huri pachena uye hunogutsa.",
        "auth.login.title": "Pinda mu LifeSync",
        "auth.signup.title": "Gadzira Akaunti Yenyu Ye LifeSync",
        "auth.form.email": "E-mail",
        "auth.form.password": "Pasiwedi",
        "auth.login.button": "Pinda",
        "auth.signup.button": "Nyoresa",
        "auth.login.signup_prompt": "Hauna akaunti? Nyoresa",
        "auth.signup.login_prompt": "Wakatonyoresa kare? Pinda",
        "auth.form.name": "Zita Renyu",
        "common.warning": "Yambiro",
        "common.ok": "Zvakanaka",
        "feedback.default": "Ichirodha mhinduro yako...",
        "feedback.thoughtful": "Mhinduro yakafungisisa! Izvi zvinotipa ruzivo rwakanaka.",
        "feedback.simple": "Zvakanaka, zvanyorwa.",
        "feedback.generic": "Mhinduro yagamuchirwa.",
        "feedback.error": "Yatadza kuwana mhinduro yekukurumidza. Kuenderera mberi...",
    },
     // Kiswahili (sw)
    sw: {
        "nav.title": "LifeSync",
        "nav.home": "Nyumbani",
        "nav.guest_assessment": "Tathmini ya Mgeni",
        "nav.guest_report": "Ripoti ya Mgeni",
        "nav.features": "Vipengele",
        "nav.about": "Kuhusu Sisi",
        "nav.login": "Ingia",
        "nav.signup": "Jisajili",
        "hero.title": "Sawazisha Maisha Yenu, Imarisha Muunganisho Wenu",
        "hero.subtitle": "LifeSync inatoa maarifa ya utangamano yaliyopangwa, yanayotokana na data kusaidia wanandoa kujenga mahusiano imara, yenye uwazi, wakishughulikia mada muhimu kwa ujasiri.",
        "hero.cta.assessment": "Fanya Tathmini ya Mgeni",
        "hero.cta.signup": "Jisajili Kupata Ufikiaji Kamili",
        "hero.card.title": "Gundua Utangamano Wenu",
        "hero.card.subtitle": "Chunguza maeneo muhimu kama vile maadili, mtindo wa maisha, na fedha.",
        "hero.card.cta": "Anza Tathmini",
        "assessment.title": "Tathmini ya Utangamano ya Mgeni",
        "assessment.subtitle": "Jibu maswali machache ili kupata muhtasari wa maarifa yako ya utangamano. Hakuna usajili unaohitajika!",
        "assessment.loading": "Inapakia maswali...",
        "assessment.question_counter": "Swali {current} kati ya {total}",
        "assessment.loading_input": "Inapakia uingizaji...",
        "assessment.next": "Inayofuata",
        "assessment.complete": "Kamilisha Tathmini",
        "assessment.error": "Imeshindwa kupakia tathmini. Tafadhali jaribu tena baadaye.",
        "assessment.no_questions": "Hakuna maswali yanayopatikana.",
        "assessment.placeholder.text": "Andika jibu lako hapa...",
        "assessment.select_answer": "Tafadhali chagua jibu.",
        "assessment.unsupported_type": "Aina ya swali isiyotumika: {type}",
        "assessment.completed": "Tathmini Imekamilika!",
        "assessment.ready_to_complete": "Umejibu maswali yote.",
        "report.title": "Ripoti Yako ya Utangamano ya Mgeni",
        "report.subtitle": "Huu hapa muhtasari wa maarifa yako ya tathmini. Jisajili ili kufungua vipengele kamili na kushiriki na mwenza.",
        "report.loading": "Inapakia ripoti...",
        "report.summary_title": "Muhtasari wa Maarifa:",
        "report.summary_placeholder": "Muhtasari wako wa utangamano utaonekana hapa kulingana na majibu yako...",
        "report.your_answers_title": "Majibu Yako:",
        "report.answers_placeholder": "Majibu yako yataonekana hapa...",
        "report.cta_text": "Uko tayari kuchunguza utangamano wa kina zaidi na mwenza?",
        "report.cta_button": "Jisajili Kupata Ufikiaji Kamili",
        "report.expiry_warning": "Ripoti yako ya mgeni ni ya muda mfupi na itaisha baada ya siku 7.",
        "report.error": "Imeshindwa kutengeneza ripoti au ripoti imeisha muda wake.",
        "features.title": "Vipengele Muhimu (Inakuja Hivi Karibuni!)",
        "features.subtitle": "LifeSync inatoa seti ya vipengele vyenye nguvu kwa wanandoa waliojisajili kujenga mahusiano imara, yenye uwazi.",
        "features.tile1.title": "Tathmini za Kina",
        "features.tile1.desc": "Chunguza utangamano katika fedha, maadili, mtindo wa maisha, na zaidi, ikiwa ni pamoja na mada muhimu za kitamaduni.",
        "features.tile2.title": "Maarifa ya Utangamano",
        "features.tile2.desc": "Angalia uchambuzi wa kina wa upatanisho na tofauti na mwenza wako.",
        "features.tile3.title": "Salama na Siri",
        "features.tile3.desc": "Data yako inalindwa kwa usalama imara na vidhibiti vya faragha.",
        "features.tile4.title": "Kuhamasisha Mawasiliano",
        "features.tile4.desc": "Maarifa hutoa vidokezo vya majadiliano ya wazi na ya kweli.",
        "features.tile5.title": "Fuatilia Safari Yako",
        "features.tile5.desc": "Angalia jinsi utangamano wako unavyobadilika kwa muda na tathmini zinazoendelea.",
        "features.tile6.desc": "Inayofaa Kitamaduni",
        "features.tile6.desc": "Imeundwa kuelewa na kuheshimu asili mbalimbali za kitamaduni, ikiwa ni pamoja na nuances za Afrika Kusini.",
        "about.title": "Kuhusu LifeSync",
        "about.subtitle": "Dhamira yetu ni kuwawezesha wanandoa kwa maarifa na zana za kujenga mahusiano ya kudumu, yenye uwazi.",
        "about.paragraph1": "Iliyoundwa kwa imani kwamba utangamano wa kweli unazidi mvuto wa awali, LifeSync iliundwa ili kutoa njia iliyopangwa kwa wanandoa kuchunguza vipengele vya msingi vya ushirikiano wao. Tunaelewa kuwa mazungumzo ya wazi juu ya mada kama vile fedha, maadili, na matarajio ya familia yanaweza kuwa magumu, lakini ni muhimu kwa msingi imara.",
        "about.paragraph2": "Tunapenda sana kushughulikia mienendo ya kipekee na mazingatio ya kitamaduni yaliyopo katika jamii mbalimbali, ikiwa ni pamoja na utamaduni tajiri wa Afrika Kusini. Tathmini zetu zimeundwa kuwa nyeti, jumuishi, na muhimu, kusaidia wanandoa kushughulikia vipengele hivi muhimu kwa kuheshimiana na kuelewana.",
        "about.paragraph3": "Iwe mnaanza tu au mmekuwa pamoja kwa miaka mingi, LifeSync inatoa maarifa unayohitaji ili kuimarisha muunganisho wako na kufanya maamuzi sahihi kuhusu mustakabali wenu pamoja. Jiunge nasi katika safari hii kuelekea mahusiano yenye uwazi na yenye kuridhisha zaidi.",
        "auth.login.title": "Ingia kwenye LifeSync",
        "auth.signup.title": "Fungua Akaunti Yako ya LifeSync",
        "auth.form.email": "Barua pepe",
        "auth.form.password": "Nenosiri",
        "auth.login.button": "Ingia",
        "auth.signup.button": "Jisajili",
        "auth.login.signup_prompt": "Huna akaunti? Jisajili",
        "auth.signup.login_prompt": "Tayari unayo akaunti? Ingia",
        "auth.form.name": "Jina Lako",
        "common.warning": "Onyo",
        "common.ok": "Sawa",
        "feedback.default": "Inapakia jibu lako...",
        "feedback.thoughtful": "Jibu la kufikiria! Hii inatupa maarifa mazuri.",
        "feedback.simple": "Sawa, imebainishwa.",
        "feedback.generic": "Jibu limepokelewa.",
        "feedback.error": "Imeshindwa kupata maoni ya papo hapo. Inaendelea...",
    },
     // Japanese (ja)
    ja: {
        "nav.title": "LifeSync",
        "nav.home": "ホーム",
        "nav.guest_assessment": "ゲスト評価",
        "nav.guest_report": "ゲストレポート",
        "nav.features": "機能",
        "nav.about": "私たちについて",
        "nav.login": "ログイン",
        "nav.signup": "サインアップ",
        "hero.title": "人生を同期させ、つながりを深める",
        "hero.subtitle": "LifeSyncは、構造化されたデータ駆動型の互換性に関する洞察を提供し、カップルがより強く、より透明性の高い関係を築き、重要なトピックを自信を持ってナビゲートできるように支援します。",
        "hero.cta.assessment": "ゲスト評価を受ける",
        "hero.cta.signup": "フルアクセスにサインアップ",
        "hero.card.title": "あなたの互換性を発見する",
        "hero.card.subtitle": "価値観、ライフスタイル、経済などの主要な領域を探求します。",
        "hero.card.cta": "評価を開始する",
        "assessment.title": "ゲスト互換性評価",
        "assessment.subtitle": "いくつかの質問に答えて、互換性に関する洞察の概要を把握してください。登録は不要です！",
        "assessment.loading": "質問を読み込み中...",
        "assessment.question_counter": "{total}問中{current}問目",
        "assessment.loading_input": "入力中...",
        "assessment.next": "次へ",
        "assessment.complete": "評価を完了する",
        "assessment.error": "評価の読み込みに失敗しました。後でもう一度お試しください。",
        "assessment.no_questions": "質問はありません。",
        "assessment.placeholder.text": "ここに回答を入力してください...",
        "assessment.select_answer": "回答を選択してください。",
        "assessment.unsupported_type": "サポートされていない質問タイプ: {type}",
        "assessment.completed": "評価完了！",
        "assessment.ready_to_complete": "すべての質問に回答しました。",
        "report.title": "ゲスト互換性レポート",
        "report.subtitle": "評価に関する洞察の概要です。登録して全機能を解放し、パートナーと共有してください。",
        "report.loading": "レポートを読み込み中...",
        "report.summary_title": "洞察の概要：",
        "report.summary_placeholder": "回答に基づいた互換性の概要がここに表示されます...",
        "report.your_answers_title": "あなたの回答：",
        "report.answers_placeholder": "あなたの回答がここに表示されます...",
        "report.cta_text": "パートナーとのより深い互換性を探求する準備はできましたか？",
        "report.cta_button": "フルアクセスにサインアップ",
        "report.expiry_warning": "ゲストレポートは一時的なものであり、7日後に期限切れになります。",
        "report.error": "レポートの生成に失敗しました、またはレポートの有効期限が切れました。",
        "features.title": "主要機能（近日公開！）",
        "features.subtitle": "LifeSyncは、登録済みのカップルがより強く、より透明性の高い関係を築くための強力な機能を提供します。",
        "features.tile1.title": "詳細な評価",
        "features.tile1.desc": "経済、価値観、ライフスタイルなど、文化的に関連するトピックを含む互換性を探求します。",
        "features.tile2.title": "互換性に関する洞察",
        "features.tile2.desc": "パートナーとの一致点と相違点の詳細な分析を確認します。",
        "features.tile3.title": "安全でプライベート",
        "features.tile3.desc": "データは堅牢なセキュリティとプライバシー管理で保護されています。",
        "features.tile4.title": "コミュニケーションを促進する",
        "features.tile4.desc": "洞察は、オープンで誠実な議論のきっかけを提供します。",
        "features.tile5.title": "旅を追跡する",
        "features.tile5.desc": "継続的な評価により、時間の経過とともに互換性がどのように進化するかを確認します。",
        "features.tile6.desc": "文化的に関連する",
        "features.tile6.desc": "南アフリカのニュアンスを含む多様な文化的背景を理解し、尊重するように設計されています。",
        "about.title": "LifeSyncについて",
        "about.subtitle": "私たちの使命は、永続的で透明性のある関係を築くための知識とツールをカップルに提供することです。",
        "about.paragraph1": "真の互換性は最初の魅力以上のものだという信念に基づいて設立されたLifeSyncは、カップルがパートナーシップの基本的な側面を探求するための構造化された方法を提供するために作成されました。私たちは、経済、価値観、家族の期待などのトピックに関するオープンな会話が難しい場合があることを理解していますが、それらは強固な基盤にとって不可欠です。",
        "about.paragraph2": "私たちは特に、南アフリカの豊かな文化を含む、多様な社会に存在する独自のダイナミクスと文化的考慮事項に取り組むことに情熱を傾けています。私たちの評価は、敏感で包括的かつ関連性のあるものになるように設計されており、カップルが相互尊重と理解をもってこれらの重要な側面をナビゲートするのを支援します。",
        "about.paragraph3": "始めたばかりでも、何年も一緒にいる場合でも、LifeSyncはつながりを深め、一緒に将来について情報に基づいた決定を下すために必要な洞察を提供します。より透明性があり、充実した関係に向けたこの旅に私たちと一緒に参加してください。",
        "auth.login.title": "LifeSyncにログイン",
        "auth.signup.title": "LifeSyncアカウントを作成",
        "auth.form.email": "メールアドレス",
        "auth.form.password": "パスワード",
        "auth.login.button": "ログイン",
        "auth.signup.button": "サインアップ",
        "auth.login.signup_prompt": "アカウントをお持ちでない場合 サインアップ",
        "auth.signup.login_prompt": "すでにアカウントをお持ちですか？ ログイン",
        "auth.form.name": "あなたの名前",
        "common.warning": "警告",
        "common.ok": "OK",
        "feedback.default": "回答を処理中...",
        "feedback.thoughtful": "思慮深い回答です！これは良い洞察を提供します。",
        "feedback.simple": "はい、了解しました。",
        "feedback.generic": "回答を受け付けました。",
        "feedback.error": "即時フィードバックを取得できませんでした。続行します...",
    },
     // Mandarin (zh)
    zh: {
        "nav.title": "LifeSync",
        "nav.home": "首页",
        "nav.guest_assessment": "访客评估",
        "nav.guest_report": "访客报告",
        "nav.features": "功能",
        "nav.about": "关于我们",
        "nav.login": "登录",
        "nav.signup": "注册",
        "hero.title": "同步您的生活，加深您的联系",
        "hero.subtitle": "LifeSync 提供结构化、数据驱动的兼容性洞察，帮助情侣建立更牢固、更透明的关系，自信地处理关键话题。",
        "hero.cta.assessment": "进行访客评估",
        "hero.cta.signup": "注册以获得完整访问权限",
        "hero.card.title": "发现您的兼容性",
        "hero.card.subtitle": "探索价值观、生活方式和财务等关键领域。",
        "hero.card.cta": "开始评估",
        "assessment.title": "访客兼容性评估",
        "assessment.subtitle": "回答几个问题，了解您的兼容性洞察。无需注册！",
        "assessment.loading": "正在加载问题...",
        "assessment.question_counter": "第 {current} 题，共 {total} 题",
        "assessment.loading_input": "正在加载输入...",
        "assessment.next": "下一题",
        "assessment.complete": "完成评估",
        "assessment.error": "加载评估失败。请稍后重试。",
        "assessment.no_questions": "没有可用问题。",
        "assessment.placeholder.text": "在此输入您的答案...",
        "assessment.select_answer": "请选择一个答案。",
        "assessment.unsupported_type": "不支持的问题类型：{type}",
        "assessment.completed": "评估完成！",
        "assessment.ready_to_complete": "您已回答所有问题。",
        "report.title": "您的访客兼容性报告",
        "report.subtitle": "这是您的评估洞察摘要。注册以解锁完整功能并与伴侣分享。",
        "report.loading": "正在加载报告...",
        "report.summary_title": "洞察摘要：",
        "report.summary_placeholder": "您的兼容性摘要将根据您的答案显示在此处...",
        "report.your_answers_title": "您的答案：",
        "report.answers_placeholder": "您的答案将显示在此处...",
        "report.cta_text": "准备好与伴侣一起探索更深层次的兼容性了吗？",
        "report.cta_button": "注册以获得完整访问权限",
        "report.expiry_warning": "您的访客报告是临时的，将在 7 天后过期。",
        "report.error": "生成报告失败或报告已过期。",
        "features.title": "核心功能（即将推出！）",
        "features.subtitle": "LifeSync 为注册情侣提供了一系列强大的功能，以建立更牢固、更透明的关系。",
        "features.tile1.title": "深度评估",
        "features.tile1.desc": "探索财务、价值观、生活方式等方面的兼容性，包括文化相关主题。",
        "features.tile2.title": "兼容性洞察",
        "features.tile2.desc": "查看与伴侣的一致性和差异的详细分析。",
        "features.tile3.title": "安全和隐私",
        "features.tile3.desc": "您的数据受到强大的安全和隐私控制的保护。",
        "features.tile4.title": "促进沟通",
        "features.tile4.desc": "洞察提供了开放和诚实讨论的提示。",
        "features.tile5.title": "追踪您的旅程",
        "features.tile5.desc": "通过持续评估，了解您的兼容性如何随时间演变。",
        "features.tile6.desc": "文化相关",
        "features.tile6.desc": "旨在理解和尊重不同的文化背景，包括南非的细微差别。",
        "about.title": "关于 LifeSync",
        "about.subtitle": "我们的使命是赋予情侣知识和工具，以建立持久、透明的关系。",
        "about.paragraph1": "LifeSync 的创立基于真诚的兼容性超越最初吸引力的信念，旨在为情侣提供一种结构化的方式来探索他们关系的根本方面。我们理解，关于财务、价值观和家庭期望等话题的开放式对话可能具有挑战性，但它们对于坚实的基础至关重要。",
        "about.paragraph2": "我们特别热衷于解决不同社会中存在的独特动态和文化考量，包括南非丰富的文化底蕴。我们的评估旨在敏感、包容和相关，帮助情侣以相互尊重和理解的方式处理这些重要方面。",
        "about.paragraph3": "无论您是刚刚开始还是已经在一起多年，LifeSync 都能提供您所需的洞察，以加深您的联系，并就您的未来共同做出明智的决定。加入我们，踏上这段通往更透明、更充实关系的旅程。",
        "auth.login.title": "登录 LifeSync",
        "auth.signup.title": "创建您的 LifeSync 账户",
        "auth.form.email": "电子邮件",
        "auth.form.password": "密码",
        "auth.login.button": "登录",
        "auth.signup.button": "注册",
        "auth.login.signup_prompt": "没有账户？注册",
        "auth.signup.login_prompt": "已有账户？登录",
        "auth.form.name": "您的姓名",
        "common.warning": "警告",
        "common.ok": "确定",
        "feedback.default": "正在处理您的答案...",
        "feedback.thoughtful": "周到的回答！这给了我们很好的洞察。",
        "feedback.simple": "好的，已记录。",
        "feedback.generic": "答案已收到。",
        "feedback.error": "无法获取即时反馈。正在继续...",
    },
};

/**
 * Translates elements on the page based on the selected language.
 * @param {string} lang - The language code (e.g., 'en', 'xh').
 */
function translatePage(lang) {
    const elementsToTranslate = document.querySelectorAll('[data-translate-key]');
    const currentTranslations = translations[lang] || translations['en']; // Fallback to English

    elementsToTranslate.forEach(el => {
        const key = el.dataset.translateKey;
        let text = currentTranslations[key] || translations['en'][key] || el.textContent; // Fallback to English key or original text

        // Handle placeholders in text (e.g., "Question {current} of {total}")
        if (key === 'assessment.question_counter' && guestQuestions.length > 0) {
             text = text.replace('{current}', currentQuestionIndex + 1).replace('{total}', guestQuestions.length);
        } else if (key === 'assessment.unsupported_type' && el.dataset.unsupportedType) {
             text = text.replace('{type}', el.dataset.unsupportedType);
        }
        // Add more placeholder handling as needed

        // For input placeholders, use the placeholder attribute
        if (el.placeholder && currentTranslations[key]) {
            el.placeholder = currentTranslations[key];
        } else {
             el.textContent = text;
        }
    });
}

/**
 * Helper function to get a translated string for use in JS logic (like alerts).
 * @param {string} key - The translation key.
 * @param {string} defaultText - The default text if translation is not found.
 * @param {object} [placeholders={}] - Optional object with placeholder values.
 * @returns {string} The translated string.
 */
function translate(key, defaultText, placeholders = {}) {
    const selectedLang = languageSwitcher.value;
    const currentTranslations = translations[selectedLang] || translations['en'];
    let text = currentTranslations[key] || translations['en'][key] || defaultText;

    // Replace placeholders
    for (const placeholderKey in placeholders) {
        if (placeholders.hasOwnProperty(placeholderKey)) {
            text = text.replace(`{${placeholderKey}}`, placeholders[placeholderKey]);
        }
    }

    return text;
}


// Add event listener to the language switcher
languageSwitcher.addEventListener('change', (event) => {
    const selectedLang = event.target.value;
    translatePage(selectedLang);
});

// --- Swipe Gesture for Navigation ---
let touchstartX = 0;
let touchendX = 0;

mainContainer.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX;
}, false);

mainContainer.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const sectionsCount = sections.length;

    if (touchendX < touchstartX - swipeThreshold) { // Swiped left
        if (currentSectionIndex < sectionsCount - 1) {
            navigateToSection(currentSectionIndex + 1);
        }
    }
    if (touchendX > touchstartX + swipeThreshold) { // Swiped right
        if (currentSectionIndex > 0) {
            navigateToSection(currentSectionIndex - 1);
        }
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set the width of the main container based on the number of sections
    mainContainer.style.width = `${sections.length * 100}%`;

    // Initial navigation to the home section
    navigateToSection(0);

    // Fetch guest questions when the page loads (or when navigating to the assessment section)
    // For MVP, let's fetch on page load for simplicity, but ideally fetch when the user navigates to the assessment section.
    // fetchGuestQuestions(); // Commented out to avoid immediate API call on load, will trigger on section navigation in MVP

    // Add event listener to fetch questions when the assessment section becomes visible
    // This is a simplified approach; a proper SPA router would handle this better.
    // For this horizontal layout, we'll trigger fetch when navigating to section 1
    navLinks.forEach(link => {
        if (parseInt(link.dataset.section) === 1) { // Section index for Guest Assessment
            link.addEventListener('click', () => {
                if (guestQuestions.length === 0) { // Only fetch if not already fetched
                    fetchGuestQuestions();
                }
            });
        }
    });

    // Handle direct access to report section via URL hash (e.g., #report=some_token)
    // This is a basic example and needs a backend endpoint to validate the token and return data
    if (window.location.hash.startsWith('#report=')) {
        const reportToken = window.location.hash.substring(8);
        // In a real application, you would fetch the report data using this token
        // fetchGuestReportByToken(reportToken); // Need to implement this backend call
        console.log(`Attempting to load report with token: ${reportToken}`);
        // For MVP, we'll just show a placeholder or error if accessed directly via hash
         loadingReport.style.display = 'none';
         reportContent.style.display = 'none';
         reportError.style.display = 'block';
         reportErrorMessage.textContent = translate('report.error', 'Direct report access via token is not fully implemented in this MVP.');
         guestReportNavLink.style.display = 'block'; // Show the report link
         navigateToSection(2); // Navigate to the report section
    }


    // Apply initial translation based on default language or browser setting
    translatePage(languageSwitcher.value);
});

// Example of a placeholder fetchGuestReportByToken function (needs backend implementation)
/*
async function fetchGuestReportByToken(token) {
     loadingReport.style.display = 'block';
     reportContent.style.display = 'none';
     reportError.style.display = 'none';

     try {
         const response = await fetch(`${API_BASE_URL}/api/guest/report/${token}`);
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }
         const reportData = await response.json();
         displayGuestReport(reportData);
     } catch (error) {
         console.error('Error fetching guest report by token:', error);
         loadingReport.style.display = 'none';
         reportContent.style.display = 'none';
         reportError.style.display = 'block';
         reportErrorMessage.textContent = translate('report.error', 'Failed to load report or report expired.');
          guestReportNavLink.style.display = 'block'; // Show the report link
          navigateToSection(2); // Navigate to the report section
     }
}
*/

// Mock Guest Questions data structure (replace with actual API fetch)
// This is just for frontend development/testing before backend is ready
/*
const mockGuestQuestions = [
    {
        id: 'q1',
        text: 'How important is financial stability to you in a relationship?',
        type: 'scale',
        min_value: 1,
        max_value: 5,
        step: 1,
        min_label: 'Not Important',
        max_label: 'Very Important'
    },
    {
        id: 'q2',
        text: 'Describe your ideal weekend.',
        type: 'text'
    },
     {
        id: 'q3',
        text: 'How do you prefer to handle disagreements?',
        type: 'radio',
        options: [
            { text: 'Talk it out calmly', value: 'talk' },
            { text: 'Take some space first', value: 'space' },
            { text: 'Seek external advice', value: 'advice' },
            { text: 'Agree to disagree', value: 'agree' },
        ]
    },
     {
        id: 'q4',
        text: 'What are your views on providing financial support to extended family?',
        type: 'text' // Using text for nuanced cultural questions in MVP
    }
    // Add more mock questions here
];

// To use mock data for testing, uncomment this section and comment out the fetchGuestQuestions call in DOMContentLoaded
// async function fetchGuestQuestions() {
//      loadingQuestions.style.display = 'block';
//      assessmentContent.style.display = 'none';
//      assessmentError.style.display = 'none';
//
//      // Simulate network delay
//      await new Promise(resolve => setTimeout(resolve, 1000));
//
//      guestQuestions = mockGuestQuestions;
//      userAnswers = new Array(guestQuestions.length).fill(null);
//      currentQuestionIndex = 0;
//
//      if (guestQuestions.length > 0) {
//          loadingQuestions.style.display = 'none';
//          assessmentContent.style.display = 'block';
//          renderCurrentQuestion();
//      } else {
//          loadingQuestions.style.display = 'none';
//          assessmentError.style.display = 'block';
//           assessmentError.querySelector('p').textContent = translate('assessment.no_questions', 'No questions available.');
//      }
// }

// Mock handleAssessmentCompletion function (needs backend implementation)
// async function handleAssessmentCompletion() {
//      assessmentContent.style.display = 'none';
//      loadingReport.style.display = 'block';
//      reportContent.style.display = 'none';
//      reportError.style.display = 'none';
//
//      // Simulate sending data and receiving report from backend
//      await new Promise(resolve => setTimeout(resolve, 1500));
//
//      const mockReportData = {
//          summary: translate('report.summary_mock', 'Based on your answers, you show a preference for structure and direct communication in relationships.'),
//          user_answers: userAnswers.map((answer, index) => ({
//              question_id: guestQuestions[index].id,
//              answer: answer.answer // Assuming answer object has an 'answer' property
//          }))
//      };
//
//      displayGuestReport(mockReportData);
// }
*/

