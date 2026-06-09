# ⚙️ HOW TO SET UP RPY WRITER

This is a local web app that runs on your machine. It does not need an internet connection once installed. Follow these steps exactly and you will be up and running in about five minutes.

---

## STEP 1 — Install Node.js (one time only)

Node.js is the engine that runs this app. You only ever install it once.

**Download it here:** https://nodejs.org

Click the big **"LTS"** button (not "Current"). Install it like any normal program. When it asks about adding to PATH, say yes.

**To check if it worked**, open a terminal and type:
```
node --version
```
You should see a version number like `v20.x.x`. If you do, you're good.

> **Windows:** search for "Command Prompt" or "PowerShell"
> **Mac:** search for "Terminal"

---

## STEP 2 — Install the app's dependencies (one time only)

Open a terminal, navigate to the RPY Writer folder, and run:
```
npm install
```

This downloads everything the app needs into a `node_modules` folder. It takes a minute or two. You only ever do this once (or if you pull an update from GitHub).

> **Tip:** In Windows Explorer you can type `cmd` into the address bar of the folder to open a terminal there directly.

---

## STEP 3 — Launch the app

### The easy way (Windows):
Double-click **`Launch_RPY_Writer.bat`**

### The easy way (Mac / Linux):
Double-click or run **`launch.sh`**

### The manual way (any platform):
Open a terminal in the project folder and run:
```
npm run dev
```

---

## STEP 4 — Open it in your browser

After launching, open your browser and go to:
```
http://localhost:5173
```

That's it. The app is running.

> Leave the terminal window open while you work — closing it stops the app.

---

## STOPPING THE APP

Close the terminal window, or press **Ctrl + C** inside it.

---

## TROUBLESHOOTING

**"npm is not recognized"**
Node.js isn't installed or didn't add itself to PATH. Reinstall it from nodejs.org and make sure to check the PATH option during install.

**"Cannot find module" errors after npm install**
Try deleting the `node_modules` folder and running `npm install` again.

**The browser shows a blank page or an error**
Make sure the terminal is still running (not closed). Try refreshing the browser. If it still fails, stop the app (Ctrl+C) and run `npm run dev` again.

**Port 5173 is already in use**
Another process is using that port. Either close whatever's using it, or Vite will automatically try the next port (5174, etc.) — check the terminal for the actual URL.

---

## UPDATING FROM GITHUB

When a new version is available:
1. Download or pull the latest files
2. Run `npm install` again (in case dependencies changed)
3. Launch as normal

---

*You do not need to know React, JavaScript, or web development to use this app. If it launched and you can see the canvas, you're done with setup.*
