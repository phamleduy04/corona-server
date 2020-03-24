javascript: function makeHttpObject() {
    try {
        return new XMLHttpRequest();
    } catch (error) {}
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (error) {}
    try {
        return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (error) {}
    throw new Error("Could not create HTTP request object.");
}
var request = makeHttpObject();
request.open("GET", "https://corona-js.herokuapp.com/global?lang=vn", true);
request.send(null);
request.onreadystatechange = function() {
    if (request.readyState == 4) var data = JSON.parse(request.responseText);
    if (!data) return;
    alert(data.messages[0].text);
};