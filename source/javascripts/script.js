// initialize Parse application and id
Parse.initialize("AkroJBS9kpJ8AL2bxcaMyNJrD6TmrKouEHWZrJGU", "jgyzkbCzZQYBJK63wZn9EWflKoxJWoh9BU9Vi5Pw");

window.fbAsyncInit = function() {
	Parse.FacebookUtils.init({
	appId      : '1569324956622321',
	status     : false,
	cookie     : true,
	xfbml      : true,
	version    : 'v2.1'
	});

	// INTERACTING WITH PARSE FACEBOOK SDK
		// Facebook log in function, gives scope permissions to access the user's friends
		function fbLogIn() {
			Parse.FacebookUtils.logIn("user_friends", {
				success: function(user) {
					alert("User logged in through Facebook!");
					getGraphInfo();
					retrieveSavedCourses();
					$('#logIn').hide();
					$('#logOut').show();
			},
				error: function(user, error) {
					alert("User cancelled the Facebook login or did not fully authorize.");
				}
			});
		};

		// Facebook log out function
		function fbLogOut() {
			Parse.User.logOut();
			alert('User logged out');
			location.reload();
		};

		// calls Facebook log in / log out functions (fbLogIn / fbLogOut) on button click
		$('#logIn').on('click', fbLogIn);
		$('#logOut').on('click', fbLogOut);

		// calls Facebook graph API to get current user's friends who are also using romaine
		function getGraphInfo() {
			FB.api(
				"/me/friends?fields=name,picture",
				function(response) {
					if (response && !response.error) {
						$('.container').append("<p>Friends also using this app: </p>")
						for (var i = 0; i < response.data.length; i++) {
							$('.container').append("<p>" + response.data[i].name + "</p><img src='" + response.data[i].picture.data.url + "' />");
						}
					}
				}
			);

			// calls Facebook graph API to get current user's name and picture
			FB.api(
				"/me?fields=id,name,picture",
				function(response) {
					if (response && !response.error) {					
						$('#current-user').append(response.name);
						$('#current-user').append("<p><img src='" + response.picture.data.url + "' /></p>");
						Parse.User.current().set("facebookId", response.id);
						Parse.User.current().set("name", response.name);
						Parse.User.current().set("picture", response.picture.data.url);
						Parse.User.current().save();
					}
				}
			);
		};

	// INTERACTING WITH PARSE BACKEND
		var savedCourse = Parse.Object.extend("Courses");
		var course_query = new Parse.Query(savedCourse);
		course_query.include("user"); // make sure to include _User pointer in query call to Courses
		var coursesCurrentUserIsTaking = [];
		var coursesOtherUsersAreTaking = [];

		// retrieving user's saved classes
		function retrieveSavedCourses() {	

			course_query.find({
				success: function(results) {

					for (var i = 0; i < results.length; i ++) {
						// if the Course object has the current user attached to it (which means the current user saved it)
						if (results[i].attributes.user.id == Parse.User.current().id) {
							$("#myCourses").append("<p id='" + results[i].attributes.linked_course.id + "'>" + results[i].attributes.info + " <span class='entypo-cancel " + results[i].attributes.linked_course.id + "'></p>");
							coursesCurrentUserIsTaking.push(results[i].attributes.linked_course.id);
						} else {
							coursesOtherUsersAreTaking.push(results[i].attributes.linked_course.id);
						}
					};

					for (var i = 0; i < results.length; i ++) {
						// if the Course object does not have the current user attached to it (meaning these are courses other users have added)
						if (results[i].attributes.user.id !== Parse.User.current().id) {
							for (var j = 0; j < coursesCurrentUserIsTaking.length; j++) {
								// if the course that the current user is taking is equal to any of the courses other users are taking
								if (coursesCurrentUserIsTaking[j] == results[i].attributes.linked_course.id) {
									$("#" + coursesCurrentUserIsTaking[j]).append("<div>you're taking this course with: " + results[i].attributes.user.attributes.name + "<img src='" + results[i].attributes.user.attributes.picture + "' /></div>");
								};
							};
						};
					};
				},
				error: function(error) {
					console.log("Error: " + error.code + " " + error.message);
				}
			});
		};

		// create a new subclass and a new instance of it to make a query to the Parse database
		var Course = Parse.Object.extend("TestCatalog");
		var query = new Parse.Query(Course);

		// query all available courses
		query.find({
			success:function(results) {
				for (var i = 0; i < results.length; i++) {

					var object = results[i];

					// create a button for each available course
					$("#courses").append("<li><button type='button' class='courseButtons'>" + "(" + object.id + ") " + object.get("catalog_num") + " Section " + object.get("section") + ":  " + object.get("title") + "</button><div><span class='entypo-right-open-big'></span><ul class='courseDescriptions'><li><b>Subject:</b> " + object.get("subject") + "</li><li><b>Type:</b> " + object.get("component") + "</li><li><b>Instructor:</b> " + object.get("instructor") + "</li><li><b>Location:</b> " + object.get("room") + "</li><li><b>Days:</b> " + object.get("meeting_days") + "</li></ul></div></li>");
				};

				// on click of the course buttons
				$(".courseButtons").on("click", function() {
					// create a new Parse object under class Courses that will show the relationship between current user and the clicked course
					var UserLinkedCourse = Parse.Object.extend("Courses");
					var newUserLinkedCourse = new UserLinkedCourse();

					// retrieve text of button
					var textValue = $(this).text();	
					// search for the Parse-designated id of the course in textValue
					var regex = textValue.match(/\w{10}/)
					
					var myCourse = new Course();
					myCourse.id = regex[0]

					// check if user has logged in, only save classes for logged in users
					if (Parse.User.current() != null) {
						// if user has already saved class, do not add it again
						if (coursesCurrentUserIsTaking.indexOf(myCourse.id) >= 0) {
							alert("This course has already been added to your cart.");
						} else {
							// create relationship between current user and clicked course
							newUserLinkedCourse.set("user", Parse.User.current())
							newUserLinkedCourse.set("info", textValue)
							newUserLinkedCourse.set("linked_course", myCourse)

							newUserLinkedCourse.save(null, {
								success: function(newUserLinkedCourse) {
									alert("Added to cart.");
									// refresh myCourses with new changes
									coursesCurrentUserIsTaking.push(newUserLinkedCourse.attributes.linked_course.id);
									var save = $("#myCourses h1").detach();
									$("#myCourses").empty().append(save);
									coursesCurrentUserIsTaking.length = 0;
									retrieveSavedCourses();
								},
								error: function(newUserLinkedCourse, error) {
									alert("Oops, something went wrong.");
								}
							});
						}
					} else {
						alert('You must be signed in to save classes');
					}
				});	

				// function to show or hide div containing course descriptions
				$(".entypo-right-open-big").click(function(){
					$(this).toggleClass("entypo-right-open-big entypo-down-open-big");
					$(this).next().toggle();
				});
			},
			error: function(error) {
				console.log("The Parse query failed.")
			}
		});

		// function to destroy clicked Courses record if user wants to drop from saved courses		
		$("body").on("click", ".entypo-cancel", function() {
			var idOfCourseToDestroy = $(this).attr("class").split(" ")[1];
			var destroy_query = new Parse.Query(savedCourse);
			destroy_query.equalTo("linked_course", {
				__type: "Pointer",
				className: "TestCatalog",
				objectId: idOfCourseToDestroy
			}).equalTo("user", {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.User.current().id				
			})

			destroy_query.find({
				success: function(results) {
					for (var i = 0; i < results.length; i++){
						results[i].destroy({
							success: function() {
								alert("Course removed.");
								$("#" + idOfCourseToDestroy).remove();
								var i = coursesCurrentUserIsTaking.indexOf(idOfCourseToDestroy);
								if (i != -1) {
									coursesCurrentUserIsTaking.splice(i, 1);
								};
							},
							error: function() {
								console.log("Could not delete course.")
							}
						});
					};
				},
				error: function() {
					console.log("Couldn't find the course to destroy.")
				}
			});
		});

	// if user is already logged in, only show log out button, load their Facebook Graph API info and retrieve their saved courses
	// else only show log in button
	if (Parse.User.current() != null) {
		getGraphInfo();
		retrieveSavedCourses();
		$('#logIn').hide();
		$('#logOut').show();
	} else {
		$('#logIn').show();
		$('#logOut').hide();
	};
};

// Parse/Facebook integration
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// document ready
$(document).ready(function() {
	console.log("current Parse user ID: " + Parse.User.current().id);
});