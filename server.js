const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
app.set("view engine", "ejs");
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
var path = require('path');
var logger = require('morgan');
// var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));



var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
var session = driver.session();

app.get('/matchall', function(req, res){
    session
        .run('MATCH(n) RETURN n LIMIT 20')
        .then(function(result){
            result.records.forEach(function(record){
                console.log(record._fields[0].properties);
            });
        })
        .catch(function(err){
            console.log(err);
        });
    res.send('Hello');
});

//Recommends College Exam Given
app.get('/examgiven', function(req, res){
    session
        .run('MATCH(a:Course)-[:is_offered_by]->(b:College) WHERE a.Rankcl < $cutoffparam RETURN b.name,a.name,a.Rankcl',{cutoffparam:cutoff})
        .then(function(result){
            result.records.forEach(function(record){
                console.log(record._fields);
            });
        })
        .catch(function(err){
            console.log(err);
        });
    res.send('Hello');
});
//Recommends College Exam Not Given
app.get('/examnotgiven', function(req, res){
    session
        .run('MATCH(a:Course)-[:is_offered_by]->(b:College) WHERE b.name = $collegenameparam RETURN a.name',{collegenameparam:collegename})
        .then(function(result){
            result.records.forEach(function(record){
                console.log(record._fields);
            });
        })
        .catch(function(err){
            console.log(err);
        });
    res.send('Hello');
});


var cutoff = 500
var collegename = "Veermata Jijabai Technological Institute, Mumbai"
module.exports = app;
var collegeIDdoc;
var fnamedoc;
var lnamedoc;
var password;
var repassword;
// const { Client } =require('pg');
const RegisterSchema = {
    _id: {
        type: String,
        require: true
    },
    fname: {
        type: String,
        require: true
    },
    lname: { type: String, require: true },
    email: { type: String, require: true },
    phone: { type: String, require: true },
    gender: { type: String, require: true },
    DOB: { type: Date },


    // semester: { type: String, require: true },
    // year: { type: String, require: true },
    // program: { type: String, require: true },
    // department: { type: String, require: true },

    password: { type: String, require: true },
    repassword: { type: String, require: true }
};

//Schema for Complaint 
const locationSchema = {

  Name: { type: String, require :true  },
  Lat : {type:Number},
  Long :{type: Number}

}

const collegeSchema = {
    _id : {type:Number},
  Name: { type: String, require :true  },

  Fees:    { type: String},

  City: { type: String},

  Sector: { type: String },

  Exam: { type: String }

}
const loginSchema = {

  email: { type: String, require: true },
  password: { type: String, require: true },
  Lat : {type:Number},
  Long :{type: Number}

}
const courseSchema = {

  Name: { type: String, require :true  },
  college : {type : String },
  Rankop : {type:Number},
  Rankcl :{type: Number}

}
const courseModel = mongoose.model('course', courseSchema);

const ComplaintSchema={}
const collegeModel = mongoose.model('colleges',collegeSchema);

//StudentModel
const registerModel = mongoose.model('student', RegisterSchema);
//ComplaintModel
const complaintModel = mongoose.model('complaint', ComplaintSchema);

const locationModel = mongoose.model('location', locationSchema);
var user_lat ;
var user_long ;
var user_radius=200 ;
function distance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


app.get('/latlong', function (req, res) {
    locationModel.find({}, function (err, data) {
        if (err) { console.log(err); }
        else {    
            var docs=[]
            for(i=0;i<367;++i)
      {
       if(distance(user_lat,user_long,data[i].Lat,data[i].Long)<user_radius){
        docs.push(data[i]);
        }
      }
            console.log(docs);
            res.send([docs,user_lat,user_long,user_radius]);
        }
    }

    );
});

app.get('/latlongradius', function (req, res) {
    locationModel.find({ location:
                            { $geoWithin:
                                 { $centerSphere: [ [user_lat, user_long], user_radius / 6378.1 ] 
                                 } } } ,
                  function (err, data) {
                     if (err) { console.log(err); }
                      else {
                        console.log(docs);
                          res.send(docs);
                         }
             }
             );
    });
