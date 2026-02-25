/**
 * Global Application Logic
 * Handles Theme, Toasts, Usage Tracking, Translations, Command Palette, and Dynamic Tool Rendering
 */

console.log('DGToolbox App.js Loaded - v7');
const APP_CONFIG = {
    defaultAccent: '#00c8ff',
    defaultFontSize: '16px',
    themes: {
        dark: { bg: '#0f0f0f', surface: '#1c1c1c', text: '#ffffff' },
        light: { bg: '#e0e5ec', surface: '#e0e5ec', text: '#4a4a4a' },
        amoled: { bg: '#000000', surface: '#000000', text: '#ffffff' },
        flat: { bg: '#f5f7fa', surface: '#ffffff', text: '#2d3436' }
    }
};

const TOOLS_LIST = [
    // --- GAMER TOOLS ---
    { id: 'sens-conv', category: 'gamer', name: 'Sensitivity Converter', icon: 'fas fa-mouse-pointer', desc: 'Convert mouse sensitivity between games (Valorant to CS2, etc).', link: 'sensitivity-converter.html', keywords: ['sensitivity', 'mouse', 'dpi', 'fps'] },
    { id: 'crosshair', category: 'gamer', name: 'Crosshair Generator', icon: 'fas fa-crosshairs', desc: 'Design your perfect crosshair visually.', link: 'crosshair-generator.html', keywords: ['crosshair', 'generator', 'csgo', 'valorant'] },
    { id: 'reflex', category: 'gamer', name: 'Reflex Pro', icon: 'fas fa-bolt', desc: 'Measure your reaction time.', link: 'reaction-tester.html', keywords: ['reaction', 'game', 'speed', 'reflex'] },
    { id: 'controller', category: 'gamer', name: 'Gamepad Tester', icon: 'fas fa-gamepad', desc: 'Test controller buttons, sticks, and rumble.', link: 'controller-tester.html', keywords: ['gamepad', 'controller', 'test', 'input'] },
    { id: 'aim-trainer', category: 'gamer', name: 'Aim Labs Pro', icon: 'fas fa-crosshairs', desc: 'Esports-grade aim training (Gridshot, Spidershot).', link: 'aim-trainer.html', keywords: ['aim', 'train', 'fps', 'valorant', 'gridshot'] },

    // --- PRODUCTIVITY TOOLS ---
    { id: 'pdf-studio', category: 'developer', name: 'PDF Studio Pro', icon: 'fas fa-file-pdf', desc: 'Merge, split, encrypt, and watermark PDFs offline.', link: 'pdf-studio-pro.html', keywords: ['pdf', 'merge', 'split', 'encrypt'] },


    // --- DEVELOPER TOOLS ---
    { id: 'color-picker', category: 'developer', name: 'Color Picker', icon: 'fas fa-palette', desc: 'Advanced color selection with HEX, RGB conversion.', link: 'color-picker.html', keywords: ['color', 'hex', 'rgb', 'picker'] },
    { id: 'password-gen', category: 'developer', name: 'Password Gen', icon: 'fas fa-key', desc: 'Generate secure passwords with custom strength.', link: 'password-generator.html', keywords: ['password', 'security', 'generator'] },
    { id: 'json-formatter', category: 'developer', name: 'JSON Formatter', icon: 'fas fa-code', desc: 'Validate, format, and minify JSON data.', link: 'json-formatter.html', keywords: ['json', 'format', 'minify', 'lint'] },
    { id: 'encrypt', category: 'developer', name: 'Text Encrypt (AES)', icon: 'fas fa-user-secret', desc: 'Securely encrypt and decrypt text.', link: 'encrypt-decrypt.html', keywords: ['encrypt', 'decrypt', 'aes', 'security'] },
    { id: 'unit-converter', category: 'developer', name: 'Unit Converter', icon: 'fas fa-balance-scale', desc: 'Convert between common units easily.', link: 'unit-converter.html', keywords: ['unit', 'convert', 'length', 'weight'] },
    { id: 'ping', category: 'developer', name: 'Ping Checker', icon: 'fas fa-network-wired', desc: 'Check response times for websites.', link: 'ping-checker.html', keywords: ['ping', 'network', 'latency'] },
    { id: 'uuid', category: 'developer', name: 'UUID Generator', icon: 'fas fa-fingerprint', desc: 'Generate unique identifiers (v4).', link: 'uuid-generator.html', keywords: ['uuid', 'guid', 'generator'] },
    { id: 'base64', category: 'developer', name: 'Base64 Converter', icon: 'fas fa-exchange-alt', desc: 'Encode and decode Base64 strings.', link: 'base64-tool.html', keywords: ['base64', 'encode', 'decode'] },
    { id: 'regex', category: 'developer', name: 'Regex Tester', icon: 'fas fa-search', desc: 'Test regular expressions in real-time.', link: 'regex-tester.html', keywords: ['regex', 'regexp', 'test'] },
    { id: 'markdown', category: 'developer', name: 'Markdown to HTML', icon: 'fab fa-markdown', desc: 'Convert Markdown text to clean HTML.', link: 'markdown-tool.html', keywords: ['markdown', 'html', 'convert'] },
    { id: 'qr', category: 'developer', name: 'QR Code Generator', icon: 'fas fa-qrcode', desc: 'Generate QR codes for URLs and text.', link: 'qr-code-tool.html', keywords: ['qr', 'code', 'generator'] },
    { id: 'image', category: 'developer', name: 'Image Compressor', icon: 'fas fa-image', desc: 'Compress and resize images locally.', link: 'image-compressor.html', keywords: ['image', 'compress', 'resize'] },
    { id: 'diff', category: 'developer', name: 'Text Diff Checker', icon: 'fas fa-columns', desc: 'Compare two texts and highlight differences.', link: 'diff-checker.html', keywords: ['diff', 'compare', 'text'] },
    { id: 'emoji', category: 'developer', name: 'Emoji Picker', icon: 'fas fa-smile', desc: 'Copy emojis to clipboard instantly.', link: 'emoji-picker.html', keywords: ['emoji', 'picker', 'smile'] },
    { id: 'summarizer', category: 'developer', name: 'AI Summarizer', icon: 'fas fa-magic', desc: 'Summarize long texts instantly.', link: 'text-summarizer.html', keywords: ['ai', 'summarize', 'text'] },
    { id: 'grammar', category: 'developer', name: 'AI Grammar Fixer', icon: 'fas fa-wand-magic-sparkles', desc: 'Auto-fix grammar, tone, and style instantly.', link: 'grammar-fixer.html', keywords: ['grammar', 'fix', 'ai', 'check', 'spell'] },
    { id: 'exif-viewer', category: 'developer', name: 'SPECTRE | FORENSICS', icon: 'fas fa-eye', desc: 'Forensic Image Analysis. Extract metadata, GPS & camera settings.', link: 'exif-viewer.html', keywords: ['exif', 'metadata', 'gps', 'camera', 'image'] },
];


// (Experimental tools removed)


