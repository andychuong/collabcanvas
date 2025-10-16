# AI Chat Assistant Guide

## Overview

The AI Chat Assistant is an intelligent tool that allows you to create and manipulate canvas shapes using natural language commands. It's powered by OpenAI's GPT-4 and LangChain.

## Setup

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy your API key (it starts with `sk-`)

### 2. Configure the Environment Variable

1. Create a `.env` file in your project root directory (if it doesn't exist)
2. Add the following line:
   ```env
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```
3. Replace `sk-your-key-here` with your actual API key
4. Restart your development server:
   ```bash
   npm run dev
   ```

For detailed setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md)

> ⚠️ **Security**: The `.env` file is already in `.gitignore` to prevent accidentally committing your API key.

## Features

The AI Chat Assistant can execute various types of commands:

### Creation Commands

Create shapes with specific properties:

```
- "Create a red circle at position 100, 200"
- "Add a text layer that says 'Hello World'"
- "Make a 200x300 rectangle"
- "Draw a blue circle with radius 75"
- "Create text 'Welcome' at the center"
```

### Manipulation Commands

Modify existing shapes:

```
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big"
- "Rotate the rectangle left 90 degrees"
- "Make the red circle 100 pixels wide"
- "Move the text to position 300, 400"
```

### Layout Commands

Arrange multiple shapes:

```
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Make a 4x4 grid of blue circles at position 100, 100"
```

### Complex Commands

Create sophisticated layouts:

```
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image, and description"
- "Create a dashboard with header, sidebar, and main content"
```

## Available Tools

The AI Assistant has access to the following tools:

1. **create_circle** - Create circles with specified position, radius, and colors
2. **create_rectangle** - Create rectangles with dimensions and rotation
3. **create_text** - Add text elements with custom styling
4. **create_line** - Draw lines between two points
5. **move_shape** - Move shapes to new positions
6. **resize_shape** - Change shape dimensions
7. **rotate_shape** - Rotate rectangles by degrees
8. **arrange_horizontal** - Arrange shapes in a row
9. **create_grid** - Generate grids of shapes
10. **delete_shape** - Remove shapes from the canvas
11. **get_canvas_info** - Get information about current canvas state

## Tips for Best Results

### Be Specific
- Include exact positions when possible: "at 200, 300" instead of "over there"
- Specify colors: "red", "blue", "#FF0000"
- Include dimensions: "100 pixels wide", "radius 50"

### Use Descriptive Language
The AI can identify shapes by:
- Type: "the circle", "the rectangle"
- Color: "the red circle", "the blue text"
- Content: "the text that says 'Welcome'"

### Complex Layouts
For complex requests, the AI will break them down into individual components:
- "Create a login form" → Creates username label, username input, password label, password input, submit button
- "Make a navigation bar" → Creates background rectangle, multiple text elements for menu items

### Reference Existing Shapes
- "Move the blue rectangle to the center"
- "Resize the largest circle"
- "Delete the red text"

## Example Conversation

```
You: Create a red circle at 300, 200
AI: Created a red circle at position (300, 200) with radius 50

You: Now add text that says "Hello" at 300, 150
AI: Created text "Hello" at position (300, 150) with font size 24

You: Make a 3x3 grid of blue squares starting at 100, 100
AI: Created a 3x3 grid of blue squares

You: Move the red circle to the center
AI: Moved circle to position (512, 384)
```

## Troubleshooting

### "OpenAI API key not configured"
- Check that `VITE_OPENAI_API_KEY` is set in your `.env` file
- Ensure the variable name is exactly `VITE_OPENAI_API_KEY` (case-sensitive)
- Make sure the key starts with `sk-`
- Restart your development server after adding the variable
- Verify the key is valid in your OpenAI dashboard

### "Error executing command"
- Check your internet connection
- Verify your API key is correct and has available credits
- Ensure you have credits in your OpenAI account
- Try rephrasing your command to be more specific

### AI doesn't find the right shape
- Be more specific: "the blue rectangle" instead of "the shape"
- Use color and type together: "the red circle"
- Reference text content: "the text that says 'Welcome'"

### Commands not working as expected
- Try breaking complex commands into smaller steps
- Specify exact coordinates for precise positioning
- Use the canvas info tool: "What shapes are on the canvas?"

### Environment variable not loading
- Ensure your `.env` file is in the project root directory
- Check that the variable name starts with `VITE_` (required by Vite)
- Restart your dev server completely (stop and run `npm run dev` again)
- Check for typos in the variable name

## Privacy & Security

- Your OpenAI API key is stored in your local `.env` file
- The `.env` file is excluded from version control (in `.gitignore`)
- API calls go directly from your browser to OpenAI
- Never commit your `.env` file to Git repositories
- All canvas data is stored in Firebase as per the app's normal operation
- Use different API keys for development and production environments

## Cost Considerations

- Each command sent to the AI uses OpenAI API credits
- GPT-4 Turbo is used for optimal performance
- Typical cost per command: $0.01 - $0.05 USD
- Monitor your usage in the OpenAI dashboard

## Limitations

- Cannot create custom images or load external assets
- Shape manipulation is limited to supported shape types (circle, rectangle, text, line)
- Complex layouts may require multiple commands
- AI interpretation may vary - be specific for best results

## Advanced Usage

### Batch Operations
"Create 5 circles spaced horizontally from 100, 200 to 500, 200"

### Styling
"Create a bold red text that says 'Important' with font size 32"

### Precision
"Make a rectangle at exactly 250, 300 with width 150 and height 100"

### Queries
"What shapes are on the canvas?"
"How many circles do I have?"

## Feedback & Support

If you encounter issues or have suggestions for improving the AI Chat Assistant, please file an issue in the project repository.

