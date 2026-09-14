# Campus Connect Portal - JavaScript Interactive Features Guide

## File Location
`client/script.js` - Separate JavaScript file linked to HTML (best practice)

---

## 1. EVENT LISTENERS IMPLEMENTED (4 types required - we have 4+)

### ✅ INPUT EVENT (Real-time feedback)
```javascript
inputField.addEventListener('input', (event) => {
  userInput = event.target.value;
  updateFeedback();  // Updates welcome message as user types
});
```
**Effect**: "Welcome, [name]! 👋 Ready to explore campus?" appears instantly as user types

---

### ✅ KEYPRESS EVENT (Keyboard interaction)
```javascript
inputField.addEventListener('keypress', (event) => {
  if (event.key === 'Enter' && userInput.trim()) {
    showWelcomeMessage();  // Shows notification when Enter pressed
    inputField.value = '';
    userInput = '';
  }
});
```
**Effect**: Pressing Enter key triggers welcome notification

---

### ✅ CLICK EVENT (Button clicks)
```javascript
btnLearnMore.forEach((btn, index) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForEvent(index);  // Registers for event
  });
});
```
**Effect**: Clicking "Learn More" on event cards registers the event and updates counter

---

### ✅ KEYDOWN EVENT (Keyboard shortcut)
```javascript
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'd' && event.ctrlKey) {
    event.preventDefault();
    toggleDarkMode();  // Ctrl+D activates dark mode
  }
});
```
**Effect**: Press Ctrl+D to toggle dark mode

---

## 2. DOM MANIPULATION EXAMPLES

### Create and Append Elements
```javascript
const listItem = document.createElement('li');
listItem.style.cssText = `
  background: #f5f5f5;
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 6px;
  border-left: 4px solid #17483f;
`;
const span = document.createElement('span');
span.textContent = clubName;
listItem.appendChild(span);
interestList.appendChild(listItem);  // Appends to DOM
```

### Remove Elements
```javascript
listItem.style.animation = 'slideUp 0.3s ease-out forwards';
setTimeout(() => listItem.remove(), 300);  // Removes after animation
```

### Change Element Content
```javascript
feedbackContainer.textContent = `Welcome, ${userInput}! 👋 Ready to explore campus?`;
feedbackContainer.style.display = 'block';
```

### Modify Styles Dynamically
```javascript
btnRemove.onmouseover = () => btnRemove.style.background = '#c0392b';
btnRemove.onmouseout = () => btnRemove.style.background = '#e74c3c';
```

---

## 3. INTERACTIVE FEATURES

### Feature 1: Name Input with Real-Time Feedback
- **Event**: `input` (fires as user types)
- **DOM Changes**: Display welcome message below input
- **User Benefit**: Immediate visual feedback

### Feature 2: Club Interest Management
- **Add Functionality**: 
  - Click "Add Interest" button (CLICK event)
  - Creates new list item element
  - Appends to DOM
  - Shows success notification
  
- **Remove Functionality**:
  - Click "✕" button on club item (CLICK event)
  - Removes element from DOM
  - Shows removal notification
  - Updates localStorage

### Feature 3: Event Registration Counter
- **Event**: CLICK on "Learn More" button
- **DOM Changes**: Updates counter text from "Events Registered: 0" → "Events Registered: 2"
- **State Management**: Tracks in `eventRegistrations` array
- **Visual Feedback**: Counter pulses on update

### Feature 4: Toast Notifications
- **Trigger**: After any user action
- **DOM Changes**: Creates floating notification element
- **Animation**: Slides in from bottom-right
- **Auto-Remove**: Disappears after 4 seconds

### Feature 5: Data Persistence
- **Storage**: Uses `localStorage` API
- **Saves**: Club interests survive page refresh
- **Loaded**: On page load, restores saved clubs

---

## 4. STATE MANAGEMENT (Without Hard-Coding)

```javascript
// Global state reflects actual user actions
let eventRegistrations = [];      // Tracks registered events
let clubInterests = [];           // Tracks club interests
let userInput = '';               // Tracks current name input
let darkMode = false;             // Tracks dark mode status
```

All state changes based on **actual user interactions**, not hard-coded values.

---

## 5. PAGE NEVER RELOADS

✅ All interactions are **client-side only**
✅ No form submissions
✅ No page refreshes
✅ DOM updates instantly
✅ All changes remain in memory during session
✅ localStorage persists data across sessions

---

## 6. KEY FUNCTIONS

### `updateFeedback()`
Updates welcome message text based on input field content

### `registerForEvent(index)`
- Adds event to `eventRegistrations` array
- Updates event counter
- Shows success notification

### `addClubInterest(clubName)`
- Creates list item element
- Appends to DOM with animation
- Saves to localStorage
- Shows notification

### `removeClubInterest(clubName, listItem)`
- Removes from `clubInterests` array
- Removes from localStorage
- Animates removal from DOM
- Shows notification

### `showNotification(message, type)`
Creates floating toast notification that auto-dismisses

---

## 7. ANIMATIONS (CSS-IN-JS)

```javascript
// Smooth animations for better UX
@keyframes slideDown { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 1; } to { opacity: 0; } }
@keyframes pulse { 0% { scale: 1; } 50% { scale: 1.05; } }
```

---

## 8. TESTING THE FEATURES

### Test 1: Real-time Input
1. Type in "Enter your name" field
2. Watch welcome message update in real-time
3. ✅ INPUT event working

### Test 2: Add Club Interest
1. Type club name in input
2. Click "Add Interest"
3. Club appears in list below
4. ✅ CLICK event and DOM append working

### Test 3: Remove Club Interest
1. Click "✕" on a club item
2. Club slides out and disappears
3. ✅ CLICK event and DOM remove working

### Test 4: Event Registration
1. Scroll to event cards
2. Click "Learn More" on any event
3. Counter updates: "Events Registered: 1"
4. ✅ CLICK event and state management working

### Test 5: Dark Mode (Bonus)
1. Press Ctrl+D
2. Page colors invert
3. Press Ctrl+D again to return
4. ✅ KEYDOWN event and style manipulation working

---

## 9. FILES STRUCTURE

```
client/
├── index.html        (HTML structure with interactive controls)
├── style.css         (CSS styling and animations)
└── script.js         (JavaScript interactivity)
```

---

## 10. LEARNING OUTCOMES ACHIEVED

✅ DOM Selection using `querySelector`, `querySelectorAll`, `getElementById`
✅ Event Handling: `input`, `keypress`, `click`, `keydown`
✅ Dynamic Content Creation: `createElement`, `appendChild`
✅ Element Removal: `.remove()` with animations
✅ Text Content Modification
✅ Style Manipulation
✅ State Management
✅ Data Persistence with localStorage
✅ Event-Driven Programming Model
✅ No Page Reloads - Pure Client-Side Interactivity

---

## 11. CONSOLE OUTPUT

When page loads, check browser console for:
```
Campus Connect Interactive Script Loaded
Features: Event registration, club interests, dark mode (Ctrl+D)
```

No errors should appear in the console during normal operation.