window.TRANSLATIONS = {
    en: {
        // Navigation
        home: "Home",
        tools: "Tools",
        settings: "Settings",
        exit: "Exit Tool",
        back: "Back",


        // Dashboard
        dashboard_total: "Total Uses",
        dashboard_last: "Last Visit",
        dashboard_recent: "Recent Tools",
        tip: "Tip:",
        footer: "© 2025 Developers & Gamers Toolbox. All tools run locally.",
        footer_desc: "The elite client-side arsenal for developers and cyber-athletes. Forged for speed, privacy, and dominance. 100% Offline Capable.",
        footer_about: "About Us",
        footer_terms: "Terms of Service",
        footer_privacy: "Privacy Policy",

        // Hero
        hero_title: "UNLEASH YOUR DIGITAL POTENTIAL",
        hero_desc: "Limitless Power. Zero Latency. The Ultimate Offline Arsenal for Developers & Gamers. No Servers. Just Code.",
        cta_explore: "Explore Tools",
        search_placeholder: "Search tools...",

        // Settings Headers
        settings_title: "Preferences Engine",
        settings_desc: "Customize every aspect of your experience.",
        level_1: "Level 1: Essentials",
        level_2: "Level 2: Typography",
        level_3: "Level 3: Density & Layout",
        level_4: "Level 4: Interaction & Performance",
        level_5: "Level 5: Experimental",
        data_mgmt: "Data Management",

        // Settings Labels
        lang_label: "Language / اللغة",
        theme_label: "Theme Mode",
        accent_label: "Accent Color",
        font_family_label: "Font Family",
        font_size_label: "Font Size",
        density_label: "UI Density",
        layout_label: "Tools Layout",
        anim_label: "Interaction Profile",
        energy_label: "Energy Mode",
        sound_label: "Sound Effects",
        exp_label: "Enable Experimental Tools",
        exp_desc: "Enable bleeding-edge features. These might be unstable.",
        export_import_label: "Export/Import Settings",

        // Settings Options
        theme_dark: "Dark Mode",
        theme_light: "Light Mode",
        theme_amoled: "AMOLED Pure Black",
        theme_flat: "Flat Design",

        font_inter: "Inter (Modern)",
        font_jetbrains: "JetBrains Mono (Code)",
        font_poppins: "Poppins (Geometric)",
        font_cairo: "Cairo (Arabic Optimized)",

        density_compact: "Compact (High Density)",
        density_comfortable: "Comfortable (Default)",
        density_spacious: "Spacious (Relaxed)",

        layout_grid: "Grid 3x3",
        layout_large: "Large Cards",
        layout_list: "Minimal List",

        anim_fast: "Fast (Snappy)",
        anim_normal: "Normal (Balanced)",
        anim_slow: "Slow (Cinematic)",
        anim_none: "Instant (No Animation)",

        energy_aesthetic: "Aesthetic (Max FX)",
        energy_balanced: "Balanced",
        energy_performance: "Performance (Low FX)",
        energy_battery: "Battery Saver (Low FPS)",

        // Buttons
        btn_export: "Export",
        btn_import: "Import",
        btn_clear: "Clear All Local Data",

        // About / Terms / Privacy
        about_title: "About DGToolbox",
        terms_title: "Terms of Service",
        privacy_title: "Privacy Policy",

        // About Page Content
        about_intro: "Developers & Gamers Toolbox is a passion project designed to provide essential web utilities without the bloat.",
        about_why: "Most online tools are filled with ads, require sign-ups, or send your data to remote servers. We wanted to build something different:",
        about_point_1: "100% Client-Side: All calculations happen in your browser.",
        about_point_2: "Privacy First: No data is ever stored or transmitted.",
        about_point_3: "Fast & Clean: No ads, no trackers, just tools.",
        tool_guide_title: "Tool Guide",

        // Tool Categories
        cat_dev: "Developer",
        cat_security: "Security",
        cat_media: "Media",

        // Tools
        open_tool: "Open Tool",
        tool_name_color_picker: "Color Picker Pro",
        tool_desc_color_picker: "Advanced color selection with HEX, RGB conversion.",
        tool_name_password_gen: "Password Generator",
        tool_desc_password_gen: "Generate secure passwords with custom strength.",
        tool_name_json_formatter: "JSON Formatter",
        tool_desc_json_formatter: "Validate, format, and minify JSON data.",
        tool_name_encrypt: "Text Encrypt (AES)",
        tool_desc_encrypt: "Securely encrypt and decrypt text.",
        tool_name_unit_converter: "Unit Converter",
        tool_desc_unit_converter: "Convert between common units easily.",
        tool_name_ping: "Ping Checker",
        tool_desc_ping: "Check response times for websites.",
        tool_name_uuid: "UUID Generator",
        tool_desc_uuid: "Generate unique identifiers (v4).",
        tool_name_base64: "Base64 Converter",
        tool_desc_base64: "Encode and decode Base64 strings.",
        tool_name_regex: "Regex Tester",
        tool_desc_regex: "Test regular expressions in real-time.",
        tool_name_markdown: "Markdown to HTML",
        tool_desc_markdown: "Convert Markdown text to clean HTML.",
        tool_name_qr: "QR Code Generator",
        tool_desc_qr: "Generate QR codes for URLs and text.",
        tool_name_image: "Image Compressor",
        tool_desc_image: "Compress and resize images locally.",
        tool_name_diff: "Text Diff Checker",
        tool_desc_diff: "Compare two texts and highlight differences.",

        tool_name_reflex: "Reflex Pulse",
        tool_desc_reflex: "Test your reaction time in milliseconds.",

        // Encryption Tool
        enc_label_key: "Secret Key (Keep this safe!)",
        enc_ph_key: "Enter a strong secret key...",
        enc_label_input: "Input Text",
        enc_ph_input: "Enter text to encrypt or decrypt...",
        enc_label_output: "Output Result",
        enc_btn_encrypt: "Encrypt",
        enc_btn_decrypt: "Decrypt",
        enc_btn_copy: "Copy Result",
        enc_btn_paste: "Paste",
        enc_btn_clear: "Clear",
        enc_missing_input: "Please enter both text and a secret key.",
        enc_success: "Text Encrypted!",
        dec_success: "Text Decrypted!",
        dec_error: "Error: Invalid key or corrupted data.",
        copy_success: "Copied to Clipboard!",
        log_start_enc: "Starting encryption...",
        log_success_enc: "Encryption successful.",
        log_start_dec: "Starting decryption...",
        log_success_dec: "Decryption successful.",
        log_fail_dec: "Decryption failed: Invalid key.",
        enc_tip: "Tip: Use a strong passphrase. Encryption is done locally via AES-256.",

        // Base64 Tool
        b64_label_input: "Input (Text or Base64)",
        b64_ph_input: "Type or paste content here...",
        b64_label_output: "Output Result",
        b64_btn_encode: "Encode to Base64",
        b64_btn_decode: "Decode from Base64",
        b64_btn_copy: "Copy Result",
        b64_btn_paste: "Paste",
        b64_btn_clear: "Clear",
        b64_success_enc: "Encoded to Base64",
        b64_success_dec: "Decoded from Base64",
        b64_error_enc: "Encoding Failed: Invalid characters",
        b64_error_dec: "Decoding Failed: Invalid Base64 string",
        b64_tip: "Tip: Base64 is commonly used to encode binary data for text-based transport. It is NOT encryption."
    },
    ar: {
        // Navigation
        home: "الرئيسية",
        tools: "الأدوات",
        settings: "الإعدادات",
        exit: "خروج",
        back: "رجوع",

        // Dashboard
        dashboard_total: "إجمالي الاستخدام",
        dashboard_last: "آخر زيارة",
        dashboard_recent: "أدوات حديثة",
        tip: "تلميح:",
        footer: "© 2025 صندوق أدوات المطورين واللاعبين. جميع الأدوات تعمل محلياً.",
        footer_desc: "صندوق الأدوات النهائي للمطورين واللاعبين. آمن، سريع، ومتاح دائماً بلا اتصال. لا خوادم، لا تتبع، لا تعقيد.",
        footer_about: "من نحن",
        footer_terms: "شروط الخدمة",
        footer_privacy: "سياسة الخصوصية",

        // Hero
        hero_title: "أدواتك الشاملة للويب",
        hero_desc: "أدوات تعمل بالكامل على متصفحك. خصوصية تامة، بدون خوادم، وبدون تعقيد.",
        cta_explore: "تصفح الأدوات",
        search_placeholder: "ابحث عن أداة...",

        // Settings Headers
        settings_title: "تفضيلاتك",
        settings_desc: "تحكم في كل تفصيلة في تجربتك.",
        level_1: "الأساسيات",
        level_2: "الخطوط والنصوص",
        level_3: "التخطيط والكثافة",
        level_4: "التفاعل والأداء",
        level_5: "ميزات تجريبية",
        data_mgmt: "إدارة البيانات",

        // Settings Labels
        lang_label: "اللغة",
        theme_label: "المظهر",
        accent_label: "اللون الأساسي",
        font_family_label: "نوع الخط",
        font_size_label: "حجم النص",
        density_label: "كثافة العناصر",
        layout_label: "تخطيط الأدوات",
        anim_label: "سرعة الحركة",
        energy_label: "وضع الطاقة",
        sound_label: "المؤثرات الصوتية",
        exp_label: "الأدوات التجريبية",
        exp_desc: "تفعيل ميزات تحت التطوير (قد تكون غير مستقرة).",
        export_import_label: "نسخ واستعادة الإعدادات",

        // Settings Options
        theme_dark: "الداكن",
        theme_light: "الفاتح",
        theme_amoled: "الأسود الملكي (AMOLED)",
        theme_flat: "المسطح",

        font_inter: "Inter (عصري)",
        font_jetbrains: "JetBrains Mono (برمجي)",
        font_poppins: "Poppins (هندسي)",
        font_cairo: "Cairo (الأفضل للعربية)",

        density_compact: "مكدس (كثيف)",
        density_comfortable: "مريح (تلقائي)",
        density_spacious: "مسترخي (واسع)",

        layout_grid: "شبكة 3x3",
        layout_large: "بطاقات كبيرة",
        layout_list: "قائمة مصغرة",

        anim_fast: "سريع (خاطف)",
        anim_normal: "طبيعي",
        anim_slow: "سينمائي (بطيء)",
        anim_none: "بدون حركة",

        energy_aesthetic: "أقصى جودة",
        energy_balanced: "متوازن",
        energy_performance: "أداء عالي",
        energy_battery: "توفير الطاقة",

        // Audio Studio
        audio_studio_title: "استوديو الصوت",
        audio_master: "الصوت الرئيسي",
        audio_theme_label: "سمة المؤثرات",
        audio_ambient_label: "طبقة الاجواء المحيطة",
        audio_click_vol: "صوت النقرات",
        audio_voice_vol: "صوت القارئ",

        // Sound Themes
        sound_default: "افتراضي (متوازن)",
        sound_minimal: "بسيط (نقي)",
        sound_tech: "تقني (خاطف)",
        sound_mechanical: "ميكانيكي (ملموس)",
        sound_bubble: "فقاعات (مرح)",
        sound_retro: "ريترو (8-بت)",
        sound_glass: "زجاجي (أنيق)",
        sound_magic: "سحري (بريق)",
        sound_wood: "خشبي (عضوي)",
        sound_zap: "خيال علمي (ليزر)",
        sound_piano: "بيانو (موسيقي)",
        sound_space: "فضاء (عميق)",
        sound_water: "ماء (سائل)",
        sound_neon: "نيون (طنين)",
        sound_typewriter: "آلة كاتبة",
        sound_samurai: "ساموراي (حادة)",
        sound_synth: "موسيقى إلكترونية (80s)",
        sound_orchestra: "أوركسترا (درامي)",
        sound_cartoon: "كرتون (مضحك)",
        sound_cyberpunk: "سايبر بانك (ثقيل)",
        sound_pop: "بوب (سعيد)",
        sound_horror: "رعب (مخيف)",

        // Buttons
        btn_export: "تصدير",
        btn_import: "استيراد",
        btn_clear: "مسح البيانات",

        // About / Terms / Privacy
        about_title: "عن المنصة",
        terms_title: "الشروط والأحكام",
        privacy_title: "سياسة الخصوصية",

        // About Page Content
        about_title: "عن المنصة",
        about_intro: "<strong>DevGamerToolbox</strong> ليست مجرد موقع أدوات؛ إنها <strong>محطة طاقة من جانب العميل</strong>. قمنا بهندسة هذه المنصة لمنح المطورين واللاعبين وصولاً فورياً للأدوات الأساسية بدون تأخير، إعلانات، أو مخاطر الخصوصية.",
        about_why: "الويب مليء بالأدوات البطيئة والمليئة بالإعلانات التي تحصد بياناتك. تمردنا ضد ذلك. بنينا ملاذاً يلتقي فيه الأداء بالخصوصية.",
        about_point_1: "100% محلي: جميع العمليات الحسابية تتم في متصفحك. لا رحلات للخوادم. نتائج فورية.",
        about_point_2: "الخصوصية أولاً: بياناتك لا تغادر متصفحك أبداً.",
        about_point_3: "سريع ونظيف: لا إعلانات، لا تعقب، فقط أدوات.",
        about_zero_latency: "دون تأخير",
        about_data_fortress: "حصن البيانات",
        about_offline_dominance: "العمل دون إنترنت",

        // Privacy Policy
        privacy_title: "بروتوكولات الخصوصية",
        privacy_desc: "بياناتك هي منطقتك الخاصة. نحن لا نتجاوز حدودنا.",
        priv_1_title: "1. هندسة المعرفة الصفرية",
        priv_1_desc: "تم تصميم <strong>DGToolbox</strong> بـسياسة \"المعرفة الصفرية\". نحن لا نجمع، نخزن، نرسل، أو نحلل أي من بياناتك الشخصية، مدخلاتك، ملفاتك، أو أنماط استخدامك.<br><br>لا توجد قاعدة بيانات خلفية. لا توجد لوحة تحكم للتحليلات. لا يوجد \"نحن\" نراقب \"أنت\".",
        priv_2_title: "2. بيئة التنفيذ المحلية",
        priv_2_desc: "كل أداة على هذه المنصة—من ضاغط الصور إلى مولد كلمات المرور—تعمل <strong>100% داخل صندوق المتصفح الخاص بك</strong>.<br><br>عندما ترفع صورة أو تلصق نصاً، فإنه لا يغادر ذاكرة جهازك (RAM). تتم معالجته بواسطة JavaScript محلياً ويعود إليك فوراً.",
        priv_3_title: "3. التخزين المحلي (Persistence)",
        priv_3_desc: "نستخدم تقنية <code>localStorage</code> في متصفحك فقط لتحسين تجربتك. وهذا يشمل حفظ:<br><ul><li>المظهر المختار (مثلاً: الوضع الداكن).</li><li>تفضيلات الصوت.</li><li>ترتيب الأدوات والمفضلة.</li></ul><br>تظل هذه البيانات على قرصك الصلب ويمكن حذفها بمسح ذاكرة المتصفح.",
        priv_4_title: "4. الإشارات الخارجية",
        priv_4_desc: "نحن نعمل في عزلة تامة، باستثناء موردين جماليين بسيطين:<br><ul><li><strong>Google Fonts:</strong> لتحميل الخطوط.</li><li><strong>Font Awesome:</strong> لتحميل الأيقونات.</li></ul>",

        // Terms of Service
        terms_title: "شروط الخدمة",
        terms_intro: "إرشادات التشغيل لاستخدام DevGamerToolbox.",
        terms_1_title: "1. قبول المهمة",
        terms_1_desc: "بوصولك إلى واستخدامك لأدوات <strong>DGToolbox</strong>، فإنك تقر بأنك قرأت، فهمت، ووافقت على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على هذه البروتوكولات، يجب عليك إيقاف المهمة وقطع الاتصال فوراً.",
        terms_2_title: "2. معايير التشغيل",
        terms_2_desc: "توفر DGToolbox مجموعة من الأدوات التي تعمل من جانب العميل لأغراض تعليمية وتطويرية. جميع الأدوات تعمل محلياً.<br><ul><li>توافق على استخدام الأدوات بمسؤولية وأخلاقية.</li><li>لن تحاول استغلال البنية التحتية (رغم عدم وجود خوادم).</li><li>الاستخدام لأغراض غير قانونية ممنوع منعاً باتاً.</li></ul>",
        terms_3_title: "3. درع المسؤولية",
        terms_3_desc: "<strong>يتم توفير الأدوات \"كما هي\"، دون أي ضمانات.</strong><br><br>بينما نسعى للدقة بنسبة 100%، لا يمكن تحميل DGToolbox المسؤولية عن أي فقدان بيانات أو أخطاء حسابية ناتجة عن استخدام هذا البرنامج. تحقق دائماً من البيانات الحساسة.",
        terms_4_title: "4. تحديثات البروتوكول",
        terms_4_desc: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت لتعكس ميزات جديدة أو متطلبات قانونية.",
        terms_5_title: "5. الملكية الفكرية",
        terms_5_desc: "الشفرة البرمجية، التصميم، وعلامة \"DGToolbox\" هي ملكية فكرية للمطور <strong>Mostafa Khalil</strong>.",

        // Tool UI Common
        tool_hex: "HEX",
        tool_rgb: "RGB",
        tool_hsl: "HSL",
        tool_copy: "نسخ",
        tool_shades: "الظلال والتدرجات",
        tool_recent_colors: "ألوان حديثة",
        tool_tab_picker: "منتقي الألوان",
        tool_tab_gradient: "صانع التدرجات",
        tool_clear_history: "مسح السجل",

        // Tool Guide
        tool_guide_title: "دليل الترسانة (الأدوات)",
        cat_dev: "تطوير",
        cat_security: "أمان",
        cat_media: "وسائط",

        // Tools
        open_tool: "فتح الأداة",
        tool_name_color_picker: "منتقي الألوان المحترف",
        tool_desc_color_picker: "اختيار ألوان متقدم مع تحويل HEX و RGB.",

        // Password Generator
        pass_vault_title: "خزنة كلمات المرور",
        pass_btn_generate: "توليد",
        pass_copy_title: "نسخ كلمة المرور",
        pass_len: "طول كلمة المرور",
        pass_opt_upper: "أحرف كبيرة (A-Z)",
        pass_opt_lower: "أحرف صغيرة (a-z)",
        pass_opt_num: "أرقام (0-9)",
        pass_opt_sym: "رموز (!@#$)",
        pass_strength_title: "قوة الأمان",
        pass_history_title: "السجل",
        pass_tip: "تلميح: استخدم مزيجاً من الأحرف وطولاً لا يقل عن 16 لأقصى أمان.",
        pass_empty: "لا يوجد سجل",
        pass_calculating: "جاري الحساب...",
        pass_very_weak: "ضعيفة جداً",
        pass_weak: "ضعيفة",
        pass_medium: "متوسطة",
        pass_strong: "قوية",
        pass_very_strong: "قوية جداً (لا تُقهر)",

        tool_name_password_gen: "مولد كلمات المرور",
        tool_desc_password_gen: "إنشاء كلمات مرور قوية وآمنة.",

        // Image Compressor
        img_title: "ضاغط الصور المحترف",
        img_settings_title: "إعدادات الضغط",
        img_quality: "مستوى الجودة",
        img_quality_help: "جودة أقل = حجم أصغر",
        img_max_width: "أقصى عرض (بكسل)",
        img_target_size: "الحجم المستهدف (م.ب)",
        img_btn_apply: "تطبيق الإعدادات",
        img_drop_title: "أفلت الصورة هنا",
        img_drop_desc: "يدعم JPG, PNG, WEBP (بحد أقصى 20 ميجا)",
        img_badge_orig: "الأصلية",
        img_badge_opt: "المحسنة",
        img_saved_label: "وفرت",
        img_btn_download: "تنزيل الصورة",
        img_toast_success: "بدأ التنزيل بنجاح!",
        img_toast_error: "حدث خطأ أثناء الضغط.",
        img_processing: "جاري المعالجة...",
        img_msg_valid: "يرجى رفع ملف صورة صالح",
        img_complete: "تم التحسين بنجاح!",
        img_failed: "فشل الضغط",
        img_no_reduction: "لا يمكن تقليل الحجم أكثر",
        img_downloading: "بدأ تنزيل الصورة",

        // JSON Studio
        json_title: "استوديو JSON",
        json_beautify: "تجميل وتنسيق",
        json_minify: "ضغط الكود (Minify)",
        json_upload: "رفع ملف",
        json_save: "حفظ الملف",
        json_tree: "شجرة البيانات",
        json_clear: "مسح الكل",
        json_input: "المدخلات (JSON)",
        json_output: "المخرجات / الشجرة",
        json_status_ready: "جاهز",
        json_msg_formatted: "تم التنسيق بنجاح",
        json_msg_minified: "تم الضغط بنجاح",
        json_msg_loaded: "تم تحميل الملف:",
        json_msg_copied: "تم النسخ للحافظة",
        json_msg_pasted: "تم اللصق من الحافظة",
        json_msg_cleared: "تم مسح البيانات",
        json_err_invalid: "خطأ: كود JSON غير صالح",

        // Regex Tester
        regex_title: "فاحص التعابير النمطية",
        regex_mode_match: "وضع المطابقة",
        regex_mode_replace: "وضع الاستبدال",
        regex_label_pattern: "التعبير النمطي (RegEx)",
        regex_label_replace: "نص الاستبدال",
        regex_label_test: "نص الاختبار",
        regex_label_result: "النتيجة النهائية",
        regex_matches: "التطابقات",
        regex_quick_insert: "إدراج سريع",
        md_source: "المحرر",
        md_preview: "المعاينة الحية",
        md_placeholder: "ابدأ الكتابة هنا...",
        md_words: "كلمة",
        md_lines: "سطر",
        md_toast_open: "تم فتح الملف",
        md_toast_save: "تم تحميل الملف",
        md_toast_copy: "تم نسخ HTML",
        md_toast_clear: "تم مسح المحرر",

        // Ping Checker
        ping_title: "فاحص الاستجابة (Ping)",
        ping_placeholder: "أدخل النطاق (مثال: google.com)",
        ping_btn_start: "بدء الفحص",
        ping_btn_stop: "إيقاف",
        ping_status_ready: "جاهز",
        ping_status_running: "جاري الفحص...",
        ping_status_stopped: "متوقف",
        ping_col_seq: "#",
        ping_col_url: "الهدف",
        ping_col_time: "الوقت (ms)",
        ping_col_status: "الحالة",
        ping_stat_sent: "المرسلة",
        ping_stat_received: "المستلمة",
        ping_stat_avg: "المتوسط",
        ping_err_url: "رابط غير صالح",

        // Unit Converter
        unit_title: "محول الوحدات الشامل",
        unit_label_type: "نوع الوحدة",
        unit_label_from: "من",
        unit_label_to: "إلى",
        unit_type_length: "الطول",
        unit_type_weight: "الوزن",
        unit_type_temp: "الحرارة",
        unit_type_area: "المساحة",
        unit_type_data: "البيانات Digital",
        unit_type_speed: "السرعة",
        unit_type_time: "الوقت",
        unit_err_invalid: "قيمة غير صالحة",

        // QR Code
        qr_title: "استوديو رموز QR",
        qr_placeholder: "أدخل رابطاً أو نصاً...",
        qr_fg_color: "لون الرمز",
        qr_bg_color: "لون الخلفية",
        qr_correction: "تصحيح الخطأ",
        qr_logo_label: "شعار (اختياري)",
        qr_btn_download: "تنزيل PNG",
        qr_help_hires: "دقة عالية (1000×1000)",
        qr_toast_saved: "تم حفظ الرمز",
        qr_toast_err: "فشل التنزيل",

        // Confirm
        msg_confirm_clear: "هل أنت متأكد أنك تريد المسح؟",

        // Base64
        b64_btn_encode: "تشفير (Encode)",
        b64_btn_decode: "فك تشفير (Decode)",
        b64_err: "خطأ: نص غير صالح",
        b64_mode_text: "وضع النصوص",
        b64_mode_file: "وضع الملفات",
        b64_label_upload: "رفع ملف",
        b64_label_string: "نص Base64",
        b64_msg_drag: "اضغط أو اسحب الملف هنا",
        b64_msg_supports: "يدعم الصور، PDF، والمستندات",

        // UUID
        uuid_title: "مولد UUID المحترف",
        uuid_btn_gen: "توليد UUID",
        uuid_btn_clear: "مسح السجل",
        uuid_opt_hyphens: "شرطات (-)",
        uuid_opt_upper: "أحرف كبيرة (Upper)",
        uuid_opt_braces: "أقواس {}",
        uuid_stat_generated: "تم التوليد",
        uuid_bulk_count: "العدد (للوضع الجماعي)",
        uuid_msg_copied: "تم نسخ UUID",
        uuid_title_output: "المعرفات المولدة",
        uuid_label_type: "نوع المعرف (ID Type)",
        uuid_label_qty: "العدد",
        uuid_label_format: "خيارات التنسيق",
        uuid_opt_quotes: 'علامات تنصيص ""',
        uuid_opt_single: "علامات فردية ''",
        uuid_opt_comma: "فواصل (,)",
        uuid_opt_num: "ترقيم (1.)",

        // Diff Checker
        diff_title: "مقارنة النصوص",
        diff_orig: "النص الأصلي",
        diff_mod: "النص المعدل",
        diff_btn_compare: "مقارنة النصوص",
        diff_stat_add: "إضافات",
        diff_stat_rem: "محذوفات",
        diff_stat_change: "تغييرات",
        diff_msg_nodiff: "النصوص متطابقة تماماً!",
        diff_msg_found: "تم رصد اختلافات",
        diff_demo_btn: "تحميل مثال حي",
        diff_why: "لماذا تستخدم هذه الأداة؟",
        diff_desc_spot: "رصد التغييرات: معرفة الفرق بين نسختين فوراً.",
        diff_desc_debug: "تصحيح الكود: العثور على الأخطاء البرمجية.",
        enc_ph_key: "أدخل مفتاح التشفير السري...",
        enc_label_input: "النص",
        enc_label_output: "النتيجة",
        enc_tip: "يتم التشفير باستخدام AES-256 داخل المتصفح. لا يتم إرسال أي بيانات.",
        enc_btn_encrypt: "تشفير",
        enc_btn_decrypt: "فك تشفير",
        enc_log_success: "نجاح",
        enc_log_error: "خطأ",
        enc_msg_empty: "الرجاء إدخال النص والمفتاح",
        enc_log_start_enc: "بدء التشفير...",
        enc_log_start_dec: "بدء فك التشفير...",
        enc_msg_success: "العملية تمت بنجاح",
        enc_err_dec: "فشل فك التشفير (مفتاح خاطئ؟)",
        enc_log_ready: "محرك التشفير جاهز",

        pass_vault_title: "خزنة كلمات المرور",
        pass_strength_title: "قوة الأمان",
        pass_calculating: "جاري الحساب...",
        pass_history_title: "السجل",
        pass_empty: "لا يوجد سجل حتى الآن",
        pass_tip: "نصيحة: استخدم مزيجاً من الأحرف والرموز لزيادة الأمان.",
        pass_btn_generate: "توليد جديد",
        pass_strength_weak: "ضعيفة",
        pass_strength_med: "متوسطة",
        pass_strength_strong: "قوية",
        pass_strength_very_strong: "قوية جداً",
        pass_msg_copied: "تم نسخ كلمة المرور",

        color_tip_pick: "اضغط لاختيار لون",
        color_btn_clear: "مسح السجل",
        color_msg_copied: "تم نسخ اللون",
        color_msg_cleared: "تم مسح السجل",

        // Image Compressor
        img_title: "ضاغط الصور",
        img_settings_title: "إعدادات الضغط",
        img_quality: "الجودة",
        img_quality_help: "جودة أقل = حجم أصغر",
        img_max_width: "العرض الأقصى (px)",
        img_target_size: "الحجم المستهدف (MB)",
        img_btn_apply: "تطبيق الإعدادات",
        img_drop_title: "أفلت الصورة هنا",
        img_drop_desc: "يدعم JPG, PNG, WEBP (بحد أقصى 20 ميجابايت)",
        img_badge_orig: "الأصلي",
        img_badge_opt: "المحسن",
        img_btn_download: "تحميل الصورة المحسنة",
        img_msg_valid: "الرجاء اختيار صورة صالحة",
        img_processing: "جاري المعالجة...",
        img_saved_label: "تم توفير",
        img_no_reduction: "لا يوجد تقليل",
        img_complete: "اكتمل الضغط!",
        img_failed: "فشل الضغط",
        img_downloading: "جاري التحميل...",

        // JSON Formatter
        json_title: "منسق JSON",
        json_input_label: "إدخال JSON",
        json_btn_format: "تنسيق",
        json_btn_minify: "ضغط",
        json_btn_tree: "شجرة",
        json_btn_upload: "رفع ملف",
        json_btn_paste: "لصق",
        json_btn_clear: "مسح",
        json_output_label: "المخرجات",
        json_status_ready: "جاهز",
        json_err_invalid: "JSON غير صالح",
        json_msg_formatted: "تم التنسيق",
        json_msg_minified: "تم الضغط",
        json_msg_loaded: "تم التحميل:",
        json_msg_copied: "تم النسخ",
        json_msg_pasted: "تم اللصق",
        json_msg_cleared: "تم المسح",
        json_items_count: "عناصر",

        // Regex Tester
        regex_title: "مختبر التعابير النمطية",
        regex_mode_match: "مطابقة",
        regex_mode_replace: "استبدال",
        regex_label_pattern: "التعبير النمطي",
        regex_label_replace: "نص الاستبدال",
        regex_label_test: "النص الاختباري",
        regex_label_result: "نتيجة الاستبدال",
        regex_matches: "تطابق",
        regex_no_matches: "لا يوجد تطابق",
        regex_match_prefix: "تطابق",
        regex_group_prefix: "مجموعة",
        regex_quick_insert: "إدراج سريع",
        regex_expl_placeholder: "أدخل نمطاً...",
        regex_pattern_prefix: "النمط",
        regex_flags_global: "شامل (g)",
        regex_flags_ignore: "تجاهل الحالة (i)",
        regex_flags_multiline: "متعدد الأسطر (m)",
        regex_err: "خطأ",

        // Markdown Editor
        md_title: "محرر Markdown",
        md_btn_open: "فتح",
        md_btn_save_md: "حفظ MD",
        md_btn_export_html: "تصدير HTML",
        md_source: "المصدر",
        md_preview: "المعاينة",
        md_words: "كلمات",
        md_lines: "أسطر",
        md_toast_open: "تم فتح الملف",
        md_toast_clear: "تم مسح المحرر",
        md_toast_copy: "تم نسخ HTML إلى الحافظة",

        // Tooltips (Common & Specific)
        tip_copy: "نسخ",
        tip_clear: "مسح",
        tip_regex_global: "بحث شامل",
        tip_regex_case: "تجاهل حالة الأحرف",
        tip_regex_multiline: "لجميع الأسطر",
        tip_regex_dot: "النقطة تطابق سطر جديد",
        tip_regex_unicode: "يونيكود",
        tip_md_editor: "المحرر فقط",
        tip_md_split: "عرض مقسم",
        tip_md_preview: "المعاينة فقط",
        tip_md_h1: "عنوان 1",
        tip_md_h2: "عنوان 2",
        tip_md_h3: "عنوان 3",
        tip_md_bold: "عريض",
        tip_md_italic: "مائل",
        tip_md_strike: "مشطوب",
        tip_md_ul: "قائمة نقطية",
        tip_md_ol: "قائمة رقمية",
        tip_md_task: "قائمة مهام",
        tip_md_code: "كود",
        tip_md_quote: "اقتباس",
        tip_md_link: "رابط",
        tip_md_image: "صورة",
        tip_md_table: "جدول",

        tool_name_json_formatter: "منسق JSON",
        tool_desc_json_formatter: "التحقق من صحة وتنسيق بيانات JSON.",
        tool_name_encrypt: "تشفير النصوص (AES)",
        tool_desc_encrypt: "تشفير وفك تشفير النصوص بأمان.",
        tool_name_unit_converter: "محول الوحدات",
        tool_desc_unit_converter: "تحويل بين الوحدات الشائعة بسهولة.",
        tool_name_ping: "فاحص الاستجابة (Ping)",
        tool_desc_ping: "قياس سرعة الاستجابة للمواقع.",
        tool_name_uuid: "مولد المعرفات (UUID)",
        tool_desc_uuid: "إنشاء معرفات فريدة (v4).",
        tool_name_base64: "محول Base64",
        tool_desc_base64: "تشفير وفك تشفير نصوص Base64.",
        tool_name_regex: "فاحص التعابير النمطية",
        tool_desc_regex: "اختبار التعابير النمطية (Regex) بشكل فوري.",
        tool_name_markdown: "محول Markdown",
        tool_desc_markdown: "تحويل نصوص Markdown إلى HTML.",
        tool_name_qr: "مولد رمز الاستجابة (QR)",
        tool_desc_qr: "إنشاء رموز QR للروابط والنصوص.",
        tool_name_image: "ضاغط الصور",
        tool_desc_image: "ضغط وتغيير حجم الصور محلياً.",
        tool_name_diff: "مقارنة النصوص",
        tool_desc_diff: "مقارنة نصين وتظليل الاختلافات.",

        tool_name_reflex: "نبض رد الفعل",
        tool_desc_reflex: "اختبر سرعة رد فعلك بالمللي ثانية.",

        tool_name_controller: "فاحص يد التحكم Pro",
        tool_desc_controller: "اختبار الأزرار، المحاور (Drift)، والاهتزاز بدقة متناهية.",

        // ... (Keep existing tool-specific keys if any, else they are covered above)
        enc_label_key: "المفتاح السري (احتفظ به آمناً!)",
        enc_title: "تشفير النصوص AES",
        enc_subtitle: "تشفير عسكري الطراز مباشرة في متصفحك.",

        // Base64
        b64_title: "محول Base64",
        b64_subtitle: "ترميز وفك تشفير البيانات للنقل الآمن.",
        b64_label_input: "المدخلات",
        b64_label_output: "النتيجة"
    }
};

