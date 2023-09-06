const express = require("express");
const router = express.Router();
const {
  generateEndpointSchema,
  validateSpec,
  checkAnthropicAPI,
} = require("./anthropicProxy");

// Health check route
router.get("/health", async (req, res) => {
  try {
    // Check if the API can talk with Anthropic by making a simple request
    const answer = await checkAnthropicAPI();
    if (answer.includes("pong") === false) {
      return res.status(503).json({ status: "not ok", detail: "API down" });
    }

    return res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", detail: "Internal server error" });
  }
});

router.post("/generate-endpoint-schema", async (req, res) => {
  const { prompt, filepath } = req.body;
  try {
    const schema = await generateEndpointSchema(prompt, filepath);
    res.json({ schema });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

router.post("/validate-spec", async (req, res) => {
  const { spec } = req.body;
  try {
    const validYaml = await validateSpec(spec);
    res.json({ validYaml });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
