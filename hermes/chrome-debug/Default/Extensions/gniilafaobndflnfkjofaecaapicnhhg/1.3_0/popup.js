let formulaHistory = JSON.parse(localStorage.getItem('formulaHistory')) || [];
let formulaType = localStorage.getItem('selectedFormulaType') || 'Google Sheets';



let uid = null;
let userEmail = null;
chrome.storage.local.get(['uid', 'userEmail'], function (result) {
    uid = result.uid;
    userEmail = result.userEmail;
    console.log(userEmail);

    if (userEmail != null) {
        document.getElementById("emailText").textContent = "Signed in as " + userEmail;
    }
    // Use uid and userEmail within this callback or call other functions from here

});


function login(){
    window.open('https://www.sheets-gpt.com/sign-in/', '_blank');
}

const creditNum = document.getElementById("creditNum");

function checkSignIn() {
    chrome.storage.local.get(['uid'], function (result) {
        const contentDiv = document.getElementById('content'); // Assuming the main content has an id="content"
        const loginDiv = document.getElementById("loginSection");
        // Check if the 'uid' is not stored
        if (result.uid === undefined) {
            // 'uid' is not stored, indicating the user might not have logged in or used the extension.
            console.log('UID not found. Hiding main content until user logs in or sets up their account.');
            if (contentDiv) {
                contentDiv.style.display = 'none';
            }
            if(loginDiv){loginDiv.style.display = 'flex';}
            creditNum.style.display = "none";
        } else {
            // UID found, indicating the user has previously logged in on this device.
            console.log('Welcome back, UID found. Showing main content.');
            if (contentDiv) contentDiv.style.display = 'flex';
            if(loginDiv){loginDiv.style.display = 'none';}
        }
    });
}



const creditResetMessage = document.getElementById("creditResetMessage")
const upgradeBtn = document.getElementById("upgradeBtn");
function fetchAndStoreSubscriptionType(retryCount = 0) {
    const maxRetries = 2; // Maximum number of retries

    chrome.storage.local.get(['uid'], function (result) {
        if (result.uid) {
            // UID is available, proceed to fetch subscription type
            chrome.runtime.sendMessage({ action: "getSubscriptionType" }, function (response) {
                if (response.subscriptionType) {
                    console.log("Subscription Type:", response.subscriptionType);
                    // Adjust visibility based on subscription type
                    if (response.subscriptionType == "free") {
                        creditNum.style.display = "block";
                        upgradeBtn.style.display = "block";
                    }
                    else {
                        creditNum.style.display = "none";
                        upgradeBtn.style.display = "none";
                    }
                    // Store the subscription type for later use
                    chrome.storage.local.set({ 'subscriptionType': response.subscriptionType }, function () {
                        console.log('Subscription type stored.');
                    });
                } else if (response.error) {
                    console.error('Error fetching subscription type:', response.error);
                    // Here, you could set a default or retry based on the error type
                    // For this scenario, we're focusing on UID not found errors
                }
            });
        } else {
            if (retryCount < maxRetries) {
                console.log(`UID not found, retrying... Attempt ${retryCount + 1}/${maxRetries}`);
                setTimeout(() => fetchAndStoreSubscriptionType(retryCount + 1), 20000); // Retry after 5 seconds
            } else {
                // Max retries reached, apply a fallback action
                console.log('Maximum retry attempts reached. Applying default settings.');
                // Optionally set a default subscription type until the actual type can be fetched
                chrome.storage.local.set({ 'subscriptionType': 'free' }, function () {
                    console.log('Default subscription type set temporarily.');
                    creditNum.style.display = "block"; // Default action for free subscription
                    upgradeBtn.style.display = "block";
                });
            }
        }
    });
}

// Call the function with the initial retry count set to 0
document.addEventListener('DOMContentLoaded', () => fetchAndStoreSubscriptionType(0));




//Credits stack so if you wait a month and only use 2 credits you can have 5 the next

