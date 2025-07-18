 const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config(); // Load environment variables from .env file
const port = process.env.PORT || 4000;

const da = require("./data-access");
const { checkApiKey } = require("./security");
const getNewApiKey = require("./security").getNewApiKey;

app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get("/apikey", async (req, res) => {
    let email = req.query.email;
    if(email){
        const newApiKey = getNewApiKey(email);
        res.send(newApiKey);
    }else{
        res.status(400);
        res.send("an email query param is required");
    }   
});

app.get("/customers", checkApiKey, async (req, res) => {
     const [cust, err] = await da.getCustomers();
     if(cust){
         res.send(cust);
     }else{
         res.status(500);
         res.send(err);
     }   
});

app.get("/customers/find", async (req, res) => {
    const keys = Object.keys(req.query);
    if (keys.length === 0) {
        res.status(400);
        res.send("query string is required");
        return;
    } 

    if (keys.length > 1) {
        res.status(400);
        res.send("only one query string is allowed");
        return;
    }

    const key = keys[0];
    const validKeys = ["id", "name", "email"];
    if (!validKeys.includes(key)) {
        res.status(400);
        res.send("query string must be one of " + validKeys.join(", "));
        return;
    }
    
    const value = req.query[key];
    const [cust, err] = await da.findCustomer(key, value);
    if (cust) {
        res.send(cust);
    } else {
        res.status(404);
        res.send(err);
    }
});

app.get("/reset", checkApiKey, async (req, res) => {
    const [result, err] = await da.resetCustomers();
    if(result){
        res.send(result);
    }else{
        res.status(500);
        res.send(err);
    }   
});

app.post('/customers', checkApiKey, async (req, res) => {
    const newCustomer = req.body;
    if (newCustomer === null || req.body == {}) {
        res.status(400);
        res.send("missing request body");
    } else {

        const key = "email";
        const value = newCustomer.email;

        const [cust, err] = await da.findCustomer(key, value);
        if (cust) {
            res.status(400);
            res.send("email already used");
            return;
        }
        
        if (err && err !== "no matching customer documents found") {
            res.status(500);
            res.send(err);
            return;
        }
        
        // return array format [status, id, errMessage]
        const [status, id, errMessage] = await da.addCustomer(newCustomer);
        if (status === "success") {
            res.status(201);
            let response = { ...newCustomer };
            response["_id"] = id;
            res.send(response);
        } else {
            res.status(400);
            res.send(errMessage);
        }
    }
});

app.get("/customers/:id", checkApiKey, async (req, res) => {
     const id = req.params.id;
     // return array [customer, errMessage]
     const [cust, err] = await da.getCustomerById(id);
     if(cust){
         res.send(cust);
     }else{
         res.status(404);
         res.send(err);
     }   
});

app.put('/customers/:id', checkApiKey, async (req, res) => {
    const id = req.params.id;
    const updatedCustomer = req.body;

    
    if (updatedCustomer === null || req.body == {}) {
        res.status(400);
        res.send("missing request body");
    } else {
        const updatedCustomerObject = JSON.parse(JSON.stringify(updatedCustomer));
        console.log("updatedCustomerObject: " + JSON.stringify(updatedCustomerObject));
        console.log("updatedCustomerObject.id: " + updatedCustomerObject.id);
        if (id != updatedCustomerObject.id) {
            res.status(400);
            res.send("id in path and body do not match");
            return;
        }

        const key = "email";
        const value = updatedCustomer.email;

        const [cust, err] = await da.findCustomer(key, value);
    
        //console.log ("cust unstring : " + cust);
        //console.log("cust: " + JSON.stringify(cust));
        //console.log("cust.id: " + custObject.id);
        //console.log("custObject : " + JSON.stringify(custObject));
        //console.log("cust.id: " + cust.id);
        //console.log("id: " + id);

        if (cust){
            const custObject = JSON.parse(JSON.stringify(cust[0]));
            if (custObject && custObject.id != id) {
                res.status(400);
                res.send("email already used - test");
                return;
            }
        }

        
        if (err && err !== "no matching customer documents found") {
            res.status(500);
            res.send(err);
            return;
        }

        delete updatedCustomer._id;
        // return array format [message, errMessage]
        const [message, errMessage] = await da.updateCustomer(updatedCustomer);
        if (message) {
            res.send(message);
        } else {
            res.status(400);
            res.send(errMessage);
        }
    }
});

app.delete("/customers/:id", checkApiKey, async (req, res) => {
    const id = req.params.id;
    // return array [message, errMessage]
    const [message, errMessage] = await da.deleteCustomerById(id);
    if (message) {
        res.send(message);
    } else {
        res.status(404);
        res.send(errMessage);
    }
});