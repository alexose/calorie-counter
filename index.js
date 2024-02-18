const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const http = require("http");
const fs = require("fs");

const app = express();
const ws = require("ws");

const port = 3003;
const db = new sqlite3.Database("./data.db");

const secrets = require("./secrets.js");
const SECRET_KEY = secrets.SECRET_KEY;
const OPENAI_KEY = secrets.OPENAI_KEY;

const openai = require("openai");
const openAiInstance = new openai({apiKey: OPENAI_KEY});
const prompt = fs.readFileSync("./prompt.txt", "utf8");

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

// Start new session
app.post("/session", (req, res) => {
    // Generate a 20 character random string
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Save the session ID in the database
    const sql = "INSERT INTO sessions (token) VALUES (?)";
    db.run(sql, sessionId, function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        } else {
            res.status(200).json({sessionId});
        }
    });
});

// Set calorie targets
app.post("/session/:id", (req, res) => {
    const {id} = req.params;
    const {calories, protein, fat, carbs} = req.body;

    const sql =
        "UPDATE sessions SET calorie_target = ?, protein_target = ?, fat_target = ?, carbs_target = ? WHERE token = ?";
    db.run(sql, [calorie_target, protein_target, fat_target, carbs_target, id], function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({message: `Row(s) updated: ${this.changes}`});
    });
});

// Get session
app.get("/session/:id", (req, res) => {
    const {id} = req.params;
    db.get("SELECT * FROM sessions WHERE token = ?", id, (err, row) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({data: row});
    });
});

// CREATE
app.post("/items", (req, res) => {
    const itemsArray = req.body.items;

    if (!Array.isArray(itemsArray)) {
        return res.status(400).json({error: "Invalid input format"});
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const sql =
            "INSERT INTO items (name, calories_low, fat_low, carbs_low, protein_low, calories, fat, carbs, protein, calories_high, fat_high, carbs_high, protein_high, consumed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        let errorOccurred = false;
        let insertedCount = 0; // Track the number of successful inserts

        // Using a traditional for-loop to allow breaking out
        for (let i = 0; i < itemsArray.length; i++) {
            const item = itemsArray[i];
            const params = [
                name,
                calories_low,
                calories,
                calories_high,
                protein_low,
                protein,
                protein_high,
                fat_low,
                fat,
                fat_high,
                carbs_low,
                carbs,
                carbs_high,
                fiber_low,
                fiber,
                fiber_high,
                alcohol_low,
                alcohol,
                alcohol_high,
                consumed_at,
            ];

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

// DELETE
app.delete("/item/:id", (req, res) => {
    const {id} = req.params;
    db.run("DELETE FROM items WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({message: `Row(s) deleted: ${this.changes}`});
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
    const dateString = today.toISOString().split("T")[0]; // Format as 'YYYY-MM-DD'

    const sql = "SELECT * FROM items WHERE DATE(consumed_at) >= ? ORDER BY consumed_at DESC";

    db.all(sql, [dateString], (err, rows) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.status(200).json({data: rows});
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

// Submit to OpenAI API and stream results back
async function sendAndStream(ws, message) {
    const currentPrompt = prompt.replace("{{date}}", new Date().toLocaleString());
    const request = {
        model: "gpt-4",
        messages: [{role: "user", content: currentPrompt + "\n" + message}],
        stream: true,
    };

    const stream = openAiInstance.beta.chat.completions.stream(request);
    let type = null;
    let results = "";
    stream
        .on("content", data => {
            // If the first token is a number, we assume it's a list of items
            if (type === null) {
                const firstToken = data;
                console.log(isNaN(firstToken), firstToken);
                if (!isNaN(firstToken)) {
                    type = "items";
                } else if (firstToken.toLowerCase() === "targets") {
                    type = "targets";
                }
                return;
            }

            // Begin recording the data
            if (type == "items" || type == "targets") {
                results += data;
                const newlineCount = (results.match(/\n/g) || []).length;
                try {
                    const obj = JSON.parse(results);
                    type = "done";
                    if (type === "items") {
                        recordItems(ws, obj);
                    } else if (type === "targets") {
                        recordTargets(ws, obj);
                    }
                } catch (e) {
                    // If we can't parse the JSON, it's not complete yet
                }
                return;
            }

            // If we're done with data, stream each individual item back to the client
            ws.send(JSON.stringify({type: "message", data}));
        })
        .on("end", () => {
            console.log("Stream ended"); // End of streaming
            ws.send(JSON.stringify({type: "end"}));
        })
        .on("error", error => {
            console.error("Error:", error.message); // Handle errors
            ws.send(JSON.stringify({type: "error", data: error.message}));
        });
}

async function sendWelcomePrompt(ws) {
    const welcomePrompt = "Please welcome the user to Alex's calorie tracker version one.";

    const requestData = {
        model: "gpt-4",
        messages: [{role: "user", content: welcomePrompt}],
        stream: true,
    };

    const stream = await openAiInstance.beta.chat.completions.stream(requestData);

    stream
        .on("content", data => {
            ws.send(JSON.stringify({type: "message", data}));
        })
        .on("end", () => {
            console.log("Stream ended"); // End of streaming
            ws.send(JSON.stringify({type: "end"}));
        })
        .on("error", error => {
            console.error("Error:", error.message); // Handle errors
            ws.send(JSON.stringify({type: "error", data: error.message}));
        });
}

// Record the items in the database
async function recordItems(ws, arr) {
    const sql =
        "INSERT INTO items (name, calories_low, calories, calories_high, protein_low, protein, protein_high, fat_low, fat, fat_high, carbs_low, carbs, carbs_high, consumed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.run(sql, arr, function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Recorded ${arr.join(", ")}`);
            ws.send(JSON.stringify({type: "reload"}));
        }
    });
}

// Record targets in the database
async function recordTargets(ws, arr) {
    const sql =
        "UPDATE sessions SET calorie_target = ?, protein_target = ?, fat_target = ?, carbs_target = ? WHERE token = ?";

    db.run(sql, arr, function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Recorded ${arr.join(", ")}`);
            ws.send(JSON.stringify({type: "reload"}));
        }
    });
}

// Start the server
const server = http.createServer(app);

const wss = new ws.WebSocketServer({server: server});

wss.on("connection", async function (ws, request) {
    const hash = request.url.replace("/ws/", "");

    if (!hash || hash.length < 10) {
        ws.close();
        return;
    }

    // Get session information from the database
    const sql = "SELECT * FROM sessions WHERE token = ?";
    const session = await new Promise((resolve, reject) => {
        db.get(sql, hash, (err, row) => {
            if (err) {
                ws.send(JSON.stringify({type: "no_session"}));
                reject(err);
            } else {
                resolve(row);
            }
        });
    });

    ws.send(JSON.stringify({type: "session", data: session}));

    ws.on("message", function (json) {
        const message = JSON.parse(json).message;
        if (message === "ping") {
            ws.send("pong");
            return;
        } else if (message === "welcomePrompt") {
            sendWelcomePrompt(ws);
        } else {
            sendAndStream(ws, message.toString());
        }
        console.log("received: %s", message);
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
