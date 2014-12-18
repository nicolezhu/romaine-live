$.getJSON("../subjects.json", callbackFuncWithData);

function callbackFuncWithData(data) {
	console.log(data)
	for (var i = 0; i < data.length; i++) {
		$(".table-striped").append("<tr><td class='subject-name'>" + data[i].symbol + "</td><td>" + data[i].name + "</td></tr>")

	}

}