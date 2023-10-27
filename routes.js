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

// router.put('/setUserOnline/:UserId', authentication.setUserOnline);
// router.put('/setUserOffline/:UserId', authentication.setUserOffline);


// Authentication get route
router.get('/user', authentication.getUserDetails);

// Dashboard get route
router.get('/userdevices/:companyEmail', dashboard.userDevices);
router.get('/data/:deviceid/:parameter', dashboard.getDataByCustomDate);
router.get('/parametersFilter/:deviceid/:parameter/:interval', dashboard.parametersFilter);
router.get('/live-device-detail/:deviceId', dashboard.getDeviceDetails);
router.get('/user-data/:userId', dashboard.getUserData);
router.get('/messages/:receiver', dashboard.getUserMessages);
router.get('/Company-users/:CompanyEmail', dashboard.fetchCompanyUser);
router.get('/logs', logs.fetchLogs);
// router.put('/personalDetails/:UserId', authentication.personalDetails);
// router.get('/data/:deviceuid/intervals', dashboard.getDataByTimeInterval);



//SA get route
router.get('/fetchAllDevices', SA.fetchAllDevices);
router.get('/fetchAllUsers', SA.fetchAllUsers);
router.get('/Company/:CompanyEmail', SA.dev);
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
router.get('/parametersFilter/:deviceid/:parameter/:interval', dashboard.parametersFilter);
//router.get('/fetchCounts/:CompanyEmail', SA.fetchCounts);

//SA post/put/delete route
router.post('/addDevice', SA.addDevice);
router.put('/updateDevice/:deviceUID', SA.updateDevice);
router.put('/blockuser/:userid/', SA.Block);
router.delete('/deleteDevice/:deviceUID', SA.deleteDevice);
router.delete('/removeUser/:userId', SA.removeUser);


//SA graph route
router.get('/graph1/', SA.graph1);
router.get('/graph2/', SA.graph2);
router.get('/graph3/', SA.graph3);
router.get('/graph4/', SA.graph4);

module.exports = router;