//TODO: Changed
function initializeOrResetCredits() {
    chrome.storage.sync.get(['firstOpenTimestamp', 'userCredits'], function (result) {
        const now = new Date();

        if (result.firstOpenTimestamp) {
            // User has opened the extension before; find the next reset date based on the firstOpenTimestamp
            let firstOpenDate = new Date(result.firstOpenTimestamp);
            let nextResetDate = new Date(firstOpenDate);
            //TODO:
            nextResetDate.setMonth(firstOpenDate.getMonth() + 1); // Initial next reset date, one month from firstOpenTimestamp
            // Loop to adjust the nextResetDate if it's still before the current date
            // This loop accounts for the scenario where multiple months have passed since the first open date
            // while (now >= nextResetDate) {
            //     //nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            //     nextResetDate.setMinutes(nextResetDate.getMinutes() + 1);
            // }

            // If nextResetDate calculated from the loop is after the current date, but the one-month-ago date was before now,
            // It means we've crossed the reset threshold and need to reset the credits.
            ////const oneMonthAgoFromNextReset = new Date(nextResetDate);
            //oneMonthAgoFromNextReset.setMonth(oneMonthAgoFromNextReset.getMonth() - 1);
            ////oneMonthAgoFromNextReset.setMinutes(oneMonthAgoFromNextReset.getMinutes() - 1);
            ////if (oneMonthAgoFromNextReset <= now) {
                ////console.log('Reset period has passed. Resetting credits.');
                ////resetCredits();
            ////} else {
                ////console.log('Reset period not yet reached.');
            ////}
            if (now >= nextResetDate) {
                console.log('Reset period has passed. Resetting credits.');
                resetCredits(now); // Pass the current date to resetCredits
            } else {
                console.log('Reset period not yet reached.');
            }
        } else {
            // User's first login; initialize everything
            console.log('First-time login detected.');
            chrome.storage.sync.set({ 'firstOpenTimestamp': now.getTime() }, function () {
                console.log('firstOpenTimestamp set.');
            });
            resetCredits(now); // This initializes userCredits and sets up everything for the first time
        }
    });
}




// Function to reset credits and update the last reset timestamp
function resetCredits(currentTime) {
    const creditsToSet = 3; // Set this to the number of credits you want to initialize

    chrome.storage.sync.set({
        'userCredits': creditsToSet,
        'firstOpenTimestamp': currentTime.getTime() // Update the firstOpenTimestamp to current time
    }, function () {
        console.log(`Credits reset to ${creditsToSet}.`);
        updateCreditDisplay(); // Make sure this function refreshes the credit display in the UI
        checkCreditsAndAdjustInput(); // Re-enable the input field if necessary
    });
}

function updateCreditDisplay() {
    chrome.storage.sync.get(['userCredits'], function (result) {
        let credits = result.userCredits;
        if (credits > 3) {
            credits = 0;
        }
        creditNum.textContent = "Credits: " + credits; 
    });
}


function checkFirstTimeUseSync() {
    chrome.storage.sync.get(['firstTimeUseSync'], function (result) {
        if (result.firstTimeUseSync === undefined) {
            // This indicates the user has not used the extension before across any synced device.
            console.log('First time using the extension across synced devices.');

            // Perform any first-time initialization here.
            // This might include setting default settings or initializing synced data.
            initializeOrResetCredits();


            // Set the flag to false, indicating that the user has now used the extension.
            chrome.storage.sync.set({ 'firstTimeUseSync': false }, function () {
                console.log('The first-time use flag has been set in sync storage.');
            });

            // Optionally, perform other actions for first-time users.
            // This could include showing a welcome message or providing a tutorial.
        } else {
            // The user has already used the extension before on a synced device.
            console.log('Welcome back! Recognized across synced devices.');
            // Perform any actions needed for returning users.
        }
    });
}

// Call this function when the extension is loaded or initialized.
checkFirstTimeUseSync();







