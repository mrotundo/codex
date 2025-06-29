# VS Code Runner for Codex API & UI

This guide explains how to use the VS Code task runner to easily start and manage the Codex API server and UI.

## 🚀 Quick Start

### Method 1: Using VS Code Tasks (Recommended)

1. **Open VS Code Command Palette**: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)

2. **Run Task**: Type "Tasks: Run Task" and select it

3. **Choose a task**:
   - **`Start Codex API & UI (Fresh)`** - First time setup + start servers
   - **`Start Codex API & UI`** - Start servers (if already set up)
   - **`Stop All Servers`** - Stop both servers

### Method 2: Using the Terminal

```bash
# First time setup
./start-api.sh

# Windows
start-api.bat
```

### Method 3: Using VS Code Debug

1. Go to the Debug panel (Cmd+Shift+D)
2. Select **"Launch Codex API & UI"** from the dropdown
3. Press F5 or click the green play button

## 📋 Available Tasks

### Setup Tasks
- **`Install All Dependencies`** - Install npm packages for both projects
- **`Setup Codex API`** - Install dependencies + initialize database

### Server Tasks  
- **`Start Backend Server`** - Start only the API server (port 4133)
- **`Start Frontend Server`** - Start only the UI server (port 4123)
- **`Start Codex API & UI`** - Start both servers
- **`Start Codex API & UI (Fresh)`** - Complete setup + start servers

### Build Tasks
- **`Build Backend`** - Build the API server
- **`Build Frontend`** - Build the UI  
- **`Build All`** - Build both projects

### Utility Tasks
- **`Initialize Database`** - Create/reset the SQLite database
- **`Stop All Servers`** - Kill all running servers

## 🎯 Task Shortcuts

You can bind keyboard shortcuts to frequently used tasks:

1. Open Keyboard Shortcuts: `Cmd+K Cmd+S`
2. Search for "workbench.action.tasks.runTask"
3. Add a keybinding, then select the specific task

Example keybindings to add to `keybindings.json`:
```json
[
  {
    "key": "cmd+shift+s",
    "command": "workbench.action.tasks.runTask",
    "args": "Start Codex API & UI"
  },
  {
    "key": "cmd+shift+x", 
    "command": "workbench.action.tasks.runTask",
    "args": "Stop All Servers"
  }
]
```

## 🐛 Debugging

### Debug Configurations

- **`Debug Backend Server`** - Debug the API server with breakpoints
- **`Debug Frontend`** - Debug the React app in Chrome
- **`Full Stack Debug`** - Debug both frontend and backend simultaneously

### How to Debug

1. Set breakpoints in your code
2. Select debug configuration
3. Press F5 to start debugging

## 🔧 Troubleshooting

### Port Already in Use

If you see "Port already in use" errors:

```bash
# Find process using port 4123
lsof -i :4123

# Find process using port 4133  
lsof -i :4133

# Kill process
kill -9 <PID>
```

Windows:
```cmd
# Find process
netstat -ano | findstr :4123

# Kill process
taskkill /PID <PID> /F
```

### Dependencies Not Found

Run the setup task:
1. `Cmd+Shift+P` → "Tasks: Run Task"
2. Select "Setup Codex API"

### Database Issues

Reset the database:
1. Delete `codex-server/database/codex.db`
2. Run "Initialize Database" task

## 📁 VS Code Workspace Settings

The workspace includes:
- TypeScript configuration
- ESLint setup
- Tailwind CSS IntelliSense
- Recommended extensions
- Task definitions
- Debug configurations

## 🎨 Recommended Extensions

Install recommended extensions when prompted, or manually install:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript extensions
- React snippets

## 🖥️ Terminal Integration

The tasks will open in the VS Code integrated terminal with:
- Color-coded output
- Separate panels for each server
- Automatic problem detection
- Click-to-navigate errors

## 💡 Tips

1. **Quick Restart**: Use `Cmd+Shift+X` to stop, then `Cmd+Shift+S` to start (with keybindings)

2. **View Logs**: The terminal panels show real-time logs from both servers

3. **Hot Reload**: Both servers support hot reload - just save your files

4. **Multiple Windows**: Tasks work across VS Code windows in the same workspace

5. **Task Status**: Check the status bar for running tasks

Happy coding with Codex! 🚀