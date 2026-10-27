import 'dotenv/config';

// Imported after dotenv so the Firebase config can read process.env
const { default: app } = await import('./app.js');

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`LearnX API listening on port ${port}`));