// --- Interactive Tips System ---
const TOOL_HINTS = {
    'color-picker.html': "Tip: 🎨 You can drag your cursor over the spectrum or paste a HEX code directly.",
    'password-generator.html': "Tip: 🔐 Click the refresh icon to instantly generate a new strong password.",
    'json-formatter.html': "Tip: 📋 Paste minified JSON here to beautify and validate it instantly.",
    'uuid-generator.html': "Tip: 🆔 Need bulk UUIDs? Toggle the 'Bulk Mode' switch.",
    'encrypt-decrypt.html': "Tip: 🔒 Never share your Secret Key. Encryption happens locally in your browser.",
    'unit-converter.html': "Tip: ⚖️ You can swap the input and output units using the arrow button.",
    'ping-checker.html': "Tip: 📡 This measures the time it takes for a resource to load from your browser.",
    'base64-tool.html': "Tip: 🔄 Base64 encoding is not encryption! Decoding is easy for anyone.",
    'regex-tester.html': "Tip: 🧩 Use the cheat sheet below if you forget specific regex tokens.",
    'markdown-tool.html': "Tip: 📝 You can copy the raw HTML output or download it as an .html file.",
    'qr-code-tool.html': "Tip: 📱 Higher error correction levels make the QR code denser but more robust.",
    'image-compressor.html': "Tip: 🖼️ Adjust quality to balance file size and visual fidelity.",
    'diff-checker.html': "Tip: ⚖️ Green highlights represent added text, Red represents removed text.",
    'text-summarizer.html': "Tip: ✨ Use the slider to control summary depth. Lower values gives you the core message!",
    'grammar-fixer.html': "Tip: 🖊️ Try changing the 'Tone' to see how your text transforms from Casual to Professional!",
    'reaction-tester.html': "Tip: ⚡ Focus on the center! Don't click until you see GREEN."
};

