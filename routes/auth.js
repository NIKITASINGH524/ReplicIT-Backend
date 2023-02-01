const express = require('express');
const Member = require('../models/Member');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');
const Doctor = require('../models/Doctor');
const JWT_SECRET = "supermanbatmansinchan"

// contains routes for 
/**
 * CREATE
 * /create
 */
router.post('/create', async (req, res) => {
    console.log(req.body)
    const { name, email, password, role } = req.body;

    // check if member is already present or not
    let user = await Member.findOne({ email });
    if (user) {
        return res.status(400).json({ error: "MEmber already exists" })
    }


    try {
        const newMember = await Member.create({
            name, email, password, role
        })

        const data = {
            user: {
                id: newMember.id
            }
        }

        let authtoken = jwt.sign(data, JWT_SECRET);

        res.json({ authtoken });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
})


router.post('/login', async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;

    try {
        let user = Member.findOne({ email })

        if (!user) {
            return res.status(400).json({ error: "Enter a valid credentials" })
        }


        let data = {
            user: {
                id: user.id
            }
        }
        let authtoken = jwt.sign(data, JWT_SECRET);
        res.json({ authtoken })

        // save this token into local storage

    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
})


router.get('/getmember', fetchUser, async (req, res) => {
    // this will run automatcally on dashboard
    // will check the local storage and call the function and get all the details 
    try {
        let userID = req.user.id;
        const user = await Member.findById(userID).select('-password')

        res.json({ user })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

router.get('/getmemberrole', fetchUser, async (req, res) => {
    // this will run automatcally on dashboard
    // will check the local storage and call the function and get all the details 
    try {
        let userID = req.user.id;
        const user = await Member.findById(userID).select('-password')

        const role = user.role
        res.json({ role })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

router.post('/createdr', fetchUser, async (req, res) => {
    // check if the current user is mr or not
    const managerID = req.user.id;
    console.log(managerID)

    const role = await Member.findById(managerID);
    console.log(role.role)
    const createdBy = role.name
    try {
        if (role.role == 0 || role.role == 3) {
            const {
                fname,
                mname,
                lname,
                phoneno,
                email,
                qualification,
                specialization,
                experience,
                prefeeredDomain,
                city,
                state,
                verifiedOn,
                verifiedBy,
                updatedOn,
                updateBy } = req.body;
            const newDoctor = await Doctor.create({
                managerID,
                fname,
                mname,
                lname,
                phoneno,
                email,
                qualification,
                specialization,
                experience,
                prefeeredDomain,
                city,
                state,
                createdBy,
                createdBy,
                verifiedOn,
                verifiedBy,
                updatedOn,
                updateBy
            })

            const createNewDoctor = await newDoctor.save();

            // return createNewDoctor;
            res.json({ createNewDoctor })
        } else {
            return res.status(401).json({ error: "Authenticate using valid token" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

/////// update doctor form by mr
router.put('/updatedr/:id', fetchUser, async (req, res) => {
    const userID = req.user.id

    try {

        // check if the doctor is present in the table 
        const doctorID = req.params.id
        const chechDoctor = await Doctor.findById(doctorID)
        if (!chechDoctor) { return res.status(404).json({ error: "Not Found" }) }

        // get the object of new data from the req.body
        const newData = req.body;
        d = await Doctor.findByIdAndUpdate(doctorID, { $set: newData })
        res.send(newData)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error ocured" })
    }


})

// update doctor status by manager
// we only be alloed to approved or reject 2 condition
// this can be direct single function
// on click of a button
// direct change based on the user type
// take a stirng and make it to that sring
router.put('/updatedrstatus/:id', fetchUser, async (req, res) => {
    const doctorID = req.params.id
    const toChangeTo = req.body.toChange;
    try {

        // check if doctors with the id exists or not
        let d = await Notes.findById(doctorID)
        if (!d) { return res.status(404).send("Not Found") }

        const userID = req.user.id
        const loggedInUser = await Member.findById(userID);
        const loggedInUserName = loggedInUser.name
        const loggedInUserrole = loggedInUser.role

        // we only want to update the status of the doctor request to approved
        if (loggedInUserrole == 0 || loggedInUserrole == 3) {
            // if the loggedin user is manager then he is allowd to update the status of doctor to approved or rejected
            // find by id and update
            try {
                d = await Doctor.findByIdAndUpdate(doctorID, { $set: { status: toChangeTo } })
                res.json(d);
            } catch (error) {
                return res.status(401).json({ error: "Not Allowed" });
            }
        } else if (loggedInUserrole == 2 || loggedInUserrole == 3) {
            // the current user is tech member
            // is is allowed to make the status to `certification`
            try {
                d = await Doctor.findByIdAndUpdate(doctorID, { $set: { status: toChangeTo } })
                res.json(d);
            } catch (error) {
                return res.status(401).json({ error: "Not Allowed" });
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal server error ocured" })
    }

})


// get all the doctor of specific mr
router.get('/getdrmr', fetchUser, async (req, res) => {

    // check if the current user is mr or not 
    // if mr get all the doctors
    try {

        const userID = req.user.id;
        const userDetails = await Member.findById(userID)
        const userRole = userDetails.role

        if (userRole == 0 || userRole == 3) {
            const doctors = await Doctor.find({ managerID: userID });
            res.json({ doctors });

        } else {
            return res.status(401).json({ error: "Not Allowed" });
        }
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})


// get all the doctors
router.get('/getdrs', fetchUser, async (req, res) => {
    try {
        const drs = await Doctor.find();
        res.json({ drs });
    } catch (e) {
        // console.log(e)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

// show all the approved doctors to tech team
// check if the curretn user is tech or admin or not 
router.get("approveddrs", fetchUser, async (req, res) => {
    let userID = req.user.id;

    try {
        // get the role of the id 
        let userDetails = await Member.findById(userID);
        let userrole = userDetails.role

        if (userrole == 2 || userrole == 3) {
            // show all the docs with approved status
            const doctorsA = await Doctor.find({ status: "approved" })
            res.json(doctorsA);
        } else {
            return res.status(401).json({ error: "Not Allowed" });
        }
    } catch (e) {
        // console.log(e)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

// show all thing to admin and all live websites to admin and tech 


// show all the not approved doctor to the mr
router.get("/notapproveddrs", fetchUser, async () => {
    let userID = req.user.id;

    try {
        // get the role of the id 
        let userDetails = await Member.findById(userID);
        let userrole = userDetails.role

        if (userrole == 0 || userrole == 3) {
            // show all the docs with approved status
            const doctorsA = await Doctor.find({ status: "rejected" })
            res.json(doctorsA);
        } else {
            return res.status(401).json({ error: "Not Allowed" });
        }
    } catch (e) {
        // console.log(e)
        res.status(500).json({ error: "Internal server error ocured" })
    }
})

module.exports = router;
