function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

async function initClient() {
    gapi.client.init({
        clientId: '312095007922-uhdvlip6mti77t66s3sv1748fifrmu3g.apps.googleusercontent.com', // Replace with your actual client ID
        scope: 'https://www.googleapis.com/auth/userinfo.email',
    }).then(() => {
        const signInButton = document.getElementById('sign-in-button');
        signInButton.onclick = async () => {
            try {
                await gapi.auth2.getAuthInstance().signIn();
                const formUrl = document.getElementById('form-url').value; // Get the form URL input
                if (formUrl) {
                    window.location.href = `form.html?formLink=${encodeURIComponent(formUrl)}`; // Redirect to the form page
                } else {
                    alert('Please enter a valid Google Form URL.');
                }
            } catch (error) {
                console.error('Error signing in:', error);
            }
        };
    }).catch((error) => {
        console.error('Error initializing auth2:', error);
    });
}

handleClientLoad();
