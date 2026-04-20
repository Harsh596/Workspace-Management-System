// 16 Custom Themes matching Vercel/Linear advanced developer aesthetic

export const THEMES = {
  "default": { name: "WMS (Default)", bgPrimary: "#f9f9f9", bgSecondary: "#ffffff", border: "#e2e2e2", textPrim: "#1a1c1c", textSec: "#747474", accent: "#c00100", font: "Inter, sans-serif", radius: "0px", radiusLg: "0px" },
  "vercel": { name: "Vercel Dark", bgPrimary: "#000000", bgSecondary: "#0a0a0a", border: "#333333", textPrim: "#ededed", textSec: "#a1a1aa", accent: "#0070f3", font: "Inter, sans-serif", radius: "8px", radiusLg: "16px" },
  "linear": { name: "Linear Core", bgPrimary: "#141517", bgSecondary: "#1c1d21", border: "#2d2e33", textPrim: "#f2f2f2", textSec: "#8a8f98", accent: "#5e6ad2", font: "Inter, sans-serif", radius: "6px", radiusLg: "12px" },
  "cyberpunk": { name: "Cyber Neon", bgPrimary: "#0d0221", bgSecondary: "#13042c", border: "#2b0a5e", textPrim: "#00ffcc", textSec: "#ff007f", accent: "#fcee0a", font: "monospace", radius: "0px", radiusLg: "0px" },
  "dracula": { name: "Dracula", bgPrimary: "#282a36", bgSecondary: "#44475a", border: "#6272a4", textPrim: "#f8f8f2", textSec: "#bd93f9", accent: "#ff79c6", font: "'Segoe UI', Roboto, sans-serif", radius: "8px", radiusLg: "16px" },
  "monokai": { name: "Monokai Pro", bgPrimary: "#2d2a2e", bgSecondary: "#403e41", border: "#5b595c", textPrim: "#fcfcfa", textSec: "#939293", accent: "#ff6188", font: "Arial, sans-serif", radius: "4px", radiusLg: "8px" },
  "nord": { name: "Nordic Frost", bgPrimary: "#2e3440", bgSecondary: "#3b4252", border: "#4c566a", textPrim: "#eceff4", textSec: "#d8dee9", accent: "#88c0d0", font: "'Helvetica Neue', sans-serif", radius: "8px", radiusLg: "16px" },
  "github_dark": { name: "GitHub Dark", bgPrimary: "#0d1117", bgSecondary: "#161b22", border: "#30363d", textPrim: "#c9d1d9", textSec: "#8b949e", accent: "#58a6ff", font: "system-ui", radius: "6px", radiusLg: "12px" },
  "material": { name: "Material Deep", bgPrimary: "#0f111a", bgSecondary: "#1a1c23", border: "#2d2f3b", textPrim: "#ffffff", textSec: "#a6accd", accent: "#82aaff", font: "Roboto, sans-serif", radius: "8px", radiusLg: "16px" },
  "oled": { name: "OLED Pitch", bgPrimary: "#000000", bgSecondary: "#000000", border: "#111111", textPrim: "#dcdcdc", textSec: "#555555", accent: "#ffffff", font: "Inter, sans-serif", radius: "8px", radiusLg: "16px" },
  "forest": { name: "Midnight Forest", bgPrimary: "#0a1913", bgSecondary: "#11261d", border: "#1c3d2e", textPrim: "#e2f2eb", textSec: "#8ea399", accent: "#34d399", font: "Georgia, serif", radius: "12px", radiusLg: "24px" },
  "ocean": { name: "Deep Ocean", bgPrimary: "#04101e", bgSecondary: "#0a1c30", border: "#15304d", textPrim: "#e0f0ff", textSec: "#7d9bbb", accent: "#38bdf8", font: "'Trebuchet MS', sans-serif", radius: "8px", radiusLg: "16px" },
  "sunset": { name: "Desert Sunset", bgPrimary: "#1a0b0b", bgSecondary: "#2a1515", border: "#4a2525", textPrim: "#ffecd1", textSec: "#b38c8c", accent: "#f97316", font: "Inter, sans-serif", radius: "8px", radiusLg: "16px" },
  "rose_pine": { name: "Rosé Pine", bgPrimary: "#191724", bgSecondary: "#1f1d2e", border: "#26233a", textPrim: "#e0def4", textSec: "#908caa", accent: "#eb6f92", font: "Inter, sans-serif", radius: "8px", radiusLg: "16px" },
  "catppuccin": { name: "Catppuccin Mocha", bgPrimary: "#1e1e2e", bgSecondary: "#181825", border: "#313244", textPrim: "#cdd6f4", textSec: "#bac2de", accent: "#cba6f7", font: "system-ui", radius: "8px", radiusLg: "16px" },
  "synthwave": { name: "Synthwave '84", bgPrimary: "#262335", bgSecondary: "#241b2f", border: "#49395f", textPrim: "#ffffff", textSec: "#848bbd", accent: "#ff7edb", font: "monospace", radius: "0px", radiusLg: "0px" },
  "light_vercel": { name: "Vercel Light", bgPrimary: "#ffffff", bgSecondary: "#fafafa", border: "#eaeaea", textPrim: "#000000", textSec: "#666666", accent: "#000000", font: "Inter, sans-serif", radius: "8px", radiusLg: "16px" }
};

export const applyTheme = (themeId) => {
  const theme = THEMES[themeId] || THEMES["default"];
  const root = document.documentElement;
  
  root.style.setProperty('--bg-primary', theme.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.bgSecondary);
  root.style.setProperty('--border-color', theme.border);
  root.style.setProperty('--text-primary', theme.textPrim);
  root.style.setProperty('--text-muted', theme.textSec);
  root.style.setProperty('--text-secondary', theme.textSec);
  root.style.setProperty('--accent-ai', theme.accent);
  root.style.setProperty('--btn-primary', theme.textPrim);
  root.style.setProperty('--font-sans', theme.font);
  root.style.setProperty('--btn-primary-text', theme.bgPrimary);
  root.style.setProperty('--radius', theme.radius);
  root.style.setProperty('--radius-lg', theme.radiusLg);

  // WMS specific overrides for exact accuracy
  if (themeId === 'default') {
    root.style.setProperty('--btn-primary-bg', theme.accent); // WMS buttons are intensely red
    root.style.setProperty('--btn-primary-text', '#ffffff');
  } else {
    root.style.setProperty('--btn-primary-bg', theme.textPrim);
    
    // Ensure light themes have white button text if primary button is black/dark
    if (themeId === 'light_vercel') {
      root.style.setProperty('--btn-primary-text', "#ffffff");
    } else {
      root.style.setProperty('--btn-primary-text', "#000000");    
    }
  }
};
