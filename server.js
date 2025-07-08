const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - the ship's rigging
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize SQLite database - our treasure chest
const db = new sqlite3.Database('skills.db');

// Create tables if they don't exist - setting up the ship's manifest
db.serialize(() => {
    // Team members table
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT DEFAULT '🧑‍💻',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Skills table
    db.run(`CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        icon TEXT DEFAULT '⚡'
    )`);
    
    // Member skills junction table - the skill matrix itself
    db.run(`CREATE TABLE IF NOT EXISTS member_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        skill_id INTEGER,
        level INTEGER CHECK(level >= 1 AND level <= 5),
        FOREIGN KEY(member_id) REFERENCES members(id),
        FOREIGN KEY(skill_id) REFERENCES skills(id),
        UNIQUE(member_id, skill_id)
    )`);
    
    // Insert some sample data - starter crew and skills
    db.get("SELECT COUNT(*) as count FROM members", (err, row) => {
        if (row.count === 0) {
            // Sample team members
            const members = [
                ['Captain JavaScript', 'Full Stack Developer', '🏴‍☠️'],
                ['Admiral Python', 'Backend Engineer', '🐍'],
                ['Commander React', 'Frontend Specialist', '⚛️'],
                ['Lieutenant Docker', 'DevOps Engineer', '🐳']
            ];
            
            members.forEach(member => {
                db.run("INSERT INTO members (name, role, avatar) VALUES (?, ?, ?)", member);
            });
            
            // Sample skills
            const skills = [
                ['JavaScript', 'Frontend', '🟨'],
                ['Python', 'Backend', '🐍'],
                ['React', 'Frontend', '⚛️'],
                ['Node.js', 'Backend', '🟢'],
                ['Docker', 'DevOps', '🐳'],
                ['SQL', 'Database', '🗄️'],
                ['Git', 'Tools', '📝'],
                ['AWS', 'Cloud', '☁️']
            ];
            
            skills.forEach(skill => {
                db.run("INSERT INTO skills (name, category, icon) VALUES (?, ?, ?)", skill);
            });
            
            // Sample skill assignments
            setTimeout(() => {
                const skillAssignments = [
                    [1, 1, 5], [1, 3, 4], [1, 4, 5], [1, 7, 3],
                    [2, 2, 5], [2, 4, 4], [2, 6, 4], [2, 8, 3],
                    [3, 1, 4], [3, 3, 5], [3, 7, 4],
                    [4, 5, 5], [4, 8, 4], [4, 7, 5]
                ];
                
                skillAssignments.forEach(assignment => {
                    db.run("INSERT INTO member_skills (member_id, skill_id, level) VALUES (?, ?, ?)", assignment);
                });
            }, 100);
        }
    });
});

// API Routes - the ship's navigation charts

// Get all team members with their skills
app.get('/api/members', (req, res) => {
    const query = `
        SELECT m.*, 
               GROUP_CONCAT(s.name || ':' || ms.level || ':' || s.icon) as skills
        FROM members m
        LEFT JOIN member_skills ms ON m.id = ms.member_id
        LEFT JOIN skills s ON ms.skill_id = s.id
        GROUP BY m.id
        ORDER BY m.name
    `;
    
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Parse skills data
        const members = rows.map(row => ({
            ...row,
            skills: row.skills ? row.skills.split(',').map(skill => {
                const [name, level, icon] = skill.split(':');
                return { name, level: parseInt(level), icon };
            }) : []
        }));
        
        res.json(members);
    });
});

// Get all available skills
app.get('/api/skills', (req, res) => {
    db.all("SELECT * FROM skills ORDER BY category, name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new team member
app.post('/api/members', (req, res) => {
    const { name, role, avatar } = req.body;
    db.run("INSERT INTO members (name, role, avatar) VALUES (?, ?, ?)", 
           [name, role, avatar || '🧑‍💻'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Member added to the crew!' });
    });
});

// Add new skill
app.post('/api/skills', (req, res) => {
    const { name, category, icon } = req.body;
    db.run("INSERT INTO skills (name, category, icon) VALUES (?, ?, ?)", 
           [name, category, icon || '⚡'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'New skill discovered!' });
    });
});

// Update member skill level
app.post('/api/member-skills', (req, res) => {
    const { member_id, skill_id, level } = req.body;
    db.run(`INSERT OR REPLACE INTO member_skills (member_id, skill_id, level) 
            VALUES (?, ?, ?)`, [member_id, skill_id, level], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Skill level updated!' });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server - hoist the colors!
app.listen(PORT, () => {
    console.log(`🏴‍☠️ Skill Matrix Server sailing on port ${PORT}`);
    console.log(`⚓ Navigate to http://localhost:${PORT} to board the ship!`);
});