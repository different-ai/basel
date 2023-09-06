# Basel

Basel is a tool designed to help developers avoid writing OpenAPI specifications from scratch. It leverages the power of AI to generate and validate OpenAPI 3.0 schemas for your API endpoints.
Installation

You can install Basel using npm:
`npm i basel-sdk`

## Usage

Here is an example of how to use Basel:
`node main.js --root ./ --include api --exclude node_modules`

This command will generate an OpenAPI specification for all files in the api directory (excluding any in the node_modules directory), and write the specification to a file named spec.yaml.

Basel can be used in two ways:

1. By using the Basel API, which requires a `BASEL_API_KEY` and optionally a BASEL_API_URL.
2. By using the client-side API, which requires an `ANTHROPIC_API_KEY`.

You can provide either a `BASEL_API_KEY` or an `ANTHROPIC_API_KEY`, but not both.

### Basel API

If you have a `BASEL_API_KEY`, Basel will use the Basel API to generate and validate your OpenAPI specifications. If you also have a `BASEL_API_URL`, Basel will use this URL as the base URL for the Basel API.

### Client-side API

If you have an `ANTHROPIC_API_KEY`, Basel will use the client-side API to generate and validate your OpenAPI specifications.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

Basel is licensed under the MIT License.
