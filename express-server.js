import express from 'express';
const app = express();
const port = 3001;  // A different port than Vite's default (3000)
import cors from 'cors';


// Middleware to parse JSON
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
// The /verusidlogin route
app.post("/verusidlogin", async (req, res) => {
  const data = req.body;
  
  // Log received data for debugging purposes
  console.log("Received data:", data); 
  const getidentity  = data.getidentity;
  const challengeId = data.challengeId;
  const deepLink = data.deepLink;  // Destructure challengeId and deepLink from request body
  console.log('Challenge ID:', challengeId);
  console.log('Deep Link:', deepLink);
  console.log("Username", getidentity)

  // Placeholder: Normally, you would validate the challengeId and deepLink and verify login.
  // For this example, we're just returning a sample username.
;  // Replace with real logic to get username
  
  // Respond with the username (or other user data)
  res.json({ getidentity });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