function updateHistoryContainer() {
    // Get the history container div by its ID
    const historyContainer = document.getElementById('history_container');

    // Ensure the container is empty before adding new content
    historyContainer.innerHTML = '<hr style="margin-bottom: 10px;><p style="margin-top: 0px;">History:</p>';

    // Iterate over the formulaHistory array
    formulaHistory.forEach((historyItem, index) => {
        // Create a new div element for each history item
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item'; // Add a class for styling (optional)
        itemDiv.textContent = `${historyItem}`;

        //add copy icon
        const itemSpan = document.createElement('span');
        itemSpan.className = 'material-symbols-outlined';
        itemSpan.style.fontSize = '14px';
        itemSpan.style.marginLeft = '3px';
        itemSpan.textContent = 'content_copy'; // Set the text content to the name of the material icon

        itemDiv.appendChild(itemSpan);

        // Attach click event listener to each history item
        itemDiv.addEventListener('click', function () {
            // Copy text content to clipboard
            navigator.clipboard.writeText(historyItem).then(function () {
                console.log('Text copied to clipboard');
            }).catch(function (err) {
                console.error('Error in copying text: ', err);
            });

            // Change the icon from 'content_copy' to 'check'
            itemSpan.textContent = 'check';

            // Change the icon back to 'content_copy' after 1 second
            setTimeout(function () {
                itemSpan.textContent = 'content_copy';
            }, 600);
        });

        // Append the new div to the history container
        historyContainer.appendChild(itemDiv);
    });
    const itemBreak = document.createElement("hr");
    itemBreak.style.marginTop = "15px";
    historyContainer.appendChild(itemBreak);
}

// Define an array to store chat messages
let jarvisMessages = [
    {
        "role": "system",
        "content": "You are SheetsGPT, a helpful bot that only returns" + formulaType + "formulas. Only say the formula, nothing else"
    }];

async function callChatGPT(msg) {
    // Ensure the jarvisMessages array contains at most 5 messages
    if (jarvisMessages.length > 5) {
        jarvisMessages.shift(); // Remove the oldest message to keep the array size within limits
    }

    // Append user message to the jarvisMessages array
    jarvisMessages.push({ role: "user", content: msg });

    // Prepare the request payload
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Remove the Authorization header since the API key should be handled by your proxy server
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: jarvisMessages
        })
    };

    try {
        // Update the fetch URL to point to your proxy server
        const response = await fetch('https://lit-plateau-37817-170e49ac4c7d.herokuapp.com/chatgpt-proxy', requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const completion = await response.json();

        // Get the chat response from the API response
        const chatResponse = completion.choices[0].message.content;
        console.log(chatResponse);


        return chatResponse;
    } catch (error) {
        console.error('There was a problem with the proxy server:', error);
        return null;
    }
}

var outerOutput = document.getElementById('outer_output');



document.getElementById('submitBtn').addEventListener('click', async () => {


    // Retrieve the stored subscription type
    chrome.storage.local.get(['subscriptionType'], function (result) {
        const subscriptionType = result.subscriptionType;

        if (subscriptionType) {
            console.log("Using stored Subscription Type:", subscriptionType);

            if (subscriptionType == "monthly" || subscriptionType == "yearly") {
                // Logic for subscribed users, e.g., don't decrement credits
                creditNum.style.display = "none";
            } else {
                // Logic for non-subscribed users, e.g., decrement credit
                chrome.storage.sync.get(['userCredits'], function (result) {
                    let currentCredits = result.userCredits;
                    if (currentCredits > 0) {
                        chrome.storage.sync.set({ 'userCredits': currentCredits - 1 }, function () {
                            console.log('Credit decremented');
                            updateCreditDisplay(); // Refresh the displayed credits
                            checkCreditsAndAdjustInput();
                        });
                    } else {
                        console.log('No credits left');
                        alert("You have no more credits, please wait for them to reset or purchase more at sheets-gpt.com/pricing");
                        // Optionally, disable the button or notify the user
                    }
                });
            }
        } else {
            console.error("No subscription type stored.");
            // Handle the case where subscription type isn't available
        }
    });




    const userInput = document.getElementById('textInput').textContent;
    document.getElementById('textInput').textContent = "";
    outerOutput.setAttribute('style', 'display: flex;');
    try {
        var aiResponse = await callChatGPT(userInput);
        document.getElementById('ai_response').textContent = `${aiResponse}`;
        document.getElementById('response').textContent = `${userInput}`;
        if (formulaHistory.length >= 3) {
            formulaHistory.shift()
        }
        formulaHistory.push(aiResponse);
        localStorage.setItem('formulaHistory', JSON.stringify(formulaHistory));
        updateHistoryContainer();
    } catch (error) {
        console.error('Error calling ChatGPT:', error);
        // Handle error
    }
});

