// For Vercel Serverless Function
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
};
