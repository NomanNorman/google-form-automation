// Load the Google Identity Services API
function handleClientLoad() {
    const googleClientId = '312095007922-uhdvlip6mti77t66s3sv1748fifrmu3g.apps.googleusercontent.com'; // Replace with your actual client ID

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
        // Redirect to the form page with the URL passed as a query parameter
        window.location.href = `form.html?formLink=${encodeURIComponent(formUrl)}`; 
    } else {
        alert('Please enter a valid Google Form URL.');
    }
}

// Call the handleClientLoad function when the page loads
window.onload = handleClientLoad;
