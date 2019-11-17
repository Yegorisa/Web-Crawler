const button = document.getElementById('myButton');
button.addEventListener('click', function (e) {
  console.log('button was clicked');
  fetch('/clicked', { method: 'POST' })
    .then(function (response) {
      if (response.ok) {
        response.body
        console.log('DATA IS ' + response.body)
        console.log('Click was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function (error) {
      console.log(error);
    });
});