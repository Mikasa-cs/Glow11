# Testing Guide - SkinReportGenerator Pop-up Component

## Quick Start Testing

### Step 1: Start the Application

#### Option A: Using Batch Files (Recommended for Windows)
1. **Start Backend**:
   - Open Command Prompt
   - Navigate to project: `cd C:\Users\shivi\Downloads\glow12.0`
   - Run: `START_BACKEND.bat`
   - Wait for: "Starting GlowIQ API on http://localhost:8000"

2. **Start Frontend** (New Command Prompt):
   - Navigate to project: `cd C:\Users\shivi\Downloads\glow12.0`
   - Run: `START_FRONTEND.bat`
   - Wait for: "http://localhost:3000" or "http://localhost:5173"

#### Option B: Manual npm/python commands
```bash
# Terminal 1 - Backend
python server.py

# Terminal 2 - Frontend
npm run dev
```

### Step 2: Test the Component

1. **Login** to the application if required
2. **Navigate** to the storefront/user page
3. **Look for** 📊 floating button in the **bottom-right corner**
4. **Test interactions**:
   - Hover over button → should brighten and shadow should increase
   - Click button → modal should appear with dark overlay
   - Modal should contain the form with all fields
   - Try filling in form fields
   - Click ✕ button → modal should close
   - Click overlay area → modal should close

---

## Detailed Testing Checklist

### Visual Tests
- [ ] Floating button visible in bottom-right corner
- [ ] Button is circular (60×60px)
- [ ] Button shows 📊 emoji
- [ ] Button doesn't obstruct other content
- [ ] Button appears above other elements (z-index correct)

### Hover State Tests
- [ ] Button color changes on hover
- [ ] Button shadow increases on hover
- [ ] Cursor changes to pointer
- [ ] Hover effect is smooth

### Click & Modal Tests
- [ ] Clicking button opens modal
- [ ] Modal appears centered on screen
- [ ] Modal has semi-transparent overlay behind it
- [ ] Modal can't be dragged (normal behavior)
- [ ] Close button (✕) visible in top-right of modal
- [ ] Close button text is white and visible

### Form Tests (Inside Modal)
- [ ] "GlowIQ Report" header visible
- [ ] "Your Personalized Skin Analysis" heading visible
- [ ] Personal details section with name and age inputs
- [ ] Skin type section with 5 buttons (Oily, Dry, Combination, Sensitive, Normal)
- [ ] Main concerns section with 6 buttons (Acne, Brightening, Anti-Aging, Pore-Care, Moisturizing, Soothing)
- [ ] Budget range section with 4 buttons
- [ ] Chat history summary (if applicable)
- [ ] Product recommendations summary (if applicable)
- [ ] "Download GlowIQ Report" button at bottom

### Form Interaction Tests
- [ ] Typing in name input works
- [ ] Typing in age input works
- [ ] Skin type buttons are clickable
- [ ] Skin type selection toggles active state
- [ ] Concern buttons are selectable (multiple)
- [ ] Budget buttons are selectable (single)
- [ ] Form fields maintain values when modal closes and reopens

### Close Modal Tests
- [ ] Clicking close button (✕) closes modal
- [ ] Clicking overlay outside modal closes it
- [ ] Pressing Escape key closes modal (if implemented)
- [ ] Modal smoothly disappears

### PDF Generation Tests
- [ ] Select a skin type (required field)
- [ ] Click "Download GlowIQ Report" button
- [ ] Button shows loading spinner and "Generating PDF..." text
- [ ] No errors appear in console
- [ ] PDF downloads to Downloads folder
- [ ] Downloaded file has correct name format: `GlowIQ-Report-{name}.pdf`
- [ ] PDF opens successfully

### Error Handling Tests
- [ ] Try to generate report without selecting skin type
- [ ] Error message appears: "Please select your skin type."
- [ ] Error message styled with red background
- [ ] Error message has ! icon
- [ ] Error disappears when user selects skin type

### Responsiveness Tests
- [ ] Button visible on mobile (bottom-right corner)
- [ ] Modal readable on small screens
- [ ] Form scrolls if content overflows
- [ ] Modal not too large for screen size

### Browser Compatibility Tests
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari (if available)
- [ ] Test on Edge

---

## Common Issues & Solutions

### Issue: Button not visible
**Solution**: 
- Check browser console for errors (F12 → Console tab)
- Check if component is imported in the page
- Verify z-index issue (open DevTools, inspect button)

### Issue: Modal doesn't open
**Solution**:
- Check browser console for JavaScript errors
- Verify onClick handler is working (add console.log)
- Check if setIsOpen state is updating

### Issue: Form fields not working
**Solution**:
- Check console for errors
- Verify onChange handlers
- Check if form state is being updated

### Issue: PDF download fails
**Solution**:
- Verify backend is running (localhost:8000)
- Check network tab in DevTools
- Verify API response status
- Check browser console for fetch errors

### Issue: Styling looks off
**Solution**:
- Verify theme prop is passed correctly
- Check if inline styles are conflicting
- Inspect element to see applied styles
- Clear browser cache (Ctrl+Shift+Del)

---

## Expected Behavior Summary

1. ✅ Button always visible in bottom-right (even while scrolling on long pages)
2. ✅ Modal appears on top of all content when opened
3. ✅ Form preserves user input until page refresh
4. ✅ PDF generation happens in background (async)
5. ✅ Component doesn't affect other page elements
6. ✅ Component is fully self-contained

---

## Performance Notes

- Button rendering: Minimal overhead (single fixed element)
- Modal: Only rendered when isOpen is true (good performance)
- Form: Same performance as before
- No new dependencies added

---

## Files to Check if Issues Occur

1. **Component**: `src/components/SkinReportGenerator.jsx`
   - Check syntax, state management, JSX structure

2. **Backend API**: `server.py`
   - Check `/api/report/generate` endpoint
   - Verify it's running on port 8000

3. **Browser Console**: F12 → Console tab
   - Look for JavaScript errors
   - Check network requests (F12 → Network tab)

---

## Success Criteria

✅ All checkboxes in Testing Checklist pass
✅ No errors in browser console
✅ PDF generation works
✅ Form interactions smooth
✅ Visual appearance matches design
✅ No breaking changes to other components

