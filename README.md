<div align="center">

  <!-- Centered Logo/Banner -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=090a0f&height=200&section=header&text=Snowlead&fontSize=80&fontColor=5759ff" alt="Snowlead Logo" />

  <!-- Badges -->
  <p>
    <a href="#"><img src="https://img.shields.io/badge/Chrome-Extension-blue.svg?style=flat-square&logo=google-chrome" alt="Chrome"></a>
    <a href="#"><img src="https://img.shields.io/badge/JavaScript-ES6-F7DF1E.svg?style=flat-square&logo=javascript" alt="JavaScript"></a>
    <a href="#"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License"></a>
    <a href="#"><img src="https://img.shields.io/badge/Status-Active-brightgreen.svg?style=flat-square" alt="Status"></a>
  </p>

  <!-- Demo Video/GIF -->
  <img src="YAHAN_APNI_EXTENSION_KI_GIF_KA_LINK_DALEIN.gif" alt="Snowlead Demo" width="70%" />

</div>

<br/>

[Quick Start](#quick-start) | [Features](#features) | [Installation](#installation) | [License](#license)

## Why Snowlead?

Snowlead ek fully autonomous, premium Chrome Extension hai jo LinkedIn Recruiter Lite se lead generation ko 100% automate karta hai. Yeh manually profiles open karne aur URLs copy karne ka jhanjhat khatam karta hai. Sirf ek click mein, bot khud pages navigate karta hai, hidden public URLs extract karta hai, aur properly formatted CSV file generate karta hai.

Agar aapka internet slow hai toh iska crash-resilient architecture wait karta hai aur automatically retry karta hai.

## Installation

Snowlead ko install karne ke liye aapko Developer Mode ka use karna hoga.

| Requirement | Description |
| :--- | :--- |
| **Browser** | Google Chrome (Latest Version) |
| **Account** | LinkedIn Recruiter Lite |
| **Download** | Is repository ki ZIP file download karein |

**Steps:**
1. Is repository ko clone ya download karein aur folder extract karein.
2. Apne Chrome browser mein `chrome://extensions/` open karein.
3. Top-right corner se **Developer mode** on karein.
4. **Load unpacked** par click karein aur extracted folder select karein.

## Quick Start

Extracted folder ko load karne ke baad, aap is extension ko use karna shuru kar sakte hain.

```javascript
// Example CSV Output Format
{
  "First Name": "John",
  "Last Name": "Doe",
  "Email": "",
  "LinkedIn URL": "[https://linkedin.com/in/johndoe](https://linkedin.com/in/johndoe)",
  "Country": "United States"
}
