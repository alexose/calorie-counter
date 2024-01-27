const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data.db");

db.serialize(() => {
    db.run(
        `CREATE TABLE items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            calories REAL NOT NULL,
            fat REAL NOT NULL,
            carbs REAL NOT NULL,
            protein REAL NOT NULL,
            consumed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
    );
});
db.close();