function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }, 800); // 0.8s show time
    }
}

function setupPageTransitions() {
    // Simple fade-in effect for main content
    const main = document.querySelector('main');
    if (main) {
        main.style.opacity = '0';
        main.style.transition = 'opacity 0.4s ease';
        requestAnimationFrame(() => main.style.opacity = '1');
    }
}

function initHints() {
    const path = window.location.pathname.split('/').pop();
    const hint = TOOL_HINTS[path];

    if (hint) {
        const seenHints = JSON.parse(localStorage.getItem('dg_seen_hints')) || [];
        if (!seenHints.includes(path)) {
            setTimeout(() => showToolHint(path, hint), 1500); // Delay for effect
        }
    }
}

function showToolHint(id, message) {
    const card = document.createElement('div');
    card.className = 'hint-card';
    card.innerHTML = `
        <div class="hint-header">
            <i class="fas fa-lightbulb"></i>
            <span>Interactive Tip</span>
        </div>
        <div class="hint-body">${message}</div>
        <button class="hint-close" onclick="dismissHint('${id}', this)">Got it</button>
    `;

    document.body.appendChild(card);
    if (window.playSound) window.playSound('hover');
    requestAnimationFrame(() => card.classList.add('show'));
}

window.dismissHint = (id, btn) => {
    const card = btn.closest('.hint-card');
    card.classList.remove('show');

    const seenHints = JSON.parse(localStorage.getItem('dg_seen_hints')) || [];
    if (!seenHints.includes(id)) {
        seenHints.push(id);
        localStorage.setItem('dg_seen_hints', JSON.stringify(seenHints));
    }

    setTimeout(() => card.remove(), 500);
};

