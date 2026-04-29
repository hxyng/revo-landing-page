// For Local Development Only
require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const waitlistLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.post('/api/waitlist', waitlistLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        const { error } = await supabase
            .from('waitlist')
            .insert([{ email, source: 'revo-landing-page' }]);

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'This email is already on the waitlist.' });
            }
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error saving email to database' });
        }

        res.status(200).json({ message: 'Email saved' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