app.get('/radiusall', function (req, res) {
        locationModel.find({ location:
                 { $geoWithin:
                 { $centerSphere: [ [user_lat, user_long], user_radius / 6378.1 ] } } },
                  function (err, data) {
        if (err) { console.log(err); }
        else {

              console.log(docs);

        var filter={
            rankcl : {
                $gte : rank
            }
        }
        courseModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                var i=0
                var arr=[]
                for(i=0;i<docs.length;++i)
                {
                     courseModel.find({Name : docs[i].Name}, function (err, docs) {
                            arr.push(docs[0])
                     });
                }
                res.send(arr)
            }
        });
        // });

        }
    });
    });

//     );
app.route('/course-rank')
     .post(function (req, res) {
        var filter={
            Rankcl : {
                $gte : req.body.rank
            }
        }
        courseModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                var i=0
                var arr=[]
                for(i=0;i<docs.length;++i)
                {
                     courseModel.find({Name : docs[i].Name}, function (err, docs) {
                            arr.push(docs[0])
                     });
                }
                res.send(arr)
            }
        });
        });
app.post('/getlatlon', (req, res) => {
  console.log(req.body.coords.latitude,req.body.coords.longitude);
  // global user_lat;
  // global user_long;
  user_lat=req.body.coords.latitude
  user_long =req.body.coords.longitude
  res.json({ ok: true });

});


function print(){
    const query2 = `
    SELECT *
    FROM location
    `;

    client.query(query2, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        for (let row of res.rows) {
            console.log(row);
        }
        // client.end(); 
    });
}


mongoose.connect('mongodb://localhost:27017/GrievanceDB', { useNewUrlParser: true, useUnifiedTopology: true });
//Schema for Student Data
// Home(Login) route
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/', async function (req, res) {
    var collegeIDlogin = req.body.collegeID;
    var passwordlogin = req.body.password;
    if (collegeIDlogin == "admin" && passwordlogin == "admin") {
        res.redirect('/admin-page')
    }
    else {
        try {
            var resdata = await registerModel.findById(collegeIDlogin);
            // var resdata = await registerModel.find({email : collegeIDlogin})
            if (resdata.password == passwordlogin) {
                collegeIDdoc = resdata._id;
                fnamedoc = resdata.fname;
                lnamedoc = resdata.lname;

                res.redirect('/profile');
            }
            else {
                res.render('errorlogin', { msg: "Error Login! Please enter correct College ID and Password." });
            }
        } catch (err) {
            console.log(err);
            res.render('errorlogin', { msg: "No user found!Please register first." })
        }




    }
});

//sign-up Route
app.get('/sign-up', function (req, res) {
    res.sendFile(__dirname + "/sign-up.html");
});


app.post('/sign-up', function (req, res) {

    password = req.body.password;
    repassword = req.body.repassword;
    if (password == repassword) {
        var regStudent = new registerModel({
            _id: req.body.email,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            DOB: req.body.DOB,
            gender : req.body.gender,
            password: req.body.password,
            repassword: req.body.repassword
        });
        regStudent.save(function (err) {
            if (err) { console.log(err); }
            else {
                res.redirect('/success');
            }
            app.get('/success', function (req, res) { res.sendFile(__dirname + "/success.html"); });
        });
    }
});

//--------------------------------REGISTER COMPLAINT---------------------------------------------//

//register complaint route 
app.route('/profile-register')
    .get(function (req, res) {
        res.render("compsubmit", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc })
    })
    .post(function (req, res) {

        var lodgedComplaint = new complaintModel({
            dateIssued: new Date(),
            location: req.body.location,
            section: req.body.section,
            description: req.body.description,
            dateResolved: null,
            isSolved: false,
            studentID: collegeIDdoc,
            adminFeedBack: null,
            inProgress: false
        })
        lodgedComplaint.save(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                res.render('submitsuccess', { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc })
            }
        });
    });
//--------------------------------------------ALL COMPLAINTS-----------------------------------------------------------//
// app.route('/course-rank')
//      .post(function (req, res) {
//         var filter={
//             rankcl : {
//                 $gte : req.body.rank
//             }
//         }
//         courseModel.find(filter, function (err, docs) {
//             if (err) { console.log(err) }
//             else {
//                 var i=0
//                 var arr=[]
//                 for(i=0;i<docs.length;++i)
//                 {
//                      courseModel.find({Name : docs[i].Name}, function (err, docs) {
//                             arr.push(docs[0])
//                      });
//                 }
//                 res.send(arr)
//             }
//         });
//         });
//     });


