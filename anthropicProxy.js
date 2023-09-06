const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");

// Initialize Anthropic SDK
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function checkAnthropicAPI() {
  // Check if the API can talk with Anthropic by making a simple request
  const answer = await anthropic.completions.create({
    model: "claude-2",
    prompt: 'Human:say "pong" \nAssistant:',
    max_tokens_to_sample: 100,
  });
  return answer.completion;
}

// Generate endpoint schema
async function generateEndpointSchema(prompt, filepath) {
  const completion = await anthropic.completions.create({
    model: "claude-2",
    prompt: generatePrompt(prompt, filepath),
    max_tokens_to_sample: 600,
  });
  // get the yaml from the completion

  const regex = /<yaml>(.*?)<\/yaml>/s;
  const match = completion.completion.match(regex);
  return match ? match[1] : null;
}

// Generate prompt for endpoint schema
function generatePrompt(prompt, filepath) {
  return `
Human: Write hello between <yaml></yaml>
Assistant: <yaml>hello</yaml>
Human: Please provide an OpenAPI 3.0 schema for this API endpoint between yaml:
<yaml>
${prompt}:
${fs.readFileSync(filepath, "utf8")}
</yaml>
Assistant:`;
}

// Validate spec
async function validateSpec(spec) {
  const validYaml = await anthropic.completions.create({
    model: "claude-2",
    max_tokens_to_sample: 100000,
    prompt: generateValidationPrompt(spec),
  });

  const regex = /<yaml>(.*?)<\/yaml>/s;
  const match = validYaml.completion.match(regex);
  return match ? match[1] : null;
}

// Generate validation prompt
function generateValidationPrompt(specYaml) {
  return `
Human: Output valid OpenAPI yaml within <yaml></yaml> always:
Assistant: 
<yaml>
openapi: 3.0.0
info:
  title: Example API
  description: An example to demonstrate OpenAPI 3.0
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /users:
    get:
      summary: Gets a list of users
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
  /users/{userId}:
    get:
      summary: Gets a user by ID
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: Success
          content:
            application/json:
              schema: 
                $ref: '#/components/schemas/User'
        404:
          description: User not found
    put:
      summary: Updates a user
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        200:
          description: Success
        404:
          description: User not found
 
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name: 
          type: string
    UserUpdate:
      type: object
      properties:
        name:
          type: string
</yaml>
Human:  ${specYaml}
Output valid OpenAPI yaml within <yaml></yaml> fix errors and output a single yaml file:
Assistant:
`;
}

module.exports = { generateEndpointSchema, validateSpec, checkAnthropicAPI };
