window.addEventListener("message", function(event) {
    // Only accept messages from the same frame
    if (event.source !== window) return;

    // Example of checking the message for something specific:
    if (event.data.type && (event.data.type === "FROM_PAGE")) {
        console.log("Content script received:", event.data.userEmail);
        console.log("Content script received:", event.data.uid);

        // Now send the message to the background script
        chrome.runtime.sendMessage({greeting: "hello", userEmail: event.data.userEmail, uid: event.data.uid}, function(response) {
            //console.log(response.farewell);
            console.log(response.output);
        });
    }
});
