# RPY Writer — User Guide
=====================================================

## What is RPY Writer?
RPY Writer is a visual node-based tool for building Ren'Py game scripts
without writing code by hand. You design your game's map, characters,
interactions, and story flow visually, then generate a working .rpy script
with one click.

=====================================================
## GETTING STARTED — READ THIS FIRST
=====================================================

### Step 1: Set Up Your Story Master
When you open RPY Writer, you will be prompted to set up the Story Master
node. This is required before you can build anything else. It defines:
- Your game type (Location Based or Linear Story)
- Your time system (how many periods per day)
- Your characters
- Your point/stat systems
- How your story progresses between chapters
- What appears on your HUD

### Step 2: Build Your Map
Right-click the canvas to add nodes:
- Location nodes — places the player can visit
- Scene nodes — linear story sequences
- Transition nodes — cutscenes between locations or at story events

Connect Location nodes together to define navigation paths.
Select multiple nodes and click "Group Selection" to group them
into a chapter/phase.

### Step 3: Fill In Your Locations
Double-click any Location node to open its editor.
Each location has time-slot columns (Morning, Afternoon, etc.)
based on your Story Master settings.

Inside each time slot you can add interactions — each one defines:
- Who needs to be present (character, no one, item, etc.)
- When it triggers (first time, every time, Nth time, etc.)
- An optional extra condition (flag, stat, item in inventory, day)
- The actual content (dialogue, items, stat changes, etc.)

### Step 4: Set Up Schedulers and Inventory
Use the Schedulers button in the top bar to place characters and items
at specific locations on specific days and times.

Use the Inventory button to define items players can collect,
including their display name, icon, and description.

### Step 5: Generate Your Script
Click "Generate Script" in the top bar. This downloads a .rpy file.

=====================================================
## USING THE GENERATED SCRIPT IN REN'PY
=====================================================

### Renaming the File
The downloaded file will be named after your project (e.g. MyGame.rpy).
You have two options:
1. Rename it to script.rpy and place it in your Ren'Py project's
   game/ folder, replacing the existing script.rpy
2. Keep the filename and paste its contents directly into your
   existing script.rpy file

### Folder Structure
Your Ren'Py project should look like this:
MyGame/
game/
script.rpy        ← your generated script goes here
images/           ← all your background and sprite images go here
audio/            ← music and sound effect files go here
gui/              ← Ren'Py GUI files (leave alone)

=====================================================
## IMAGES AND SPRITES — CRITICAL
=====================================================

### Background Images
In your Location panels you type background image names like:
    bg_living_room_morning

This means Ren'Py will look for a file called:
    game/images/bg_living_room_morning.png

The name must match EXACTLY — including case sensitivity on Mac/Linux.
Common formats: .png, .jpg, .webp

### Character Sprites
When you add a Dialogue block and type a sprite name like:
    alice happy

Ren'Py will look for a file called:
    game/images/alice happy.png

OR if you are using layered images, it will use the Ren'Py
layeredimage system. Refer to Ren'Py documentation for advanced
sprite setups.

### GIF/Video Files
GIF and video filenames you type in GIF/Video blocks must also
exist in your game/images/ or game/ folder. Ren'Py supports
.webm for video files.

### Audio Files
Music and sound effect filenames must exist in your game/audio/ folder.
Common formats: .mp3, .ogg, .wav

Example: if you type "theme_music" in an audio block, Ren'Py
will look for game/audio/theme_music.mp3 (or .ogg, .wav)

=====================================================
## HOW THE GENERATED SCRIPT WORKS
=====================================================

### Visit Tracking
The script uses Ren'Py's "persistent" system to track which
interactions the player has seen. This means:
- First-time interactions only play once, even across multiple saves
- Visit counts carry over between save files
- If you want to reset visit tracking during testing, use
  Ren'Py's console: persistent._clear()

### Time System
Days and time periods are tracked with these variables:
    current_day      — index into active_days list (0 = first day)
    current_period   — index into time_periods list (0 = first period)
    action_count     — counts first-visit interactions completed

Time advances automatically when action_count reaches your
threshold (set in Story Master). You can also advance time
manually using Transition nodes set to Trigger mode.

### Scheduler Keys
The scheduler stores character/item locations as a dictionary.
Keys follow this format:
    DayAbbreviation_period
Examples:
    Mon_morning
    Sat_night
    Wed_day  (for two-period systems)

These are set automatically by the Scheduler panel — you do not
need to edit them manually.

### Progression / Chapters
Each group on your canvas becomes a chapter label in the script.
When the progression condition is met (points threshold, time,
or trigger), the script automatically jumps to the next chapter.

Make sure your groups are numbered correctly on the canvas —
Chapter 1 should be the starting group.

### The HUD Screen
The generated HUD screen displays day, time period, stats, and
an inventory button. It uses Ren'Py's screen language and is
shown automatically at game start.

If you want to customize the HUD appearance (fonts, colors,
position), edit the "screen hud():" section in your script.rpy.

The inventory screen is also generated automatically if you
have items defined.

=====================================================
## KNOWN LIMITATIONS
=====================================================

- Scene node content (dialogue blocks inside scenes) is not yet
  fully written to the script. Scene labels are generated with
  choice menus but block content requires manual addition for now.

- Transition node content is not yet written to the script.
  Transition labels will be added in a future update.

- Choice consequences (branching dialogue) generate a "pass"
  placeholder. You will need to add the consequence code manually
  or wire scene nodes to handle branching.

- The HUD and inventory screens may need styling adjustments
  to match your game's visual design.

- If you change your time period setting in Story Master after
  building locations, existing location data may not match the
  new period structure. Rebuild affected locations if needed.

=====================================================
## TIPS
=====================================================

- Save your project frequently using the Save button (downloads
  a .json file you can reload later with the Load button)

- Name your locations clearly — the variable names in the
  generated script are derived from location names
  (e.g. "Living Room" becomes loc_living_room)

- Characters must be defined in Story Master before they will
  appear in location interaction dropdowns

- Items must be defined in the Inventory panel before they will
  appear in interaction and condition dropdowns

- Groups are numbered by their groupNumber property. If groups
  appear out of order in the script, check that they were
  created in the correct sequence

=====================================================
## SUPPORT
=====================================================

RPY Writer is an independent tool built with React and React Flow.
For Ren'Py documentation and support visit: https://www.renpy.org/doc/html/

=====================================================