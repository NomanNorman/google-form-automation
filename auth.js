function start() {
  gapi.load('auth2', function() {
    gapi.auth2.init({
      client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      scope: 'profile email'
    }).then(function(auth2) {
      attachSignin(document.getElementById('signin-button'));
    });
  });
}

function attachSignin(element) {
  gapi.auth2.getAuthInstance().attachClickHandler(element, {},
    function(googleUser) {
      // Handle successful sign-in
      console.log('Signed in as: ' + googleUser.getBasicProfile().getName());
      // Redirect or load form
      window.location.href = 'https://your-github-username.github.io/form';
    }, function(error) {
      console.log(JSON.stringify(error, undefined, 2));
    });
}

// Call start() when the page loads
window.onload = function() {
  start();
};
