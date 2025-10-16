# AI Chat Quick Start Guide

Get up and running with the AI Chat Assistant in 5 minutes!

## ⚡ Quick Setup

### Step 1: Get Your OpenAI API Key (2 minutes)

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click **"Create new secret key"**
4. Give it a name (e.g., "CollabCanvas")
5. Copy the key (starts with `sk-`)

> ⚠️ **Important**: Save this key somewhere safe - you won't be able to see it again!

### Step 2: Configure Environment Variable (1 minute)

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following line:
   ```env
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```
3. Replace `sk-your-key-here` with your actual API key
4. Restart your development server:
   ```bash
   npm run dev
   ```

✅ **Done!** You're ready to use AI commands.

> 📖 For detailed setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md)

## 🎯 Try These First Commands

Copy and paste these into the AI Chat to get started:

### 1. Create Your First Shape
```
Create a red circle at 300, 200
```

### 2. Add Some Text
```
Add text that says "Hello AI!" at 300, 150
```

### 3. Make a Grid
```
Create a 3x3 grid of blue squares
```

### 4. Move Something
```
Move the red circle to the center
```

### 5. Build Something Cool
```
Create a login form with username and password fields
```

## 📚 Learn More

After you're comfortable with basic commands, explore:

- **[AI_CHAT_GUIDE.md](./AI_CHAT_GUIDE.md)** - Complete feature documentation
- **[AI_CHAT_EXAMPLES.md](./AI_CHAT_EXAMPLES.md)** - 50+ example commands
- **[AI_IMPLEMENTATION_SUMMARY.md](./AI_IMPLEMENTATION_SUMMARY.md)** - Technical details

## 💰 Cost Information

- Each command costs approximately **$0.01 - $0.05 USD**
- Uses GPT-4 Turbo for best results
- You only pay for what you use (no subscription)
- Monitor usage in your [OpenAI Dashboard](https://platform.openai.com/usage)

## 🔒 Privacy

- Your API key is stored **only in your browser**
- Never transmitted to our servers
- Direct communication: Your Browser ↔ OpenAI
- You can clear it anytime in settings

## 🐛 Troubleshooting

### "OpenAI API key not configured"
→ Check that `VITE_OPENAI_API_KEY` is in your `.env` file and restart the dev server

### "Error executing command"
→ Check your internet connection, API key validity, and OpenAI account credits

### AI doesn't understand my command
→ Be more specific:
- ❌ "Make a circle"
- ✅ "Create a red circle at 300, 200"

### Shapes aren't appearing
→ Make sure you're logged in and the canvas is loaded

### Environment variable not loading
→ Ensure the variable starts with `VITE_` and restart your dev server

## 🎓 Pro Tips

1. **Be Specific**: Include colors, positions, and sizes
   ```
   Create a blue circle with radius 75 at position 400, 300
   ```

2. **Reference Existing Shapes**: Describe them clearly
   ```
   Move the blue rectangle to position 500, 400
   ```

3. **Build Complex Layouts Step-by-Step**:
   ```
   Step 1: Create a 3x3 grid of squares
   Step 2: Add text labels to each square
   Step 3: Draw connecting lines between squares
   ```

4. **Ask for Help**: The AI can provide information
   ```
   What shapes are on the canvas?
   ```

## 🚀 Next Steps

Now that you're set up, try these challenges:

### Challenge 1: Wireframe
Create a basic app wireframe with header, sidebar, and main content

### Challenge 2: Flowchart
Build a 5-step process flow with connecting lines

### Challenge 3: Dashboard
Design a dashboard layout with title, stats cards, and chart area

## 📞 Need Help?

- Check [AI_CHAT_GUIDE.md](./AI_CHAT_GUIDE.md) for detailed documentation
- Browse [AI_CHAT_EXAMPLES.md](./AI_CHAT_EXAMPLES.md) for inspiration
- File an issue on GitHub

---

**Have fun creating with AI! 🎨✨**

