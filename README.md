# ToonForge Studio — Auto Animation Prototype

अपनी कहानी लिखें और “कहानी से ऑटो एनिमेशन बनाएँ” दबाएँ। ऐप कहानी को वाक्यों में बाँटता है, हर सीन के लिए कुछ बेसिक एक्शन (चलना, दौड़ना, बात करना, अभिवादन, नाचना, हैरान होना) पहचानता है और 3D पात्रों को एनिमेट करके सीन चलाता है।

## सीमाएँ साफ-साफ
- यह GitHub Pages पर चलने वाला ब्राउज़र प्रोटोटाइप है, असली generative AI text-to-video नहीं।
- कैरेक्टर procedural और पहले से बने हैं; कहानी के हर खास किरदार/एक्शन को समझने की क्षमता सीमित है।
- आवाज़ डिवाइस के Speech Synthesis पर निर्भर है; कुछ ब्राउज़र में हिंदी आवाज़ उपलब्ध नहीं हो सकती।
- वीडियो अभी WebM में रिकॉर्ड होती है; आवाज़ रिकॉर्डिंग में शामिल न भी हो सकती है।
- असली नए AI कैरेक्टर, natural lip-sync और AI-generated cinematic video के लिए अलग AI सेवा और सुरक्षित backend चाहिए। GitHub Pages में API secret न रखें।

## GitHub Pages अपडेट
1. ZIP extract करें।
2. Repository में `index.html`, `style.css`, `app.js`, `README.md` को root में upload करके पुराने files replace करें।
3. Commit changes करें और Pages deploy होने का इंतज़ार करें।
