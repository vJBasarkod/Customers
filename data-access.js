const MongoClient = require('mongodb').MongoClient;
const dbName = 'custdb';
const baseUrl = 'mongodb://localhost:27017';
const collectionName = "customers";
const connectString = baseUrl + '/' + dbName;
let collection;

async function dbStartup() {
    const client = new MongoClient(connectString);
    await client.connect();
    collection = client.db(dbName).collection(collectionName);
}

async function getCustomers() {
     try {
         const customers = await collection.find().toArray();
         return [customers, null];
     } catch (err) {
         console.log(err.message);
         return [null, err.message];
     }
}

async function resetCustomers() {
    let data = [{ "id": 0, "name": "Mary Jackson", "email": "maryj@abc.com", "password": "maryj" },
    { "id": 1, "name": "Karen Addams", "email": "karena@abc.com", "password": "karena" },
    { "id": 2, "name": "Scott Ramsey", "email": "scottr@abc.com", "password": "scottr" }];

    try {
        await collection.deleteMany({});
        await collection.insertMany(data);
        const customers = await collection.find().toArray();
        const message = "data was refreshed. There are now " + customers.length + " customer records!"
        return [message, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

async function addCustomer(newCustomer) {
    try {
        const insertResult = await collection.insertOne(newCustomer);
        // return array [status, id, errMessage]
        return ["success", insertResult.insertedId, null];
    } catch (err) {
        console.log(err.message);
        return ["fail", null, err.message];
    }
}

async function getCustomerById(id) {
    try {
        const customer = await collection.findOne({"id": +id});
        // return array [customer, errMessage]
        if(!customer){
          return [ null, "invalid customer number"];
        }
        return [customer, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

async function getCustomerByEmail(email) {
    try {
        const customer = await collection.findOne({"email": email});
        // return array [customer, errMessage]
        if(!customer){
          return [null, "email not used"];
        }
        return [customer, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}   

async function findCustomer(key, value) {
    try {
        if (key === "id") {
            value = +value; // convert to number
        }
        if (value === undefined || value === null) {
            return [null, "value for query string is missing"];
        }
        const query = {[key]: value};

        const customers = await collection.find(query).toArray();
        // return array [customer, errMessage]
        if (customers.length === 0) {
            return [null, "no matching customer documents found"];
        }
        return [customers, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

async function updateCustomer(updatedCustomer) {
    try {
        const filter = { "id": updatedCustomer.id };
        const setData = { $set: updatedCustomer };
        const option = { upsert: true }; // insert if not found
        const updateResult = await collection.updateOne(filter, setData, option);
        // return array [message, errMessage]
        return ["one record updated", null];
    } catch (err) {
        console.log(err.message);
        return [ null, err.message];
    }
}

async function deleteCustomerById(id) {
    try {
        const deleteResult = await collection.deleteOne({ "id": +id });
        if (deleteResult.deletedCount === 0) {
            // return array [message, errMessage]
            return [null, "no record deleted"];
        } else if (deleteResult.deletedCount === 1) {
            return ["one record deleted", null];
        } else {
            return [null, "error deleting records"]
        }
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

dbStartup()
    .then(() => console.log("Database connection established"))
    .catch(err => console.error("Database connection failed:", err));

module.exports = {
    getCustomers,
    resetCustomers,
    addCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomerById,
    findCustomer,
    getCustomerByEmail
};

