// Test script for /api/engineer-assignments/submissions/all/details endpoint
const http = require("http");

// You need to replace these with actual values
const JWT_TOKEN = process.env.JWT_TOKEN || "your-jwt-token-here"; // Get this from signin response
const HOST = "localhost";
const PORT = 5100;

console.log("🧪 Testing GET /api/engineer-assignments/submissions/all/details");
console.log(
  `📍 URL: http://${HOST}:${PORT}/api/engineer-assignments/submissions/all/details`,
);
console.log(`🔑 Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log("---");

const options = {
  hostname: HOST,
  port: PORT,
  path: "/api/engineer-assignments/submissions/all/details",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${JWT_TOKEN}`,
  },
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📦 Response:`);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error:", error.message);
});

req.end();
