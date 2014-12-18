
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
					bootbox.dialog({
						title: "Logged in!",
						message:"You're now connected."
					});						
					getFbFriends();
					getMyFbInfo();
					retrieveSavedCourses();
					$('#logIn').hide();
					$('.dropdown').show();
					$('#logOut').show();
			},
				error: function(user, error) {
					console.log("You cancelled the Facebook login or did not fully authorize the app.");
				}
			});
		};

		// Facebook log out function
		function fbLogOut() {
			Parse.User.logOut();
			bootbox.dialog({
				title: "Good bye!",
				message:"You've logged out."
			});				
			location.reload();
		};

		// calls Facebook log in / log out functions (fbLogIn / fbLogOut) on button click
		$('#logIn').on('click', fbLogIn);
		$('#logOut').on('click', fbLogOut);

	// FB API CALLS
		// calls Facebook graph API to get current user's friends who are also using romaine
		function getFbFriends() {
			FB.api(
				"/me/friends?fields=name,picture",
				function(response) {
					for (var i = 0; i < response.data.length; i ++) {
						$('.friends-list').append("<p>" + response.data[i].name + "</p><img src='" + response.data[i].picture.data.url + "' />");	
					};
				}
			);
		};

		// calls Facebook graph API to get current user's name and picture
		function getMyFbInfo() {
			FB.api(
				"/me?fields=id,name,picture",
				function(response) {
						$('#current-user').append(response.name);
						$('.clicker').append("<img src='" + response.picture.data.url + "' id='user-pic' />");
						Parse.User.current().set("facebookId", response.id);
						Parse.User.current().set("name", response.name);
						Parse.User.current().set("picture", response.picture.data.url);
						Parse.User.current().save();
						$('.prof-pic').prepend("<img src='" + response.picture.data.url + "' id='user-pic' />");
						loadUserOptions();
				}
			);
		};

		// SERIES OF FB API CALLS THAT PASS OFF DATA FOR LATER USE
			// get FB friends' FB ids
			function getFbFriendsId(callback) {
				FB.api(
					"/me/friends?fields=id",
					function(response) {
						for (var i = 0; i < response.data.length; i ++) {
							callback(response.data[i].id);
						};
					}
				);
			};	

			// get FB friends' profile picture URLs
			function getFbFriendsPic(callback) {
				FB.api(
					"/me/friends?fields=picture",
					function(response) {
						for (var i = 0; i < response.data.length; i ++) {
							callback(response.data[i].picture.data.url);
						};
					}
				);
			};	

	// USER PIC DROPDOWN OPTIONS
		function loadUserOptions() {
			$('#log-out').on('click', fbLogOut);
		};
	
	// INTERACTING WITH PARSE BACKEND
		var savedCourse = Parse.Object.extend("Courses");
		var course_query = new Parse.Query(savedCourse);
		course_query.include("user"); // make sure to include _User pointer in query call to Courses
		var coursesCurrentUserIsTaking = [];
		var coursesOtherUsersAreTaking = [];

		// function to append friends' pictures to each search result
		function showFriends(thisButton, parent) {
			var uniqueClassId = $(thisButton).attr("class").split(" ")[0];

			var buttonCourses = Parse.Object.extend("Courses");
			var buttonCourse_query = new Parse.Query(buttonCourses);

			buttonCourse_query.include("user");
			buttonCourse_query.equalTo("linked_course", {
				__type: "Pointer",
				className: "Catalog",
				objectId: uniqueClassId
			});

			buttonCourse_query.find({
				success: function(results) {

					for (var i = 0; i < results.length; i++) {
						if (results[i].attributes.user.id !== Parse.User.current().id) {
							if ($(parent + " > li > " + thisButton).find("#" + results[i].attributes.user.attributes.facebookId).length == 0) {
								$(parent + " > li > " + thisButton).next(".views").after("<div class='friendsInClass'><img id='" + results[i].attributes.user.attributes.facebookId + "' title='" + results[i].attributes.user.attributes.name + "' src='" + results[i].attributes.user.attributes.picture + "'/></div>");	
							};
						};
					};
				},
				error: function(error) {
					console.log("Error: " + error.code + " " + error.message);
				}
			});
		};	

		// retrieves user's saved classes
		function retrieveSavedCourses() {
			course_query.include("linked_course");	
			course_query.find({
				success: function(results) {
					for (var i = 0; i < results.length; i ++) {
						// if the Course object has the current user attached to it (which means the current user saved it)

						var object = results[i];

						if (object.attributes.user.id == Parse.User.current().id) {

							// create a button for each available course
							$("#myCourses").append("<ul class='list-unstyled'><div class='panel panel-default'><li><span class='entypo-cancel'></span><button type='button' class='" + object.attributes.linked_course.id + " courseButtons " + object.attributes.linked_course.attributes.school + "'>" + object.attributes.linked_course.attributes.subject + " " + object.attributes.linked_course.attributes.catalog_num + " Section " + object.attributes.linked_course.attributes.section + ":  " + object.attributes.linked_course.attributes.title + "</button><span class='views entypo-right-open'></span><ul class='courseDescriptions list-unstyled'><div class='panel-body'><li><b>Subject:</b> " + object.attributes.linked_course.attributes.subject + "</li><li><b>Type:</b> " + object.attributes.linked_course.attributes.component + "</li><li><b>Instructor:</b> " + object.attributes.linked_course.attributes.instructor.name + "</li><li><b>Location:</b> " + object.attributes.linked_course.attributes.room.building_name + "</li><li><b>Days:</b> " + object.attributes.linked_course.attributes.meeting_days + "</li><li><b>Overview:</b> " + object.attributes.linked_course.attributes.overview + "</li></div></div></ul></li>");

							coursesCurrentUserIsTaking.push(object.attributes.linked_course.id);
						} else {
							coursesOtherUsersAreTaking.push(object.attributes.linked_course.id);
						};
					};

					for (var i = 0; i < results.length; i ++) {
						
						var object = results[i];						
						// if the Course object does not have the current user attached to it (meaning these are courses other users have added)
						if (object.attributes.user.id !== Parse.User.current().id) {

							for (var j = 0; j < coursesCurrentUserIsTaking.length; j++) {
								// if the course that the current user is taking is equal to any of the courses other users are taking
								if (coursesCurrentUserIsTaking[j] == object.attributes.linked_course.id) {

									$("." + object.attributes.linked_course.id).next(".views").after("<div class='friendsInClass'><img title='" + object.attributes.user.attributes.name + "' src='" + object.attributes.user.attributes.picture + "'/></div>");	
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

		// search functionality
		$("#search").on("click", function() {
			$("#resultCourses").empty();
			var specificCourse = $("#searchText").val();
			var specificCourseArray = specificCourse.split(" ");

			if (specificCourseArray.length > 1) {
				var courseSubject = specificCourseArray[0].toUpperCase();
				var courseNumber = specificCourseArray[1];
			} else {
				var courseSubject = specificCourse.toUpperCase();
			};

			// create a new subclass and a new instance of it to make a query to the Parse database
			var Course = Parse.Object.extend("Catalog");
			var query = new Parse.Query(Course);

			if (!courseNumber) {
				query.equalTo("subject", courseSubject);			
			} else if (courseNumber) {
				query.equalTo("subject", courseSubject).matches("catalog_num", courseNumber);	
			};

			// query courses
			query.find({
				success:function(results) {
					
					if (results.length == 0) {
						bootbox.dialog({
							title: "Oops!",
							message:"We didn't find that course. Please make sure your subject code is correct."
						});
					} else {					
						for (var i = 0; i < results.length; i++) {

							var object = results[i];

							// create a button for each available course
							$("#resultCourses").append("<li><button type='button' class='" + object.id + " courseButtons " + object.get("school") + "'>" + object.get("subject") + " " + object.get("catalog_num") + " Section " + object.get("section") + ":  " + object.get("title") + "</button><span class='views entypo-right-open'></span><ul class='courseDescriptions list-unstyled'><li><b>Subject:</b> " + object.get("subject") + "</li><li><b>Type:</b> " + object.get("component") + "</li><li><b>Instructor:</b> " + object.attributes.instructor.name + "</li><li><b>Location:</b> " + object.attributes.room.building_name + "</li><li><b>Days:</b> " + object.get("meeting_days") + "</li><li><b>Overview:</b> " + object.attributes.overview + "</li></ul></li>");

							showFriends("." + object.id, "#resultCourses");	
						};
					};

					// on click of the course buttons
					$(".courseButtons").on("click", function() {
						
						// create a new Parse object under class Courses that will show the relationship between current user and the clicked course
						var UserLinkedCourse = Parse.Object.extend("Courses");
						var newUserLinkedCourse = new UserLinkedCourse();

						// retrieve class id from element class
						var uniqueId = $(this).attr("class").split(" ")[0];	
						
						var myCourse = new Course();
						myCourse.id = uniqueId;

						// check if user has logged in, only save classes for logged in users
						if (Parse.User.current() != null) {
							// if user has already saved class, do not add it again
							if (coursesCurrentUserIsTaking.indexOf(myCourse.id) >= 0) {
								bootbox.dialog({
									title: "Oops!",
									message:"This course has already been added to your cart."
								});								
							} else {
								// create relationship between current user and clicked course
								newUserLinkedCourse.set("user", Parse.User.current());
								newUserLinkedCourse.set("linked_course", myCourse);

								newUserLinkedCourse.save(null, {
									success: function(newUserLinkedCourse) {
										bootbox.dialog({
											title: "Added!",
											message:"This course is now in your <a href='courses.html'>Saved Courses</a> page."
										});	
										// refresh myCourses with new changes
										coursesCurrentUserIsTaking.push(newUserLinkedCourse.attributes.linked_course.id);
										$("#myCourses").empty();
										coursesCurrentUserIsTaking.length = 0;
									},
									error: function(error) {
										console.log("Error: " + error.code + " " + error.message);
									}
								});
							}
						} else {
							bootbox.dialog({
								title: "Oops!",
								message:"You must be signed in to save classes and see which of your friends are taking this class."
							});							
						}
					});	
				},
				error: function(error) {
					console.log("Error: " + error.code + " " + error.message);
				}
			});	
		});

		$("#searchText").keyup(function() {
			// if there's nothing in the search bar, clear the result list
			if (!$(this).val()) {
				$("#resultCourses").empty();
			};

			// if user presses 'enter', trigger search button
			if (event.keyCode == 13) {
				$("#search").click();
			}
		});

		$("#clear-subject-results").on("click", function() {
			$("#resultCourses").empty();
			$("#searchText").val('');
		});

		$("#clear-school-results").on("click", function() {
			$("#exploreResultSubjects").empty();
			$("#exploreResultCourses").empty();		
		});

		// function to show all subjects under a school when user chooses a school
		$(".chooseSchool").on("click", function(e) {
			e.preventDefault();
			$(this).toggleClass('selected');
			var schoolCode = $(this).attr("class").split(" ")[0];

			var school = Parse.Object.extend("Catalog");
			var schoolQuery = new Parse.Query(school);

			schoolQuery.equalTo("school", schoolCode)
			schoolQuery.limit(1000);

			// mimics toggle functionality for the subject buttons that are generated on click of a school
			if ($("#exploreResultSubjects").find("." + schoolCode).length) {
				$("#exploreResultSubjects").find("." + schoolCode).closest("li").remove();
				$("#exploreResultCourses").find("." + schoolCode).closest("li").remove();
			} else {			
				schoolQuery.find({
					success: function(results) {
						for (var i = 0; i < results.length; i++){
							
							var subject = results[i].attributes.subject;

							// special case: ampersand throws off jQuery
							if (subject == "TH&DRAMA") {
								if ($("#exploreResultSubjects > li > button.THDRAMA").length == 0) {
									$("#exploreResultSubjects").append("<li><button type='button' class='THDRAMA col-md-2 col-xs-4 exploreButtons " + results[i].attributes.school + "'>" + subject + "</li></ul></li>");

								};

							// special case: JOUR is the name of both the school and a subject under the school
							} else if (subject == "JOUR") {
								if ($("#exploreResultSubjects > li > button.subJOUR").length == 0) {
									$("#exploreResultSubjects").append("<li><button type='button' class='subJOUR col-md-2 col-xs-4 exploreButtons " + results[i].attributes.school + "'>JOUR</li></ul></li>");
								};

							// for everything else
							} else {
								if ($("#exploreResultSubjects > li > button." + subject).length == 0) {
									$("#exploreResultSubjects").append("<li><button type='button' class='" + subject + " col-md-2 col-xs-4 exploreButtons " + results[i].attributes.school + "'>" + subject + "</li></ul></li>");
								};
							};
						};
					}, 
					error: function(error){
						console.log("Error: " + error.code + " " + error.message);
					}
				});

				// special case: Parse can't retrieve more than 1,000 resuts at a time. Because there are more than 1,000 classes under Weinberg, looping through each class to make a button for each unique subject is impossible. Instead, we loop through courses.json to get all unique subject codes, then make a separate Parse query for each. 
				if (schoolCode == "WCAS") {
					var wcasSubjects = [];

					$.getJSON("../courses.json", callbackFuncWithData);

					function callbackFuncWithData(data) {
						for (var i = 0; i < data.length; i++) {
							if (data[i].school == "WCAS") {

								if (wcasSubjects.indexOf(data[i].subject) == -1) {
									wcasSubjects.push(data[i].subject);
								};
							};
						};
					
						for (var j = 0; j < wcasSubjects.length; j++) {
							schoolQuery.equalTo("subject", wcasSubjects[j]);

							schoolQuery.limit(1000);
							schoolQuery.find({
								success: function(results) {
									for (var i = 0; i < results.length; i++){
										
										var subject = results[i].attributes.subject;

										if ($("#exploreResultSubjects > li > button." + subject).length == 0) {
											$("#exploreResultSubjects").append("<li><button type='button' class='" + subject + " col-md-2 col-xs-4 exploreButtons " + results[i].attributes.school + "'>" + subject + "</li></ul></li>");
										};
									};
								}, 
								error: function(error){
									console.log("Error: " + error.code + " " + error.message);
								}
							});
						};			
					};
				};
			};
		});

		// function to show all courses under a clicked subject
		$("body").on("click", ".exploreButtons", function(e) {
			e.preventDefault();
			$(this).toggleClass('selected');	

			var schoolCode = $(this).attr("class").split(" ")[4];
			var subjectCode = $(this).attr("class").split(" ")[0];

			var subject = Parse.Object.extend("Catalog");
			var subjectQuery = new Parse.Query(subject);

			subjectQuery.limit(1000);
			if (subjectCode == "subJOUR") {
				subjectQuery.equalTo("subject", "JOUR");
			} else {
				subjectQuery.equalTo("school", schoolCode).equalTo("subject", subjectCode);
			};

			// mimics toggle functionality for the subject buttons that are generated on click of a school
			if ($("#exploreResultCourses").find("." + subjectCode).length) {
				$("#exploreResultCourses").find("." + subjectCode).closest("li").remove();
			} else {

				subjectQuery.find({
					success: function(results) {
						if (subjectCode == "subJOUR") {
							for (var i = 0; i < results.length; i++) {

								var object = results[i];

								// create a button for each available course
								$("#exploreResultCourses").append("<li><button type='button' class='" + object.id + " courseButtons subJOUR " + object.get("school") + "'>" + object.get("subject") + " " + object.get("catalog_num") + " Section " + object.get("section") + ":  " + object.get("title") + "</button><span class='views entypo-right-open'></span><ul class='courseDescriptions list-unstyled'><li><b>Subject:</b> " + object.get("subject") + "</li><li><b>Type:</b> " + object.get("component") + "</li><li><b>Instructor:</b> " + object.attributes.instructor.name + "</li><li><b>Location:</b> " + object.attributes.room.building_name + "</li><li><b>Days:</b> " + object.get("meeting_days") + "</li><li><b>Overview:</b> " + object.attributes.overview +  "</li></ul></li>");

								showFriends("." + object.id, "#exploreResultCourses");	
							};
						} else {
							for (var i = 0; i < results.length; i++) {

								var object = results[i];

								// create a button for each available course
								$("#exploreResultCourses").append("<li><button type='button' class='" + object.id + " courseButtons " + object.get("subject") + " " + object.get("school") + "'>" + object.get("subject") + " " + object.get("catalog_num") + " Section " + object.get("section") + ":  " + object.get("title") + "</button><span class='views entypo-right-open'></span><ul class='courseDescriptions list-unstyled'><li><b>Subject:</b> " + object.get("subject") + "</li><li><b>Type:</b> " + object.get("component") + "</li><li><b>Instructor:</b> " + object.attributes.instructor.name + "</li><li><b>Location:</b> " + object.attributes.room.building_name + "</li><li><b>Days:</b> " + object.get("meeting_days") + "</li><li><b>Overview:</b> " + object.attributes.overview + "</li></ul></li>");

								showFriends("." + object.id, "#exploreResultCourses");					
							};
						};	
									
					
					},
					error: function(error) {
						console.log("Error: " + error.code + " " + error.message);						
					}
				});

				// on click of the course buttons
				$(".courseButtons").on("click", function() {
					
					// create a new Parse object under class Courses that will show the relationship between current user and the clicked course
					var UserLinkedCourse = Parse.Object.extend("Courses");
					var newUserLinkedCourse = new UserLinkedCourse();

					// retrieve class id from element class
					var uniqueId = $(this).attr("class").split(" ")[0];	
					
					var Course = Parse.Object.extend("Catalog");
					var myCourse = new Course();
					myCourse.id = uniqueId;

					// check if user has logged in, only save classes for logged in users
					if (Parse.User.current() != null) {
						// if user has already saved class, do not add it again
						if (coursesCurrentUserIsTaking.indexOf(myCourse.id) >= 0) {
								bootbox.dialog({
									title: "Oops!",
									message:"This course has already been added to your cart."
								});									
						} else {
							// create relationship between current user and clicked course
							newUserLinkedCourse.set("user", Parse.User.current());
							newUserLinkedCourse.set("linked_course", myCourse);

							newUserLinkedCourse.save(null, {
								success: function(newUserLinkedCourse) {
									bootbox.dialog({
										title: "Added!",
										message:"This course is now in your <a href='courses.html'>Saved Courses</a> page."
									});		
									// refresh myCourses with new changes
									coursesCurrentUserIsTaking.push(newUserLinkedCourse.attributes.linked_course.id);
									$("#myCourses").empty();
									coursesCurrentUserIsTaking.length = 0;
								},
								error: function(error) {
									console.log("Error: " + error.code + " " + error.message);
								}
							});
						}
					} else {
						bootbox.dialog({
							title: "Oops!",
							message:"You must be signed in to save classes and see which of your friends are taking this class."
						});									
					}
				});		
			};
		});	

		// function to destroy clicked Courses record if user wants to drop from saved courses		
		$("body").on("click", ".entypo-cancel", function() {

			var idOfCourseToDestroy = $(this).next().attr("class").split(" ")[0];
			var destroy_query = new Parse.Query(savedCourse);
			destroy_query.equalTo("linked_course", {
				__type: "Pointer",
				className: "Catalog",
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
								bootbox.dialog({
									title: "Removed!",
									message:"This course is no longer your cart."
								});								
								$("." + idOfCourseToDestroy).closest("ul").remove();
								var i = coursesCurrentUserIsTaking.indexOf(idOfCourseToDestroy);
								if (i != -1) {
									coursesCurrentUserIsTaking.splice(i, 1);
								};
							},
							error: function(error) {
								console.log("Error: " + error.code + " " + error.message);
							}
						});
					};
				},
				error: function(error) {
					console.log("Error: " + error.code + " " + error.message);
				}
			});
		});

	// if user is already logged in, only show log out button, load their Facebook Graph API info and retrieve their saved courses
	// else only show log in button
	if (Parse.User.current() != null) {
		getFbFriends();
		getMyFbInfo();
		retrieveSavedCourses();
		$('#logIn').hide();
		$('.dropdown').show();
		$('#logOut').show();
	} else {
		$('.dropdown').hide();
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

$(document).ready(function() {
	// activate auto hiding navbar
	$(".navbar-fixed-top").autoHidingNavbar();

	// toggle course descriptions on any dynamically generate course button
	$("body").on("click", ".views", function(){
		$(this).siblings(".courseDescriptions").toggle();
		$(this).toggleClass("entypo-right-open entypo-down-open");		
	});		
});