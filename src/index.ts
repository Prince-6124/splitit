import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Your routes and API logic
app.post("/splitit", (req, res) => {
  // Your logic to split videos
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
  