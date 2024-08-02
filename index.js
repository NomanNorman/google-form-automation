<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website Title</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script>
        let tokenClient;
        let gapiInited = false;
        let gisInited = false;

        const CLIENT_ID = '312095007922-uhdvlip6mti77t66s3sv1748fifrmu3g.apps.googleusercontent.com';
        const SCOPES = 'https://www.googleapis.com/auth/userinfo.email';

        function gapiLoaded() {
            gapi.load('client', initializeGapiClient);
        }

        async function initializeGapiClient() {
            await gapi.client.init({
                apiKey: 'YOUR_API_KEY',
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            gapiInited = true;
            maybeEnableButtons();
        }

        function gisLoaded() {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined later
            });
            gisInited = true;
            maybeEnableButtons();
        }

        function maybeEnableButtons() {
            if (gapiInited && gisInited) {
                document.getElementById('sign-in-button').style.display = 'block';
            }
        }

        function handleSignInClick() {
            tokenClient.callback = (resp) => {
                if (resp.error !== undefined) {
                    console.log('Error signing in:', resp.error);
                    return;
                }
                console.log('Sign-in successful');
                document.getElementById('form-section').style.display = 'block';
            };

            if (gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        }

        function handleFormSubmit(event) {
            event.preventDefault();
            const formLink = document.getElementById('form-link').value;
            console.log('Form link submitted:', formLink);
            // Redirect to Google Form and pass the link as a query parameter
            window.location.href = `form.html?formLink=${encodeURIComponent(formLink)}`;
        }

        document.addEventListener('DOMContentLoaded', () => {
            gapiLoaded();
            gisLoaded();
        });
    </script>
    <style>
        #form-section {
            display: none;
        }
    </style>
</head>
<body>
    <h1>Welcome to Your Website</h1>
    <button id="sign-in-button" onclick="handleSignInClick()" style="display:none">Sign in with Google</button>
    <div id="form-section">
        <form onsubmit="handleFormSubmit(event)">
            <label for="form-link">Google Form Link:</label>
            <input type="url" id="form-link" required>
            <button type="submit">Submit</button>
        </form>
    </div>
    <script src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
    <script src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>
</body>
</html>
