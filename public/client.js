const button = document.getElementById('myButton');
button.addEventListener('click', function (e) {
    console.log('button was clicked');
    document.getElementById("myTable").innerHTML = "";
    document.getElementById("myTable2").innerHTML = "";
    const button = document.getElementById("myButton");
    button.disabled = true;
    fetch('/clicked', {method: 'GET'})
        .then(async function (response) {
            button.disabled = false;
            if (response.ok) {
                const responseJson = await response.json();
                console.log('DATA IS ' + JSON.stringify(responseJson));
                console.log('Click was recorded');
                responseJson.oldProfiles.forEach(profile => addRow(profile, "myTable"));
                responseJson.newProfiles.forEach(profile => addRow(profile, "myTable2"));
                return;
            }
            throw new Error('Request failed.');
        })
        .catch(function (error) {
            button.disabled = false;
            console.log(error);
        });
});

function addRow(obj, tableName) {
    var table = document.getElementById(tableName);
    var row = table.insertRow(0);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.innerHTML = obj.name;
    cell2.innerHTML = obj.email;
}