//use history button to toggle showing the history
document.getElementById('history_btn').addEventListener('click', async () => {
    updateHistoryContainer();
    var div = document.getElementById('history_container');
    // Toggle the div visibility
    if (div.style.display === 'none') {
        div.style.display = 'block'; // Show the div
    } else {
        div.style.display = 'none'; // Hide the div
    }
})

document.addEventListener('DOMContentLoaded', function () {

    checkSignIn();
    updateCreditDisplay();
    checkCreditsAndAdjustInput();

    const loginButton = document.getElementById('loginBtn');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    
    // Get the div element
    var outputDiv = document.getElementById('output');

    var historyDiv = document.getElementById('history_container');
    historyDiv.style.display = 'none';

    //Initialize radio buttons
    let forumulaType = localStorage.getItem('selectedFormulaType') || 'Google Sheets';
    if (formulaType === 'Google Sheets') {
        document.getElementById('gsheets').checked = true;
    } else if (formulaType === 'Excel') {
        document.getElementById('excel').checked = true;
    }

    document.getElementById('gsheets').addEventListener('change', handleRadioSelection);
    document.getElementById('excel').addEventListener('change', handleRadioSelection);

    // Add click event listener to the div
    outputDiv.addEventListener('click', function () {
        // Get the text from the p element
        var textToCopy = document.getElementById('ai_response').innerText;

        // Use the Clipboard API to copy the text
        navigator.clipboard.writeText(textToCopy).then(function () {
            console.log('Text copied to clipboard');
        }).catch(function (err) {
            console.error('Error in copying text: ', err);
        });
    });

    initializeOrResetCredits(); // Ensure credits are initialized or reset

});


function handleRadioSelection(event) {
    // Check which radio button was selected and adjust behavior accordingly
    if (event.target.id === 'gsheets') {
        console.log('Google Sheets selected');
        formulaType = 'Google Sheets';
    }
    else if (event.target.id === 'excel') {
        console.log('Excel selected');
        formulaType = 'Excel'
    }

    localStorage.setItem('selectedFormulaType', formulaType);
}

// Get references to the clipboard and check icons
var copyContainer = document.getElementById('copy_container');
var clipboardIcon = document.getElementById('clipboardIcon');
var checkIcon = document.getElementById('checkIcon');


// Add a click event listener to the clipboard icon
copyContainer.addEventListener('click', function () {
    var outputDiv = document.getElementById('output');

    var textToCopy = document.getElementById('ai_response').innerText;

    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(textToCopy).then(function () {
        console.log('Text copied to clipboard');
    }).catch(function (err) {
        console.error('Error in copying text: ', err);
    });
    // Toggle visibility of the icons
    clipboardIcon.style.display = 'none';
    checkIcon.style.display = 'inline';

    // Simulate copying to clipboard (replace this with your actual copying logic)
    setTimeout(function () {
        // Reset the icons after a brief delay (in this example, after 1 second)
        clipboardIcon.style.display = 'inline';
        checkIcon.style.display = 'none';
    }, 1000); // 1000 milliseconds = 1 second
});


function updateTimeUntilReset() {
    //TODO: fix back
    chrome.storage.sync.get(['firstOpenTimestamp'], function (result) {
        if (result.firstOpenTimestamp) {
            const firstOpenTimestamp = result.firstOpenTimestamp;
            const now = new Date();
            const firstOpenDate = new Date(firstOpenTimestamp);
            //const nextResetDate = new Date(firstOpenDate.setMonth(firstOpenDate.getMonth() + 1));
            const nextResetDate = new Date(firstOpenDate);
            nextResetDate.setMonth(firstOpenDate.getMonth() + 1); // Temporary reset interval for testing


            const timeUntilReset = document.getElementById('timeUntilReset');
            if (now.getTime() > nextResetDate.getTime()) { // It's been more than a month
                // Update the reset message to indicate credits have been reset
                timeUntilReset.textContent = "Credits have been reset.";
                resetCredits(now); 
            } else {
                // Calculate difference
                const diff = nextResetDate - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                timeUntilReset.textContent = `${days} days and ${hours} hours`;
                ////const seconds = Math.floor(diff / 1000);
                ////timeUntilReset.textContent = `${seconds} seconds until credits reset`;
            }
        }
    });
}



