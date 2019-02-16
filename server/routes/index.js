const express = require('express');
const request = require('request');
const db = require('../config/database_conn');

const router = express.Router();
var sess;
var USER_ID, USER_NAME;

var eventDetails = [];

module.exports = () => {
    router.get('/',(req,res,next) => {
       
        
        sess = req.session;
        if (!sess.sessId) {
            return res.render('registration', {
                page: 'Registration',
                flag: 0
            });


        } else {
            var userId = sess.sessId;
            console.log("Inside Route 1");
            var userFullName = "";
            var sql = "SELECT fullname from users where uid='"+userId+"'";
            db.query(sql, (err, result) => {
                if (result.length > 0) {
                    userFullName = result[0].fullname;
                    USER_ID = userId;
                    USER_NAME = userFullName;

                    res.redirect('/home');
                } else {
                    return next();
                }
            });

        }
    });

    router.post('/register',(req,res,next) => {
        const username = req.body.username;
        const password = req.body.password;
        const fullName = req.body.fullname;

        // Save to Database and redirect to login
        const sql = "INSERT INTO users (fullname,password,uname) VALUES('"+fullName+"','"+ password + "','" + username + "')";
        db.query(sql,(err,result) => {
            if (err){
                successfulRegistration = false;
                console.log(err);
                return res.render('registration', {
                    page: 'Registration',
                    flag: 1
                });
            }else{
                return res.render('registration', {
                    page: 'Registration',
                    flag: 2
                });
            }
        });
    });
    
    router.post('/login',(req,res,next) => {
        const userName = req.body.userName;
        const password = req.body.password;
        
        db.query("SELECT * FROM users where uname = '"+ userName +"' and password='" + password + "'",
            (err, result) => {
                console.log(result);
                if (err){
                    return res.send(err);
                }
                if (result.length == 0) {
                    res.render('registration', {
                        page: 'Registration',
                        flag: 3
                    })
                } else {


                    sess = req.session;
                    sess.sessId = result[0].uid;
                    USER_ID = result[0].uid;
                    USER_NAME = result[0].fullname;
                    res.redirect('/home');
                }



            });
    });

    router.post('/logout', (req, res, next) => {
        console.log("inside logout");
        req.session.destroy((err) => {
            if (err) {
                console.log("Error");
            } else {
                // return res.render('registration',{
                //     page:'Registration',
                //     flag:0
                // });
                console.log("Completing Logout");
                res.redirect('/');
            }
        });
    });

    router.get('/home', async (req,res,next) => {
        var courseResults = [];
        var enrolledCourseIds = [];
        var enrolledCoursesDict = [];

        db.query("SELECT courseid from courses where uid='"+ USER_ID +"'",
          (err,result) => {
            if (result.length > 0){
               for (var i = 0; i < result.length; i++){
                   enrolledCourseIds.push(result[i].courseid);
                  // console.log(enrolledCourseIds[i]);
               }
            }
          });

       request({
            url: 'https://sandbox.api.it.nyu.edu/course-catalog-exp/courses',
            headers: {
               'Authorization': 'Bearer 1951dab0-c1d9-3e09-b65c-e4b75ca2d33b'
            },
            rejectUnauthorized: false
          }, function(err, result) {
                if(err) {
                  console.error(err);
                } else {
                  // console.log(res.body);
                  var results = JSON.parse(result.body);
                  // console.log(results)
                  var i;
                  // console.log(results.length)
                  
                  for (i = 0; i < results.length; i++) {

                   // console.log(results[i].course_id+"-"+results[i].course_title);
                    courseResults.push({
                        'courseId': results[i].course_id,
                        'courseName': results[i].course_title
                    });
                    
                  }

                  for (var j = 0; j < enrolledCourseIds.length; j++){
                      if (courseResults.some(e => e.courseId == enrolledCourseIds[j])){
                          enrolledCoursesDict.push({
                            'enrolledCourseId': enrolledCourseIds[j],
                            'enrolledCourseName':courseResults[j]['courseName']
                          });
                      }
                  }
                 // console.log(courseResults[0]['courseId']);
                }
                
                return res.render('home',{
                    id:USER_ID,
                    name:USER_NAME,
                    courseResults: courseResults,
                    enrolledCourses: enrolledCoursesDict,
                    eventDetails: eventDetails
                });
          });
          
        
    });
    
    router.post('/home/getevents',(req,res,next) => {
       var startDate = req.body.startDate;
       var startDateNew = new Date(startDate);
       
       startDate = startDateNew.getFullYear() + "-" + (startDateNew.getMonth() + 1)+ "-" + startDateNew.getDate();
       //console.log(startDate);


       const request = require('request');
      
       var startTime="",endTime="";
       
request({
  url: 'https://sandbox.api.it.nyu.edu/engage-exp/events?start_date=2019-02-20&end_date=2019-02-21&keywords=',
  headers: {
     'Authorization': 'Bearer 1951dab0-c1d9-3e09-b65c-e4b75ca2d33b'
  },
  rejectUnauthorized: false
}, function(err, result) {
      if(err) {
        console.error(err);
      } else {
        // console.log(res.body);
        var results = JSON.parse(result.body);
        var i;
        for (i = 0; i < results.length; i++) {
         
         if (results[i].description.trim().length > 0){ 
           
          if(results[i].occurrences[0].is_all_day == true){

         
            startTime = "00:00:00";
           
            endTime = "11:59:00";
          }
          else{
            
            startTime = results[i].occurrences[0].starts_at.split("T")[1].split("Z")[0];
            endTime = results[i].occurrences[0].ends_at.split("T")[1].split("Z")[0];
          }
          eventDetails.push({
            "eventName":results[i].name,
            "eventDescription":results[i].description,
            "eventLocation":results[i].location,
            "eventStartTime":startTime,
            "eventEndTime":endTime
          });
        }
        
        }
      }

      res.redirect('/home');

});

       
    });

    router.post('/home',(req,res,next) => {
        courseId = req.body.courseId;
        startTime = req.body.startTime;
        endTime = req.body.endTime;

        console.log(USER_ID);

        console.log(courseId, startTime, endTime);
        const sql = "INSERT INTO courses (uid,courseid,starttime,endtime) VALUES('"+USER_ID+"','"+ courseId + "','" + startTime + "','"+endTime+"')";
        db.query(sql,(err,result) => {
            if (err){
                
                console.log(err);
               
            }else{
               console.log("Saved Successfully");
               res.redirect('/home');
            }
        });
        
    });


    



    return router;
};