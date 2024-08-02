<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website Title</title>
    <script src="https://apis.google.com/js/api.js"></script>
    <script>
        function onLoad() {
            console.log('Loading auth2 library...');
            gapi.load('auth2', function() {
                console.log('Initializing auth2...');
                gapi.auth2.init({
                    client_id: '312095007922-uhdvlip6mti77t66s3sv1748fifrmu3g.apps.googleusercontent.com'
                }).then(function () {
                    console.log('auth2 initialized successfully');
                }).catch(function (error) {
                    console.error('Error initializing auth2:', error);
                });
            });
        }

        function handleSignInClick() {
            console.log('Sign in button clicked');
            const auth2 = gapi.auth2.getAuthInstance();
            auth2.signIn().then(function(user) {
                console.log('User signed in:', user);
                document.getElementById('form-section').style.display = 'block';
            }).catch(function(error) {
                console.error('Error signing in:', error);
            });
        }

        function handleFormSubmit(event) {
            event.preventDefault();
            const formLink = document.getElementById('form-link').value;
            console.log('Form link submitted:', formLink);
            // Redirect to your GitHub Pages website with the form link as a parameter
            const redirectUrl = `https://nomannorman.github.io/google-form-automation/?formLink=${encodeURIComponent(formLink)}`;
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        }
    </script>
    <style>
        #form-section {
            display: none;
        }
    </style>
</head>
<body onload="onLoad()">
    <h1>Welcome to Your Website</h1>
    <button id="sign-in-button" onclick="handleSignInClick()">Sign in with Google</button>
    <div id="form-section">
        <h2>Paste Google Form Link</h2>
        <form onsubmit="handleFormSubmit(event)">
            <input type="text" id="form-link" placeholder="Enter Google Form link" required>
            <button type="submit">Submit</button>
        </form>
    </div>
</body>
</html>