// --- Settings Logic ---
let _initialLoad = true;

function applySettings() {
    const settings = JSON.parse(localStorage.getItem('dg_settings')) || {};
    const root = document.documentElement;
    const body = document.body;

    // 1. Theme Mode classes
    body.classList.remove('light-mode', 'amoled-mode', 'flat-mode', 'neon-mode', 'cyber-mode', 'retro-mode', 'pastel-mode');

    if (settings.themeMode === 'light') body.classList.add('light-mode');
    else if (settings.themeMode === 'amoled') body.classList.add('amoled-mode');
    else if (settings.themeMode === 'flat') body.classList.add('flat-mode');
    else if (settings.themeMode === 'neon') body.classList.add('neon-mode');
    else if (settings.themeMode === 'cyber') body.classList.add('cyber-mode');
    else if (settings.themeMode === 'retro') body.classList.add('retro-mode');
    else if (settings.themeMode === 'pastel') body.classList.add('pastel-mode');

    // 2. Accent Color (Override Theme)
    if (settings.accentColor) {
        // Set on BODY to override theme class specificity
        body.style.setProperty('--accent-color', settings.accentColor);
    } else {
        body.style.removeProperty('--accent-color');
    }

    // 3. Typography
    if (settings.fontSize) root.style.fontSize = settings.fontSize;
    if (settings.fontFamily) root.style.setProperty('--font-main', settings.fontFamily);

    // 4. Density
    body.classList.remove('density-compact', 'density-spacious');
    if (settings.density === 'compact') body.classList.add('density-compact');
    else if (settings.density === 'spacious') body.classList.add('density-spacious');

    // 5. Animation
    body.classList.remove('anim-fast', 'anim-slow', 'anim-none');
    if (settings.animProfile === 'fast') body.classList.add('anim-fast');
    else if (settings.animProfile === 'slow') body.classList.add('anim-slow');
    else if (settings.animProfile === 'none') body.classList.add('anim-none');

    // 6. Energy
    body.classList.remove('energy-aesthetic', 'energy-performance', 'energy-battery');
    if (settings.energyMode === 'aesthetic') body.classList.add('energy-aesthetic');
    else if (settings.energyMode === 'performance') body.classList.add('energy-performance');
    else if (settings.energyMode === 'battery') body.classList.add('energy-battery');

    // 7. Layout
    const toolsGrid = document.getElementById('tools');
    if (toolsGrid) {
        toolsGrid.className = 'tools-grid';
        if (settings.layout === 'list') toolsGrid.classList.add('list-view');
        else if (settings.layout === 'large') toolsGrid.classList.add('large-view');
    }

    // 8. Language
    applyLanguage(settings.language || 'en');

    // Trigger Notification if NOT initial load
    if (!_initialLoad) {
        // We use a small debounce or check to avoid spamming usage of ApplySettings
        // But for now, we leave it to manual triggers in specific actions
        // OR we can trigger generic "Settings Applied"
        // showToast('Settings Updated', 'success'); 
        // User requested triggers for specific actions. Since applySettings handles ALL, 
        // it's better to trigger in the saveSettings wrapper or specific handlers.
    }
    _initialLoad = false;
}

