const fs = require('fs');
const path = require('path');

// Start from Monday of the current week (Jan 19, 2026)
// Current date is Jan 25, 2026 (Sunday-ish/Saturday-ish depending on TZ, strict local time provided is 2026-01-25)
const startDate = new Date('2026-01-19T12:00:00'); 
const days = 21; // 3 weeks
const calendar = [];

for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Create an appointments object with empty slots
    const appointments = {
        "09:00": "Available",
        "10:00": "Available",
        "11:00": "Available",
        "13:00": "Available",
        "14:00": "Available",
        "15:00": "Available"
    };

    calendar.push({
        date: dateStr,
        appointments: appointments
    });
}

const outputPath = path.resolve('/Users/berny/Desktop/conuhacks/ConUHacksX/backend/dist/data/calendar.json');

// Ensure dir exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(calendar, null, 2));
console.log('Calendar generated at ' + outputPath);
