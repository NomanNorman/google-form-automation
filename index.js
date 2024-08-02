// Load the Google Identity Services API
function handleClientLoad() {
    const googleClientId = 'YOUR_CLIENT_ID'; // Replace with your actual client ID

    window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
    });

    // Render the sign-in button
    window.google.accounts.id.renderButton(
        document.getElementById("sign-in-button"),
        { theme: "outline", size: "large" }  // Customize the button as desired
    );
}

// This function handles the response from the Google Sign-In
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    
    const formUrl = document.getElementById('form-url').value; // Get the form URL input
    if (formUrl) {
        window.location.href = `form.html?formLink=${encodeURIComponent(formUrl)}`; // Redirect to the form page
    } else {
        alert('Please enter a valid Google Form URL.');
    }
}

// Call the handleClientLoad function when the page loads
window.onload = handleClientLoad;