function applyLanguage(lang) {
    const t = TRANSLATIONS[lang];
    if (!t) return;
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    // 1. Text Content (innerHTML)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerHTML = t[key];
    });

    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.setAttribute('placeholder', t[key]);
    });

    // 3. Titles (Tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (t[key]) el.setAttribute('title', t[key]);
    });

    // 4. Alt Text (Images)
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (t[key]) el.setAttribute('alt', t[key]);
    });

    // Re-render dynamic content
    if (document.getElementById('tools')) {
        renderTools();
        renderDashboard();
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initSplashScreen();
    applySettings();
    initToasts();
    initHints();
    trackVisit();
    setupGlobalShortcuts();
    initCommandPalette();
    initDragAndDrop();
    initMobileDock();
    initMobileMenu();

    if (document.getElementById('tools')) {
        renderDashboard();
        renderTools();
    }

    updateToolStatsUI();

    // Audio Triggers
    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, .tool-card, .color-swatch, .action-btn')) {
            if (window.playSound) window.playSound('click');
        }
    });

    setupPageTransitions();
});

// --- Dynamic Tool Rendering & Drag/Drop ---
function renderTools(filter = 'all') {
    const container = document.getElementById('tools');
    if (!container) return;

    const currentLang = document.documentElement.lang || 'en';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    // Get saved order or default
    let savedOrder = [];
    try {
        savedOrder = JSON.parse(localStorage.getItem('dg_tool_order')) || [];
    } catch (e) {
        localStorage.removeItem('dg_tool_order');
    }

    // Filter List
    let displayList = TOOLS_LIST;
    if (filter !== 'all') {
        displayList = TOOLS_LIST.filter(t => t.category === filter);
    }

    // Sort based on savedOrder
    if (savedOrder.length > 0) {
        displayList.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
    }

    container.innerHTML = displayList.map(tool => {
        const name = t[`tool_name_${tool.id.replace(/-/g, '_')}`] || t[`tool_name_${tool.id}`] || tool.name;
        const desc = t[`tool_desc_${tool.id.replace(/-/g, '_')}`] || t[`tool_desc_${tool.id}`] || tool.desc;
        const openText = t['open_tool'] || "Open Tool";

        return `
        <a href="${tool.link}" class="tool-card" draggable="true" data-id="${tool.id}" onclick="handleToolClick(event, '${tool.link}')" aria-label="${name} - ${desc}">
            <div class="tool-icon"><i class="${tool.icon}" aria-hidden="true"></i></div>
            <h3>${name}</h3>
            <p>${desc}</p>
            <span class="tool-link">${openText}</span>
        </a>
    `}).join('');

    // Only init drag/drop if viewing all, to avoid reorder issues with partial lists
    if (filter === 'all') {
        initDragAndDrop();
    }
}

