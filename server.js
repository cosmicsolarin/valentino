const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;

let scans = [];

const dareTexts = {
  "Dare Card (Flirty)": [
    "Kiss me somewhere new.",
    "Tell me a secret fantasy.",
    "Do a 30-second slow dance with me.",
    "Run your fingers through my hair while we talk.",
    "Send me a flirty voice message right now.",
    "Trace my lips with your finger and don’t stop until I smile.",
    "Give me a gentle kiss on my wrist.",
    "Compliment me in the most seductive way you can.",
  ],
  "Dare Card (Bold)": [
    "Strip without using your hands.",
    "Lick chocolate off your partner.",
    "Do a body shot from a new angle.",
    "Give me a lap dance for 1 minute.",
    "Blindfold yourself and let me kiss any part of your body.",
    "Slowly unbutton your shirt while making eye contact.",
    "Trace your finger along my collarbone and whisper a naughty thought.",
    "Dance like you own the room for 30 seconds.",
  ],
  "Dare Card (Spicy)": [
    "Get tied up and tease me.",
    "Reenact a steamy movie scene.",
    "Use an ice cube to tease a sensitive spot.",
    "Play ‘hot and cold’ with a feather and ice cube on me.",
    "Whisper something naughty in my ear and then kiss my neck.",
    "Give me a massage with no rules — use your hands and lips.",
    "Slowly undress me while maintaining eye contact.",
    "Show me your best seductive pose and hold it for 10 seconds.",
  ],
};

const paymentOptions = [
  "Dare Card (Flirty)",
  "Dare Card (Bold)",
  "Dare Card (Spicy)",
  "A clothing item",
];

const drinks = [
  "Bittersweet Sin",
  "Bare & Bubbly",
  "The Tease",
  "Dark Desire",
  "The Body Shot",
  "Sweet Surrender",
];

function getRandomReward() {
  const drink = drinks[Math.floor(Math.random() * drinks.length)];
  const payment =
    paymentOptions[Math.floor(Math.random() * paymentOptions.length)];

  let dare = null;
  if (payment.startsWith("Dare Card")) {
    const dareList = dareTexts[payment];
    dare = dareList[Math.floor(Math.random() * dareList.length)];
  }

  return { drink, payment, dare };
}

// Store clients for SSE
let clients = [];

app.get("/", (req, res) => {
  res.render("index", { scans, dareTexts });
});

// SSE endpoint
app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Optional: Send a comment line to keep connection alive
  res.write(`:\n\n`);

  // Add client
  clients.push(res);

  // Remove client on close
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

app.post("/api/reset", (req, res) => {
  scans = [];

  return res.status(200).json({ status: "Ok" });
});

app.post("/api/update", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).send("Missing user field");

  const { drink, payment, dare } = getRandomReward();

  const scan = { user, drink, cost: payment, dare };
  scans.push(scan);

  // Notify SSE clients
  clients.forEach((clientRes) => {
    clientRes.write(`data: ${JSON.stringify(scans)}\n\n`);
  });

  console.log(
    `[${new Date().toISOString()}] User: ${user}, Drink: ${drink}, Cost: ${payment}`
  );
  if (dare) console.log(`Dare: ${dare}`);

  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
