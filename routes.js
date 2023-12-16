const express = require('express');
const router = express.Router();
const authentication = require('./auth/authentication');
const dashboard = require('./dash/dashboard.js');
const limitter = require('express-rate-limit');
const logs = require('./graph/graphlogs');
const SA = require('./superadmin/SA.js');

const registerLimitter = limitter({
    windowMS : 5*60*1000,
    max: 2,
})

const loginLimit = limitter({
    windowMS : 1*60*1000,
    max: 5,
})
  
// Authentication post/put route
router.post('/login',loginLimit,authentication.login);
router.post('/register',registerLimitter, authentication.register);
router.post('/register-dashboard', authentication.register_dashboard);
router.post('/verify', authentication.verifyToken);
router.post('/re-verify-mail', authentication.resendToken);
router.post('/forgot', authentication.forgotPassword);
router.post('/resend-forgot', authentication.resendResetToken);
router.post('/reset-password', authentication.resetPassword);
router.post('/addDevice', dashboard.addDevice);
router.put('/editDevice/:deviceId', dashboard.editDevice);
router.put('/companyDetails/:UserId', dashboard.companyDetails);
router.put('/personalDetails/:UserId', dashboard.personalDetails);
router.put('/updatePassword/:UserId', dashboard.updatePassword);


router.get('/feederinterval/:deviceId/:interval', dashboard.Intervalfeeder);  
router.get('/feeder/:CompanyName', dashboard.feeder);
router.get('/feederParametrised/:CompanyName', dashboard.feederParametrised);
router.get('/feederHarmonic/:CompanyName', dashboard.feederHarmonic);
router.get('/getdata/:meters', dashboard.getdata);
router.get('/parametersFilter/:deviceid/:parameter/:interval', dashboard.parametersFilter);
router.post('/addDeviceTrigger', dashboard.addDeviceTrigger);
router.get('/piechart/:companyName/:interval', dashboard.piechart);
router.get('/fetchmaxdemand/:companyName', dashboard.fetchmaxdemand);
// router.put('/setUserOnline/:UserId', authentication.setUserOnline);
// router.put('/setUserOffline/:UserId', authentication.setUserOffline);


// Authentication get route
router.get('/user', authentication.getUserDetails);

// Dashboard get route
router.get('/userdevices/:companyEmail', dashboard.userDevices);
router.get('/data/:deviceid/:parameter', dashboard.getDataByCustomDate);
router.get('/parametersFilter/:CompanyName/:interval', dashboard.filter);
router.get('/live-device-detail/:company', dashboard.getDeviceDetails);
router.get('/user-data/:userId', dashboard.getUserData);
router.get('/messages/:receiver', dashboard.getUserMessages);
router.get('/Company-users/:CompanyEmail', dashboard.fetchCompanyUser);
router.get('/logs', logs.fetchLogs);
router.get('/temp', dashboard.temp);
//userdetailspage
router.get('/userdetails/:userId', dashboard.getUserDetails);
router.put('/edituser/:userId', dashboard.edituser);
router.delete('/deleteuser/:userId', dashboard.deleteuser);
//feederconfiguration
router.get('/feederdetails/:deviceId', dashboard.getFeederDetails);
router.put('/editfeeder/:deviceId', dashboard.editfeeder);
//alertseventsdetail
router.get('/alerteventsDetail/:alertId', dashboard.alerteventDetails);
router.put('/editalert/:alertId', dashboard.editalert);




// router.put('/personalDetails/:UserId', authentication.personalDetails);
// router.get('/data/:deviceuid/intervals', dashboard.getDataByTimeInterval);



//SA get route
router.get('/fetchAllDevices', SA.fetchAllDevices);
router.get('/fetchAllUsers', SA.fetchAllUsers);
//router.get('/Company/:CompanyEmail', SA.dev);
router.get('/logs/:interval', SA.fetchLogs);
router.get('/apilogs/:interval', SA.apilogs);
router.get('/getDeviceByUID/:deviceUID', SA.getDeviceByUID);
router.get('/fetchCompanyDetails/:CompanyEmail', SA.fetchCompanyDetails);
router.get('/usermanagement', SA.usermanagement);
router.get('/userInfo', SA.userInfo);
router.get('/compInfo', SA.companyinfo);
router.get('/alarms', SA.alarms);
router.get('/allnotification', SA.allnotification);
router.get('/unreadnotification', SA.unreadnotification);
router.get('/userByCompanyname/:company_name', SA.userByCompanyname);
//router.get('/parameters/:interval/:parameter/:deviceid', SA.parameter);
router.get('/parameter/:deviceid/:parameter/:interval', SA.parameter);
router.get('/sum/:deviceid', SA.SumData);
router.get('/kwsum/:deviceid', SA.kwSumData);
router.get('/dwsum', SA.dwSumData);

//router.get('/fetchCounts/:CompanyEmail', SA.fetchCounts);

//SA post/put/delete route
router.post('/addDevice', SA.addDevice);
router.put('/updateDevice/:deviceUID', SA.updateDevice);
router.put('/blockuser/:userid/', SA.Block);
router.delete('/deleteDevice/:deviceUID', SA.deleteDevice);
router.post('/recoverUser/:userid', SA.recoverUser);
router.delete('/deleteUser/:userid', SA.deleteUser);


//SA graph route
router.get('/graph1/', SA.graph1);
router.get('/graph2/', SA.graph2);
router.get('/graph3/', SA.graph3);
router.get('/graph4/', SA.graph4);

module.exports = router;
