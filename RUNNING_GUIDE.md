# Running GlowIQ After Component Update

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ (check: `node --version`)
- Python 3.8+ (check: `python --version`)
- Git (already installed)

### Step 1: Install Frontend Dependencies
```bash
cd C:\Users\shivi\Downloads\glow12.0
npm install
```

### Step 2: Start Backend Server
**Option A: Using Batch File (Windows)**
```bash
START_BACKEND.bat
```

**Option B: Manual Command**
```bash
python server.py
```

Expected output: `Starting GlowIQ API on http://localhost:8000`

### Step 3: Start Frontend Development Server
**Option A: Using Batch File (Windows)**
```bash
START_FRONTEND.bat
```

**Option B: Manual Command**
```bash
npm run dev
```

Expected output: `http://localhost:3000` or `http://localhost:5173`

### Step 4: Open Browser
Navigate to:
- **http://localhost:3000** (if port 3000)
- OR **http://localhost:5173** (if Vite default)

---

## ✅ What You Should See

### On Any User Page:
1. **Floating Button** in bottom-right corner with 📊 emoji
2. **Hover over button** → Button brightens with glowing shadow
3. **Click button** → Beautiful modal pops up with the form
4. **Fill the form** and click "Download GlowIQ Report"
5. **PDF downloads** to your Downloads folder

---

## 🔧 Project Structure

```
glow12.0/
├── src/
│   ├── components/
│   │   └── SkinReportGenerator.jsx  ← MODIFIED (now a pop-up)
│   ├── pages/
│   ├── store/
│   ├── App.jsx
│   └── main.jsx
├── server.py                        ← Backend API
├── package.json
├── vite.config.js
├── START_BACKEND.bat
├── START_FRONTEND.bat
└── ...
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Kill the process using the port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Backend Not Responding
```
Error: Failed to fetch from http://localhost:8000/api/report/generate
```

**Solution**:
1. Verify backend is running (`START_BACKEND.bat`)
2. Check backend terminal for errors
3. Ensure port 8000 is not blocked

### Issue: Module Not Found
```
Error: Cannot find module 'react' 
```

**Solution**: Install dependencies
```bash
npm install
```

### Issue: Changes Not Showing Up
**Solution**: Clear browser cache and restart dev server
```bash
# Clear cache
Ctrl + Shift + Delete (select "All time")

# Restart dev server
npm run dev
```

---

## 📋 Environment Setup

### .env File (if needed)
Create `.env` file in project root:
```env
VITE_GROQ_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:8000
```

---

## 🎯 Build for Production

### Build Frontend
```bash
npm run build
```

Outputs to `dist/` folder

### Deploy
1. Copy contents of `dist/` to web server
2. Ensure backend API is accessible
3. Update API URLs if needed

---

## 🔗 Important URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | Dev only |
| Backend API | http://localhost:8000 | Dev + Prod |
| API Docs | http://localhost:8000/docs | Dev only |

---

## ✨ What Changed

Only **ONE file** was modified:
- ✅ `src/components/SkinReportGenerator.jsx`

**The modification**:
- 📊 Floating button in bottom-right corner
- Opens full form in beautiful modal
- All original functionality preserved
- No breaking changes

---

## 📚 Additional Resources

- See `CHANGES_SUMMARY.md` for detailed changes
- See `TESTING_GUIDE.md` for testing instructions
- See `IMPLEMENTATION_VERIFICATION.md` for technical details

---

## 💡 Tips

### Development
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Backend
```bash
# View API documentation
http://localhost:8000/docs
```

### Debugging
1. Open DevTools: `F12`
2. Console tab: JavaScript errors
3. Network tab: API calls
4. Elements tab: HTML/CSS inspection

---

## 🆘 Getting Help

### Check These Files
1. Console errors → DevTools (F12)
2. Server errors → Terminal/Command Prompt
3. API errors → Network tab in DevTools

### Common Fixes
1. **Restart both servers** (backend and frontend)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Check port availability** (netstat -ano)
4. **Verify dependencies** (npm install)

---

## 📞 Support

If you encounter issues:
1. Check the terminal for error messages
2. Look at browser console (F12)
3. Verify all prerequisites are installed
4. Make sure both backend and frontend are running

---

## ✅ Success Indicators

- [x] No console errors
- [x] No terminal errors
- [x] Floating button visible
- [x] Modal opens on click
- [x] Form is interactive
- [x] PDF generation works

---

**Status**: ✅ Ready to run
**Last Updated**: $(date)
**Version**: 1.0.0