function initDragAndDrop() {
    const cards = document.querySelectorAll('.tool-card');
    const container = document.getElementById('tools');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => {
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            saveToolOrder();
        });
    });

    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.tool-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveToolOrder() {
    const cards = document.querySelectorAll('.tool-card');
    const order = Array.from(cards).map(card => card.getAttribute('data-id'));
    localStorage.setItem('dg_tool_order', JSON.stringify(order));
}

// --- Command Palette ---
function initCommandPalette() {
    // Create HTML for palette if not exists
    if (!document.getElementById('cmd-palette-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'cmd-palette-overlay';
        overlay.innerHTML = `
            <div id="cmd-palette">
                <input type="text" id="cmd-input" placeholder="Type a command or search tools..." autocomplete="off">
                <div id="cmd-list"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Event Listeners
        const input = document.getElementById('cmd-input');
        const list = document.getElementById('cmd-list');

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) toggleCommandPalette(false);
        });

        // Input handling
        input.addEventListener('input', (e) => filterCommands(e.target.value));
        input.addEventListener('keydown', (e) => handleCommandNav(e));
    }
}

function toggleCommandPalette(show) {
    const overlay = document.getElementById('cmd-palette-overlay');
    const input = document.getElementById('cmd-input');

    if (show) {
        overlay.style.display = 'flex';
        input.value = '';
        input.focus();
        filterCommands(''); // Show all initially
    } else {
        overlay.style.display = 'none';
        window.currentCmdList = []; // Clean up
    }
}

function filterCommands(query) {
    const list = document.getElementById('cmd-list');
    const q = query.toLowerCase();

    // Combine Tools + Actions
    const actions = [
        { name: 'Toggle Dark Mode', icon: 'fas fa-moon', action: () => { saveSettings('themeMode', 'dark'); applySettings(); } },
        { name: 'Toggle Light Mode', icon: 'fas fa-sun', action: () => { saveSettings('themeMode', 'light'); applySettings(); } },
        { name: 'Go Home', icon: 'fas fa-home', action: () => window.location.href = 'index.html' },
        { name: 'Settings', icon: 'fas fa-cog', action: () => window.location.href = 'settings.html' }
    ];

    const allItems = [
        ...TOOLS_LIST.map(t => ({ name: t.name, icon: t.icon, action: () => window.location.href = t.link, type: 'Tool' })),
        ...actions.map(a => ({ ...a, type: 'Action' }))
    ];

    const filtered = allItems.filter(item => item.name.toLowerCase().includes(q));

    list.innerHTML = filtered.map((item, index) => `
        <div class="cmd-item ${index === 0 ? 'selected' : ''}" onclick="window.cmdAction(${index})">
            <i class="${item.icon}"></i>
            <span>${item.name}</span>
            <span class="cmd-shortcut">${item.type}</span>
        </div>
    `).join('');

    // Store current filtered list for keyboard nav
    window.currentCmdList = filtered;
}

function handleCommandNav(e) {
    const list = window.currentCmdList || [];
    let selected = document.querySelector('.cmd-item.selected');
    let index = selected ? Array.from(selected.parentNode.children).indexOf(selected) : 0;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        index = (index + 1) % list.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        index = (index - 1 + list.length) % list.length;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (list[index]) {
            list[index].action();
            toggleCommandPalette(false);
        }
    } else if (e.key === 'Escape') {
        toggleCommandPalette(false);
    }

    // Update UI
    document.querySelectorAll('.cmd-item').forEach((el, i) => {
        if (i === index) el.classList.add('selected');
        else el.classList.remove('selected');
    });
}

// Helper for inline onclick
window.cmdAction = (index) => {
    if (window.currentCmdList && window.currentCmdList[index]) {
        window.currentCmdList[index].action();
        toggleCommandPalette(false);
    }
};

// --- Sound Effects ---
function playSound(type = 'click') {
    if (window.audioManager) {
        window.audioManager.play(type);
    }
}

// --- Toast Notifications (Removed) ---
// --- Toast Notifications System ---
const NotificationManager = {
    container: null,
    queue: [],

    init() {
        if (this.container) return;

        const existing = document.querySelector('.toast-container');
        if (existing) {
            this.container = existing;
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        // Ensure init is called
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = 'toast-item';

        // Add theme-specific class based on current settings
        const settings = JSON.parse(localStorage.getItem('dg_settings')) || {};
        if (settings.themeMode) {
            this.container.classList.add(`toast-${settings.themeMode}`);
        }

        // Icon Logic
        let icon = 'fa-info-circle';
        if (type === 'success' || message.includes('Success') || message.includes('تم') || message.includes('Saved')) icon = 'fa-check-circle';
        if (type === 'error' || message.includes('Failed') || message.includes('فشل') || message.includes('Error')) icon = 'fa-exclamation-triangle';
        if (type === 'warning') icon = 'fa-exclamation-circle';
        if (message.includes('Offline')) icon = 'fa-wifi-slash';
        if (message.includes('Online')) icon = 'fa-wifi';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

        // Sound
        if (window.playSound && type !== 'info') {
            window.playSound(type === 'error' ? 'error' : 'success'); // Assuming 'error' sound exists, else default
        }

        this.container.appendChild(toast);

        // Remove after duration
        setTimeout(() => {
            toast.classList.add('exiting');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }
};

function initToasts() {
    NotificationManager.init();
}

function showToast(message, type = 'info') {
    NotificationManager.show(message, type);
}

// --- Usage Tracking & Dashboard ---
function trackVisit() {
    const now = Date.now();
    const lastVisit = localStorage.getItem('dg_last_visit_ts');

    if (!lastVisit || (now - parseInt(lastVisit) > 60000)) {
        localStorage.setItem('dg_last_visit_ts', now);
    }
}

function getLastVisitText() {
    const lastVisit = localStorage.getItem('dg_last_visit_ts');
    if (!lastVisit) return "First Visit";
    return timeAgo(parseInt(lastVisit));
}

function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";

    return "Just now";
}

function trackToolUsage(toolId) {
    let tool = TOOLS_LIST.find(t => t.id === toolId || t.name === toolId);
    if (!tool) return;

    const realId = tool.id;
    const stats = JSON.parse(localStorage.getItem('dg_stats')) || { total: 0, tools: {}, recent: [], toolDetails: {} };

    stats.total++;
    stats.tools[realId] = (stats.tools[realId] || 0) + 1;

    if (!stats.toolDetails) stats.toolDetails = {};
    if (!stats.toolDetails[realId]) stats.toolDetails[realId] = { count: 0, lastUsed: null };
    stats.toolDetails[realId].count++;
    stats.toolDetails[realId].lastUsed = Date.now();

    stats.recent = stats.recent.filter(id => id !== realId);
    stats.recent.unshift(realId);
    if (stats.recent.length > 5) stats.recent.pop();

    localStorage.setItem('dg_stats', JSON.stringify(stats));
    updateToolStatsUI(realId);
}

function updateToolStatsUI(toolId) {
    if (!toolId) {
        const path = window.location.pathname;
        const tool = TOOLS_LIST.find(t => path.includes(t.link));
        if (tool) toolId = tool.id;
    }
    if (!toolId) return;

    const statsBar = document.getElementById('toolStatsBar');
    if (!statsBar) return;

    const stats = JSON.parse(localStorage.getItem('dg_stats')) || { toolDetails: {} };
    const details = stats.toolDetails?.[toolId];

    if (details) {
        const lastUsedDate = details.lastUsed ? timeAgo(details.lastUsed) : 'Never';
        statsBar.innerHTML = `
            <div class="stat-item" title="Times Used"><i class="fas fa-chart-bar"></i> ${details.count}</div>
            <div class="stat-divider"></div>
            <div class="stat-item" title="Last Used"><i class="fas fa-clock"></i> ${lastUsedDate}</div>
        `;
    }
}

function clearLocalStats() {
    if (confirm('Are you sure you want to clear all usage stats? This cannot be undone.')) {
        localStorage.removeItem('dg_stats');
        localStorage.removeItem('dg_last_visit_ts');
        showToast('History Cleared');
        renderDashboard();
    }
}

function updateGreeting() {
    const greetingEl = document.getElementById('greetingText');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = "Welcome";

    if (hour < 12) greeting = "Good Morning ☀️";
    else if (hour < 18) greeting = "Good Afternoon 🌤️";
    else greeting = "Good Evening 🌙";

    greetingEl.innerText = greeting + ", Developer";
}

function renderDashboard() {
    const dashboard = document.getElementById('miniDashboard');
    if (!dashboard) return;

    updateGreeting();

    const currentLang = document.documentElement.lang || 'en';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    const stats = JSON.parse(localStorage.getItem('dg_stats')) || { total: 0, tools: {}, recent: [] };

    // 1. Total Actions
    const totalEl = document.getElementById('statTotal');
    if (totalEl) {
        animateValue(totalEl, 0, stats.total, 1000);
    }

    // 2. Last Visit
    const visitEl = document.getElementById('statLastVisit');
    if (visitEl) visitEl.innerText = getLastVisitText();

    // 3. Recent Tools
    const recentEl = document.getElementById('recentToolsList');
    if (recentEl) {
        if (stats.recent.length === 0) {
            recentEl.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem; font-style: italic; padding: 10px;">${t['no_recent'] || "Start using tools to populate this list."}</span>`;
        } else {
            recentEl.innerHTML = stats.recent.slice(0, 3).map(id => {
                const tool = TOOLS_LIST.find(t => t.id === id);
                if (!tool) return '';

                const name = t[`tool_name_${tool.id.replace(/-/g, '_')}`] || t[`tool_name_${tool.id}`] || tool.name;

                return `
                    <a href="${tool.link}" class="recent-item" onclick="handleToolClick(event, '${tool.link}')">
                        <div class="recent-icon"><i class="${tool.icon}"></i></div>
                        <span>${name}</span>
                        <i class="fas fa-chevron-right" style="margin-left: auto; font-size: 0.7rem; opacity: 0.5;"></i>
                    </a>
                `;
            }).join('');
        }
    }
}

