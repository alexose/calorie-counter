const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3003;
const db = new sqlite3.Database("./data.db");

const SECRET_KEY = "678rCkqRM#hmcUCpDzLrH^w&";

const authenticate = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];

    // No need to authenticate if the call is coming from localhost
    const isLocal =
        req.connection.remoteAddress === "localhost" ||
        req.connection.remoteAddress === "::1" ||
        req.connection.remoteAddress === "::ffff" ||
        req.connection.remoteAddress === "::ffff:127.0.0.1";

    if (isLocal || (apiKey && apiKey === SECRET_KEY)) {
        next(); // Key is correct, proceed to the route
    } else {
        res.status(401).json({error: "Unauthorized"});
    }
};

app.use(bodyParser.json());

// Serve static files in /dist
app.use(express.static("dist"));

// Require auth for the rest of the endpoints
app.use(authenticate);

// CREATE
app.post("/items", (req, res) => {
    const itemsArray = req.body.items;

    if (!Array.isArray(itemsArray)) {
        return res.status(400).json({error: "Invalid input format"});
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const sql = "INSERT INTO items (name, calories, fat, carbs, protein, consumed_at) VALUES (?, ?, ?, ?, ?, ?)";
        let errorOccurred = false;
        let insertedCount = 0; // Track the number of successful inserts

        // Using a traditional for-loop to allow breaking out
        for (let i = 0; i < itemsArray.length; i++) {
            const item = itemsArray[i];
            const params = [item.name, item.calories, item.fat, item.carbs, item.protein, item.consumed_at];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error(err.message);
                    errorOccurred = true;
                } else {
                    insertedCount++;
                    console.log(
                        `${item.name}: ${item.calories} calories, ${item.fat}g of fat, ${item.carbs}g of carbs, ${item.protein}g of protein.  Consumed at ${item.consumed_at}`
                    );
                }

                // Check if all inserts have completed
                if (insertedCount === itemsArray.length) {
                    if (errorOccurred) {
                        db.run("ROLLBACK");
                        res.status(500).json({error: "An error occurred while inserting items"});
                    } else {
                        db.run("COMMIT");
                        res.status(201).json({message: "All items inserted successfully"});
                    }
                }
            });
        }
    });
});

// READ
app.get("/items", (req, res) => {
    db.all("SELECT * FROM items ORDER BY consumed_at DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({data: rows});
    });
});

app.get("/items/today", (req, res) => {
    const today = new Date();
    const date = today.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"

    // Assuming using a database library like 'mysql' or 'pg'
    const query = `
        SELECT * FROM items 
        WHERE consumed_at >= '${date} 00:00:00' 
        AND consumed_at <= '${date} 23:59:59'`;

    // Execute the query
    db.query(query, (error, results) => {
        if (error) {
            // Handle error
            res.status(500).send("Server error");
        } else {
            // Send the results
            res.json(results);
        }
    });
});

app.get("/items/last7days", (req, res) => {
    // Get the current date and time
    const today = new Date();

    // Subtract 7 days from the current date
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Format dates to 'YYYY-MM-DD'
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split("T")[0];

    const sql = "SELECT * FROM items WHERE DATE(consumed_at) >= ? ORDER BY consumed_at DESC";

    db.all(sql, [sevenDaysAgoString], (err, rows) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({data: rows});
    });
});

// READ
app.get("/items", (req, res) => {
    db.all("SELECT * FROM items", [], (err, rows) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({data: rows});
    });
});

// UPDATE
app.put("/items/:id", (req, res) => {
    const {id} = req.params;
    const {name} = req.body;
    db.run("UPDATE items SET name = ? WHERE id = ?", [name, id], function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({message: `Row(s) updated: ${this.changes}`});
    });
});

// DELETE
app.delete("/items/:id", (req, res) => {
    const {id} = req.params;
    db.run("DELETE FROM items WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({message: `Row(s) deleted: ${this.changes}`});
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
