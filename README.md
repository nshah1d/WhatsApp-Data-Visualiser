# WhatsApp Data Visualiser

![Status](https://img.shields.io/badge/Status-Production-success) ![Privacy](https://img.shields.io/badge/Privacy-Local%20Only-green) ![Platform](https://img.shields.io/badge/Architecture-Responsive-blue) ![License](https://img.shields.io/badge/License-MIT-orange) [![Live Demo](https://img.shields.io/badge/Demo-Live%20Preview-31B33B)](https://www.nauman.cc/demo/whatsapp/)

A high-fidelity, privacy-focused visualisation engine for WhatsApp chat exports.

This application transforms raw, unstructured `_chat.txt` logs and media assets into a fully interactive, searchable, and responsive application interface. Engineered with a "Zero-Dependency" philosophy, it operates without external frameworks, databases, or cloud services, ensuring absolute data sovereignty.

---

## Key Capabilities

* **Zero-Dependency Architecture:** Built exclusively with vanilla JavaScript (ES6+) and PHP. No Node_modules, no build pipelines, and no bloat.
* **Data Sovereignty (Privacy First):** The system runs entirely within your local environment or private server. Sensitive chat data is never transmitted to third-party clouds.
* **High-Performance Rendering:** Utilises custom DOM virtualisation and lazy-loading algorithms to render massive chat histories (10,000+ messages) and heavy media libraries (500MB+) with zero layout thrashing.
* **Context-Aware Media Drawer:** A dedicated utility panel that aggregates, categorises, and previews attachments (Images, Video, Documents) independently of the message stream.
* **Advanced Data Normalisation:** Proprietary Regex logic cleans and structures chaotic chat logs, handling multi-line messages, system events, and timestamp variations automatically.

---

## Adaptive Architecture

The interface features a responsive "Glass" UI that adapts its layout logic based on the host device capabilities.

### Desktop: The Command Centre
On high-resolution displays, the application renders a productivity-focused **Three-Pane Layout**:
* **Navigation Sidebar:** Persistent access to chat archives.
* **Active Thread:** Wide-screen message view with granular search controls.
* **Inspector Panel:** Side-by-side media browsing without context switching.

### Mobile: The Field Unit
On touch devices (<768px), the system shifts to a **Native-App Emulation Mode**:
* **Off-Canvas Navigation:** Slide-out drawers for navigation and media maximize the reading viewport.
* **Touch Optimisation:** Enlarged hit targets and swipe-friendly gestures.
* **Smart Viewport:** Disables accidental zooming (`user-scalable=no`) to mimic native application behaviour.
* **Adaptive Grid:** Media galleries dynamically reflow columns to maintain visual clarity on narrower screens.

---

## Virtualisation & Navigation Engine

To handle multi-gigabyte chat logs without crashing the browser, the application utilises a custom **Bi-Directional Virtual Scrolling** algorithm:

* **Teleportation Logic:** When jumping to a search result, the engine bypasses linear scrolling. Instead, it calculates the target index, wipes the DOM to free memory, and injects a localised "slice" of history (e.g., 20 messages before/after).
* **Bi-Directional Loading:** Unlike standard infinite scroll (which only looks up), this engine detects scroll boundaries in both directions. Users can scroll up to load older context or down to read towards the present.
* **Asset Lazy-Loading:** Heavy media assets (images/videos) outside the active viewport are effectively garbage-collected, keeping the memory footprint minimal regardless of the jump depth.
* **Context Restoration:** A "Return to Present" floating action button (FAB) automatically detects when the user is viewing historical data and offers a one-click return to the live conversation end.

---

## Technical Specifications

This project serves as a demonstration of advanced **Full Stack Engineering** without reliance on abstraction layers.

* **Frontend Core:** Vanilla JS with Asynchronous Fetch API for non-blocking data ingestion.
* **Text Processing:** Complex Regular Expression (Regex) engines to parse non-standardised log files into strict JSON objects.
* **Media Handling:** Custom video player controls with "Auto-Pause-Others" logic to prevent audio overlap.
* **Security:** Base64 encoding (`btoa`) for sanitising DOM IDs, preventing selector errors from special characters in filenames.
* **Visual System:** CSS Variables-based Dark Mode with SVG iconography for resolution-independent sharpness.

---

## Technologies

**Core Stack:** ![PHP](https://img.shields.io/badge/PHP-Backend-777BB4) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E) ![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26) ![CSS3](https://img.shields.io/badge/CSS3-Grid%2FFlex-1572B6)

**Engineering:** ![Regex](https://img.shields.io/badge/Regex-Parsing-critical) ![JSON](https://img.shields.io/badge/JSON-Data%20Structure-lightgrey) ![Git](https://img.shields.io/badge/Git-Version%20Control-F05032)

---

## Configuration

To enable accurate message alignment, you must define the "Host User."

1.  Open **`app.js`**.
2.  Locate the configuration constant at the top of the file:
    ```javascript
    const MY_NAME = "John Doe"; 
    ```
3.  Update this string to match the exact display name found in your exported `_chat.txt` logs.

---

## Deployment Protocol

1.  **Deploy Core Files:**
    Upload `index.html`, `app.js`, `style.css`, and `scan.php` to any PHP-enabled web server (Apache/Nginx).

2.  **Ingest Data:**
    * **Export:** In WhatsApp, select **Export Chat** > **Attach Media**.
    * **Deploy:** Unzip the resulting folder and upload it directly to the server directory (same level as `index.html`).

3.  **Initialise:**
    * Navigate to the URL. The application will auto-scan the directory, index the chat folders, and build the UI dynamically.

### Directory Hierarchy

```text
/public_html/whatsapp-viewer/
├── index.html          # Application Shell
├── app.js              # State Management & Logic
├── style.css           # Visual Theme & Responsive Rules
├── scan.php            # File System Indexer
├── Family_Group/       # <--- Your WhatsApp Export Folder
│   ├── _chat.txt
│   ├── IMG-20240101.jpg
│   └── ...
└── Project_Team/       # <--- Another Export Folder
    ├── _chat.txt
    └── ...
```
---

<div align="center">
<br>

**_Architected by Nauman Shahid_**

<br>

[![Portfolio](https://img.shields.io/badge/Portfolio-nauman.cc-000000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.nauman.cc)
[![GitHub](https://img.shields.io/badge/GitHub-nshah1d-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/nshah1d)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nshah1d/)

</div>
<br>

---