function checkCreditsAndAdjustInput() {
    chrome.storage.local.get(['subscriptionType'], function (subscriptionResult) {
        // Only proceed if the user is on a free plan
        if (subscriptionResult.subscriptionType === 'free') {
            chrome.storage.sync.get(['userCredits'], function (creditResult) {
                let credits = creditResult.userCredits;
                const inputField = document.getElementById('textInput');
                const submitButton = document.getElementById('submitBtn');
                const creditResetMessage = document.getElementById('creditResetMessage');
                const timeUntilReset = document.getElementById('timeUntilReset');

                if (credits <= 0) {
                    if (inputField) {
                        inputField.setAttribute('contenteditable', 'false');
                        inputField.style.opacity = '0.5';
                        inputField.style.pointerEvents = 'none';
                    }
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.style.opacity = '0.5';
                        submitButton.style.pointerEvents = 'none';
                    }
                    console.log('Input disabled due to insufficient credits.');
                    document.getElementById('creditResetMessage').style.display = 'block'; // Show reset message
                    updateTimeUntilReset(); // This function updates the time until credits reset

                } else {
                    if (inputField) {
                        inputField.setAttribute('contenteditable', 'true');
                        inputField.style.opacity = '1';
                        inputField.style.pointerEvents = 'auto';
                    }
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.style.opacity = '1';
                        submitButton.style.pointerEvents = 'auto';
                    }
                    creditResetMessage.style.display = 'none'; // Hide the reset message
                }
            });
        } else {
            // If the user is not on a free plan, make sure everything is enabled and hide the credit message.
            const inputField = document.getElementById('textInput');
            const submitButton = document.getElementById('submitBtn');
            if (inputField) {
                inputField.setAttribute('contenteditable', 'true');
                inputField.style.opacity = '1';
                inputField.style.pointerEvents = 'auto';
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.style.opacity = '1';
                submitButton.style.pointerEvents = 'auto';
            }
            document.getElementById('creditResetMessage').style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const signOutElement = document.getElementById('signOutBtn');
    if (signOutElement) {
        signOutElement.addEventListener('click', function() {
            // Clear chrome.storage.local
            chrome.storage.local.clear(() => {
                // Check for errors
                if (chrome.runtime.lastError) {
                    console.log(`Error clearing storage: ${chrome.runtime.lastError}`);
                } else {
                    console.log('Local storage cleared successfully.');
                    
                    // Redirect to the login page. For an extension, you might simply change the displayed section
                    // or use window.location.href if you have a specific HTML file for login.
                    // This example assumes you want to show a different part of your popup:
                    document.getElementById('content').style.display = 'none'; // Hide main content
                    document.getElementById('loginSection').style.display = 'flex'; // Show login section
                }
            });
            
            // Optionally, reset specific variables instead of clearing everything
            // chrome.storage.local.remove('yourSpecificVariable', function() { ... });
        });
    }

    const privacyPolicyBtn = document.getElementById("privacyPolicyBtn");
    if(privacyPolicyBtn){
        privacyPolicyBtn.addEventListener('click', function(){
            window.open('https://sheets-gpt.com/privacy-policy/', '_blank');
        })
    }

    const termsBtn = document.getElementById("termsBtn");
    if(termsBtn){
        termsBtn.addEventListener('click', function(){
            window.open('https://sheets-gpt.com/terms-of-use/', '_blank');
        })
    }

    const upgradeBtn = document.getElementById("upgradeBtn");
    if(upgradeBtn){
        upgradeBtn.addEventListener('click', function(){
            window.open('https://sheets-gpt.com/pricing/', '_blank');
        })
    }
});