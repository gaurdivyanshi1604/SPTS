# Student Performance Tracker System (SPTS) v1.0
## Developed per Software Requirements Specification (SRS)

This project contains three distinct components organized in one single folder ready for VS Code:

1. **`index.html`** - **Frontend**: Responsive UI, Light/Dark mode, Dashboards, Charts, SRS System Requirements Pop-up.
2. **`Backend.java`** - **Backend**: Pure Java HTTP REST Server compliant with the SRS document.
3. **`data.json`** - **Database / JSON Data**: All users (Dhruv Chadha, Divyansh Carpenter, Divyansh Deore, Dhruv Nigam, Divyanshi Gaur, Divyanshi Bhawsar), marks (MST1, MST2, Internal, End Sem), attendance, and subjects.
4. **`app.js`** - Client-side state manager and API bridge connecting frontend to the backend.

---

### How to Run in VS Code

#### Option A: Running with Java Backend (Per SRS Requirement)
1. Open this folder in **VS Code**.
2. Open a terminal in VS Code (`Ctrl + ~`).
3. Compile and run `Backend.java`:
   ```bash
   javac Backend.java
   java Backend
   ```
4. Open your browser at:
   ```
   http://localhost:8080/
   ```

#### Option B: Quick Preview (Live Server or Python)
You can also run directly with any static server or VS Code Live Server extension:
```bash
python -m http.server 5500
```
Then open `http://localhost:5500/`.

---

## Demo Login

The project includes sample admin, teacher,
and student accounts for testing.

Demo login accounts are available in the
data.json file.