function animateValue(obj, start, end, duration) {
    if (start === end) {
        obj.innerHTML = end;
        return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function saveSettings(key, value) {
    const settings = JSON.parse(localStorage.getItem('dg_settings')) || {};
    const oldValue = settings[key];
    settings[key] = value;
    localStorage.setItem('dg_settings', JSON.stringify(settings));

    // Trigger Notification based on key
    const t = TRANSLATIONS[document.documentElement.lang || 'en'] || TRANSLATIONS['en'];

    if (key === 'themeMode') showToast(`${t.theme_label || 'Theme'}: ${value}`, 'success');
    if (key === 'language') showToast(value === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language switched to English', 'success');
    if (key === 'soundEnabled') showToast(value ? 'Sound Enabled 🔊' : 'Sound Disabled 🔇', 'info');
    if (key === 'animProfile') showToast(`Animation: ${value}`, 'info');
}

// Expose globally
window.showToast = showToast;
window.trackToolUsage = trackToolUsage;
window.playSound = playSound;
window.applySettings = applySettings;
window.saveSettings = saveSettings;

function initApp() {
    // 1. Apply Settings
    applySettings();
}


function handleToolClick(e, link) {
    e.preventDefault();
    playSound('click');
    setTimeout(() => {
        window.location.href = link;
    }, 150);
}
window.handleToolClick = handleToolClick;

// --- UX Helpers ---
function setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            toggleCommandPalette(true);
        }
        if (e.ctrlKey && e.key === 'Enter') {
            const primaryBtn = document.querySelector('.action-btn');
            if (primaryBtn) {
                e.preventDefault();
                primaryBtn.click();
            }
        }
        if (e.key === 'Escape') {
            if (document.getElementById('cmd-palette-overlay').style.display === 'flex') {
                toggleCommandPalette(false);
            } else if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, .tool-card, .color-swatch, input[type="checkbox"], select')) {
            playSound('click');
        }
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('button, a, .tool-card, .color-swatch')) {
            playSound('hover');
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            playSound('type');
        }
    });
}

// --- PWA & Offline System ---
function showPwaToast(message, isUpdate = false) {
    let toast = document.getElementById('pwa-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pwa-toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="pwa-content">
            <i class="fas ${isUpdate ? 'fa-sync-alt fa-spin' : 'fa-wifi'}"></i>
            <span>${message}</span>
        </div>
        ${isUpdate ? '<button onclick="window.location.reload()">Reload</button>' : ''}
    `;

    // Force reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    if (!isUpdate) {
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Connectivity Listeners
// Connectivity Listeners
window.addEventListener('online', () => showPwaToast('Connection Restored'));
window.addEventListener('offline', () => showPwaToast('Offline Mode Active'));

// --- Mobile Dock Removed by User Request ---


// Register Service Worker with Premium Update Handling
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {

            // 1. Check if update is waiting (sw loaded but waiting for activation)
            if (registration.waiting) {
                showUpdateModal(registration.waiting);
            }

            // 2. Listen for new updates arriving
            registration.onupdatefound = () => {
                const newWorker = registration.installing;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New update available
                            showUpdateModal(newWorker);
                        } else {
                            showPwaToast('System Ready for Offline Ops');
                        }
                    }
                };
            };
        }).catch(err => console.log('SW Check Failed:', err));

        // 3. Handle Controller Change (Reload trigger)
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    });
}

function showUpdateModal(worker) {
    const overlay = document.getElementById('system-update-overlay');
    if (!overlay) return; // Fail safe

    // Play Notification Sound
    if (window.audioManager) window.audioManager.playSound('click'); // Or 'alert'

    overlay.classList.add('active');

    // Store worker to post message later
    window.waitingWorker = worker;
}

window.applySystemUpdate = function () {
    const btn = document.getElementById('btn-update-now');
    if (btn) btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> INITIALIZING...';

    // Play Confirm Sound
    if (window.audioManager) window.audioManager.playSound('success');

    if (window.waitingWorker) {
        window.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
        // Fallback
        window.location.reload();
    }
};


// --- Vercel Analytics (Vanilla JS) ---
(function () {
    window.va = window.va || function () { (window.va.q = window.va.q || []).push(arguments); };
    var script = document.createElement('script');
    script.defer = true;
    script.src = "/_vercel/insights/script.js";
    document.head.appendChild(script);
})();

// --- Mobile Detection & Warning System ---
function checkMobileDevice() {
    const isMobile = window.innerWidth < 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check if warning was already dismissed in session
    if (sessionStorage.getItem('mobile_warning_dismissed')) return;

    if (isMobile) {
        const warning = document.createElement('div');
        warning.id = 'mobile-warning-overlay';
        warning.innerHTML = `
            <i class="fas fa-desktop" style="font-size: 4rem; margin-bottom: 20px;"></i>
            <h1><i class="fas fa-exclamation-triangle"></i> System Warning</h1>
            <p><strong>DGT | ARSENAL is designed for Desktop Command Stations.</strong></p>
            <p style="font-size: 0.9rem; opacity: 0.8;">
                Mobile interfaces are detected but not fully optimized for these tools. 
                Experience may be degraded or unusable.
            </p>
            <button onclick="dismissMobileWarning()">[ OVERRIDE & CONTINUE ]</button>
        `;
        document.body.appendChild(warning);
    }
}

window.dismissMobileWarning = function () {
    const warning = document.getElementById('mobile-warning-overlay');
    if (warning) {
        warning.style.opacity = '0';
        setTimeout(() => warning.remove(), 300);
        sessionStorage.setItem('mobile_warning_dismissed', 'true');
    }
};

// Check on load
window.addEventListener('load', checkMobileDevice);

// --- Tool Filter Logic ---
function initToolFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic Update
            const filter = btn.getAttribute('data-filter');
            if (window.renderTools) renderTools(filter);
            if (window.playSound) window.playSound('click');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initToolFilters();
});