//Profile Route
app.get('/profile', function (req, res) {

    complaintModel.find({ isSolved: false }, function (err, docs) {
        if (err) { console.log(err) }
        else {
            console.log(docs);
            res.render("profile", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    });

});

//Profile-Solved Route
app.get('/profile-mycomplaints-solved', function (req, res) {
    console.log(req.query.length)
    console.log(2)
    console.log(req.query)
    // console.log(isEmpty(a))
    a=req.query
    if(isEmpty(a))
   {
    if(isEmpty(a.college))
    {
            arr=[]
                collegeModel.find({}).exec(function (err,docs){
        if(err){console.log(err)}
        else{
            for(i=0;i<docs.length;++i)
                {   
                    // console.log("Veermata Jijabai Technological Institute, Mumbai".slice(0,req.query.college.length)=="Veermata Jijabai Technological Institute")
                        if( docs[i].Name.indexOf(req.query.college)!==-1)
                        {  
                         // console.log(docs[i])
                                      courseModel.find({college : docs[i].Name}, function (err, docs) {
                                // console.log(collegeModel.find().limit(5))
                                if (err) { console.log(err); }
                                else {
                                    // console.log(docs,"sdkasdhkjshk");
                                    res.render("profilemysolved", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

                                }
                            });
                          break;
                        }
                }
            }
        });
        }
        else
        {
        collegeModel.find({}).exec(function (err,docs){
        if(err){console.log(err)}
        else{
            var data=[]
            for(i=0;i<docs.length;++i)
                {   
                    // console.log("Veermata Jijabai Technological Institute, Mumbai".slice(0,req.query.college.length)=="Veermata Jijabai Technological Institute")
                        if( docs[i].City.indexOf(req.query.city)!==-1)
                        { 
                            // console.log(data)
                                data.push(docs[i].Name)
                        } 
                }
                 // console.log(data)
                                      courseModel.find({college : {'$in' : data}}, function (err, docs) {
                                // console.log(collegeModel.find().limit(5))
                                if (err) { console.log(err); }
                                else {
                                    // console.log(docs,"sdkasdhkjshk");
                                    res.render("profilemysolved", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

                                }
                            });


            }
        });
    }



        }
    else

    {
            courseModel.find({}).limit(50).exec(function (err, docs) {
        // console.log(collegeModel.find().limit(5))
        if (err) { console.log(err); }
        else {
            // console.log(docs,"sdkasdhkjshk");
            res.render("profilemysolved", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    });
    }


});

app.post('/profile-allColleges', function (req, res) {

    collegeModel.find({}, function (err, docs) {
        // console.log(collegeModel.find().limit(5))
        if (err) { console.log(err); }
        else {
            // console.log(docs);
            res.render("profilemy", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    }

    );

});

// app.get('/profile-allColleges?', function (req, res) {
//     console.log(req.query)
//     console.log(2)
//     // res.json({ ok: true });

// });
function isEmpty(obj) {
  for (var o in obj)
    if (o) return true;
  return false;
}
app.get('/profile-allColleges', function (req, res) {
    console.log(req.query.length)
    console.log(2)
    a=req.query
    console.log(isEmpty(a))
    if(isEmpty(a))
    {
    user_radius=parseInt(req.query.radius, 10);
    user_rank=parseInt(req.query.rank,10)
        var filter={
            Rankcl : {
                $gt : user_rank
            }
        }
        courseModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                var i=0
                var arr=[]
                // console.log(docs)
                for(i=0;i<docs.length;++i)
                {
                        arr.push(docs[i].college)
                }

                console.log(arr)
                    collegeModel.find({Name : {"$in" : arr }}).sort({"_id":1}).exec(function (err, docs) {
                    if (err) { console.log(err); }
                    else {
                        // console.log(docs);
            res.render("profilemy", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

                            }
                        });
                                    // res.send(arr)
            }
        });
}
    else

    {
            collegeModel.find({}).sort({"_id":1}).limit(100).exec( function (err, docs) {
        // console.log(collegeModel.find().limit(5))
        if (err) { console.log(err); }
        else {
            // console.log(docs);
            res.render("profilemy", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    });
    }


});
//Sending Json route  (Sorting)    PENDING
app.route('/complaints-pending/:location/:section/:duration')
    .get(function (req, res) {
        var location = req.params.location;
        var section = req.params.section;
        var duration = req.params.duration;
        console.log(location);
        console.log(section);
        var filter = {};
        if (duration == "month") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == "week") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration = 'today') {
            var today = new Date();
            var deadline = today.setHours(0, 0, 0, 0);
            var formatDeadline = new Date(deadline);
            filter = {
                dateIssued: {
                    $gte: new Date(formatDeadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }

        }
        if (location == "All") {
            filter.isSolved = false
            // filter = { isSolved: false }; 
        }
        else if (section == "All") {
            // filter = { isSolved: false, location: location };
            filter.isSolved = false;
            filter.location = location;

        }
        else {
            // filter = { isSolved: false, location: location, section: section };
            filter.isSolved = false;
            filter.location = location;
            filter.section = section;
        }

        complaintModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                res.send(docs);
            }
        });
    }
    );


//Sending Json route  (Sorting)            SOLVED 
app.route('/complaints-solved/:location/:section/:duration')
    .get(function (req, res) {
        var location = req.params.location;
        var section = req.params.section;
        var duration = req.params.duration;
        console.log(location);
        console.log(section);
        var filter = {};
        if (duration == "month") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == "week") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == 'today') {
            var today = new Date();
            var deadline = today.setHours(0, 0, 0, 0);
            var formatDeadline = new Date(deadline);
            filter = {
                dateIssued: {
                    $gte: new Date(formatDeadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }

        }
        if (location == "All") {
            filter.isSolved = true;
            // filter = { isSolved: false }; 
        }
        else if (section == "All") {
            // filter = { isSolved: false, location: location };
            filter.isSolved = true;
            filter.location = location;

        }
        else {
            // filter = { isSolved: false, location: location, section: section };
            filter.isSolved = true;
            filter.location = location;
            filter.section = section;
        }


        complaintModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                res.send(docs);
            }
        });
    }
    );

//------------------------------------------------MY COMPLAINTS-------------------------------------------------------//

//Profile Mycomplaints Pending
app.get('/profile-allColleges', function (req, res) {
    collegeModel.find({}, function (err, docs) {
        // console.log(collegeModel.find().limit(5))
        if (err) { console.log(err); }
        else {
            // console.log(docs);
            res.render("profilemy", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    }

    );

});
// app.get('/profile-mycomplaints', function (req, res) {
//         docs=[{
//             Name : 'Veermata Jijabai Technological Institute, Mumbai',
//             City : 'Mumbai,Maharashtra',
//             Sector :'Private /Government',
//             Fees : '332330',
//             Exams : 'JEE Mains ,MHT-CET'

//         },
//         {
//             Name : 'IITB',
//             City : 'Mumbai,Maharashtra',
//             Sector :'Private /Government',
//             Fees : '',
//             Exams : 'JEE Mains'

//         }
//     ]
//       res.render("profilemy", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

// })

//Profile Mycomplaints Solved
app.get('/profile-mycomplaints-solved', function (req, res) {
    complaintModel.find({ studentID: collegeIDdoc, isSolved: true }, function (err, docs) {
        if (err) { console.log(err); }
        else {
            console.log(docs);
            res.render("profilemysolved", { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc, complaints: docs });

        }
    }

    );
});
//Sending Json route  (Sorting)    PENDING
app.route('/complaints-pending-my/:location/:section/:duration')
    .get(function (req, res) {
        var location = req.params.location;
        var section = req.params.section;
        var duration = req.params.duration;
        console.log(location);
        console.log(section);
        var filter = {};
        if (duration == "month") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == "week") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == 'today') {
            var today = new Date();
            var deadline = today.setHours(0, 0, 0, 0);
            var formatDeadline = new Date(deadline);
            filter = {
                dateIssued: {
                    $gte: new Date(formatDeadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }

        }
        if (location == "All") {
            filter.isSolved = false;
            filter.studentID = collegeIDdoc;
            // filter = { isSolved: false }; 
        }
        else if (section == "All") {
            // filter = { isSolved: false, location: location };
            filter.isSolved = false;
            filter.location = location;
            filter.studentID = collegeIDdoc;

        }
        else {
            // filter = { isSolved: false, location: location, section: section };
            filter.isSolved = false;
            filter.location = location;
            filter.section = section;
            filter.studentID = collegeIDdoc;
        }

        complaintModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                res.send(docs);
            }
        });
    }
    );


//Sending Json route  (Sorting)            SOLVED 
app.route('/complaints-solved-my/:location/:section/:duration')
    .get(function (req, res) {
        var location = req.params.location;
        var section = req.params.section;
        var duration = req.params.duration;
        console.log(location);
        console.log(section);
        var filter = {};
        if (duration == "month") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == "week") {
            var today = new Date();
            var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
            filter = {
                dateIssued: {
                    $gte: new Date(deadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }
        }
        else if (duration == "week") {
            var today = new Date();
            var deadline = today.setHours(0, 0, 0, 0);
            var formatDeadline = new Date(deadline);
            filter = {
                dateIssued: {
                    $gte: new Date(formatDeadline.toISOString()),
                    $lt: new Date(today.toISOString())
                }
            }

        }
        if (location == "All") {
            filter.isSolved = true;
            filter.studentID = collegeIDdoc;
            // filter = { isSolved: false }; 
        }
        else if (section == "All") {
            // filter = { isSolved: false, location: location };
            filter.isSolved = true;
            filter.location = location;
            filter.studentID = collegeIDdoc;

        }
        else {
            // filter = { isSolved: false, location: location, section: section };
            filter.isSolved = true;
            filter.location = location;
            filter.section = section;
            filter.studentID = collegeIDdoc;
        }


        complaintModel.find(filter, function (err, docs) {
            if (err) { console.log(err) }
            else {
                res.send(docs);
            }
        });
    }
    );


//----------------------------------------- ADMIN-----------------------------------------------//

//Complaint Sent By ADMIN to InProgress
app.route('/inprogress-complaints')
    .post(function (req, res) {
        var id = req.body.id;
        var inProgress = req.body.inProgress;

        console.log(id);
        console.log(inProgress);
        complaintModel.findOneAndUpdate({ _id: id, inProgress: false, }, { inProgress: inProgress }, function (err) {
            if (err) {
                console.log(err);
            }
            else { console.log("Successfully sent the complaint ") }

        });


    });


app.route('/solved-complaints')
    .post(function (req, res) {
        var id = req.body.id;
        var isSolved = req.body.isSolved;
        var feedback = req.body.feedback;
        console.log(id);
        console.log(isSolved);
        complaintModel.findOneAndUpdate({ _id: id, isSolved: false, }, { isSolved: true, dateResolved: new Date(), adminFeedBack: feedback }, function (err) {
            if (err) {
                console.log(err);
            }
            else { console.log("Successfully solved the complaint") }

        });


    });


//GET COMPLAINTS
// app.get('/admin', function (req, res) {


//     complaintModel.find({ isSolved: false }, function (err, docs) {
//         if (err) { console.log(err) }
//         else {
//             res.send(docs);
//         }
//     });
// });

//GET  COMPLAINTS to In Progress
app.get('/admin/:location/:section/:duration', function (req, res) {
    var location = req.params.location;
    var section = req.params.section;
    var duration = req.params.duration;
    console.log(location);
    console.log(section);
    var filter = {};
    if (duration == "month") {
        var today = new Date();
        var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        filter = {
            dateIssued: {
                $gte: new Date(deadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }
    }
    else if (duration == "week") {
        var today = new Date();
        var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        filter = {
            dateIssued: {
                $gte: new Date(deadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }
    }
    else if (duration == 'today') {
        var today = new Date();
        var deadline = today.setHours(0, 0, 0, 0);
        var formatDeadline = new Date(deadline);
        filter = {
            dateIssued: {
                $gte: new Date(formatDeadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }

    }
    if (location == "All") {
        filter.isSolved = false;
        filter.inProgress = false;
        // filter = { isSolved: false }; 
    }
    else if (section == "All") {
        // filter = { isSolved: false, location: location };
        filter.isSolved = false;
        filter.inProgress = false;
        filter.location = location;

    }
    else {
        // filter = { isSolved: false, location: location, section: section };
        filter.isSolved = false;
        filter.inProgress = false;
        filter.location = location;
        filter.section = section;
    }

    complaintModel.find(filter, function (err, docs) {
        if (err) {
            console.log(err);

        }
        else {
            res.send(docs);
        }


    });
});

//GET  COMPLAINTS to solved
app.get('/admin-to-solve/:location/:section/:duration', function (req, res) {
    var location = req.params.location;
    var section = req.params.section;
    var duration = req.params.duration;
    console.log(location);
    console.log(section);
    var filter = {};
    if (duration == "month") {
        var today = new Date();
        var deadline = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        filter = {
            dateIssued: {
                $gte: new Date(deadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }
    }
    else if (duration == "week") {
        var today = new Date();
        var deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        filter = {
            dateIssued: {
                $gte: new Date(deadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }
    }
    else if (duration == 'today') {
        var today = new Date();
        var deadline = today.setHours(0, 0, 0, 0);
        var formatDeadline = new Date(deadline);
        filter = {
            dateIssued: {
                $gte: new Date(formatDeadline.toISOString()),
                $lt: new Date(today.toISOString())
            }
        }

    }
    if (location == "All") {
        filter.isSolved = false;
        filter.inProgress = true;
        // filter = { isSolved: false }; 
    }
    else if (section == "All") {
        // filter = { isSolved: false, location: location };
        filter.isSolved = false;
        filter.inProgress = true;
        filter.location = location;

    }
    else {
        // filter = { isSolved: false, location: location, section: section };
        filter.isSolved = false;
        filter.inProgress = true;
        filter.location = location;
        filter.section = section;
    }

    complaintModel.find(filter, function (err, docs) {
        if (err) {
            console.log(err);

        }
        else {
            res.send(docs);
        }


    });
});


//ADMIN PAGE
app.get('/admin-page', function (req, res) {
    complaintModel.find({ isSolved: false, inProgress: true }, function (err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            res.render('admin', { complaints: docs });
        }



    })


});
//ADMIN IN PROGRESS PAGE
app.get('/admin-page-progress', function (req, res) {
    complaintModel.find({ isSolved: false, inProgress: false }, function (err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            res.render('admininprogress', { complaints: docs });
        }

    })
});

//Dashboard

app.get('/dashboard', function (req, res) {
    res.render('dashboard', { name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc });


})

//Dash filter
app.get('/dashboard-data/:type', async function (req, res) {
    var type = req.params.type;
    if (type == 'all') {
        var data = {};
        var res1 = await complaintModel.find({ isSolved: true });
        data.solved = res1.length;

        var res2 = await complaintModel.find({ isSolved: false });
        data.pending = res2.length;

        var res3 = await complaintModel.find({ location: 'College Campus' });
        data.college = res3.length;

        var res4 = await complaintModel.find({ location: 'Hostel' });
        data.hostel = res4.length;

        var res5 = await complaintModel.find({ location: 'Hostel', section: 'Security' });
        data.hostelSecurity = res5.length;

        var res6 = await complaintModel.find({ location: 'Hostel', section: 'Staff' });
        data.hostelStaff = res6.length;

        var res7 = await complaintModel.find({ location: 'Hostel', section: 'Rooms' });
        data.hostelRooms = res7.length;

        var res8 = await complaintModel.find({ location: 'Hostel', section: 'Water Supply' });
        data.hostelWater = res8.length;

        var res9 = await complaintModel.find({ location: 'Hostel', section: 'Mess' });
        data.hostelMess = res9.length;

        var res10 = await complaintModel.find({ location: 'Hostel', section: 'Electric Equipments' });
        data.hostelElectric = res10.length;

        var res11 = await complaintModel.find({ location: 'Hostel', section: 'Others' });
        data.hostelOthers = res11.length;

        var res12 = await complaintModel.find({ location: 'College Campus', section: 'Security' });
        data.collegeSecurity = res12.length;

        var res13 = await complaintModel.find({ location: 'College Campus', section: 'Washrooms' });
        data.collegeWash = res13.length;

        var res14 = await complaintModel.find({ location: 'College Campus', section: 'Lab Equipments' });
        data.collegeLab = res14.length;

        var res15 = await complaintModel.find({ location: 'College Campus', section: 'Class Rooms' });
        data.collegeClass = res15.length;

        var res16 = await complaintModel.find({ location: 'College Campus', section: 'Canteen' });
        data.collegeCanteen = res16.length;

        var res17 = await complaintModel.find({ location: 'College Campus', section: 'Electric Equipments' });
        data.collegeElectric = res17.length;

        var res18 = await complaintModel.find({ location: 'College Campus', section: 'Others' });
        data.collegeOthers = res18.length;

        console.log(data);


        res.send(data);

    }
    else {
        var data = {};
        var res1 = await complaintModel.find({ isSolved: true, studentID: collegeIDdoc });
        data.solved = res1.length;
        var res2 = await complaintModel.find({ isSolved: false, studentID: collegeIDdoc });
        data.pending = res2.length;
        var res3 = await complaintModel.find({ location: 'College Campus', studentID: collegeIDdoc });
        data.college = res3.length;
        var res4 = await complaintModel.find({ location: 'Hostel', studentID: collegeIDdoc });
        data.hostel = res4.length;
        var res5 = await complaintModel.find({ location: 'Hostel', section: 'Security', studentID: collegeIDdoc });
        data.hostelSecurity = res5.length;

        var res6 = await complaintModel.find({ location: 'Hostel', section: 'Staff', studentID: collegeIDdoc });
        data.hostelStaff = res6.length;

        var res7 = await complaintModel.find({ location: 'Hostel', section: 'Rooms', studentID: collegeIDdoc });
        data.hostelRooms = res7.length;

        var res8 = await complaintModel.find({ location: 'Hostel', section: 'Water Supply', studentID: collegeIDdoc });
        data.hostelWater = res8.length;

        var res9 = await complaintModel.find({ location: 'Hostel', section: 'Mess', studentID: collegeIDdoc });
        data.hostelMess = res9.length;

        var res10 = await complaintModel.find({ location: 'Hostel', section: 'Electric Equipments', studentID: collegeIDdoc });
        data.hostelElectric = res10.length;

        var res11 = await complaintModel.find({ location: 'Hostel', section: 'Others', studentID: collegeIDdoc });
        data.hostelOthers = res11.length;

        var res12 = await complaintModel.find({ location: 'College Campus', section: 'Security', studentID: collegeIDdoc });
        data.collegeSecurity = res12.length;

        var res13 = await complaintModel.find({ location: 'College Campus', section: 'Washrooms', studentID: collegeIDdoc });
        data.collegeWash = res13.length;

        var res14 = await complaintModel.find({ location: 'College Campus', section: 'Lab Equipments', studentID: collegeIDdoc });
        data.collegeLab = res14.length;

        var res15 = await complaintModel.find({ location: 'College Campus', section: 'Class Rooms', studentID: collegeIDdoc });
        data.collegeClass = res15.length;

        var res16 = await complaintModel.find({ location: 'College Campus', section: 'Canteen', studentID: collegeIDdoc });
        data.collegeCanteen = res16.length;

        var res17 = await complaintModel.find({ location: 'College Campus', section: 'Electric Equipments', studentID: collegeIDdoc });
        data.collegeElectric = res17.length;

        var res18 = await complaintModel.find({ location: 'College Campus', section: 'Others', studentID: collegeIDdoc });
        data.collegeOthers = res18.length;


        console.log(res1);
        console.log(data);

        console.log(data);

        res.send(data);
    }

});

//showprofile
app.get('/show-profile', async function (req, res) {
    var resdata = await registerModel.find({ _id: collegeIDdoc });
    console.log(resdata);
    res.render('showprofile', { data: resdata, name: fnamedoc + " " + lnamedoc, collegeID: collegeIDdoc });

});




app.listen(3000, function () {
    console.log("Server running on port 3000");
});