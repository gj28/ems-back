const express = require('express');
const router = express.Router();
const authentication = require('./auth/authentication');
const dashboard = require('./dash/dashboard.js');
const limitter = require('express-rate-limit');
const logs = require('./graphlogs');
const SA = require('./superadmin/SA.js');

const registerLimitter = limitter({
    windowMS : 5*60*1000,
    max: 2,
})

// Registration route
router.post('/register',registerLimitter, authentication.register);

// const loginLimit = limitter({
//     windowMS : 1*60*1000,
//     max: 5,
// })
  
// Login route
router.post('/login',authentication.login);
router.post('/register-dashboard', authentication.register_dashboard);
router.get('/user', authentication.getUserDetails);
router.post('/verify', authentication.verifyToken);
router.post('/re-verify-mail', authentication.resendToken);
router.post('/forgot', authentication.forgotPassword);
router.post('/resend-forgot', authentication.resendResetToken);
router.post('/reset-password', authentication.resetPassword);
// router.put('/setUserOnline/:UserId', authentication.setUserOnline);
// router.put('/setUserOffline/:UserId', authentication.setUserOffline);

router.put('/blockuser/:userid/', authentication.Block);


// // //Dashboard
router.get('/userdevices/:companyEmail', dashboard.userDevices);
router.put('/editDevice/:deviceId', dashboard.editDevice);

router.put('/companyDetails/:UserId', dashboard.companyDetails);
router.put('/personalDetails/:UserId', dashboard.personalDetails);
router.put('/updatePassword/:UserId', dashboard.updatePassword);

// router.put('/personalDetails/:UserId', authentication.personalDetails);
router.get('/data/:deviceuid/intervals', dashboard.getDataByTimeInterval);
router.get('/data/:deviceId', dashboard.getDataByCustomDate);
router.get('/live-device-detail/:deviceId', dashboard.getDeviceDetails);
router.get('/user-data/:userId', dashboard.getUserData);
router.post('/new-message', dashboard.insertNewMessage);
router.put('/mark-read-message/:messageId', dashboard.markMessageAsRead);
router.delete('/delete-message/:messageId', dashboard.deleteMessage);
router.get('/unread-message/:receiver', dashboard.countUnreadMessages);
router.get('/messages/:receiver', dashboard.getUserMessages);
router.get('/Company-users/:CompanyEmail', dashboard.fetchCompanyUser);
router.get('/Company/:CompanyEmail', SA.dev);
router.post('/addDevice', dashboard.addDevice);
router.get('/logs', logs.fetchLogs);



//SA
router.get('/fetchAllDevices', SA.fetchAllDevices);
router.get('/fetchAllUsers', SA.fetchAllUsers);
router.delete('/deleteDevice/:deviceUID', SA.deleteDevice);
router.get('/fetchCompanyDetails/:CompanyEmail', SA.fetchCompanyDetails);
//router.get('/fetchCounts/:CompanyEmail', SA.fetchCounts);
router.post('/addDevice', SA.addDevice);
router.get('/getDeviceByUID/:deviceUID', SA.getDeviceByUID);
router.put('/updateDevice/:deviceUID', SA.updateDevice);
router.get('/logs/:interval', SA.fetchLogs);
router.get('/apilogs/:interval', SA.apilogs);
router.delete('/removeUser/:userId', SA.removeUser);
 router.get('/usermanagement', SA.usermanagement);
router.get('/userInfo', SA.userInfo);
router.get('/compInfo', SA.companyinfo);
 router.get('/alarms', SA.alarms);
router.get('/allnotification', SA.allnotification);
router.get('/unreadnotification', SA.unreadnotification);
router.get('/userByCompanyname/:company_name', SA.userByCompanyname);

//router.get('/parametersFilter/:interval', SA.parametersFilter);
router.get('/parametersFilter/:interval/:parameter', SA.parametersFilter);
router.get('/parameters/:interval/:parameter', SA.parameter);

router.get('/graph1/', SA.graph1);
router.get('/graph2/', SA.graph2);
router.get('/graph3/', SA.graph3);
router.get('/graph4/', SA.graph4);

router.get('/sum/:deviceid', SA.SumData);
router.get('/kwsum/:deviceid', SA.kwSumData);
router.get('/dwsum', SA.dwSumData);

module.exports = router;
