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
  "Draw from Deck",
];

const drinks = [
  "Naked Citrus",
  "Slap & Tickle",
  "Lip Lock",
  "Hot Flash",
  "Gag Reflex",
  "Tangled Sheets",
  "Pulp Friction",
  "Sin on Ice",
  "The Morning After",
];

const vodkaDrinks = {
  "Naked Citrus": {
    ingredients: [
      "grapefruit vodka",
      "lime juice",
      "tonic water",
      "ice",
      "mint leaves",
    ],
    method:
      "Shake vodka with lime juice and ice, pour into glass, top with tonic water and garnish with mint.",
  },
  "Slap & Tickle": {
    ingredients: ["grapefruit vodka", "cranberry juice", "lime juice", "ice"],
    method:
      "Shake vodka, cranberry juice, and lime juice with ice. Strain into a chilled glass.",
  },
  "Lip Lock": {
    ingredients: [
      "grapefruit vodka",
      "soda water",
      "lime juice",
      "salt",
      "ice",
    ],
    method:
      "Rim glass with salt, fill with ice, add vodka and lime juice, top with soda water.",
  },
  "Hot Flash": {
    ingredients: [
      "grapefruit vodka",
      "tonic water",
      "mint leaves",
      "lime juice",
      "ice",
    ],
    method:
      "Muddle mint, shake with vodka and lime juice, top with tonic water over ice.",
  },
  "Gag Reflex": {
    ingredients: ["grapefruit vodka", "cranberry juice", "lime", "ice"],
    method:
      "Squeeze lime into shaker with vodka and cranberry, shake well, strain into glass over ice.",
  },
  "Tangled Sheets": {
    ingredients: [
      "grapefruit vodka",
      "soda water",
      "mint leaves",
      "ice",
      "lime juice",
    ],
    method:
      "Muddle mint, mix with vodka and lime, serve over ice and top with soda water.",
  },
  "Pulp Friction": {
    ingredients: ["grapefruit vodka", "lime juice", "ice", "tonic water"],
    method:
      "Build in glass over ice: vodka, lime juice, and tonic water. Stir gently.",
  },
  "Sin on Ice": {
    ingredients: ["grapefruit vodka", "cranberry juice", "ice", "mint leaves"],
    method:
      "Shake vodka and cranberry with ice, pour over fresh mint in a glass.",
  },
  "The Morning After": {
    ingredients: ["grapefruit vodka", "juice of choice", "ice", "lime juice"],
    method: "Mix vodka and juice with a splash of lime, serve cold over ice.",
  },
  "Cruel Summer": {
    ingredients: [
      "grapefruit vodka",
      "soda water",
      "mint leaves",
      "lime juice",
      "ice",
    ],
    method:
      "Shake vodka and lime with ice, pour into glass, top with soda and mint.",
  },
};

function getRandomReward() {
  const drink = drinks[Math.floor(Math.random() * drinks.length)];
  const payment =
    paymentOptions[Math.floor(Math.random() * paymentOptions.length)];

  let dare = null;
  if (payment.startsWith("Dare Card")) {
    const dareList = dareTexts[payment];
    dare = dareList[Math.floor(Math.random() * dareList.length)];
  }

  const recipe = vodkaDrinks[drink] || null;

  return { drink, payment, dare, recipe };
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

  const { drink, payment, dare, recipe } = getRandomReward();

  const scan = { user, drink, cost: payment, dare, recipe };
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
